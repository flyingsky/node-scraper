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

ScraperLee.prototype.scrapeCategoryPage = function(url, callback) {
  var me = this;

  var opts = {
    usePhantom: false,
    dumpFile: helper.tmpName({postfix: '.html', dir: helper.getAppTmpDir()})
  };

  me.scraper.scrapePage(url, opts, function(err, result) {
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

  var boxes = $('#content').find('.teasers_box');
  console.log(boxes.length);

  var imagePages = [];

  $('#content .teasers_box').each(function(i, item) {
    $(this).find('.post').each(function(j, post) {
      var title = $(post).find('.entry-title a').text();
      console.log(title);

      var link = $(post).find('.entry-content .post_image_link').attr('href');
      if(!link) {
        console.log('[WARN]: no image link at box [%d,%d]', i, j);
      } else {
        console.log(link);
        imagePages.push( {title: title, link: link});
      }
    });
  });

  var $prev = $('.prev_next .previous', '#content');
  var prevLink;
  if ($prev && $prev.length > 0) {
    prevLink = $($prev).find('a').attr('href');
    console.log(prevLink);
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
}

ScraperLee.prototype.scrapeImagePage = function(url, callback) {
  var me = this;

  var opts = {
    usePhantom: false,
    dumpFile: helper.tmpName({postfix: '.html', dir: helper.getAppTmpDir()})
  };

  me.scraper.scrapePage(url, opts, function(err, result) {
    if(err) {
      callback(err, result);
    } else {
      me.parseImagePage(result, callback);
    }
  });
}

ScraperLee.prototype.parseImagePage = function(data, callback) {
  var $ = cheerio.load(data);

  var $image = $('.post .entry-content img', '#content');

  var url = $image.attr('src');

  var fileName = path.join(helper.getAppTmpDir(), path.basename(url));

//  helper.download(url, fileName, function(err) {
//    console.log('Download [%s] to [%s]', url, fileName);
//    callback(err);
//  });
  console.log(url);
  callback(null, data);
}