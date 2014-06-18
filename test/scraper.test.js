var assert = require('assert');
var cheerio = require('cheerio');

var scraper = require('../lib/scraper');

describe('scraper', function() {
    this.timeout(1000 * 30);

    it('foo', function(done) {
        scraper.scrapePage('http://www.jufengshang.com/Longines3756', function(err, htmlPage) {
            console.log(htmlPage);
            assert(htmlPage);

            var $ = cheerio.load(htmlPage);
            var img = $('.zoomPad img:first');
            var imgSrc = img.attr('href');

            var info = $('.information');
            var title = info.children('h1').text();
            var description = info.children('.theword').html();
            var price = info.children('.shop_s').text();

            console.log(imgSrc, title, description, price);

            assert(title && imgSrc && description && price, 'All necessary fileds should exist');
            done(err);
        });
    });
});