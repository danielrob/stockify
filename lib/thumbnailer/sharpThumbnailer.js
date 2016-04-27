"use strict";
var Sharp = require("sharp");

module.exports = sharpThumbnailer;


function sharpThumbnailer(photo, thumbpath, thumbMadeCallback) {
  var img = Sharp(photo.path), ratio, size = 400;

  img
    .metadata()
    .then(function(metadata) {
      ratio = metadata.height / metadata.width;
      photo.ratio = metadata.width /  metadata.height;
      photo.height = metadata.height;
      photo.width = metadata.width;
      img.resize(size, Math.ceil(size * ratio))
        .toFile(thumbpath, function(err) {
          if (err) throw err;
          thumbMadeCallback();
        });
    })
}

