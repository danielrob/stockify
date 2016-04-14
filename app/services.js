"use strict";
const
   exif = require('exif').ExifImage;
angular.module('services', [])

// https://gist.github.com/fisch0920/37bac5e741eaec60e983
.service('orientation', function () {
  return function(photo, callback){
    try {
      new exif({ image: photo.path }, function(error, exifData) {
        if (error)
          console.log('Error: ' + error.message);
        else {
          callback(exifData.image.Orientation);
        }
      });
    } catch (error) {
      console.log('Error: ' + error.message);
    }
  }

});
