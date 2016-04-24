"use strict"
angular.module('libraryService', [])

  /*
  */
  .service('libraryService', ['$rootScope', function($rootScope) {
    let user_library;

    // Initialize
    try {
      user_library = angular.fromJson(fs.readJsonSync(LIBRARY_FILE));
    } catch (e) {
      fs.writeJsonSync(LIBRARY_FILE, []);
      user_library = [];
    };

    this.library = function() {
      return (user_library.length > 0);
    }

    this.get = function() {
      return user_library;
    }

    this.write = function(library, callback) {
      fs.writeJson(LIBRARY_FILE, library, function(err) {
        if (err) throw err;
        user_library = library;
        $rootScope.$broadcast('library-update', library);
        if (!!callback) callback();
      })
    }

    this.addImportToLibrary = function(photoList, callback) {
      this.write(
        _.chain(user_library).push({
          id: uuid(),
          date: photoList[0].created,
          data: photoList
        })
          .value(),
        callback);
    }

    this.removeImportFromLibrary = function(uuid){
      this.write(
        _.reject(user_library, function(photoImport){
          return photoImport.id === uuid;
        })
      )
    }

    this.renameImport = function(uuid, name){
      _.findWhere(user_library, {id: uuid}).name = name;
      this.write(user_library);
    }


    function uuid() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

  }])

