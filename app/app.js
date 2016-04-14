"use strict";
const
    path = require('path'),
    async = require('async'),
    lib = require('../lib/lib'),
    thumbnailer = require('../lib/thumbnailer');

angular.module('stockify-develop', ['services', 'directives'])

  .controller('HomeCtrl', ['$scope',
    function($scope) {

      $scope.import = function(files){
        lib.import(files, function(err, photos){
          if (err) throw err;
          $scope.$broadcast('new-import');
          postImport(photos);
        });
      }

      function postImport(photos) {
        // Update without a digest.
        document.getElementById('import').textContent = "Importing";
        $scope.photoImport = photos;
        $scope.setSelectedRow(0);

        const startDate = new Date();

        var count = 0;
        async.each(photos, function(photo, next){
          thumbnailer(photo, function(thumbpath){
            photo.thumbnail = thumbpath;
            if (count++ > 9) {
              $scope.initialized = true;
              $scope.$digest();
            }
            next();
          });
        }, function finallyDigest(){
          console.log('\n Image thumbnailing took ' + (new Date().getTime() - startDate.getTime()) + ' milliseconds\n\n');
          $scope.initialized = true;
          $scope.$digest();
        })
      }

      $scope.setSelectedRow = function(index) {
        $scope.selectedRow = index;
        $scope.$broadcast('new-photo-selected', index);
      }
    }
  ]);
