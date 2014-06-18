var assert = require('assert');
var cheerio = require('cheerio');

var scraper = require('../lib/scraper');

describe('scraper', function() {
    this.timeout(1000 * 30);

    it('foo', function(done) {
        scraper.scrapePage('http://www.jufengshang.com/Longines3756', function(err, htmlPage) {
            var $ = cheerio.load(htmlPage);
            var imgSrc = $('.jqzoom img').attr('src');

            var info = $('.information');
            var title = info.children('h1').text();
            var description = info.children('.theword').text();
//            var price = info.children('.shop_s').text();

            console.log(imgSrc, title, description);

            assert(title && imgSrc && description, 'All necessary fileds should exist');
            done(err);
        });
    });
});