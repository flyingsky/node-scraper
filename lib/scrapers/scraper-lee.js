/**
 * Created by colin on 6/24/14
 */
var async = require('async');
var helper = require('../helper');
var Scraper = require('../scraper');
var cheerio = require('cheerio');
var path = require('path');
var fs = require('fs');
var fse = require('fs-extra');
var url = require('url');
var download = require('../image/download.js');

var ScraperLee = module.exports = function(options) {
  var me = this;

  this.options = options || {};

  this.scraper = new Scraper();
  this.homepage = 'http://www.leeoliveira.com/';
  this.hostname = url.parse(this.homepage).hostname;

  var baseDir = this.options.outdir || path.join(helper.getAppRootDir(), 'output');
  this.outdir = path.join(baseDir, this.hostname);
  fse.ensureDirSync(this.outdir);

  this.metaFile = path.join(this.outdir, 'meta.csv');

  var metaWriter = fs.createWriteStream(this.metaFile, { flags : 'a' });

   metaWriter.on('finish', function() {
    console.log('write [%s] done', me.metaFile);
  });

  metaWriter.on('error', function(err) {
    console.log('write [%s] error: %s', me.metaFile, err);
  });

  this.metaWriter = metaWriter;

  this.categoryPages = ['http://www.leeoliveira.com/category/women/', 'http://www.leeoliveira.com/category/men/'];
  this.startPages = this.categoryPages.slice(0);
  this.currPageIndex = 0;
};

ScraperLee.prototype.start = function(callback) {
  var me = this;

  async.eachSeries(me.startPages, helper.wrapMethod(me.scrapeCategoryPage, me), function(err) {
    if(err) {
      console.log('Error: [%s]. Start again', err);
      me.startPages = me.startPages.slice(me.currPageIndex);
      me.start(callback);
    } else {
      me.metaWriter.end();
      callback();
    }
  });
};

ScraperLee.prototype.getStartPages = function(sourcePages, pageTree) {
  if(!pageTree || pageTree.length <= 0) {
    return sourcePages;
  }

  //get right most pages
  var level1PageNode = pageTree[pageTree.length - 1];
  var level1Page = level1PageNode.page;

  var currPageNode = level1PageNode;
  while(currPageNode.children && currPageNode.children.length > 0) {
    currPageNode = currPageNode.children[currPageNode.children.length - 1];
  }
  var lastPage = currPageNode.page;

  var index = sourcePages.indexOf(level1Page);
  if(index <= 0) {
    return sourcePages;
  }

  var resultPages = [lastPage];
  resultPages = resultPages.concat(sourcePages.slice(index + 1));

  return resultPages;
}


ScraperLee.prototype.scrapeCategoryPage = function(uri, callback) {
  var me = this;

  var opts = {
    uri: uri,
    usePhantom: false,
    dumpFile: helper.tmpName({postfix: '.html', dir: helper.getAppTmpDir()})
  };

  me.startPages[me.currPageIndex] = uri;
  console.log('current page: [%s]', uri);
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
  me.currCategory = category;
  me.currCategoryDir = path.join(me.outdir, me.currCategory);
  fse.ensureDirSync(me.currCategoryDir);

  var imagePages = [];

  var $contents = $('.teasers_box .post', '#content');
  $contents.each(function(index, post) {
    var title = $('.entry-title a', post).text();
    var postImageLink = $('.entry-content .post_image_link', post).attr('href');
    var teaserLink = $('.teaser_link', post).attr('href');

    if(!postImageLink) {
      console.log('[WARN]: no image link found: [%s]', teaserLink);
    } else {
//      console.log('title: [%s], link: [%s]', title, postImageLink);
      imagePages.push( {title: title, link: postImageLink});
    }
  });

  var $prev = $('.prev_next .previous', '#content');
  var prevLink;
  if ($prev && $prev.length > 0) {
    prevLink = $('a', $prev).attr('href');
//    console.log('previous page link: [%s]', prevLink);
  }

  var tasks = [];

  if(imagePages.length > 0) {
    tasks.push(function(asyncCallback) {
      async.eachLimit(imagePages, 4, function(imagePage, cb) {
        me.scrapeImagePage(imagePage.link, cb);
      }, asyncCallback);
    });
  }

  if(prevLink) {
    tasks.push(function(asyncCallback) {
      me.scrapeCategoryPage(prevLink, asyncCallback);
    });
  } else {
    console.log('[NO previous page found, go to next category]');
    me.currPageIndex++;
    if(me.currPageIndex >= me.startPages.length) {
      me.currPageIndex = me.startPages.length - 1;
    }
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
  var me = this;

  var $ = cheerio.load(data);

  var imageTitle = $('.post .headline_area h1[class=entry-title]', '#content').text();
  var imageUrl = $('.post .entry-content img', '#content').attr('src');

  var fileName = path.join(me.currCategoryDir, path.basename(imageUrl));

//  helper.download(url, fileName, function(err) {
//    console.log('Download [%s] to [%s]', url, fileName);
//    callback(err);
//  });

  download(imageUrl, fileName, function(err) {
    if(err) {
      callback(err);
    } else {
      me.writeMeta(url, imageUrl, fileName, imageTitle);
      callback(null, data);
    }
  });

//  me.writeMeta(url, imageUrl, fileName, imageTitle);
//  callback(null, data);
};

ScraperLee.prototype.writeMeta = function(imagePage, imageUrl, fileName, imageTitle) {
  var me = this;

  var relFileName = path.relative(me.outdir, fileName);

  var entry = [];
  entry.push(helper.escapeComma(me.currCategory, true));
  entry.push(imagePage);
  entry.push(imageUrl);
  entry.push(relFileName);
  entry.push(imageTitle);

  console.log('category: [%s], page: [%s], image src: [%s]', me.currCategory, imagePage, imageUrl);

  var str = entry.join(',');
  me.metaWriter.write(str);
  me.metaWriter.write('\n');
}