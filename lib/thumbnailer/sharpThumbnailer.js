"use strict";
var Sharp = require("sharp");

module.exports = sharpThumbnailer;


function sharpThumbnailer(photo, thumbpath, thumbMadeCallback) {
  var img = Sharp(photo.path), ratio, size = 200;

  img
    .metadata()
    .then(function(metadata) {
      ratio = metadata.height / metadata.width;
      img.resize(size, Math.ceil(size * ratio))
        .toFile(thumbpath, function(err) {
          if (err) throw err;
          thumbMadeCallback();
        });
    })
}

