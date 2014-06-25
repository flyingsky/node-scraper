/**
 * Created by colin on 6/25/14
 */
var async = require('async');
var helper = require('../helper');
var Scraper = require('../scraper');
var cheerio = require('cheerio');
var path = require('path');

var ScraperPeeper = module.exports = function() {
  this.scraper = new Scraper();
};

ScraperPeeper.prototype.start = function(callback) {
  var me = this;

  var entryPage = 'http://www.google.com';
  //TODO
};