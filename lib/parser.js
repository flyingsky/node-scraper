/**
 * Created by ramon on 6/19/14.
 */

var cheerio = require('cheerio');

var Parser = module.exports = function(mapping) {
  var me = this;
  me.mapping = mapping;
};

var proto = Parser.prototype;

proto.parse = function(htmlPage) {
  var me = this;
  var $ = cheerio.load(htmlPage);
  var result = {};
  var isEmptyResult = true;
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
      result[p] = attr === 'text' ? $(selector).text() : $obj.attr(attr);
      isEmptyResult = false;
    }
  }

  return isEmptyResult ? null : result;
};