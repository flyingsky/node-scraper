/**
 * Created by ramon on 6/19/14.
 */

exports.isString = function(obj) {
  return typeof(obj) === 'string';
};

exports.addSuffix = function(str, suffix) {
  return suffix + str[0].toUpperCase() + str.substr(1);
};