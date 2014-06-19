var request = require('request');

var Scraper = module.exports = function() {

};

var proto = Scraper.prototype;

proto.scrapePage = function(uri, callback) {
  var me = this;

  request.get(uri, function(err, res, body) {
    if (err || res.statusCode !== 200) {
        callback(err || 'res status code is not 200, which is ' + res.statusCode);
        return;
    }

    var result = null;
    if (me.parser) {
      result = me.parser.parse(body);
    }

    callback(null, result);
  });
};