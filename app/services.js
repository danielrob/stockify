"use strict";
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

      this.reload = function(digest){
        self.transitionTo(self.state, self.stateParams, digest);
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
      if (max !== undefined) self.max = max;
      if (0 > index || index > max) index = 0;
      self.current = index;
      $rootScope.$broadcast('index-update', self.current);
    }

    this.get = function(){
      return self.current;
    }

    // Increment the current value by 1.
    this.increment = function(){
      self.set(next(self.current));
    }

    // Decrement the current value by 1.
    this.decrement = function(){
      self.set(previous(self.current));
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
    Accepts an array of File Objects, gets the associated list of photos, and if it's not empty,
    notifies the caller, and delegates the photoList to the photoProcessingService for processing.
  */
  .factory('photoImportService', ['photoProcessingService', 'libraryService', '$rootScope', 'stateService',
   function(photoProcessingService, libraryService, $rootScope, stateService) {
     const self = this,
           notifyUpdate = $rootScope.$broadcast.bind($rootScope, 'photoimport-update');

    return {
      importPhotos: importPhotos,
      getImport: getImport,
      rejectRejects: rejectRejects
    }

    function importPhotos(files) {

      photoList(files, createPhotoImport); // Fetch photo list

      function createPhotoImport(err, list) {
        let photoImport, goToImportView;

        if (err) throw err;
        if (list.length === 0) return;

        photoImport = wrappedSortedPhotoList(list);

        goToImportView =
          stateService.transitionTo.bind(stateService, 'importView', photoImport, true);

        photoProcessingService.process(photoImport.data, goToImportView, notifyUpdate, function finalCallback(){
          libraryService.addImportToLibrary(photoImport, notifyUpdate);
        });
      }

      function wrappedSortedPhotoList(list) {
        list = _.sortBy(list, 'created');
        return {
          id: uuid(),
          date: list[0].created,
          data: list
        };
      }
    } // importPhotos

    function uuid() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

    function getImport(uuid){
      return _.findWhere(libraryService.get(), {id: uuid});
    }

   // Removes rejects from the specified import
   function rejectRejects(uuid, moveRejectsToTrash){
      let partition, rejects, keeps, photoImport = getImport(uuid);

      partition = _.partition(photoImport.data, function(photo) {
        return photo.reject === true;
      });

      rejects = partition[0];
      keeps = partition[1];

      // Remove each of the rejects.
      _.each(rejects, function(reject){
        if(moveRejectsToTrash) {
          shell.moveItemToTrash(reject.path);
        }
        // Hard delete the thumbnail regardless.
        fs.unlink(reject.thumbnail);
      })

      // Remove the whole import if it's now empty.
      if (keeps.length === 0){
        libraryService.removeImportFromLibrary(uuid);
        // Could transitionTo here, but leave the user to figure that out.
      }

      // Otherwise keep the keeps
      photoImport.data = keeps;

      // Perist for good measure
      libraryService.persist();

      // Reload the view
      stateService.reload();
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

    function (photos, firstDoneCallback, digestCallback, finalCallback) {
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
        finalCallback(photos);
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
