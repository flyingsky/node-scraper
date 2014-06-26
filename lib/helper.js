/**
 * Created by ramon on 6/19/14.
 */

var fs = require('fs');
var path = require('path');
var util = require('util');
var request = require('request');

var APP_DATA_FILE = path.join(__dirname, '..', 'app.json');
var appData;

exports.isString = function(obj) {
  return typeof(obj) === 'string';
};

exports.addSuffix = function(str, suffix) {
  return suffix + str[0].toUpperCase() + str.substr(1);
};

/**
 *
 * @param fn single function or array of function
 * @param scope
 * @return an wrap function or array of wrap function
 */
exports.wrapMethod = function(fn, scope) {
  var isArrayFn = util.isArray(fn);
  var fns = isArrayFn ? fn : [fn];
  fns = fns.map(function(fnItem){
    return function(){
      fnItem.apply(scope, arguments);
    };
  });

  return isArrayFn ? fns : fns[0];
};

exports.makeSureDirExist = function(dir) {
  fs.exists(dir, function(exists) {
    if (!exists) {
      fs.mkdir(dir, function(err){
        if (err) {
          console.log('fail to create dir: ', dir, err);
        }
      });
    }
  });
};

var makeSureDirExistSync = exports.makeSureDirExistSync = function(dir) {
  if(!fs.existsSync(dir)) {
    mkdirPSync(dir);
  }
};

/**
 * mkdir -p
 * The side effect of this function is it guarantees the input path must exist
 * @param dirPath
 */
var mkdirPSync = exports.mkdirPSync = function(dirPath) {
  var dirs = [];
  var currPath = dirPath;

  while(!fs.existsSync(currPath)) {
    dirs.unshift(currPath);
    currPath = path.dirname(currPath);
  }

  for(var i = 0; i < dirs.length; i++) {
    fs.mkdirSync(dirs[i]);
  }
};

var removeDirSync = exports.removeDirSync = function(path) {
  var files = [];

  if( fs.existsSync(path) ) {
    files = fs.readdirSync(path);

    files.forEach(function(file, index) {
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) {
        removeDirSync(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });

    fs.rmdirSync(path);
  }
};

/**
 * clearDirSync remove all the files and sub directories of the folder, but don't remove the folder itself.
 * To remove the folder as well, call 'removeDirSync'
 */
var clearDirSync = exports.clearDirSync = function(path) {
  if( !fs.existsSync(path) ) {
    return;
  }

  var files = fs.readdirSync(path);
  files.forEach(function(file) {
    var curPath = path + "/" + file;
    if(fs.lstatSync(curPath).isDirectory()) {
      removeDirSync(curPath);
    } else { // delete file
      fs.unlinkSync(curPath);
    }
  });
};

/**
 * Make sure the dirPath existing and is an empty directory
 * @param dirPath
 */
var makeSureEmptyDirSync = exports.makeSureEmptyDirSync = function(dirPath) {
  //mkdir -p if needed
  mkdirPSync(dirPath);

  //DISASTER!
  if(dirPath == '/') {
    return;
  }

  clearDirSync(dirPath);
};

exports.deleteFileSync = function(file) {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
  }
};

exports.copyFile = function(inputFile, outputFile, callback) {
  var input = fs.createReadStream(inputFile);
  var output = fs.createWriteStream(outputFile);
  pipe(input, output, callback);
};

function isFiltered(filter, file) {
  var isStringFilter = typeof(filter) === 'string';
  return isStringFilter ? filter === file : filter.test(file);
}

var pipe = exports.pipe = function(input, output, callback) {
  var isStreamCallbackExecuted = false;

  function streamCallback(err) {
    if (!isStreamCallbackExecuted) {
      isStreamCallbackExecuted = true;
      callback(err);
    }
  }

  input.on("error", streamCallback);
  output.on("error", streamCallback);
  output.on("close", function(ex) {
    streamCallback();
  });

  input.pipe(output);
};

exports.clearDebugFiles = function() {
  removeDirSync('debug');
};

exports.outputDebugFile = function(fileName, content) {
  var debugFolder = 'debug';
  makeSureDirExistSync(debugFolder);

  if(util.isArray(content)) {
    content = content.join('\n');
  }
  fs.writeFile(path.join(debugFolder, fileName), content, function(err){});
};

var getAppRootDir = exports.getAppRootDir = function() {
  return path.join(__dirname, '..');
};

var getAppTmpDir = exports.getAppTmpDir = function() {
  return path.join(getAppRootDir(), 'tmp');
};

exports.createTmpDir = function(exist) {
  var dir = path.join(getAppTmpDir(), new Date().getTime() + '_' + Math.floor((1 + Math.random()) * 0x1000000000).toString(16));
  if(exist) {
    makeSureDirExistSync(dir);
  }

  return dir;
};

exports.tmpName = function(opts) {
  opts = opts || {};

  var name = (opts.prefix || '');
  name += new Date().getTime();
  name += '_' + Math.floor((1 + Math.random()) * 0x1000000000).toString(16);
  name += (opts.postfix || '');

  var dir = opts.dir || '';
  makeSureDirExistSync(dir);

  return path.join(dir, name);
};

//http://stackoverflow.com/questions/12740659/downloading-images-with-node-js
exports.download = function(uri, filename, callback){
  request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
};

exports.escapeComma = function(txt, escape) {
  if(escape) {
    return txt.replace(/,/g, '%2C');
  } else {
    return txt.replace(/%2C/g, ',');
  }
}

var loadData = exports.loadData = function(fileName) {
  var json = {};
  if(!fs.existsSync(fileName)) {
    return json;
  }

  try {
    var txt = fs.readFileSync(fileName, 'utf-8');
    json = JSON.parse(txt);
  } catch(e) {
    console.log(e);
    json = {};
  }
  return json;
}

var saveData = exports.saveData = function(json, fileName) {
  if(!json) {
    return;
  }

  try {
    var txt = JSON.stringify(json);
    fs.writeFileSync(fileName, txt, 'utf-8');
  } catch(e) {
    console.log(e);
  }
}

exports.getAppData = function() {
  if(!appData) {
    appData = loadData(APP_DATA_FILE);
  }
  return appData;
}

exports.saveAppData = function() {
  saveData(appData, APP_DATA_FILE);
}

exports.refreshAppData = function() {
  appData = loadData(APP_DATA_FILE);
  return appData;
}