// required globals: photoList, thumbnail

angular.module('services', [])

  /*
    A simple state routing service.
  */
  .service('stateService', ['libraryService', '$rootScope', function(libraryService, $rootScope){

      const self = this;

      this.state = libraryService.library() ? 'trailView' : 'welcome';
      this.stateParams;
      this.stateStore = {};

      this.transitionTo = function(state, params, digest){
        $rootScope.$broadcast('pre-state-change', state);
        self.state = state;
        if (params) self.stateParams = params;
        $rootScope.$broadcast('state-change', state, digest);
      }

      this.getState = function(){
        return self.state;
      }

      this.store = function(key, val){
        self.stateStore[key] = val;
      }

      this.restore = function(key){
        return self.stateStore[key];
      }

  }])

 /*
    I maintain an abstract index between zero and a specified max (or infiinity).
  */
 .service('indexService', function($rootScope){
    const self = this;

    this.current;
    this.max;

    this.set = function(index, max){
      if (0 > index || index > max) index = 0;
      this.current = index;
      if (max !== undefined) this.max = max;
      $rootScope.$broadcast('index-update', this.current);
    }

    this.get = function(){
      return this.current;
    }

    // Increment the current value by 1.
    this.increment = function(){
      this.set(next(this.current));
    }

    // Decrement the current value by 1.
    this.decrement = function(){
      this.set(previous(this.current));
    }

    // Find out what next would be if incremented. Private.
    function next(i){
      return i === self.max ? self.max : i + 1;
    }

    // Find out what previous would be if decremented. Private.
    function previous(i){
      return i === 0 ? 0 : i - 1;
    }

  })

  /*
    Convert keypress events into angular events. This way they can
    more easily be consumed in child view directives.
  */
  .service('keyEvent', function($rootScope, $document){
     $document.on('keydown', function(e){
       $rootScope.$broadcast('keydown', e);
     })
  })

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
        photoProcessingService.process(photos, updateViewCallback, digestCallback, function finalCallback(photos){
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

    function (photos, firstDoneCallback, digestCallback, callback) {
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
            if (count === 0) firstDoneCallback(photos);
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
