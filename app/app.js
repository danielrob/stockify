"use strict";
angular.module('stockify-develop', ['libraryService', 'services', 'directives', 'keyboard'])

  /*
    The application initialiser and state based view maintainer.
    keyEvent & libraryService loaded here for intialisation purposes.
  */
  .controller('appCtrl', ['$scope', '$timeout', 'stateService', 'photoImportService', 'keyEvent', 'libraryService',
    function($scope, $timeout, stateService, photoImportService, keyEvent, libraryService) {

      // Initial application state
      $scope.state = stateService.getState();

      // Subscribe to future updates
      $scope.$on('state-change', function(e, state, digest){
        $scope.state = stateService.getState();
        if (digest) $timeout($scope.$digest.bind($scope));
      });

      // A drag and drop import by the user
      $scope.importPhotos = photoImportService.importPhotos;
    }
  ])

  .controller('importViewCtrl', function($scope, stateService, indexService){

      let maxIndex, reload = load;

      // Expose for monitoring & setting the selected photo in the view.
      $scope.index = indexService;

      // Expose for changing state from the view
      $scope.transitionToState = stateService.transitionTo;

      function load(){
        maxIndex = stateService.stateParams.data.length -1;

        // Which import are we showing?
        $scope.photoImport = stateService.stateParams;

        // Initialise view on the first photo.
        indexService.set(0, maxIndex);

        // To avoid program failure (too many net requests) upon loading large imports.
        ngRepeatAllSlowly(maxIndex + 1);
      }

      load();

      // Reload if there's a new photo import while in importView.
      $scope.$on('state-change', function(e, state){
        if (state === 'importView') reload();
      });

      // Digest if the currently viewed photoImport changes.
      $scope.$on('photoimport-update', function(){
        $scope.$digest();
      });

      // To avoid program failure (too many net requests) upon loading large imports.
      function ngRepeatAllSlowly(photoImportSize) {
        var delay = 100, // delay value doesn't matter much (but needs to be > 10).
          incr = 100,
          cycleCount = Math.ceil(photoImportSize / incr);

          $scope.ngRepeatLimit = 50;

        _(cycleCount).times(function(i) {
          setTimeout(function() {
            $scope.ngRepeatLimit += incr;
            $scope.$digest();
          }, delay += delay);
        })
      }
  })

  .controller('trailViewCtrl', function($scope, libraryService, stateService, indexService){
    let
      maxIndex = libraryService.get().length - 1,
      startIndex = stateService.restore('trailViewSelected') || 0;

      // Put the library on the scope
      $scope.photoLibrary = libraryService.get();

      // Initialise on
      indexService.set(startIndex, maxIndex);

      // Monitor/set the currently selected import in the template
      $scope.index = indexService;

      // For changing view
      $scope.transitionToState = stateService.transitionTo;

     // Update page when library is updated, especially after a delete.
      $scope.$on('library-update', function(event, updatedLibrary) {
        $scope.photoLibrary = updatedLibrary;
        maxIndex = updatedLibrary.length - 1;
        if (maxIndex === -1) {
         return stateService.transitionTo('welcome', null, true);
        }
        indexService.set(indexService.current, maxIndex);
        $scope.$digest();
      });

      // teardown
      $scope.$on('pre-state-change', function(){
        stateService.store('trailViewSelected', indexService.get());
      })

  })
