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
  .directive('fastImg', function(stateService) {
    return {
      template: '<img><img><img>',
      link: function(scope, el, attrs) {

        // There are only three. Ensures no memory leaks.
        const imgs = el.children();

        function newPhotoSelected(event, n) {

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
            // END of newPhotoSelected function call.
          }, 10)

          /*
            Function newPhotoSelected Local Functions
          */

          // Display image by removing the preload-image class.
          function displayCurrent(img){
            img.className = 'current ' + scope.photoImport.data[n].orientClass;
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
              spare.src = scope.photoImport.data[index].path;
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
          var maxIndex = scope.photoImport.data.length - 1;
          return n === maxIndex ? n - 2 : n + 1;
        }

        function previous(n) {
          var maxIndex = scope.photoImport.data.length - 1;
          return n === 0 ? n + 2 : n - 1;
        }

        // Call on index-update.
        scope.$on('index-update', newPhotoSelected);

        // Call on load (controller emit happens before this has loaded).
        newPhotoSelected(null, stateService.restore('goTo') || 0);
        stateService.blank('goTo');

        // Teardown before state change.
        scope.$on('pre-state-change', function() {
          _(3).times(function(i){
            imgs[i].assignedTo = null;
          });
        })
      }
    }
  })

  .directive('dropZone', function() {
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
            el.removeClass('dz-over');  // this / e.target is previous target el.
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
  })

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

  .directive('selectionScroll', function(indexService, $timeout) {
    return {
      link: function (scope, el) {
        // Scroll with selected photo
        scope.$on('index-update', function(event, index){
          scroll(index, indexService.isMax())
        })

        scope.$on('thumbnails-finished-loading', function(){
          // Fixme: $timeout is a hack. Is it $interval promise resolve timing?
          $timeout(scroll.bind(null, indexService.current, indexService.isMax()));
        })

        function scroll(index, isMax) {
          let height = document.body.clientHeight,
              bottomExtra = isMax ? 1000 : 0,
              thumb = document.getElementById('anchor' + index),
              trail = el[0],
              filler = document.getElementById('scrollbar-filler');

          if (!thumb) return;
          // Bugfix. See below.
          filler.style.display = "initial";
          trail.style.overflowY = "hidden";

          if (thumb.offsetTop - height + thumb.clientHeight > trail.scrollTop) {
            trail.scrollTop = (thumb.offsetTop - height + thumb.clientHeight) + bottomExtra;
          } else
            if (thumb.offsetTop < trail.scrollTop) {
              trail.scrollTop = thumb.offsetTop - 34 + bottomExtra;
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
.directive('imgRepeat', function(preferencesService, stateService){
  return {
    restrict: 'E',
    link: linkFn
  }

  function linkFn(scope, el, attrs) {
      // Load preview on index update
      scope.$on('index-update', _.compose(scrollReset, imgRepeat));

      // Load preview on load.
      imgRepeat();

      // Scroll to top, and hide-stop current scrolling.
      function scrollReset(){
        el[0].style.overflowY = 'hidden';
        el[0].scrollTop = 0;
        setTimeout(function(){
          el[0].style.overflowY = 'scroll';
        }, 500);
      }

      // Make the import preview.
      function imgRepeat() {
        const lockedGrid = preferencesService.lockedGrid;
        var hrefLinkIndex = 0;

        // May create a minor memory leak, but the thumbnails are tiny anyway.
        el.empty();

        // Use a copy
        let photos = scope.photoLibrary[scope.index.current].data.slice(),
            remainder;

        oneHundred();

        // Use scroll to rate limit img loading. Prevents net resource errors.
        el.on('scroll', oneHundred);

        // Add oneHundred imgs to the DOM.
        function oneHundred() {

          el.off('scroll');

          remainder = photos.splice(100);

          // Add the 100.
          _.each(photos, addImgToDom);

          photos = remainder;

          // If there's more to do, add back the listener after a delay.
          if (photos.length !== 0) {
            setTimeout(el.on.bind(el, 'scroll', oneHundred), 250);
          }

        }

        // Add an img to the DOM.
        function addImgToDom(photo, i){
           let div, img = new Image();

            if (lockedGrid) {
               div = document.createElement("div");
               div.className = "import-preview-locked-grid-image-wrapper"
               img.className = photo.orientClass + ' ' + photo.orientClass + '-scale-up import-preview-locked-grid-image';
            } else {
              let ratio = photo.ratio;
              img.className = photo.orientClass + ' import-preview-fit-to-height';
              if (ratio === 1) {
                img.className += ' ' + photo.orientClass + '-no-scale';
              } else if (1 < ratio && ratio <= 1.5) {
                img.className += ' ' + photo.orientClass + '-medium';
              } else if (ratio > 1.6) {
                img.className += ' ' + photo.orientClass + '-small';
              }
            }

            img.src = photo.thumbnail;

            if (lockedGrid) {
              el.append(angular.element(div).append(img));
            } else {
              el.append(img);
            }

            addImageLink(img);

        } // end addImgToDom

        function addImageLink(img){
          let idxCopy = hrefLinkIndex++;
            angular.element(img).on('click', function(){
              stateService.store('goTo', idxCopy);
              stateService.transitionTo('importView', scope.photoLibrary[scope.index.current], true);
            })
        } // end addImageLink
      } // end imgRepeat
    } // end linkFn
})

.directive('keywordDragMenu', function(){
  return {
    templateUrl: 'partials/keywordDragMenu.html',
    link: function(scope, el, attrs){
      scope.$on('begin-keywording', show);
      scope.$on('end-keywording', hide);

      function show(){
        el.find('drag-menu')[0].style.visibility = 'visible';
        el.find('input')[0].focus();
      }

      function hide(){
        el.find('drag-menu')[0].style.visibility = 'hidden';
      }
    }
  }
})

 .directive('dragMenu', ['$document', function($document) {
  return {
    template: '<ng-transclude></ng-transclude><button ng-click="hide()">×</button>',
    transclude: true,
    scope: true,
    link: function(scope, el, attrs) {
      var startX = 0, startY = 0, x = 0, y = 38;

      el.css({
        position: 'absolute',
        top: attrs.top || 38,
        left: attrs.left || 0,
        height: attrs.height || '400px',
        width: attrs.width || '200px',
        border: '1px solid black',
        background: 'rgba(0, 0, 0, 0.66)',
        display: 'block',
        borderRadius: '3px 3px',
        cursor: 'pointer',
        zIndex: '100',
        padding: '7px',
        visibility: attrs.visibility || 'hidden',
        color: '#fff',
        textAlign: attrs.textalign || 'center'
      });

      // style the 'x' close button.
      angular.element(el[0].lastChild).css({
        position: 'absolute',
        top: 0,
        left: 0,
        fontSize: '12px',
        border: 'none',
        background: 'none',
        color: 'white',
        padding: '0 2px',
        margin: 'none'
      });

      el.on('mousedown', function(event) {
        // Prevent default dragging of selected content
        event.preventDefault();
        startX = event.pageX - x;
        startY = event.pageY - y;
        $document.on('mousemove', mousemove);
        $document.on('mouseup', mouseup);
      });

      scope.hide = function(){
        el[0].style.visibility = 'hidden';
      }

      function mousemove(event) {
        y = event.pageY - startY;
        x = event.pageX - startX;
        el.css({
          top: y + 'px',
          left:  x + 'px'
        });
      }

      function mouseup() {
        $document.off('mousemove', mousemove);
        $document.off('mouseup', mouseup);
      }
    }
  };
}])

.directive('filterSelect', function () {
  return {
    template: '<span class="glyphicon glyphicon-filter"></span>',
    link: function (scope, el, attrs) {

      let
        base = { type: 'radio', click: filteredView },
        menu = new Menu(),
        showAllMenuItem = new MenuItem(_.extend({ label: 'All', checked: true }, base)),
        rejectsMenuItem = new MenuItem(_.extend({ label: 'Rejects' }, base)),
        picksMenuItem = new MenuItem(_.extend({ label: 'Picks' }, base)),
        allButRejects = new MenuItem(_.extend({ label: 'Without Rejects' }, base));

      menu.append(showAllMenuItem);
      menu.append(picksMenuItem);
      menu.append(rejectsMenuItem);
      menu.append(allButRejects);

      el.children().on('click', function () {
        menu.popup(remote.getCurrentWindow());
      });

      function clear() {
        showAllMenuItem.checked = false;
        rejectsMenuItem.checked = false;
        picksMenuItem.checked = false;
        allButRejects = false;
      }

      function filteredView(menuItem) {
        switch (menuItem.label) {
          case 'All': scope.showAll(); break;
          case 'Rejects': scope.filterRejectsOnly(); break;
          case 'Picks': scope.filterPicksOnly(); break;
          case 'Without Rejects': scope.allButRejects(); break;
        }
        clear();
        menuItem.checked = true;
      } // filteredView
    } // link
  }
})

.directive('minHeightSpacer', function($window){
  return {
    link: function (scope, el, attrs){
      const offset = attrs.offset ||  235;

      el[0].style.minHeight = document.body.clientHeight - offset;

      angular.element($window).bind('resize', function(){
        el[0].style.minHeight = document.body.clientHeight - offset;
      })
    }
  }
})

.directive('swipeLeft', function(){
  return {
    restrict: 'A',
    link: function (scope, el, attrs){
      document.addEventListener('wheel', function swipeLeft(e){
        if (e.deltaX < -30) {
          document.removeEventListener('wheel', swipeLeft);
          scope.transitionToState('trailView', null, true);
        }
      })
    }
  }
})

.directive('swipeRight', function(){
  return {
    restrict: 'A',
    link: function (scope, el, attrs){
      document.addEventListener('wheel', function swipeRight(e){
        if (e.deltaX > 30) {
          document.removeEventListener('wheel', swipeRight);
          scope.transitionToState('importView', scope.photoLibrary[scope.index.current], true);
        }
      })
    }
  }
})
