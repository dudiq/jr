'use strict';

var grunt = require('grunt');

module.exports = function (options, excludes) {
    options = options || {};
    excludes = excludes || {};

    function isExcluded(fileName){
        var ret = false;
        if (excludes[fileName + '.html']){
            // file exclude
            ret = true;
        } else {
            // folder exclude
            for (var key in excludes){
                if (fileName.indexOf(key) == 0){
                    ret = true;
                }
            }
        }
        return ret;
    }

    function getReplaceContent(where){
        grunt.log.writeln('start replace processes...');
        var fileOptions = {
            encoding: 'utf8'
        };

        var files = where + '**/*.html';

        var templates = grunt.file.expand(files);

        var data = {};

        for (var i = 0, l = templates.length; i < l; i++) {
            var fileName = templates[i];
            var fileKeyPre = fileName.replace(/.html$/i, "");
            var fileKey = fileKeyPre.replace(where, "");
            if (isExcluded(fileKey)){
                // do not process this view
                var text = '--- replaced for ignored:' + fileName;
                grunt.log.writeln(text['blue'].bold);
            } else {
                var content = grunt.file.read(fileName, fileOptions);

                content = content.split('\n').join('');
                content = content.split('\r').join('');

                data[fileKey] = content;
                //: todo check fileKey value
                grunt.log.writeln('--- replaced for :' + fileName);
            }
        }

        var replaceContent = "=" + JSON.stringify(data);

        //                      grunt.log.writeln('---' + replaceContent);

        return replaceContent;
    }

    function templateReplacements(filePath, where, ex) {
        var file = grunt.file.read(filePath);

        var whatReplace = ';//{{replaceData}}';
        var toReplace = getReplaceContent(where, ex);

        file = file.replace(whatReplace, toReplace);

        grunt.file.write(filePath, file);
        grunt.log.ok('VIEWS replaced');
    }



    function start() {
        grunt.log.subhead(' > start processing VIEWS for build');
        var filePath = options.what;
        var where = options.where;
        templateReplacements(filePath, where, excludes);
        grunt.file.delete(where);
    }

    start();
};