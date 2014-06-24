/**
 * Created by colin on 6/24/14
 */
var async = require('async');
var helper = require('../helper');
var Scraper = require('../scraper');

var ScraperLee = module.exports = function() {
  this.scraper = new Scraper();
};

ScraperLee.prototype.start = function(callback) {
  var me = this;

  var categoryPages = ['http://www.leeoliveira.com/category/women/', 'http://www.leeoliveira.com/category/men/'];
  async.eachSeries(categoryPages, helper.wrapMethod(me.scrapeCategoryPage, me), callback);
};

ScraperLee.prototype.scrapeCategoryPage = function(url, callback) {
  var me = this;

  var opts = {
    usePhantom: false,
    dumpFile: helper.tmpName({postfix: '.html', dir: helper.getAppTmpDir()})
  };

  me.scraper.scrapePage(url, opts, function(err, result) {
    callback(err, result);
  });
};