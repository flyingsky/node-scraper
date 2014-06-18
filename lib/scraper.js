var request = require('request');
var cheerio = require('cheerio');

exports.scrapePage = function(uri, callback) {
    request.get(uri, function(err, res, body) {
        if (err || res.statusCode !== 200) {
            callback(err || 'res status code is not 200, which is ' + res.statusCode);
            return;
        }
        
        callback(null, body);
    });   
};