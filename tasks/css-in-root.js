'use strict';

module.exports = function (grunt) {

    grunt.registerMultiTask('cssInRoot', 'Processing index.html for css files', function () {

        var opt = this.data.options;

        var from = opt.from;

        grunt.log.subhead(' > start processing ' + from);
        var to = opt.to;
        var processor = opt.processor;

        var text = grunt.file.read(from, {
            encoding: 'utf8'
        });

        text = processor(text);

        grunt.file.write(to, text);

        grunt.log.subhead(' > updated ' + to);
    });

};
