/**
 * Created by ramon on 6/19/14.
 */

var path = require('path');
var url = require('url');

var cheerio = require('cheerio');
var async = require('async');
var extend = require('extend');
var fse = require('fs-extra');

var download = require('../image/download');
var helper = require('../helper');

//=============================================================
//========================SimpleParser=========================
//=============================================================

var SimpleProcessor = exports.SimpleProcessor = function(mapping) {
  var me = this;

  if (helper.isString(mapping) && path.extname(mapping) == '.json') {
    mapping = require(mapping);
  }

  me.mapping = mapping;
};

var proto = SimpleProcessor.prototype;

/**
 *
 * @param htmlPage the html content for the page
 * @param context
 *  uri
 *  usePhantom
 * @param callback(err, result) parsed html result, if one property is image and requires downloading,
 * we change the property name to 'download' + {original property}, such imgSrc => downloadImgSrc
 * @returns {null}
 */
proto.process = function(htmlPage, context, callback) {
  var me = this;

  if (typeof(context) == 'function') {
    callback = context;
    context = {};
  }

  var $ = cheerio.load(htmlPage);
  var result = {};
  var mapping = me.mapping;

  for (var p in mapping) {
    var selector = mapping[p];
    var attr = 'text';

    if (typeof(selector) !== 'string') {
      selector = mapping[p].selector;
      attr = mapping[p].attr;
    }

    var $obj = $(selector);
    if ($obj && $obj.length > 0) {
      var value = null;

      // if selector result is array, we should return array as result
      if ($obj.length > 1) {
        value = [];
        for(var i = 0; i < $obj.length; i++) {
          value.push(me.getValue($($obj[i]), attr, context.uri));
        }
      } else {
        value = me.getValue($obj, attr, context.uri);
      }

      result[p] = value;
    }
  }

  extend(context, {mapping: me.mapping});

  callback(null, result);
};

proto.getValue = function($obj, attr, pageUrl) {
  // resolve uri
  if (attr === 'text') {
    return $obj.text();
  }

  var value = $obj.attr(attr);
  var tag = $obj[0].name;
  if ((tag == 'a' && attr == 'href') || (tag == 'img' && attr == 'src')) {
    value = url.resolve(pageUrl, value);
  }

  return value;
};


//=============================================================
//========================ImageDownloadProcessor===============
//=============================================================
exports.ImageDownloadProcessor = {
  process: function(input, context, callback) {
    var me = this;

    fse.ensureDirSync(me.getDownloadDir(context.category));

    var images = me.parseImageMapping(input, context);

    me.downloadImages(images, function(err, images){
      if (err) {
        return callback(err);
      }

      for(var i in images) {
        if (images[i].success) {
          input[images[i].prop] = images[i].downloadPath;
        } else {
          console.log('fail to download image: ' + images[i].src);
        }
      }

      callback(null, input);
    });
  },

  getDownloadDir: function(category) {
    var tmp = helper.getAppTmpDir();
    if (category) {
      return path.join(tmp, category);
    } else {
      return tmp;
    }
  },

  parseImageMapping: function(input, context) {
    var me = this;
    var uri = context.uri;
    var mapping = context.mapping;
    var dir = me.getDownloadDir(context.category);

    var images = [];
    for(var p in mapping) {
      var mappingItem = mapping[p];
      if (mappingItem.download && uri) {
        var imgSrcs = helper.ensureArray(input[p]);
        for (var i = 0; i < imgSrcs.length; i++) {
          var imgSrc = imgSrcs[i];
          var downloadPath = path.join(dir, path.basename(imgSrc));
          images.push({
            prop: helper.addSuffix(p, 'download'),
            downloadPath: downloadPath,
            src: url.resolve(uri, imgSrc)
          });
        }
      }
    }

    return images;
  },

  /**
   *
   * @param images
   *  prop {String}, 'downloadXXX'
   *  downloadPath {String}, path to the downloaded image
   *  src {String}, src to the image
   * @param callback(err, images)
   */
  downloadImages: function(images, callback) {
    console.log(images);
    callback(null);

//    async.mapLimit(images, 3, function(image, asyncCallback) {
//      download(image.src, image.downloadPath, function(err){
//        asyncCallback(null, extend(image, {
//          success: !err
//        }));
//      });
//    }, callback);
  }
};

//=============================================================
//========================FileDumpProcessor====================
//=============================================================
exports.FileDumpProcessor = {
  process: function (input, context, callback) {
    fse.writeFile(context.dumpFile, context.html, function(err){
      callback(err, input);
    });
  }
};