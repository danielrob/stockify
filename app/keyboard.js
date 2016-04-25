"use strict";
angular.module('keyboard', [])

  /*
    Convert keypress events at the document root into angular events.
    All keypress events are captured here _except for forms fields where
    handlers stopPropagation_. Local then global unless local prevents global.
    If global is hit, all loaded (in the view) key handling directives apply.

  */
  .service('keyEvent', function($rootScope, $document){
     $document.on('keydown', function(e){
       $rootScope.$broadcast('keydown', e);
     })
  })

  /*
    All views
  */
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

  /*
    trailView
  */
  .directive('trailViewKeys', function () {
    return {
      link: function (scope) {

        scope.$on('keydown', function (ngEvent, e) {
          switch (e.keyCode) {
            case 39: //  →
            case 13: // Enter (go to import view);
              scope.transitionToState(
                'importView',
                scope.photoLibrary[scope.index.current],
                true
              )
              break;
            default: // Otherwise
          }
        })
      }
    }
  })

  /*
    trailView - import information pane.
  */
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

  /*
    importView
  */
 .directive('importViewKeys', function (indexService, photoImportService) {
    return {
      link: function (scope) {
        scope.$on('keydown', function (ngEvent, e) {
          let possKeyCombo = e.metaKey || e.ctrlKey || e.altKey;
          switch (e.keyCode) {
            case 37: { // ← (Shift: Trail View);
              if (e.shiftKey) {
                scope.transitionToState('trailView', null, true);
              } else {
                toggleReject();
              }
              break;
            }
            case 39: { //  →
              togglePick();
              break;
            }
            case 27: { // Esc (go to trailView)
              scope.transitionToState('trailView', null, true);
              break;
            }
            case 8: // Del
            case 46: { // Backspace (Reject. Shift: Offer to delete all rejects)
              if (e.shiftKey) {
                let response = dialog.showMessageBox({
                  type: 'question',
                  title: 'Confirm Delete',
                  message: 'What to do with the rejected photos?',
                  buttons: ['Cancel', 'Remove From Library', 'Move to Trash' ]
                });
                if (response) photoImportService.rejectRejects(
                  scope.photoImport.id,
                  response === 2
                );
              } else {
                toggleReject();
              }
              break;
            }

            default: {
              const
                keycode = e.keyCode,
                valid = // Any of these keys will open keywording.
                  (keycode > 47 && keycode < 58)   || // number keys
                  keycode === 32 || keycode === 13   || // spacebar & return key(s) (if you want to allow carriage returns)
                  (keycode > 64 && keycode < 91)   || // letter keys
                  (keycode > 95 && keycode < 112)  || // numpad keys
                  (keycode > 185 && keycode < 193) || // ;=,-./` (in order)
                  (keycode > 218 && keycode < 223);   // [\]' (in order)

              // open keywording
              if (valid && !possKeyCombo) {
                if (keycode === 13) e.preventDefault(); // prevent empty form submission.
                scope.$broadcast('begin-keywording');
              }
            }
          }
        })

        function togglePick(){
          if (!scope.state.trailView) {
          var targetPhoto = scope.photoImport.data[indexService.current];
            targetPhoto.pick = !targetPhoto.pick;
            if(targetPhoto.reject && targetPhoto.pick) {
              targetPhoto.reject = false;
            }
            scope.$digest();
          }
        }

        function toggleReject() {
          let targetPhoto = scope.photoImport.data[indexService.current];
            targetPhoto.reject = !targetPhoto.reject;
            if (targetPhoto.reject && targetPhoto.pick) {
              targetPhoto.pick = false;
            }
            scope.$digest();
        }

      }
    }
  })

  /*
    importView - keywording input overrides.
  */
  .directive('keywordingKeyOverrides', [function(){
    return {
      restrict: 'A',
      link: function (scope, el){
        const permissableKeys = [38,40] // ↑ ↓

        el.on('mousedown', function(e){
          e.stopPropagation();
          return false;
        })

        el.on('keydown', function (e) {
          if (permissableKeys.indexOf(e.keyCode) === -1) {
            // Prevent event propagation to the global keyEvent service.
            e.stopPropagation();
          }
          // Esc key
          if (e.keyCode === 27) {
            if (scope.keywords) {
              scope.keywords = "";
              scope.$digest();
            } else {
              scope.$emit('end-keywording');
            }
          }
        });
      }
    }
  }])
