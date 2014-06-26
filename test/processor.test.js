/**
 * Created by ramon on 6/24/14.
 */

var assert = require('assert');

var helper = require('../lib/helper');

describe('helper', function(){
  it('addSuffix', function(){
    assert(helper.addSuffix('imgSrc', 'download') === 'downloadImgSrc');
  });
});