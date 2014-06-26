/**
 * Created by ramon on 6/24/14.
 */

var fs = require('fs');

var request = require('request');

/**
 *
 * @param src
 * @param dest
 * @param callback(err)
 */
module.exports = function download(src, dest, callback) {
  var options = {
    url: src,
    encoding: null,
    headers: {
      "user-agent" : "Mozilla/5.0 (iPad; CPU OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A406 Safari/8536.25",
      //"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/537.13+ (KHTML, like Gecko) Version/5.1.7 Safari/534.57.2",
      "accept-encoding" : "gzip,deflate"
    }
  };

  request.get(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var encoding = response.headers['content-encoding'];
      var decodingFn = null;
      if (encoding == 'gzip') {
        decodingFn = "gunzip";
      } else if (encoding == 'deflate') {
        decodingFn = "inflate";
      }

      if (decodingFn) {
        zlib[decodingFn](body, function(err, decoded) {
          writeToFile(dest, decoded, callback);
        });
      } else {
        writeToFile(dest, body, callback);
      }
    } else {
      callback(error || new Error("Response status is not 200, which is " + response.statusCode));
    }
  });
};

function writeToFile(filePath, data, callback) {
  fs.writeFile(filePath, data, 'binary', function(error) {
    if(error){
      console.log("fail to write image to local: " + filePath);
    }
    callback(error);
  });
}