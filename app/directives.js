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

        // Teardown before state change.
        scope.$on('pre-state-change', function() {
          _(3).times(function(i){
            imgs[i].assignedTo = null;
          });
        })
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

  .directive('trailViewKeys', function () {
    return {
      link: function (scope) {

        scope.$on('keydown', function (ngEvent, e) {
          switch (e.keyCode) {
            case 39: //  →
            case 13: // Enter (go to import view);
              scope.transitionToState(
                'importView',
                scope.photoLibrary[scope.index.current].data,
                true
              )
              break;
            default: // Otherwise
          }
        })
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
                scope.transitionToState('trailView', null, true);
              break;
            default: // Otherwise
          }
        })

      }
    }
  })

.directive('importInfoKeys', function () {
    return {
      link: function (scope) {

        scope.$on('keydown', function (ngEvent, e) {
          switch (e.keyCode) {
            case 82: // 'r' (open rename form)
              if (!(e.metaKey || e.ctrlKey))
              scope.openRenameForm();
              scope.$digest();
              break;
            case 27: // esc (exit forms);
              scope.renameForm = false;
              scope.deleteForm = false;
              scope.$digest();
              break;
            case 68:
              scope.deleteForm = true;
              scope.$digest();
              break;
            default: // Otherwise
          }
        })

      }
    }
  })

  .directive('selectionScroll', function() {
    return {
      link: function (scope, el) {
        // Scroll with selected photo
        scope.$on('index-update', function(event, index){
          scroll(index)
        })

        function scroll(index) {
          var height = document.body.clientHeight;
          var thumb = document.getElementById('anchor' + index);
          var trail = el[0];
          var filler = document.getElementById('scrollbar-filler');

          if (!thumb) return;
          // Bugfix. See below.
          filler.style.display = "initial";
          trail.style.overflowY = "hidden";

          if (thumb.offsetTop - height + thumb.clientHeight > trail.scrollTop) {
            trail.scrollTop = (thumb.offsetTop - height + thumb.clientHeight);
          } else
            if (thumb.offsetTop < trail.scrollTop) {
              trail.scrollTop = thumb.offsetTop - 34;
            }

          /*
            It's a bugfix. Without it, if there's been a click on the list,
            chrome makes a small scrolling adjustment after the above,
            giving it a horrible double-scroll-jerk.
            This was the only way I could find to fix it.
            The filler means we can still have a scrollbar, it hides the
            fact the scrollbar temporarily dissapears during this process.
          */
          setTimeout(function () {
            trail.style.overflowY = "scroll";
            filler.style.display = "none";
          }, 1);

        }
      }
    }
  })

  /*
    Display information about the import and provide actions on the import.
  */
  .directive('importInformation', function (indexService, libraryService) {
    return {
      restrict: 'E',
      templateUrl: 'partials/importInformation.html',
      controller: controllerFn
    }
    // Controller to manage information display and user actions.
    function controllerFn($scope) {

      var index = $scope.index = indexService;
      $scope.renameForm = false;
      $scope.deleteForm = false;

      $scope.$on('index-update', function(){
        $scope.renameForm = false;
        $scope.deleteForm = false;
      })

      // Open the name/rename form.
      $scope.openRenameForm = function () {
        $scope.renameName = $scope.photoLibrary[index.current].name;
        $scope.renameForm = true;
      }

      // Name/Rename form submission action
      $scope.submitRename = function (uuid, renameName) {
        libraryService.renameImport(uuid, renameName);
        $scope.renameForm = false;
      }

      // Open the delete import form
      $scope.openDeleteForm = function(){
        $scope.deleteForm = true;
      }

      // Delete form submission action
      $scope.confirmDelete = function (uuid) {
        libraryService.removeImportFromLibrary(uuid);
        $scope.deleteForm = false;
      }

      // Prevent event propogation to the global handler.
      $scope.stopPropagation = function (e) {
        if (e.keyCode !== 27)
        e.stopPropagation();
      }
    }
  })

  .directive('focusOnReveal', function($timeout){
    return {
      restrict: 'A',
      link: function (scope, el, attrs){
        $timeout(function(){
          el[0].focus();
        })
      }
    }
  })

/*
  Show as many thumbnails as possible in the available space.
  This should be an ng-repeat, but ng-repeat is slow, as well as
  adding the img orientation class after rendering the images =>
  the user sees the image rotation which is horrible.
*/
.directive('imgRepeat', function(indexService){
  return {
    restrict: 'E',
    link: linkFn
  }

  function linkFn(scope, el, attrs) {

      // Load preview on index update
      scope.$on('index-update', imgRepeat);

      // Load preview on load.
      imgRepeat();

      // Make the import preview.
      function imgRepeat() {
        el.empty(); // I create a minor memory leak, but these images are tiny.

        // Be clear it's a sample
        if (scope.photoLibrary[indexService.current].data.length > limit()) {
           el.append('<div style="text-align: left; padding: 5px;"><small>Sample:</small></div>')
        }

        // Add the imgs to the DOM.
        _.each(_.first(scope.photoLibrary[indexService.current].data, limit()), function (photo) {
          let img = new Image();
          img.style.maxWidth = attrs.maxWidth || 200;
          img.style.maxHeight = attrs.maxWidth || 150;
          img.style.margin = attrs.margin || '1px';
          img.style.verticalAlign = attrs.verticalAlign || 'middle';
          img.className = photo.orientClass;
          img.src = photo.thumbnail;
          el.append(img);
        })
      }

      /*
        Limit the number of images in the preview to the space available.
      */
      function limit() {
        return Math.floor(el.parent()[0].clientWidth / 202) *
          Math.floor((el.parent()[0].clientHeight - attrs.offsettop) / 152);
      }

    }

})
