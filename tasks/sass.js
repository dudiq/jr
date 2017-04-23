'use strict';
var sass = require('node-sass');

module.exports = function (grunt) {
    grunt.verbose.writeln('\n' + sass.info + '\n');

    function extendObj(to, from){
        for (var key in from){
            to[key] = from[key];
        }
        return to;
    }

    function getPathWithoutExt(path){
        var arr = path.split('.');
        arr.pop();
        var ret = arr.join('.');
        return ret;
    }

    function doProcessSass(file, outFile, opt, cb){
        var subOpt = {
            file: file,
            outFile: outFile
        };
        var sassOpt = extendObj(subOpt, opt);
        sass.render(sassOpt, function (err, res) {
            if (err) {
                grunt.log.error(err.message + '\n  ' + 'Line ' + err.line + '  Column ' + err.column + '  ' + err.file + '\n');
                grunt.warn('');
            } else {
                grunt.log.writeln('compiled: ' + outFile);
                grunt.file.write(outFile, res.css);
            }
            cb(err);
        });

    }

    function asyncForEach(arr, cb, done){
        var total = 0;
        for (var i = 0, l = arr.length; i < l; i++){
            var item = arr[i];
            (function(item, i, l, done){
                cb(item, i, function(err){
                    total++;
                    if (err || (total == l)){
                        //break
                        total = l;
                        done && done();
                        done = null;
                    }
                });
            })(item, i, l, done);
        }
    }

    function collectFiles(filesForProcess, len, outputDir, files) {
        for (var i = 0, l = files.length; i < l; i++){
            var file = files[i];
            var outFilePath = outputDir + file.substr(len);
            var outFile = getPathWithoutExt(outFilePath) + '.css';
            var item = {
                fromFile: file,
                outFile: outFile
            };
            filesForProcess.push(item);
        }
    }

    function syncFormEach(arr, cb) {
        for (var i = 0, l = arr.length; i < l; i++){
            cb(arr[i], i);
        }
    }

    grunt.registerMultiTask('sass', 'Compile Sass to CSS', function () {
        var done = this.async();
        var opt = this.options({});

        var libOpt = opt.libOptions || {};
        (libOpt.precision === undefined) && (libOpt.precision = 10);

        var outputDir = opt.outDir;
        var inputDirs = opt.sassDir;
        var filesForProcess = [];

        grunt.log.writeln('--- collect folders');
        syncFormEach(inputDirs, function (val) {
            if (val){
                grunt.log.writeln(val);
                var sourceFiles = val + opt.files;
                var len = val.length;
                var files = grunt.file.expand({ filter: 'isFile'}, sourceFiles);
                collectFiles(filesForProcess, len, outputDir, files);
            }
        });

        grunt.log.writeln('--- parsing files');
        asyncForEach(filesForProcess, function(file, index, next){
            var outFile = file.outFile;
            var fromFile = file.fromFile;
            doProcessSass(fromFile, outFile, libOpt, next);
        }, done);
    });
};
