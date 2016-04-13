"use strict";

angular.module('directives', [])

  .directive('fastImg', [function() {
    return {
      template: '<img><img><img>',
      link: function(scope, el, attrs) {

        const imgs = el.children();

        var working = false,
            previousCurrent;

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

          if (previousCurrent !== undefined) {
            previousCurrent.className = 'sinking-image';
          }

          for (let i = 0; i < imgs.length; i++) {
            var img = imgs[i];
            switch (img.assignedTo) {
              case n:
                img.className = 'current';
                previousCurrent = img;
                delete toFill.current;
                break;
              case next(n):
                img.className = 'preload-image';
                delete toFill.next;
                break;
              case previous(n):
                img.className = 'preload-image';
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
            loadCurrent();
          }
          // Preloads can wait. Need current image as fast as possible.
          setTimeout(preload, 10)

          function loadCurrent() {
            var spare = spares.pop();
            spare.assignedTo = n;
            spare.src = scope.photoImport[n].path;
            spare.className = 'current';
            previousCurrent = spare;
            delete toFill.current;
          }

          function preload() {
            for (let key in toFill) {
              var spare = spares.pop();
              spare.assignedTo = toFill[key];
              spare.src = scope.photoImport[toFill[key]].path;
              spare.className = 'preload-image';
            }
            // This is always the last function called.
            working = false;
          }
        }

        function next(n) {
          var maxIndex = scope.photoImport.length - 1;
          return n === maxIndex ? 0 : n + 1;
        }

        function previous(n) {
          var maxIndex = scope.photoImport.length - 1;
          return n === 0 ? maxIndex : n - 1;
        }

        scope.$on('new-photo-selected', newPhotoSelected);

        scope.$on('new-import', function() {
          imgs[0].assignedTo = null;
          imgs[1].assignedTo = null;
          imgs[2].assignedTo = null;
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

          scope.dropped({ files: e.dataTransfer.files });
          return false;
        });
      }
    }
  }])


