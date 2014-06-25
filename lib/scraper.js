var util = require('util');

var request = require('request');
var phantom = require('phantom');
var async = require('async');
var extend = require('extend');

var Parser = require('./parser');

/**
 * @param processors {object or array of object}, each object should have method process(input, context, callback)
 *   input is an input object, which is an output object from previous processor, the input of first processor is html page content.
 *   context {object},
 *    uri {String}
 *    usePhantom {bool}
 *   callback(err, output) output is an output object from previous processor
 */
var Scraper = module.exports = function(processors) {
  var me = this;

  processors = processors || [];
  if (!util.isArray(processors)) {
    processors = [processors];
  }

  me.processors = processors;
};

var proto = Scraper.prototype;

/**
 *
 * @param opts
 *  uri {String}
 *  usePhantom {bool} true use phantomjs to get html page, because maybe we need get html after some js output
 * @param callback(err, result) result is the parsed html object
 */
proto.scrapePage = function(opts, callback) {
  var me = this;
  var uri = opts.uri;
  var usePhantom = opts.usePhantom;

  var callbackWrap = function(err, html) {
    if (err) {
      callback(err);
    } else {
      var context = extend({html: html}, opts);
      me.startProcessChain(context, callback);
    }
  };

  if (usePhantom) {
    me.scrapeHtmlPageWithPhantom(uri, callbackWrap);
  } else {
    me.scrapeHtmlPage(uri, callbackWrap);
  }
};

/**
 *
 * @param context
 *  html
 *  uri
 *  usePhantom
 * @param callback(err, output)
 */
proto.startProcessChain = function(context, callback) {
  var me = this;
  var input = context.html;

  async.eachSeries(me.processors, function(processor, asyncCallback) {
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
  }, function(err) {
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