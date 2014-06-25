/**
 * Created by colin on 6/25/14
 */
var async = require('async');
var helper = require('../helper');
var Scraper = require('../scraper');
var cheerio = require('cheerio');
var path = require('path');
var url = require('url');

var ScraperPeeper = module.exports = function() {
  this.homepage = 'http://streetpeeper.com/';
};

ScraperPeeper.prototype.start = function(callback) {
  var me = this;
  me.getCityList(me.homepage, callback);
};

ScraperPeeper.prototype.getCityList = function(baseUrl, callback) {
  var me = this;

  var opts = {
    uri: baseUrl
  };

  new Scraper(new HomePageParser(baseUrl)).scrapePage(opts, function(err, result) {
    if(err) {
      callback(err, result);
    } else {
      console.log(result.cities);

      async.eachSeries(result.cities, function(city, asyncCallback) {
        me.scrapCityPage(city, asyncCallback);
      }, callback);
    }
  });
};

ScraperPeeper.prototype.scrapCityPage = function(baseUrl, callback) {
  var me = this;

  console.log('scrape city page: [%s]', baseUrl);

  var opts = {
    uri: baseUrl
  };
  new Scraper(new CityPageParser(baseUrl)).scrapePage(opts, function(err, result) {
    if(err) {
      callback(err, result);
    } else {
      var tasks = [];

      if(result.imagePages.length > 0) {
        tasks.push(function(asyncCallback) {
          async.eachSeries(result.imagePages, function(imagePage, cb) {
            me.scrapeImagePage(imagePage, cb);
          }, asyncCallback);
        });
      }

      if(result.nextLink) {
        tasks.push(function(asyncCallback) {
          me.scrapCityPage(result.nextLink, asyncCallback);
        });
      }

      if(tasks.length > 0) {
        async.series(tasks, callback);
      } else {
        callback(null, data);
      }
    }
  });
};

ScraperPeeper.prototype.scrapeImagePage = function(baseUrl, callback) {
  var me = this;

  console.log('scrape image page: [%s]', baseUrl);

  var opts = {uri: baseUrl};

  new Scraper(new ImagePageParser(baseUrl)).scrapePage(opts, function(err, result) {
    if(err) {
      callback(err, result);
    } else {
      //TODO: download image
      console.log(result);
      callback(null, result);
    }
  });
};

function HomePageParser(baseUrl) {
  this.baseUrl = baseUrl;
}

HomePageParser.prototype.process = function(data, context, callback) {
  var me = this;
  var $ = cheerio.load(data);

  var result = { cities: [] };

  var $cities = $('#block-cities-0 .cities_block_li a');
  $cities.each(function() {
    var cityLink = $(this).attr('href');
    result.cities.push(url.resolve(me.baseUrl, cityLink));
  });

  return callback(null, result);
};

function CityPageParser(baseUrl) {
  this.baseUrl = baseUrl;
}

CityPageParser.prototype.process = function(data, context, callback) {
  var me = this;
  var $ = cheerio.load(data);

  var result = { imagePages: [] };

  var $contents = $('.view .view-content .views-row .img_link');
  $contents.each(function() {
    var imagePage = $(this).attr('href');
    result.imagePages.push(url.resolve(me.baseUrl, imagePage));
  });

  var $next = $('.view .item-list .pager-next a');
  var nextLink;
  if ($next && $next.length > 0) {
    nextLink = $next.attr('href');
    result.nextLink = url.resolve(me.baseUrl, nextLink);
  }

  return callback(null, result);
};

function ImagePageParser(baseUrl) {
  this.baseUrl = baseUrl;
}

ImagePageParser.prototype.process = function(data, context, callback) {
  var me = this;
  var $ = cheerio.load(data);

  var result = { };

  var $img = $('.left_content .left_details img');
  result.imageUrl = url.resolve(me.baseUrl, $img.attr('src'));
  result.imageTitle = $img.attr('alt');

  return callback(null, result);
};