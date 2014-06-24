/**
 * Created by colin on 6/24/14
 */
var ScraperLee = require('../lib/scrapers/scraper-lee');

describe('scraper-lee', function() {
  this.timeout(1000 * 60 * 2);

  it('category', category);
});

function category(done) {
  var lee = new ScraperLee();
  lee.start(done);
}