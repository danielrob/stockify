"use strict";

const
   fs = require('fs'),
   async = require('async'),
   SIZE = 150,
   QUEUE_SIZE = 1,
   q = async.queue(function (task, queueCallback) {
     task.argz.push(queueCallback);
     canvasThumbnailer.apply(null, task.argz);
}, QUEUE_SIZE);

var imgPool = [];

for (let i = 0; i < QUEUE_SIZE + 1; i++) {
  imgPool.push(new Image());
}

function addToQueue(photo, thumbpath, thumbMadeCallback){
  q.push({argz: [photo, thumbpath, thumbMadeCallback]});
}

function canvasThumbnailer(photo, thumbpath, thumbMadeCallback, queueCallback) {

  var img = imgPool.pop();

  img.onload = function(event) {
    var width = event.path[0].width,
      height = event.path[0].height,
      ratio = height / width,
      dataURI = resizeImage(img, SIZE, Math.ceil(SIZE * ratio)),
      data = dataURI.replace(/^data:image\/jpeg;base64,/, "");

    fs.writeFile(thumbpath, data, 'base64', function(err) {
      if (err) throw err;
      thumbMadeCallback();
      queueCallback();
      imgPool.unshift(img);
    });
  };

  img.src = photo.path;
}

function resizeImage(img, width, height) {

  var canvas = document.createElement('canvas');

  canvas.width = width;
  canvas.height = height;
  var ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg');
}

module.exports = addToQueue;
