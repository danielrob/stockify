"use strict";
const
    path = require('path'),
    lib = require('../lib/lib'),
    thumbnailer = require('../lib/thumbnailer');

angular.module('stockify-develop', ['services', 'directives'])

  .controller('HomeCtrl', ['$scope', 'orientation',
    function($scope, orientation) {

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
            orientation(photo, function(o){
              photo.orientation = o;
              photo.orientClass = 'orient-' + o;
                     $scope.$digest();
            })
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

        // Scrolling. Fine inline till it's not.
        (function(document, index) {
          var height = document.body.clientHeight;
          var thumb = document.getElementById('anchor' + index);
          var trail = document.getElementById('phototrail');

          if (!thumb) return;

          // Bugfix. See below.
          trail.style.overflowY = "hidden";

          if (thumb.offsetTop - height + thumb.clientHeight > trail.scrollTop) {
            trail.scrollTop = (thumb.offsetTop - height + thumb.clientHeight);
          } else
          if (thumb.offsetTop < trail.scrollTop) {
            trail.scrollTop = thumb.offsetTop - 20;
          }

          /*
            It's a bugfix. Without it, if there's been a click on the list,
            chrome makes a small scrolling adjustment after the above,
            giving it a horrible double-scroll-jerk.
            This was the only way I could find to fix it.
          */
          setTimeout(function() {
            trail.style.overflowY = "scroll";
          }, 1);

        })(document, index)
      }
    }
  ]);
