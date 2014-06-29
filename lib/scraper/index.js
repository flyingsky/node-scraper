/**
 * Created by ramon on 6/27/14.
 */

var exports = module.exports = require('./scraper');
var processor = require('./processor');

for(var p in processor) {
  exports[p] = processor[p];
}