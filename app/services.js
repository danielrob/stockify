// required globals: photoList, thumbnail

angular.module('services', [])

  /*
    Accepts an array of File Objects, gets the associated list of photos, and if it's not empty,
    notifies the caller, and delegates the photoList to the photoProcessingService for processing.
  */
  .service('importService', ['photoProcessingService', 'libraryService',
   function(photoProcessingService, libraryService) {

    this.import = function(files, updateViewCallback, digestCallback) {

      photoList(files, photoListHandler);

      function photoListHandler(err, photos) {
        if (err) throw err;
        if (photos.length === 0) return;
        updateViewCallback(photos);
        photoProcessingService.process(photos, digestCallback, function finalCallback(photos){
          libraryService.addImportToLibrary(photos, digestCallback);
        });
      }
    }

  }])

  /*
    Accepts an array of photo objects (minimally {path: 'path/to/photo'}), and applies tasks which
    add keys to the photo object. E.g.
    {path: 'path/to/photo'} -> 
    {path: 'path/to/photo', thumbnailPath: 'path/to/photoThumbnail', orientaion: 6}
  */
  .service('photoProcessingService', ['orientation', function(orientation) {

    this.process =

    function (photos, digestCallback, callback) {
      var count = 0;
      const timerStart = new Date(),
        q = async.queue(processPhoto, 100);

      // Queue actions
      function processPhoto(photo, callback) {
        async.applyEachSeries(
          [
            orientation,
            thumbnail
          ],
          photo,
          function done() {
            if (count++ % 100 === 0 || count === 20) digestCallback(); // 100 seems a good performance heuristic
            callback();
          }
        );
      }

      // When empty
      q.drain = function() {
        console.log('\n Thumbnailing ' + photos.length + ' images took ' +
                     (new Date().getTime() - timerStart.getTime()) + ' milliseconds\n\n');
        digestCallback();
        callback(photos);
      }

      // Add all photos
      q.push(photos)
    }
  }])

  /*
    Adds the 'orientation' and 'orientClass' keys to photo objects.
  */
  .factory('orientation', function() {

    const
      exif = require('exif').ExifImage;

    // Source: https://gist.github.com/fisch0920/37bac5e741eaec60e983
    return function fetchOrientation(photo, callback) {
      if (photo.orientation !== void 0) return;

      try {
        new exif({ image: photo.path }, function(error, exifData) {
          if (error) {
            console.log('Error: ' + error.message);
            photo.orientation = 1;
            photo.orientClass = 'orient-1'
            callback(null);
          }
          else {
            photo.orientation = exifData.image.Orientation;
            photo.orientClass = 'orient-' + exifData.image.Orientation;
            callback(null);
          }
        });
      } catch (error) {
        console.log('Error: ' + error.message);
        callback(null);
      }
    }
  })

  .service('scrollService', [function() {

    this.scrollToIndex =

      function(index) {
        var height = document.body.clientHeight;
        var thumb = document.getElementById('anchor' + index);
        var trail = document.getElementById('importViewSidebar');
        var filler = document.getElementById('scrollbar-filler');

        if (!thumb) return;
        // Bugfix. See below.
        filler.style.display = "initial";
        trail.style.overflowY = "hidden";

        if (thumb.offsetTop - height + thumb.clientHeight > trail.scrollTop) {
          trail.scrollTop = (thumb.offsetTop - height + thumb.clientHeight);
        } else
          if (thumb.offsetTop < trail.scrollTop) {
            trail.scrollTop = thumb.offsetTop - 34;
          }

        /*
          It's a bugfix. Without it, if there's been a click on the list,
          chrome makes a small scrolling adjustment after the above,
          giving it a horrible double-scroll-jerk.
          This was the only way I could find to fix it.
          The filler means we can still have a scrollbar, it hides the
          fact the scrollbar temporarily dissapears during this process.
        */
        setTimeout(function() {
          trail.style.overflowY = "scroll";
          filler.style.display = "none";
        }, 1);

      }
  }])
