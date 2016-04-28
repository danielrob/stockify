"use strict";
angular.module('controllers', [])

  /*
    Root controller for the 'importView'.
  */
  .controller('importViewCtrl', function($scope, stateService, indexService, $interval){

      let maxIndex, reload = load;

      // Expose for monitoring & setting the selected photo in the view.
      $scope.index = indexService;

      // Dynamic controller initialisation.
      function load(){
        maxIndex = stateService.stateParams.data.length -1;

        // Which import are we showing?
        $scope.photoImport = stateService.stateParams;

        // Initialise selection on the first photo.
        indexService.set(stateService.restore('goTo') || 0, maxIndex);

        // To avoid program failure (too many net requests) upon loading large imports.
        ngRepeatAllSlowly(maxIndex + 1);
      }

      // Initialise.
      load();

      // Reload if there's a new photo import while in importView.
      $scope.$on('state-change', function(e, state){
        if (state === 'importView') reload();
      });

      // Digest if the currently viewed photoImport changes.
      $scope.$on('photoimport-update', function(){
        $scope.$digest();
      });

      // To avoid too many net requests upon loading large imports.
      function ngRepeatAllSlowly(photoImportSize) {
        let incr = 400,
            cycleCount = Math.ceil(photoImportSize / incr),
            stop;

          // Set initial limit
          $scope.ngRepeatLimit = 20;

          // Then reguarly increase it.
          stop = $interval(incrementLimit, 400, cycleCount, true).then(function(){
             $scope.$broadcast('thumbnails-finished-loading');
             $interval.cancel(stop);
          });

          // Increase ngRepeatLimit
          function incrementLimit() {
            $scope.ngRepeatLimit += incr;
          }
      }
  })

  // Expose batch photo actions
  .controller('photoActionsCtrl', function($scope, photoImportService){
      $scope.rejectRejects = photoImportService.rejectRejects;
  })

  /*
    Root controller for the 'trailView'.
  */
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

  /*
    Manages keyword pane.
  */
  .controller('keywordsCtrl', function($scope, indexService){

      $scope.addKeywords = function (){
        let photo = $scope.photoImport.data[indexService.current];

        if (!$scope.keywords) {
          return $scope.$emit('end-keywording');
        }

        photo.keywords = photo.keywords || [];
        photo.keywords = _.without(_.uniq(photo.keywords.concat($scope.keywords.split(','))), "");
        $scope.keywords = "";
      }

      $scope.removeKeyword = function (keyword){
        let photo = $scope.photoImport.data[indexService.current];
        photo.keywords = _.without(photo.keywords, keyword);
      }

      $scope.keepOpen = false;

      $scope.$on('index-update', function(){
        if ($scope.keepOpen) return;
        $scope.$emit('end-keywording');
      })

})

/*
  trailView sub controller: first click preview, second click open the import.
*/
.controller('clickImportSelectCtrl', function($scope){
  $scope.importSelect = function($index){
    if ($scope.index.current !== $index) {
      $scope.index.set($index);
    } else {
      $scope.transitionToState('importView', $scope.photoImport);
    }
  }
})

.controller('preferencesCtrl', function($scope, preferencesService){
  $scope.preferences = preferencesService;

  $scope.toggle = function(){
    preferencesService.lockedGrid = !preferencesService.lockedGrid;
  }
});
