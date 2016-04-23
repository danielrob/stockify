"use strict";
angular.module('stockify-develop', ['libraryService', 'services', 'directives'])

  /*
    The application initialiser and state based view maintainer.
    keyEvent & libraryService loaded here for intialisation purposes.
  */
  .controller('appCtrl', ['$scope', 'stateService', 'importService', 'keyEvent', 'libraryService',
    function($scope, stateService, importService, keyEvent, libraryService) {

      const showImport =
         stateService.transitionTo.bind(stateService, 'importView');

      // Initial application state
      $scope.state = stateService.getState();

      // Subscribe to future updates
      $scope.$on('state-change', function(e, state){
        $scope.state = stateService.getState();
      });

      // A drag and drop import by the user
      $scope.import = function(files) {
        importService.import(files, showImport, function() {
          $scope.$digest();
        });
      }
    }
  ])

  .controller('importViewCtrl', function($scope, stateService, scrollService, indexService){

      const maxIndex = stateService.stateParams.length -1;

      // Which import are we showing?
      $scope.photoImport = stateService.stateParams;

      // Initialise view on the first photo.
      indexService.set(0, maxIndex);

      // Monitor/set the currently selected photo in the template
      $scope.index = indexService;

      // For changing view
      $scope.transitionToState = stateService.transitionTo;

      // Scroll with selected photo
      $scope.$on('index-update', function(event, index){
        scrollService.scrollToIndex(index);
      })

      // To avoid program failure (too many net requests) upon loading large imports.
      ngRepeatAllSlowly(maxIndex + 1);

      function ngRepeatAllSlowly(importSize) {
        var delay = 100, // delay value doesn't matter much (but needs to be > 10).
          incr = 100,
          cycleCount = Math.ceil(importSize / incr);

          $scope.ngRepeatLimit = 50;

        _(cycleCount).times(function(i) {
          setTimeout(function() {
            $scope.ngRepeatLimit += incr;
            $scope.$digest();
          }, delay += delay);
        })
      }
  })

  .controller('trailViewCtrl', function($scope, libraryService, stateService, indexService){
    const
      maxIndex = libraryService.get().length - 1,
      startIndex = stateService.restore('trailViewSelected') || 0;

      // Put the library on the scope
      $scope.photoLibrary = libraryService.get();

      // Initialise on
      indexService.set(startIndex, maxIndex);

      // Monitor/set the currently selected import in the template
      $scope.index = indexService;

      // For changing view
      $scope.transitionToState = stateService.transitionTo;

      // teardown
      $scope.$on('pre-state-change', function(){
        stateService.store('trailViewSelected', indexService.get());
      })

  })

  /*
    Convert keypress events into angular events. This way they can
    more easily be consumed in child view directives.
  */
  .service('keyEvent', function($rootScope, $document){
     $document.on('keydown', function(e){
       $rootScope.$broadcast('keydown', e);
     })
  })

  /*
    A simple state routing service.
  */
  .service('stateService', ['libraryService', '$rootScope', function(libraryService, $rootScope){

      const self = this;

      this.state = libraryService.library() ? 'trailView' : 'welcome';
      this.stateParams;
      this.stateStore = {};

      this.transitionTo = function(state, params){
        $rootScope.$broadcast('pre-state-change', state);
        self.state = state;
        if (params) self.stateParams = params;
        $rootScope.$broadcast('state-change', state);
      }

      this.getState = function(){
        return self.state;
      }

      this.store = function(key, val){
        self.stateStore[key] = val;
      }

      this.restore = function(key){
        return self.stateStore[key];
      }

  }])

 /*
    I maintain an abstract index between zero and a specified max (or infiinity).
  */
 .service('indexService', function($rootScope){
    const self = this;

    this.current;
    this.max;

    this.set = function(index, max){
      this.current = index;
      if (max !== undefined) this.max = max;
      $rootScope.$broadcast('index-update', this.current);
    }

    this.get = function(){
      return this.current;
    }

    // Increment the current value by 1.
    this.increment = function(){
      this.set(next(this.current));
    }

    // Decrement the current value by 1.
    this.decrement = function(){
      this.set(previous(this.current));
    }

    // Find out what next would be if incremented. Private.
    function next(i){
      return i === self.max ? self.max : i + 1;
    }

    // Find out what previous would be if decremented. Private.
    function previous(i){
      return i === 0 ? 0 : i - 1;
    }

  })
