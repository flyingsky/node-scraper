/**
 * Created by ramon on 6/19/14.
 */

var path = require('path');
var url = require('url');

var cheerio = require('cheerio');
var async = require('async');
var extend = require('extend');

var download = require('./image/download');
var helper = require('./helper');

//=============================================================
//========================SimpleParser=========================
//=============================================================

var Parser = exports.Parser = function(mapping) {
  var me = this;

  if (helper.isString(mapping) && path.extname(mapping) == '.json') {
    mapping = require(mapping);
  }

  me.mapping = mapping;
};

var proto = Parser.prototype;

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
  var images = [];

  for (var p in mapping) {
    var selector = mapping[p];
    var attr = 'text';

    if (typeof(selector) !== 'string') {
      selector = mapping[p].selector;
      attr = mapping[p].attr;
    }

    var $obj = $(selector);
    if ($obj && $obj.length > 0) {
      result[p] = attr === 'text' ? $(selector).text() : $obj.attr(attr);
    }
  }

  extend(context, {mapping: me.mapping});

  callback(null, result);
};

//=============================================================
//========================ImageDownloadProcessor===============
//=============================================================
exports.ImageDownloadProcessor = {
  process: function(input, context, callback) {
    var me = this;

    var images = me.parseImageMapping(input, context.uri, context.mapping);

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

  parseImageMapping: function(input, uri, mapping) {
    var me = this;
    var images = [];
    for(var p in mapping) {
      var mappingItem = mapping[p];
      if (mappingItem.downloadDir && uri) {
        var imgSrc = input[p];
        var downloadPath = path.join(mappingItem.downloadDir, path.basename(imgSrc));

        images.push({
          prop: helper.addSuffix(p, 'download'),
          downloadPath: downloadPath,
          src: url.resolve(uri, imgSrc)
        });
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
    async.mapLimit(images, 3, function(image, asyncCallback) {
      download(image.src, image.downloadPath, function(err){
        asyncCallback(null, extend(image, {
          success: !err
        }));
      });
    }, callback);
  }
};