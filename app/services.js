"use strict";
const
   exif = require('exif').ExifImage,
   async = require('async'),
    q = async.queue(function (task, queueCallback) {
    task.argz.push(queueCallback);
    fetchOrientation.apply(null, task.argz);
  }, 100);

angular.module('services', [])


// https://gist.github.com/fisch0920/37bac5e741eaec60e983
.service('orientation', function () {
  return addToQueue;
});

function addToQueue(photo, haveOrientationCallback){
  q.push({argz: [photo, haveOrientationCallback]});
}

function fetchOrientation(photo, haveOrientationCallback, queueCallback){
    try {
      new exif({ image: photo.path }, function(error, exifData) {
        if (error) {
          console.log('Error: ' + error.message);
          haveOrientationCallback(1);
          }
        else {
          queueCallback();
          haveOrientationCallback(exifData.image.Orientation);
        }
      });
    } catch (error) {
      console.log('Error: ' + error.message);
      haveOrientationCallback(1);
    }
  }
