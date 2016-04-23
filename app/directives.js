"use strict";
angular.module('directives', [])

  /*
    Even when loading images from disk they must be decoded and rendered by the
    browser which is slow. By pre-loading, and pre-rendering the
    expected next-to-be-selected images invisibly on the page, the loading
    is much faster (<5ms). Currently preloads one above and one below the
    currently selected image in the photo array being navigated, or two ahead
    for the zero case, and two behind for the last case.
  */
  .directive('fastImg', [function() {
    return {
      template: '<img><img><img>',
      link: function(scope, el, attrs) {

        // There are only three. Ensures no memory leaks.
        const imgs = el.children();

        // Tracks call completion for better handling of fast successive calls.
        var working = false;

        function newPhotoSelected(event, n) {
          if (working) {
            return "steady on!";
          }
          working = true;

          /* A checklist of the photo objects we want pre-loaded or displayed
             in the DOM at the end of this function call. */
          var toFill = {
                current: n,
                next: next(n),
                previous: previous(n)
              },
              spares = [];

          // Reassign roles for, or trash, the currently loaded imgs.
          _.each(imgs, function(img, i){
            switch (img.assignedTo) {
              case n:
                displayCurrent(img);
                delete toFill.current;
                break;
              case next(n):
                setAsPreload(img);
                delete toFill.next;
                break;
              case previous(n):
                setAsPreload(img);
                delete toFill.previous;
                break;
              default:
                img.assignedTo = null;
                img.src = "";
                spares.push(img);
                break;
            }
          });

          // Fetch current if we hadn't already struck it off.
          if (toFill.current !== undefined) {
            assignSpareTo(n, 'andDisplayAsCurrent');
            delete toFill.current;
          }

          // Preloads can wait. Need current image as fast as possible.
          setTimeout(function(){
            createPreloads();
            working = false;
            // END of newPhotoSelected function call.
          }, 10)

          /*
            Function newPhotoSelected Local Functions
          */

          // Display image by removing the preload-image class.
          function displayCurrent(img){
            img.className = 'current ' + scope.photoImport[n].orientClass;
            return img;
          }

          // Hide image by setting the preload-image class.
          function setAsPreload(img){
            img.className = 'preload-image';
          }

          // Load preloads not already struck off the list.
          function createPreloads() {
            _.map(toFill, function(index, key){
              assignSpareTo(index);
            })
          }

          // Reassign img to a src not previously loaded
          function assignSpareTo(index, isCurrent){
            var spare = spares.pop();
            spare.className = 'preload-image';
            spare.assignedTo = index;
            spare.onload = isCurrent ? function(){
              displayCurrent(spare);
            } : null;
            try {
              spare.src = scope.photoImport[index].path;
            } catch (e) {
              // just means there's less than three photos in the import.
            }
            return spare;
          }
        }

        /*
          Helpers
        */

        function next(n) {
          var maxIndex = scope.photoImport.length - 1;
          return n === maxIndex ? n - 2 : n + 1;
        }

        function previous(n) {
          var maxIndex = scope.photoImport.length - 1;
          return n === 0 ? n + 2 : n - 1;
        }

        // Call on index-update.
        scope.$on('index-update', newPhotoSelected);

        // Call on load.
        newPhotoSelected(null, 0);
      }
    }
  }])

  .directive('globalAppKeys', function(indexService) {
    return {
      link: function(scope) {

        scope.$on('keydown', function(ngEvent, e) {
          switch (e.keyCode) {
            case 38: // ↑ (previous item)
              indexService.decrement();
              scope.$digest();
              break;
            case 40: // ↓ (next item)
              indexService.increment();
              scope.$digest();
              break;
            default: // Otherwise
          }
        })

      }
    }
  })

  .directive('trailViewKeys', function ($timeout) {
    return {
      link: function (scope) {

        scope.$on('keydown', function (ngEvent, e) {
          switch (e.keyCode) {
            case 39: //  →
            case 13: // Enter (go to import view);
              importView();
              break;
            default: // Otherwise
          }
        })

        function importView() {
          scope.$evalAsync(
            scope.transitionToState.bind(
              null,
              'importView',
              scope.photoLibrary[scope.index.current].data
            )
          );
        }
      }
    }
  })


 .directive('importViewKeys', function () {
    return {
      link: function (scope) {

        scope.$on('keydown', function (ngEvent, e) {
          switch (e.keyCode) {
            case 37: // ← (Shift: Trail View);
              if (e.shiftKey)
              scope.$evalAsync(
                scope.transitionToState.bind(null, 'trailView')
              );
              break;
            default: // Otherwise
          }
        })

      }
    }
  })

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
        });

        el.bind("dragenter", function(e) {
          // outside world -> app.
          // Assume text data is empty - it is for file/folder drops.
          if(e.dataTransfer.getData("text") === "") {
            el.addClass('dz-over');
          }
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
          scope.dropped({ files: e.dataTransfer.files });
          return false;
        });

        // app -> outside world.
        // Assume it's an img tag, and pass the img src value.
        document.addEventListener("dragstart", function(event) {
          event.dataTransfer.setData("text/plain",
            decodeURI(event.target.src.substring(7)));
        });

      }
    }
  }])

.directive('topCtrl', [function(){
    return {
      restrict: 'E',
      link: function (scope, el, attrs){
        el.on('click', function(){
          el.parent()[0].scrollTop = 0;
        })
      }
    }
  }])

  .directive('topNav', [function(){
    return {
      restrict: 'E',
      controller: function ($scope, libraryService) {
        $scope.photoLibrary = libraryService.get();
        $scope.$on('library-update', function (event, updatedLibrary) {
          $scope.photoLibrary = updatedLibrary;
          $scope.$digest();
        })
      },
      templateUrl: "partials/topNav.html"
    }
  }])

  .directive('bottomCtrl', [function(){
    return {
      restrict: 'E',
      link: function (scope, el){
        el.on('click', function(){
          el.parent()[0].scrollTop = el.parent()[0].scrollHeight;
        })
      }
    }
  }])
