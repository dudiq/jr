'use strict';

var grunt = require('grunt');

function fillObjByArr(obj, arr2){
    for (var i = 0, l = arr2.length; i < l; i++){
        var item = arr2[i];
        if (item.indexOf('.html') == -1 && item[item.length - 1] != '/'){
            // fix folder set
            item = item + '/';
        }
        obj[item] = true;
    }
}

function getExcludedViews(units){
    var ex = units.excludes;
    var exViews = {};
    for (var i = 0, l = units.length; i < l; i++){
        var modules = units[i].modules();
        for (var k = 0, j = modules.length; k < j; k++){
            var mod = modules[k];
            var name = mod.name();
            if (ex[name]){
                var views = mod.views();
                fillObjByArr(exViews, views);
            }
        }
    }
    return exViews;
}

function isExcluded(fileName, excludes){
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

function getReplaceContent(grunt, excludes, where){
    grunt.log.writeln('VIEWS: start replace processes...');
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
        if (isExcluded(fileKey, excludes)){
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

module.exports = function (grunt, options, units) {
    var excludes = units ? getExcludedViews(units) : {};

    options = options || {};

    grunt.log.subhead(' > start processing VIEWS for build');
    var viewsSrc = options.viewsSrc;

    var toReplace = getReplaceContent(grunt, excludes, viewsSrc);

    // file replace
    var filePath = options.whereReplace;
    if (filePath){
        var whatReplace = ';//{{replaceData}}';
        var file = grunt.file.read(filePath);
        file = file.replace(whatReplace, toReplace);

        grunt.file.write(filePath, file);
        grunt.log.ok('VIEWS: replaced');

    }
    if (options.cleanSrc) {
        grunt.file.delete(viewsSrc);
        grunt.log.ok('VIEWS: src is cleaned');
    }
    return toReplace;
};
