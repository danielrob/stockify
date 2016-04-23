"use strict";
angular.module('stockify-develop', ['libraryService', 'services', 'directives'])

  /*
    The application initialiser and state based view maintainer.
    keyEvent & libraryService loaded here for intialisation purposes.
  */
  .controller('appCtrl', ['$scope', 'stateService', 'importService', 'keyEvent', 'libraryService',
    function($scope, stateService, importService, keyEvent, libraryService) {

      const showImport =
         stateService.transitionTo.bind(stateService, 'importView');

      // Initial application state
      $scope.state = stateService.getState();

      // Subscribe to future updates
      $scope.$on('state-change', function(e, state){
        $scope.state = stateService.getState();
      });

      // A drag and drop import by the user
      $scope.import = function(files) {
        importService.import(files, showImport, function() {
          $scope.$digest();
        });
      }
    }
  ])

  .controller('importViewCtrl', function($scope, stateService, indexService){

      const maxIndex = stateService.stateParams.length -1;

      // Which import are we showing?
      $scope.photoImport = stateService.stateParams;

      // Initialise view on the first photo.
      indexService.set(0, maxIndex);

      // Monitor/set the currently selected photo in the template
      $scope.index = indexService;

      // For changing view
      $scope.transitionToState = stateService.transitionTo;

      // To avoid program failure (too many net requests) upon loading large imports.
      ngRepeatAllSlowly(maxIndex + 1);

      function ngRepeatAllSlowly(importSize) {
        var delay = 100, // delay value doesn't matter much (but needs to be > 10).
          incr = 100,
          cycleCount = Math.ceil(importSize / incr);

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
    const
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

      // teardown
      $scope.$on('pre-state-change', function(){
        stateService.store('trailViewSelected', indexService.get());
      })

  })
