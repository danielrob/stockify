"use strict";

var walk = require('walkdir');
var fs = require('fs-extra');
var path = require('path');
var async = require('async')


function isPhoto(maybe){
  if (typeof maybe === "string") {
    return maybe.search(/\.[Jj][Pp][Ee]?[Gg]$/) > 0;
  } else if (typeof maybe === "object") {
    return maybe.type === "image/jpeg";
  } else {
    return new Error("Item must be a file name, or file object");
  }
}


function addToImport(abspath, stats, importArray) {
  importArray.push({
    path: abspath,
    name: path.basename(abspath),
    created: stats.birthtime,
  });
}


function doImport(callback, files) {

  var photos = [];

  async.each(files, function(fileObj, finished) {

    var abspath = fileObj.path;

    if (isPhoto(fileObj)) {
      fs.lstat(abspath, function (err, stats) {
        if (err) throw err;
        addToImport(abspath, stats, photos);
        finished();
      })
    } else {
      fs.lstat(abspath, walkIfDirectory)
    }

    function walkIfDirectory(err, stats) {
      if (stats.isDirectory()) {

        walk(abspath)

        .on('file', function(abspath, stats) {
          if (isPhoto(abspath)) {
            addToImport(abspath, stats, photos)
          }
        })

        .on('end', function() {
          finished();
        });

      }
    }
  }, function() {
     if (typeof callback === 'function') callback(null, photos);
  })


}
module.exports = {
  import: doImport
}
