'use strict';

var indexParser = require('./lib/index-html-parser');
var replaceViews = require('./lib/replace-views');

module.exports = function (grunt) {

    function getExMap(){
        var excludedModules = {};
        var excludedStr = grunt.option("exclude") || '';
        var exList = excludedStr.split(',');
        for (var i = 0, l = exList.length; i < l; i++){
            var item = exList[i];
            if (item){
                excludedModules[exList[i]] = true;
            }
        }
        return excludedModules;
    }

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

    function removeFilesFromUnits(source, files){
        for (var i = 0, l = files.length; i < l; i++){
            var file = files[i];
            grunt.file.delete(source + '/' + file);
        }
    }

    function removeFilesByType(source, units, type){
        for (var i = 0, l = units.length; i < l; i++){
            var unit = units[i];
            var files = unit[type]();
            removeFilesFromUnits(source, files);
        }
    }
    
    function setUglifyJsTask(dist, units){
        var files = {};
        for (var i = 0, l = units.length; i < l; i++){
            var unit = units[i];
            var fType = unit.fileType();
            if (fType == 'js'){
                var key = unit.fileName();
                var path = dist + '/' + key;
                files[path] = path;
            }
        }
        var uglifyOptions = grunt.config('uglify');
        uglifyOptions.dist.files = files;

        grunt.config('uglify', uglifyOptions);
    }

    function setCssMinTask(dist, units){
        var files = {};
        for (var i = 0, l = units.length; i < l; i++){
            var unit = units[i];
            var fType = unit.fileType();
            if (fType == 'css'){
                var key = unit.fileName();
                var path = dist + '/' + key;
                files[path] = path;
            }
        }
        var cssminOptions = grunt.config('cssmin');
        cssminOptions.dist.files = files;

        grunt.config('cssmin', cssminOptions);
    }

    function getProcessedMapFiles(source, dest, units){
        var files = {};

        for (var i = 0, l = units.length; i < l; i++) {
            var unit = units[i];
            var key = dest + '/' + unit.fileName();
            var pFiles = unit.processedFiles();
            var filesKey = [];
            for (var j = 0, k = pFiles.length; j < k; j++){
                var fileKey = source + '/' + pFiles[j];
                filesKey.push(fileKey);
            }
            files[key] = filesKey;
        }
        return files;
    }

    function setOptionForConcat(source, dest, units) {
        var files = getProcessedMapFiles(source, dest, units);
        var options = grunt.config('concat');
        options.dist.files = files;

        grunt.config('concat', options);
    }
    
    grunt.registerMultiTask('minify', 'Processing MINIFY for build', function () {
        grunt.log.subhead(' > start processing MINIFY actions');
        /**
         * preparation task. done in gruntfile.js
         * - clean all
         * - `postcss`
         * - copy js, views, images, fonts, etc.. to .tmp dir
         * - copy index.html
         * - `insertversion`
         *
         * process task
         * - parse index.html and join js, css files by modules
         * - check modules and remove unused, for split into one file
         * - `replaceviews`, use modules defines
         * - compile into modules. js, css
         * - `rev`
         * - replace files in js, css, index.html
         *
         * dist task
         * - move processed data to dist
         *
        * */

        var source = this.data.src;
        var dest = this.data.dest;
        var replaceViewsOpt = this.data.replaceViews;
        var excludedModules = getExMap();

        var doMinifyCode = (grunt.option("minify") !== false); // true by default
        var doRevFiles = grunt.option("rev-files");

        if (!doRevFiles && doRevFiles !== false){
            // for not defined `doRevFiles` use `doMinifyCode` flag value
            doRevFiles = doMinifyCode;
        }

        var tasks = [];

        var fileOptions = {
            encoding: 'utf8'
        };

        var indexHtml = grunt.file.read(source + '/index.html', fileOptions);
        var parserOptions = {
            excludes: excludedModules,
            excludeAll: (grunt.option("excludeAll") === true) // false by default
        };
        var units = indexParser(indexHtml, parserOptions);


        var exViews = getExcludedViews(units);
        replaceViews(replaceViewsOpt, exViews);
        removeFilesByType(source, units, 'exFiles');

        if (doMinifyCode){
            var newHtml = units.html;
            grunt.file.write(source + '/index.html', newHtml);

            setUglifyJsTask(dest, units);
            setCssMinTask(dest, units);
            setOptionForConcat(source, dest, units);
            tasks.push('concat:dist');

            grunt.log.writeln('--- Started minify');

            tasks.push('concat:dist', 'uglify:dist', 'cssmin:dist');
        } else {
            // just copy all as is
            tasks.push('copy:no_minify');
        }

        tasks.push('copy:root_tmp_files');

        if (doRevFiles){
            // :todo last task. create rev files, update all files includes with new rev files using usemin task from yeoman
            //tasks.push('filerev:dist');
            tasks.push('replace-after-rev');
        }

        grunt.task.run(tasks);
    });

};