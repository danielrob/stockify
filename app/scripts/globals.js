"use strict";
const
    _ = require('underscore'),
    async = require('async'),
    path = require('path'),
    fs = require('fs-extra'),
    remote = require('remote'),
    app = remote.require('app'),
    dialog = remote.require('dialog'),
    shell = require('electron').shell,
    LIBRARY_FILE = path.join(app.getPath('userData'), "library.json"),
    photoList = require('../lib/photoList'),
    thumbnail = require('../lib/thumbnailer');
