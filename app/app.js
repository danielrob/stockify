"use strict";
const
    // Electron
    remote = require('remote'),
    app = remote.require('app'),
    homeDir = app.getPath('pictures'),
    // Node
    lib = require('../lib/lib'),
    path = require('path');

angular.module('stockify-develop', ['services', 'directives'])

  .controller('HomeCtrl', ['$scope',
    function($scope) {

      $scope.import = function (files){
        lib.import(files, function(err, importedFiles){
          if (err) throw err;
          $scope.$broadcast('new-import');
          postImport(importedFiles);
        });
      }

      function postImport(importedFiles) {
        $scope.initialized = true;
        $scope.photoImport = importedFiles;
        $scope.setSelectedRow(0);
        $scope.$digest();
      }


      $scope.setClickedRow = $scope.setSelectedRow = function(index) {
        $scope.selectedRow = index;
        $scope.$broadcast('new-photo-selected', index);
      }
    }
  ]);
