'use strict';

var indexParserLib = require('./lib/index-html-parser');
var replaceViewsLib = require('./lib/replace-views');
var indexTypes = indexParserLib.types;

function getMinModules(grunt) {
    var minifyFlag = grunt.option('minify');
    var ret = false;
    if (typeof minifyFlag == "string"){
        var list = minifyFlag.split(',');
        if (list.length){
            ret = {};
            list.map(function (item) {
                ret[item] = true;
            });
        }
    }
    return ret;
}

module.exports = function (grunt) {

    function processExUnitFiles(source, files){
        for (var i = 0, l = files.length; i < l; i++){
            var file = files[i];
            var path = source + '/' + file;
            // grunt.file.delete(path);
            // not delete file, just create empty, for do not showing errors in console
            grunt.file.write(path, '');
        }
    }

    function processExcludes(source, units, type){
        for (var i = 0, l = units.length; i < l; i++){
            var unit = units[i];
            var files = unit[type]();
            processExUnitFiles(source, files);
        }
    }

    function fillTaskValues(taskName, params){
        var taskType =  params.type;
        var dest = params.dest;
        var units = params.units;
        var modulesForMinify = params.modulesForMinify;

        var files = {};
        var replaceAll = !modulesForMinify;
        units.map(function (unit) {
            var fType = unit.fileType();
            if (fType == taskType){
                if (replaceAll){
                    putFileToList(unit, dest, files);
                } else {
                    // single modules replace
                    var modules = unit.modules();
                    modules.map(function (module) {
                        putFileToList(module, dest, files);
                    });
                }
            }
        });
        var taskOptions = grunt.config(taskName);
        taskOptions.dist.files = files;

        grunt.config(taskName, taskOptions);
    }
    function putFileToList(unit, dist, files){
        var key = unit.fileName();
        var path = dist + '/' + key;
        files[path] = path;
    }

    function setOptionForConcat(params) {
        var source = params.source;
        var dest = params.dest;
        var units = params.units;
        var modulesForMinify = params.modulesForMinify;

        var replaceAll = !modulesForMinify;
        var files = {};
        units.map(function (unit) {
            if (replaceAll){
                var key = dest + '/' + unit.fileName();
                var pFiles = unit.processedFiles();
                files[key] = getFilesForKey(source, pFiles);
            } else {
                // single
                var modules = unit.modules();
                modules.map(function (mod) {
                    var key = dest + '/' + mod.fileName();
                    var modFiles = mod.files();
                    files[key] = getFilesForKey(source, modFiles);
                });
            }
        });

        var options = grunt.config('concat');
        options.dist.files = files;

        grunt.config('concat', options);
    }

    function setCopyOptions(params) {
        var source = params.source;
        var dest = params.dest;
        var units = params.units;
        var modulesForMinify = params.modulesForMinify;

        if (modulesForMinify){
            var options = grunt.config('copy');
            var filesInTask = options.minifiedModules.files;
            units.map(function (unit) {
                var pFiles = unit.processedFiles();
                var fileToModMap = unit.filesMap();

                pFiles.map(function (pFileSingle) {

                    var node = fileToModMap[pFileSingle];
                    var module = node.module;
                    var modName = module.name();
                    if (!modulesForMinify[modName]){
                        var fileSrc = source + '/' + pFileSingle;
                        var fileDest = dest + '/' + pFileSingle;
                        var item = {
                            // expand: true,
                            follow: true,
                            src: fileSrc,
                            dest: fileDest
                        };
                        filesInTask.push(item);
                    }
                });

            });
            grunt.config('copy', options);
        }
    }

    function getFilesForKey(source, pFiles) {
        var filesKey = [];
        for (var j = 0, k = pFiles.length; j < k; j++){
            var fileKey = source + '/' + pFiles[j];
            filesKey.push(fileKey);
        }
        return filesKey;
    }

    function processMinifyData(dest, source, units, modulesForMinify) {
        fillTaskValues('uglify', {
            type: indexTypes.js,
            dest: dest,
            units: units,
            modulesForMinify: modulesForMinify
        });
        fillTaskValues('cssmin', {
            type: indexTypes.css,
            dest: dest,
            units: units,
            modulesForMinify: modulesForMinify
        });
        setOptionForConcat({
            source: source,
            dest: dest,
            units: units,
            modulesForMinify: modulesForMinify
        });
        setCopyOptions({
            source: source,
            dest: dest,
            units: units,
            modulesForMinify: modulesForMinify
        });
    }

    grunt.registerMultiTask('minify', 'Processing MINIFY for build', function () {
        grunt.log.subhead(' > start processing MINIFY actions');
        /**
         * preparation task. done in gruntfile.js
         * - clean all
         * - `postcss`
         * - copy js, views, images, fonts, etc.. to .tmp dir
         * - copy index.html
         * - `insertVersion`
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

        var minifyFlag = grunt.option("minify");
        var doRevFiles = grunt.option("rev-files");
        var buildType = this.data.buildType;

        var doMinifyCode = (minifyFlag === false) ? false : true;

        if (!doRevFiles && doRevFiles !== false &&
            (minifyFlag === true || minifyFlag === undefined)){
            // for not defined `doRevFiles` use `doMinifyCode` flag value
            doRevFiles = doMinifyCode;
        }

        var tasks = [];

        var inFlags = {
            '--build-type=': buildType
        };

        var modulesForMinify = getMinModules(grunt);
        var units = indexParserLib(grunt, {
            source: source,
            inFlags: inFlags,
            modulesForMinify: modulesForMinify
        });
        replaceViewsLib(grunt, replaceViewsOpt, units);

        processExcludes(source, units, 'exFiles');

        if (doMinifyCode){
            grunt.log.writeln('--- Started minify');
            var newHtml = units.html;
            grunt.file.write(source + '/index.html', newHtml);

            processMinifyData(dest, source, units, modulesForMinify);

            tasks.push('concat:dist', 'uglify:dist', 'cssmin:dist');
            if (modulesForMinify){
                tasks.push('copy:minifiedModules');
            }
        } else {
            // just copy all as is
            tasks.push('copy:withoutMinify');
        }

        tasks.push('copy:rootFilesFromTmp');

        if (doRevFiles){
            // :todo last task. create rev files, update all files includes with new rev files using usemin task from yeoman
            //tasks.push('filerev:dist');
            tasks.push('replaceAfterRev');
        }

        grunt.task.run(tasks);
    });

};
