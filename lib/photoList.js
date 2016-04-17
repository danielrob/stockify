"use strict";

const walk = require('walkdir'),
      fs = require('fs'),
      path = require('path'),
      async = require('async');


module.exports = photoList;


/*
 Accepts a callback and an array of File Objects (as per Web API).
 Returns an array of all JPEG files found including from walking
 directories, if any of the array items represents a directory.
 The file array order is non-deterministic.
*/
function photoList(sources, callback) {
  if (typeof callback !== 'function') {
    throw new Error("import callback must be a function");
  }

  var importList = [];

  async.each(sources, getPhotosFromSrc, finishedAddingFromAllSources);

  function getPhotosFromSrc(source, finishedAddingFromSource) {

    const abspath = source.path;
    if (isPhoto(abspath)) {
      fs.lstat(abspath, addPhoto)
    } else {
      fs.lstat(abspath, walkIfDirectory)
    }

    function addPhoto(err, stats) {
      if (err) throw err;
      addToImport(abspath, stats, importList);
      finishedAddingFromSource();
    }

    function walkIfDirectory(err, stats) {
      if (err) throw err;
      if (stats.isDirectory()) {

        walk(abspath)

          .on('file', function(abspath, stats) {
            if (isPhoto(abspath)) {
              addToImport(abspath, stats, importList)
            }
          })

          .on('end', function() {
            finishedAddingFromSource();
          });

      } else {
        finishedAddingFromSource();
      }
    }
  }

  function finishedAddingFromAllSources() {
        callback(null, importList);
  }


}

function isPhoto(fileNameOrObject){
  if (typeof fileNameOrObject === "string") {
    return fileNameOrObject.search(/\.[Jj][Pp][Ee]?[Gg]$/) > 0;
  } else if (typeof fileNameOrObject === "object") {
    return fileNameOrObject.type === "image/jpeg";
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
