'use strict';

var replaceViewsLib = require('./lib/replace-views');

module.exports = function (grunt) {

    grunt.registerMultiTask('updateViews', 'Processing TPL inject', function () {
        grunt.log.subhead(' > start processing TPL inject');

        var opt = this.data.options;

        var from = opt.from;
        var to = opt.to;

        if (grunt.file.exists(from)) {
            // all ok
            grunt.file.copy(from, to, {
                encoding: 'utf8'
            });

            replaceViewsLib(grunt, opt.replaceViews);

            grunt.log.subhead(' > updated TPL inject');
        } else {
            var text = 'hmm, views not exists? ' + from;
            grunt.log.writeln(text['blue'].bold);
        }

    });

};
