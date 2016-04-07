"use strict";
var remote = require('remote');
var app = remote.require('app');
var homeDir = app.getPath('pictures');
var lib = require('../lib/lib');
var path = require('path');

angular.module('stockify-develop', [])

  .controller('HomeCtrl', ['$scope', '$anchorScroll',
    function($scope, $anchorScroll) {

      $scope.import = lib.import.bind(undefined, function(err, importedFiles){
        $scope.initialized = true;
        $scope.photoImport = importedFiles;
        $scope.setSelectedRow(0);
        $scope.$digest();
      })

      $scope.setClickedRow = $scope.setSelectedRow = function(index){
        $scope.selectedRow = index;
        $anchorScroll('anchor'+index);
      }
    }
  ])

.directive('keyNav', [function(){
  return {
    link: function (scope, el, attrs){

      el.on('keydown', function(e){
        switch(e.keyCode) {
          case 38: // ↑ (previous item)
            nav(true);
            break;
          case 40: // ↓ (next item)
            nav(false);
            break;
          default: // Otherwise
        }
      })

      function nav(upwards){
        var increment = upwards ? -1 : 1,
            currentIndex = scope[attrs.navIndex],
            navigable = scope[attrs.keyNav];

            if (!navigable) return;

            function nextIndex(){
              var nxt = currentIndex + increment;

              // go to end
              nxt = nxt < 0 ? navigable.length - 1 : nxt;

              // go to beginning
              nxt = navigable[nxt] === undefined ? 0 : nxt;
              return nxt;
            }

            // start or resume navigation
            if (currentIndex === -1) {
              scope.setSelectedRow(0);
            } else {
              scope.setSelectedRow(nextIndex());
            }
            scope.$digest();
        }
    }
  }
}])

.directive('dropZone', ['$anchorScroll', function($anchorScroll) {
  return {
    scope: {
      dropped: '&dropped'
    },
    transclude: true,
    template: "<ng-transclude>",
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
        if (e.x === 0 && e.y === 0) {
          el.removeClass('dz-over');  // this / e.target is previous target element.
        }
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


