/**
 * Created by ramon on 6/19/14.
 */

var path = require('path');
var assert = require('assert');
var Parser = require('../lib/parser').Parser;

describe('Parser', function() {
  it('Simple Config', simpleConfig);
});

function simpleConfig(done) {
  var p = new Parser(path.resolve('test/simple-parser.json'));

  var html = '' +
    '<div class="jqzoom">' +
      '<img src="aaa"/>' +
    '</div>' +
    '<div class="information">' +
      '<h1>yyy</h1>' +
      '<p class="theword">zzz</p>' +
    '</div>';

  p.process(html, function(err, result){
    assert(result);
    assert(result.imgSrc == 'aaa');
    assert(result.title == 'yyy');
    assert(result.description == 'zzz');
    done(err);
  });
}
