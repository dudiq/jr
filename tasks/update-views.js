'use strict';

var replaceViewsLib = require('./lib/replace-views');

module.exports = function (grunt) {

    grunt.registerMultiTask('updateViews', 'Processing TPL inject', function () {
        grunt.log.subhead(' > start processing TPL inject');

        var opt = this.data.options;

        var source = opt.src;
        var from = opt.from;
        var to = opt.to;

        grunt.file.copy(from, to, {
            encoding: 'utf8'
        })

        var replaceViewsOpt = opt.replaceViews;
        replaceViewsLib(grunt, replaceViewsOpt);

        grunt.log.subhead(' > updated TPL inject');
    });

};
