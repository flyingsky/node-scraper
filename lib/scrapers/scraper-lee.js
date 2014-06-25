/**
 * Created by colin on 6/24/14
 */
var async = require('async');
var helper = require('../helper');
var Scraper = require('../scraper');
var cheerio = require('cheerio');
var path = require('path');

var ScraperLee = module.exports = function() {
  this.scraper = new Scraper();
};

ScraperLee.prototype.start = function(callback) {
  var me = this;

  var categoryPages = ['http://www.leeoliveira.com/category/women/', 'http://www.leeoliveira.com/category/men/'];
  async.eachSeries(categoryPages, helper.wrapMethod(me.scrapeCategoryPage, me), callback);
};

ScraperLee.prototype.scrapeCategoryPage = function(uri, callback) {
  var me = this;

  var opts = {
    uri: uri,
    usePhantom: false,
    dumpFile: helper.tmpName({postfix: '.html', dir: helper.getAppTmpDir()})
  };

  me.scraper.scrapePage(opts, function(err, result) {
    if(err) {
      callback(err, result);
    } else {
      me.parseCategoryPage(result, callback);
    }
  });
};

ScraperLee.prototype.parseCategoryPage = function(data, callback) {
  var me = this;

  var $ = cheerio.load(data);

  var category = $('#content #archive_intro h1').text();
  console.log(category);

  var imagePages = [];

  var $contents = $('.teasers_box .post', '#content');
  $contents.each(function(index, post) {
    var title = $('.entry-title a', post).text();
    var postImageLink = $('.entry-content .post_image_link', post).attr('href');
    var teaserLink = $('.teaser_link', post).attr('href');

    if(!postImageLink) {
      console.log('[WARN]: no image link found: [%s]', teaserLink);
    } else {
      console.log('title: [%s], link: [%s]', title, postImageLink);
      imagePages.push( {title: title, link: postImageLink});
    }
  });

  var $prev = $('.prev_next .previous', '#content');
  var prevLink;
  if ($prev && $prev.length > 0) {
    prevLink = $('a', $prev).attr('href');
    console.log('previous page link: [%s]', prevLink);
  }

  var tasks = [];

  if(imagePages.length > 0) {
    tasks.push(function(asyncCallback) {
      async.eachSeries(imagePages, function(imagePage, cb) {
        me.scrapeImagePage(imagePage.link, cb);
      }, asyncCallback);
    });
  }

  if(prevLink) {
    tasks.push(function(asyncCallback) {
      me.scrapeCategoryPage(prevLink, asyncCallback);
    });
  }

  if(tasks.length > 0) {
    async.series(tasks, callback);
  } else {
    callback(null, data);
  }
};

ScraperLee.prototype.scrapeImagePage = function(url, callback) {
  var me = this;

  me.scraper.scrapePage({uri: url}, function(err, result) {
    if(err) {
      callback(err, result);
    } else {
      me.parseImagePage(result, url, callback);
    }
  });
};

ScraperLee.prototype.parseImagePage = function(data, url, callback) {
  var $ = cheerio.load(data);

  var imageUrl = $('.post .entry-content img', '#content').attr('src');
  console.log('image [%s] from [%s]', imageUrl, url);

//  var fileName = path.join(helper.getAppTmpDir(), path.basename(url));
//
//  helper.download(url, fileName, function(err) {
//    console.log('Download [%s] to [%s]', url, fileName);
//    callback(err);
//  });

  callback(null, data);
};