"use strict"
angular.module('libraryService', [])

  /*
  */
  .service('libraryService', ['$rootScope', function($rootScope) {
    const self = this;
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
        if (typeof callback === 'function') callback();
      })
    }

    this.addImportToLibrary = function(photoImport, callback) {
      user_library.push(photoImport);
      self.write(user_library, callback);
    }

    this.removeImportFromLibrary = function(uuid){
      self.write(
        _.reject(user_library, function(photoImport){
          return photoImport.id === uuid;
        })
      )
    }

    this.renameImport = function(uuid, name){
      _.findWhere(user_library, {id: uuid}).name = name;
      self.write(user_library);
    }

    this.persist = function(callback){
      self.write(user_library, callback);
    }

    function uuid() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

  }])

