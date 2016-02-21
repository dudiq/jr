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

    grunt.registerMultiTask('sass', 'Compile Sass to CSS', function () {
        var done = this.async();
        var opt = this.options({});

        var libOpt = opt.libOptions || {};
        (libOpt.precision === undefined) && (libOpt.precision = 10);

        var outputDir = opt.outDir;
        var sourceFiles = opt.sassDir + opt.files;
        var len = opt.sassDir.length;
        var files = grunt.file.expand({ filter: 'isFile'}, sourceFiles);

        asyncForEach(files, function(file, index, next){
            var outFile = outputDir + file.substr(len);
            outFile = getPathWithoutExt(outFile) + '.css';
            doProcessSass(file, outFile, libOpt, next);
        }, done);
    });
};