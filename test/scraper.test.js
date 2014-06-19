var assert = require('assert');

var Scraper = require('../lib/scraper');
var Parser = require('../lib/parser');

describe('scraper', function() {
  this.timeout(1000 * 30);

  it('foo', function(done) {
    var parser = new Parser({
      imgSrc: {
        selector: '.jqzoom img',
        attr: 'src'
      },
      title: '.information h1',
      description: '.information .theword'
    });

    var scraper = new Scraper();
    scraper.parser = parser;

    scraper.scrapePage('http://www.jufengshang.com/Longines3756', function(err, result) {
      console.log(result);

      assert(result);
      assert(result.title);
      assert(result.imgSrc);
      assert(result.description);

      done(err);
    });
  });
});