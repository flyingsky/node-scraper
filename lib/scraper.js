var request = require('request');
var phantom = require('phantom');
var async = require('async');
var fs = require('fs');

var Scraper = module.exports = function() {

};

var proto = Scraper.prototype;

proto.scrapePage = function(uri, opts, callback) {
  var me = this;

  if (arguments.length == 2) {
    callback = opts;
    opts = {};
  }

  opts = opts || {};

  var callbackWrap = function(err, html) {
    if(err) {
      callback(err);
    } else {
      if(opts.dumpFile) {
        fs.writeFileSync(opts.dumpFile, html, 'utf-8');
      }
      if(opts.parser) {
        callback(null, opts.parser.parse(html));
      } else {
        callback(null, html);
      }
    }
  };

  if (opts.usePhantom) {
    me.scrapeHtmlPageWithPhantom(uri, callbackWrap);
  } else {
    me.scrapeHtmlPage(uri, callbackWrap);
  }
};

proto.scrapeHtmlPageWithPhantom = function(uri, callback) {
  async.waterfall([
    // create phantom
    function(asyncCallback) {
      phantom.create(function(ph){
        asyncCallback(null, ph);
      });
    },

    // create page
    function(ph, asyncCallback) {
      ph.createPage(function(page){
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
  ], callback);
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