"use strict";
var remote = require('remote');
var app = remote.require('app');
var homeDir = app.getPath('pictures');
var lib = require('../lib/lib');
var path = require('path');

angular.module('stockify-develop', [])

  .controller('HomeCtrl', ['$scope',
    function($scope, fs) {

      $scope.import = lib.import.bind(undefined, function(err, importedFiles){
        $scope.initialized = true;
        $scope.photoImport = importedFiles;
        console.log(importedFiles);
        $scope.setClickedRow(0);
        $scope.$digest();
      })

      $scope.setClickedRow = function(index){
        $scope.selectedRow = index;
        $scope.previewImagePath = $scope.photoImport[index].path;
      }

    }
  ])

.directive('dropZone', [function() {
  return {
    restrict: 'E',
    scope: {
      dropped: '&dropped'
    },
    template: "<div class='dropZoneContent'>" +
              "<p>To get started <br>drag and drop photos here.</p>" +
              "</div>",
    link: function(scope, el) {

      el.bind("dragover", function(e) {
        if (e.preventDefault) {
          e.preventDefault(); // Necessary. Allows us to drop.
        }

        if (e.stopPropagation) {
          e.stopPropagation();
        }

        e.dataTransfer.dropEffect = 'move';
        return false;
      });

      el.bind("dragenter", function(e) {
        el.addClass('dz-over');
      });

      el.bind("dragleave", function(e) {
        el.removeClass('dz-over');  // this / e.target is previous target element.
      });

      el.bind("drop", function(e) {

        if (e.preventDefault) {
          e.preventDefault(); // Necessary. Allows us to drop.
        }

        if (e.stopPropogation) {
          e.stopPropogation(); // Necessary. Allows us to drop.
        }

        el.removeClass("dz-over");

        scope.dropped({files: e.dataTransfer.files});
        return false;
      });
    }
  }
}])


