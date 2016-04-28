"use strict";
angular.module('stockify',
  [
    'libraryService',
    'services',
    'directives',
    'controllers',
    'keyboard'
  ]
)

  /*
    AppCtrl works with stateService to initialise & maintain the correct view.
    As the view container it also exposes the [drag and] drop action for whole
    application, and adds a listener for saving the library on shutdown.
    'keyEvent' service loaded here to intialise keyboard capture.
  */
  .controller('appCtrl',
    function($scope, $timeout, stateService, photoImportService, libraryService, keyEvent) {

      // Initial application view
      $scope.state = stateService.state;

      // Update the view according to state changes
      $scope.$on('state-change', function(e, state, digest){
        $scope.state = stateService.state;
        if (digest) $timeout($scope.$digest.bind($scope));
      });

      // Expose for changing view application wide.
      $scope.transitionToState = stateService.transitionTo;

      // A drag and drop import by the user
      $scope.importPhotos = photoImportService.importPhotos;

      // Write library to disk on window close / shutdown.
      window.onbeforeunload = libraryService.persist;
   })
