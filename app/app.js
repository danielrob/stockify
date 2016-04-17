"use strict";
angular.module('stockify-develop', ['services', 'directives'])

  .controller('HomeCtrl', ['$scope', 'importService', 'scrollService',
    function($scope, importService, scrollService) {

      function updateViewCallback(photos, callback) {
        $scope.$broadcast('new-import');
        $scope.photoImport = photos;
        $scope.setSelectedRow(0);
        $scope.initialized = true; // next $digest
        document.getElementById('import').innerText = "Importing"; // immediately.
      }

      $scope.import = function(files) {
        importService.import(files, updateViewCallback, function() {
          $scope.$digest();
        });
      }

      $scope.setSelectedRow = function(index) {
        $scope.selectedRow = index;
        $scope.$broadcast('new-photo-selected', index);
        scrollService.scrollToIndex(index);
      }



    }
  ]);
