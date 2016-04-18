"use strict";
angular.module('stockify-develop', ['libraryService', 'services', 'directives'])

  .controller('HomeCtrl', ['$scope', '$timeout', 'importService', 'scrollService', 'libraryService',
    function($scope, $timeout, importService, scrollService, libraryService) {

      // A drag and drop import by the user
      $scope.import = function(files) {
        importService.import(files, updateView, function() {
          $scope.$digest();
        });
      }

      // Selection of a pre-existing import
      $scope.showImport = function(photoImport) {
        updateView(photoImport);
        ngRepeatAllSlowly(photoImport.length);
      }

      // Manages photo selection display
      $scope.setSelectedRow = function(index) {
        $scope.selectedRow = index;
        $scope.$broadcast('new-photo-selected', index);
        scrollService.scrollToIndex(index);
      }

      // Ensures the library is updated for the user after new imports
      $scope.$on('library-update', function(event, updatedLibrary) {
        $scope.photoLibrary = updatedLibrary;
        $scope.$digest();
      });

      // Updates view for displaying an import.
      function updateView(photoImport) {
        // Note: no auto digest if this is called as a callback
        $scope.$broadcast('new-import');
        $scope.photoImport = photoImport;
        // Loses a race for first photo orientation & causes scroll after ng-show.
        $timeout($scope.setSelectedRow.bind(null, 0));
        $scope.state.initialized = true;
        $scope.state.trailView = false;
        document.getElementById('import').innerText = "Importing"; // immediately.
      }

      /*
        Controller Initialisation
      */
      $scope.state = {
        initialized: false,
        trailView: false
      }

      angular.element(document).ready(function() {
        if (libraryService.library()) {
          $scope.photoLibrary = libraryService.get();
          $scope.state = {
            initialized: true,
            trailView: true,
          }
          $scope.$digest(); // Nothing happens otherwise.
        }
      });

      // To avoid program failure (too many net requests) upon loading large imports.
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

    }
  ]);
