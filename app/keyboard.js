"use strict";
angular.module('keyboard', [])

  /*
    Convert keypress events into angular events.
  */
  .service('keyEvent', function($rootScope, $document){
     $document.on('keydown', function(e){
       $rootScope.$broadcast('keydown', e);
     })
  })


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


 .directive('importViewKeys', function (indexService, photoImportService) {
    return {
      link: function (scope) {

        scope.$on('keydown', function (ngEvent, e) {
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
            default: // Otherwise
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
  });
