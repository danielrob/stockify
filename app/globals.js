"use strict";
const
    _ = require('underscore'),
    async = require('async'),
    path = require('path'),
    fs = require('fs-extra'),
    app = require('remote').require('app'),
    LIBRARY_FILE = path.join(app.getPath('userData'), "library.json"),
    photoList = require('../lib/photoList'),
    thumbnail = require('../lib/thumbnailer');
