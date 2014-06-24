/**
 * Created by colin on 6/24/14
 */
var async = require('async');
var helper = require('../helper');

var ScraperLee = module.exports = function() {

};

ScraperLee.prototype.start = function(callback) {
  var me = this;

  var categoryPages = ['http://www.leeoliveira.com/category/women/', 'http://www.leeoliveira.com/category/men/'];
  async.eachSeries(categoryPages, helper.wrapMethod(me.scrapeCategoryPage, me), callback);
};

ScraperLee.prototype.scrapeCategoryPage = function(url, callback) {

};