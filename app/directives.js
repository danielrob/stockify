"use strict";

const
   _ = require('underscore');

angular.module('directives', [])

  .directive('fastImg', [function() {
    return {
      template: '<img><img><img>',
      link: function(scope, el, attrs) {

        const imgs = el.children();

        var working = false;

        function newPhotoSelected(event, n) {
          if (working) {
            return "steady on!";
          }
          working = true;

          // A checklist - entries removed when sorted.
          var toFill = {
                current: n,
                next: next(n),
                previous: previous(n)
              },
              spares = [];

          for (let i = 0; i < imgs.length; i++) {
            let img = imgs[i];
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
          }

          // Setup current if it's still on the checklist
          if (toFill.current !== undefined) {
            assignSpareTo(n, 'andDisplayAsCurrent');
            delete toFill.current;
          }

          // Preloads can wait. Need current image as fast as possible.
          setTimeout(function(){
            createPreloads();
            working = false;
          }, 10)

          // Switch on display
          function displayCurrent(img){
            img.className = 'current ' + scope.photoImport[n].orientClass;
            return img;
          }

          function setAsPreload(img){
            img.className = 'preload-image';
          }

          function createPreloads() {
            _.map(toFill, function(index, key){
              assignSpareTo(index);
            })
          }

          function assignSpareTo(index, isCurrent){
            var spare = spares.pop();
            spare.className = 'preload-image';
            spare.assignedTo = index;
            spare.onload = isCurrent ? function(){
              displayCurrent(spare);
            } : null;
            spare.src = scope.photoImport[index].path;
            return spare;
          }
        }

        function next(n) {
          var maxIndex = scope.photoImport.length - 1;
          return n === maxIndex ? n - 2 : n + 1;
        }

        function previous(n) {
          var maxIndex = scope.photoImport.length - 1;
          return n === 0 ? n + 2 : n - 1;
        }

        scope.$on('new-photo-selected', newPhotoSelected);

        scope.$on('new-import', function() {
          _(3).times(function(i){
            imgs[i].assignedTo = null;
          });
        })

      }
    }
  }])

  .directive('keyNav', [function() {
    return {
      link: function(scope, el, attrs) {

        el.on('keydown', function(e) {
          switch (e.keyCode) {
            case 38: // ↑ (previous item)
              nav(true);
              break;
            case 40: // ↓ (next item)
              nav(false);
              break;
            default: // Otherwise
          }
        })

        function nav(upwards) {
          var increment = upwards ? -1 : 1,
            currentIndex = scope[attrs.navIndex],
            navigable = scope[attrs.keyNav];

          if (!navigable) return;

          function nextIndex() {
            var nxt = currentIndex + increment;

            // beginning going up
            nxt = nxt < 0 ? 0 : nxt;

            // end going down
            nxt = navigable[nxt] === undefined ? nxt - 1 : nxt;
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


