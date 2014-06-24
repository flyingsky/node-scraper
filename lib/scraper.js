var request = require('request');
var phantom = require('phantom');
var async = require('async');

var Scraper = module.exports = function() {

};

Scraper.Parser = require('./parser');

var proto = Scraper.prototype;

proto.scrapePage = function(uri, usePhantom, callback) {
  var me = this;

  if (arguments.length == 2) {
    callback = usePhantom;
    usePhantom = false;
  }

  var callbackWrap = function(err, html) {
    if (!err && me.parser) {
//      if (usePhantom) console.log('phantom html====', html);
      callback(null, me.parser.parse(html));
    } else {
      callback(err);
    }
  };

  if (usePhantom) {
    me.scrapeHtmlPageWithPhantom(uri, callbackWrap);
  } else {
    me.scrapeHtmlPage(uri, callbackWrap);
  }
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