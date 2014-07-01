var path = require('path');
var url = require('url');

var request = require('request');
var phantom = require('phantom');
var async = require('async');
var extend = require('extend');

var helper = require('../helper');

/**
 * @param processors [object],
 *   input is an input object, which is an output object from previous processor, the input of first processor is html page content.
 *   context {object},
 *    uri {String}
 *    usePhantom {bool}
 *   callback(err, output) output is an output object from previous processor
 *
 * @param scrapers [object], the output of previous scraper is input of next scraper
 *
 */
var Scraper = module.exports = function(context) {
  this.context = context;
};

var proto = Scraper.prototype;

/**
 *
 * @param opts
 *  uri {String}
 *  usePhantom {bool} true use phantomjs to get html page, because maybe we need get html after some js output
 *  processors: if uri is not empty, use processors to start processor chain. each processor should have method process(input, context, callback)
 *    input is an input object, which is an output object from previous processor, the input of first processor is html page content.
 *    context {object},
 *      uri {String}
 *      usePhantom {bool}
 *    callback(err, output) output is an output object from previous processor
 *  scrapers: if uri is empty, use scrapers to start scraper chain
 * @param callback(err, result) result is the parsed html object
 */
proto.scrapePage = function(opts, callback) {
  var me = this;
  var context = extend(me.context, opts);

  if (context.uri) {
    var processors = helper.ensureArray(context.processors);
    delete context.processors;
    me.scrapePageWithProcessors(processors, context, callback);
  } else {
    var scrapers = helper.ensureArray(context.scrapers);
    delete context.scrapers;
    me.scrapePageWithScrapers(scrapers, context, callback);
  }
};

proto.scrapePageWithProcessors = function(processors, context, callback) {
  var me = this;

  // create opts for each uri
  var arrOpts = [];
  var arrUri = helper.ensureArray(context.uri);
  var arrCategory = helper.ensureArray(context.category);
  var contextCopy = extend({}, context);
  delete contextCopy.uri;
  delete contextCopy.category;
  arrUri.forEach(function(uri, i) {
    arrOpts.push(extend({
      uri: uri,
      category: arrCategory[i]
    }, contextCopy));
  });

  // run scape for each uri
  var combinedOutput = null;

  var runScraper = function(opts, asyncCallback) {
    me.scrapeOnePageWithProcessors(processors, opts, function(err, output){
      if (err) {
        console.log('ignore error ', opts, err);
        return asyncCallback();
      }

      // not uri scraper
      if (output.uri === undefined) {
        combinedOutput = combinedOutput || [];
        combinedOutput.push(output);
        return asyncCallback();
      }

      combinedOutput = combinedOutput || {uri: [], category: []};
      var arrUri = helper.ensureArray(output.uri);
      var arrCategory = helper.ensureArray(output.category);

      for(var i = 0; i < arrUri.length; i++) {
        arrCategory[i] = arrCategory[i] ? path.join(opts.category, arrCategory[i]) : opts.category;
      }

      combinedOutput.uri = combinedOutput.uri.concat(arrUri);
      combinedOutput.category = combinedOutput.category.concat(arrCategory);

      asyncCallback();
    });
  };

  var combineScraperResult = function(err, result) {
    // only one uri, we should make output as original result
    if (arrOpts.length == 1 && combinedOutput.length == 1) {
      combinedOutput = combinedOutput[0];
    }

    callback(err, combinedOutput);
  };

  async.eachSeries(arrOpts, runScraper, combineScraperResult);
};

proto.scrapeOnePageWithProcessors = function(processors, context, callback) {
  console.log('ready to process uri=', context.uri);

  var me = this;
  var callbackWrap = function(err, html) {
    if (err) {
      callback(err);
    } else {
      context = extend({html: html}, context);
      me.startProcessChain(processors, context, callback);
    }
  };

  if (context.usePhantom) {
    me.scrapeHtmlPageWithPhantom(context.uri, callbackWrap);
  } else {
    me.scrapeHtmlPage(context.uri, callbackWrap);
  }
};

proto.scrapePageWithScrapers = function(scrapers, context, callback) {
  this.startScraperChain(scrapers, context, callback);
};

/**
 *
 * @param context
 *  html
 *  uri
 *  usePhantom
 * @param callback(err, output)
 */
proto.startProcessChain = function(processors, context, callback) {
  var me = this;
  var input = context.html;
  me.output = context.html;

  var iterator = function(processor, asyncCallback) {
    var processCallback = function(err, output) {
      input = output;
      me.output = output;
      asyncCallback(err);
    };

    if (processor.process) {
      processor.process(input, context, processCallback);
    } else {  // skip this processor
      processCallback(null, input);
    }
  };

  var eachSeriesCallback = function(err) {
    callback(err, me.output);
  };

  async.eachSeries(processors, iterator, eachSeriesCallback);
};

/**
 *
 * @param input {String} or [object]
 *  if this.processors is empty, input is the html content
 *  else it's object output of processors. The object at least contains properties:
 *    category: we use it to create folder
 *    src: the link we continue scraping
 * @param context
 *  html
 *  uri
 *  usePhantom
 * @param callback(err, output)
 */
proto.startScraperChain = function(scrapers, context, callback) {
  var me = this;
  var opts = null;

  var iterator = function(scraper, asyncCallback) {
    /**
     *
     * @param err
     * @param output contains
     *  category: [String] optional, inherits previous scraper category if it's empty(null, undefined or empty string)
     *  uri: [String] required
     */
    var scraperCallback = function(err, output) {
      if (err) {
        return asyncCallback(err);
      }

//      console.log('output==========', output);
      me.output = output;

      if (!output.uri) {
        return asyncCallback(err); // should exit
      }

      // handle uri and prepare opts for next scraper
      opts = extend({}, scraper.context, {
        category: output.category,
        uri: output.uri
      });

      asyncCallback(err);
    };

    scraper.scrapePage(opts, scraperCallback);
  };

  async.eachSeries(scrapers, iterator, function(err) {
    callback(err, me.output);
  });
};

proto.scrapeHtmlPageWithPhantom = function(uri, callback) {
  var ph = null;

  async.waterfall([
    // create phantom
    function(asyncCallback) {
      phantom.create(function(_ph){
        asyncCallback(null, _ph);
      });
    },

    // create page
    function(_ph, asyncCallback) {
      ph = _ph;
      _ph.createPage(function(page){
        asyncCallback(null, page);
      });
    },

    // open uri and get html
    function(page, asyncCallback) {
      page.open(uri, function(status) {
        if (status !== 'success') {
          asyncCallback(new Error('Fail to open page ' + uri));
        } else {
          page.get('content', function(html){
            asyncCallback(null, html);
          });
        }
      });
    }
  ], function(err, html) {
    if (ph) {
      ph.exit();
    }
    callback(err, html);
  });
};

proto.scrapeHtmlPage = function(uri, callback) {
  request.get(uri, function(err, res, html) {
    if (err || res.statusCode !== 200) {
      callback(err || 'res status code is not 200, which is ' + res.statusCode);
      return;
    }

    callback(err, html);
  });
};