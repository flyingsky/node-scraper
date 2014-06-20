/**
 * Created by ramon on 6/19/14.
 */

var path = require('path');
var assert = require('assert');
var Parser = require('../lib/parser');

describe('Parser', function() {
  it('Simple Config', function() {
    var p = new Parser(path.resolve('test/simple-parser.json'));

    var result = p.parse('' +
      '<div class="jqzoom">' +
        '<img src="xxx"/>' +
      '</div>' +
      '<div class="information">' +
        '<h1>yyy</h1>' +
        '<p class="theword">zzz</p>' +
      '</div>');

    assert(result);
    assert(result.imgSrc == 'xxx');
    assert(result.title == 'yyy');
    assert(result.description == 'zzz');
  });
});


