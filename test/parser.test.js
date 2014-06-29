/**
 * Created by ramon on 6/19/14.
 */

var path = require('path');
var assert = require('assert');
var SimpleProcessor = require('../lib/scraper/scraper').SimpleProcessor;

describe('Processor', function() {
  it.only('Simple Config', simpleConfig);
});

function simpleConfig() {
  var p = new SimpleProcessor(path.resolve('test/simple-parser.json'));

  var html = '' +
    '<div class="jqzoom">' +
    '<img src="xxx"/>' +
    '</div>' +
    '<div class="information">' +
    '<h1>yyy</h1>' +
    '<p class="theword">zzz</p>' +
    '</div>';

  p.process(html, {}, function(err, result){
    assert(result);
    assert(result.imgSrc == 'xxx');
    assert(result.title == 'yyy');
    assert(result.description == 'zzz');
  });
}
