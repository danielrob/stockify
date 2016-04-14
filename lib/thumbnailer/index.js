"use strict"

const
  // Electron
  app = require('remote').require('app'),
  fs = require('fs'),
  path = require('path'),
  async = require('async'),

  THUMBS_DIR = path.join(app.getPath('userData'), '/Thumbnails');

  try {
    var Sharp = require("sharp");
  } catch (err) {
    console.log('Tip: Some features of this program could be made faster by installing libvips');
  }

const
  PROVIDER = (!!Sharp) ? require('./sharpThumbnailer') : require('./canvasThumbnailer'),
  generateThumbnail = generateThumbnailFactory.bind(null, PROVIDER);

module.exports = exportFunction;

function exportFunction(photo, callback) {

  const thumbpath = path.join(THUMBS_DIR, photo.name);

  function handleFileCheck(notFound, stats) {
    if (notFound) {
      generateThumbnail(photo, thumbpath, function() {
        callback(thumbpath);
      });
    } else {
      callback(thumbpath);
    }
  }

  fs.stat(thumbpath, handleFileCheck)
}

function generateThumbnailFactory(provider, photo, thumbPath, thumbMadeCallback) {
  provider(photo, thumbPath, thumbMadeCallback);
}
