'use strict';
var crypto = require('crypto');
var fs = require('fs');

module.exports = function (grunt) {
    var extReg = /[^A-Za-z0-9]/i;

    var isArray = (function () {
        // Use compiler's own isArray when available
        if (Array.isArray) {
            return Array.isArray;
        }

        // Retain references to variables for performance
        // optimization
        var objectToStringFn = Object.prototype.toString,
            arrayToStringResult = objectToStringFn.call([]);

        return function (subject) {
            return objectToStringFn.call(subject) === arrayToStringResult;
        };
    }());


    function replaceAll(str, search, replace) {
        (replace === undefined) && (replace = "");
        return str.split(search).join(replace);
    }

    function getFileName(path){
        var fileName = path.split('/').pop();
        var arr = fileName.split('.');
        (arr.length > 1) && arr.pop();
        var ret = arr.join('.');
        return ret;
    }

    function getExt(path){
        var ext = (path + '').split('.').pop();
        if (ext == path){
            ext = '';
        }
        if (ext && ext.indexOf(" ") != -1){
            ext = '';
        }
        if (ext && extReg.test(ext)){
            ext = '';
        }
        return ext;
    }

    function getFolderPath(path){
        var arr = path.split('/');
        arr.pop();
        var ret = arr.join('/');
        return ret;
    }

    function getFileHash(path, options){
        options = options || {};
        var method = options.method || 'md5';
        var length = options.length || 8;

        var ext = getExt(path);
        var fileName = getFileName(path);
        var hash = crypto.createHash(method).update(fs.readFileSync(path)).digest('hex');
        var suffix = hash.slice(0, length);
        var newFileNameArr = [suffix, fileName];
        ext && newFileNameArr.push(ext);
        var ret = newFileNameArr.join('.');
        return ret;
    }

    function createHashes(list){
        var ret = [];
        var rootFolder = this.data.folder;
        for (var i = 0, l = list.length; i < l; i++){
            var path = list[i];
            var fPath = getFolderPath(path);
            var nPath = getFileHash(rootFolder + '/' + path, this.options);
            var fileName = (fPath ? fPath + '/' : '') + nPath;
            ret.push(fileName);
        }
        return ret;
    }

    function pushItem(item, folder, dropFolder){
        var ret = item;
        if (dropFolder){
            if (item.indexOf(folder) == 0){
                ret = item.substr(folder.length + 1);
            }
        }
        return ret;
    }

    function createFileList(whereList, rootFolder, dropFolder){
        if (!isArray(whereList)){
            whereList = [whereList];
        }
        var list = [];
        var fName = '';
        for (var j = 0, k = whereList.length; j < k; j++){
            var whereItem = rootFolder + '/' + whereList[j];
            var files = grunt.file.expand(whereItem);
            if (isArray(files)){
                for (var i = 0, l = files.length; i < l; i++){
                    var path = files[i];
                    if (grunt.file.isFile(path)) {
                        fName = pushItem(files[i], rootFolder, dropFolder);
                        list.push(fName);
                    }
                }
            } else {
                if (grunt.file.isFile(whereItem)){
                    fName = pushItem(whereItem, rootFolder, dropFolder);
                    list.push(fName);
                }
            }
        }
        return list;
    }

    function processFiles(){
        var files = this.data.files;
        var rootFolder = this.data.folder;
        for (var i = 0, l = files.length; i < l; i++){
            var item = files[i];
            var whereReplace = createFileList(item.where, rootFolder);
            var whatReplace = createFileList(item.list, rootFolder, true);
            var newNames = createHashes.call(this, whatReplace);
            doReplaceFiles(whereReplace, whatReplace, newNames);
            doRenameFiles(whatReplace, newNames, rootFolder);
        }
    }

    function doRenameFiles(what, newNames, rootFolder){
        what.forEach(function(item, index){
            var oldPath = rootFolder + '/' + item;
            var newName = rootFolder + '/' + newNames[index];
            fs.renameSync(oldPath, newName);
        });
    }

    function doReplaceFiles(whereReplace, whatReplace, newNames){
        var options = {
            encoding: 'utf-8'
        };
        whereReplace.forEach(function(filePath, index, arr){
            var file = grunt.file.read(filePath, options);
            var isProcessedFile = false;

            whatReplace.forEach(function(what, ind){
                var newName = newNames[ind];
                var oldLen = file.length;
                file = replaceAll(file, what, newName);
                var newLen = file.length;
                if (newLen != oldLen){
                    if (!isProcessedFile){
                        isProcessedFile = true;
                        var title = '- working with: ' + filePath;
                        grunt.log.writeln(title['green']);
                    }
                    var text = '--- replaced: "' + what + '" to "' + newName + '"';
                    grunt.log.writeln(text['grey']);

                }
            });
            grunt.file.write(filePath, file, options);
        });
    }

    grunt.registerMultiTask('replace-after-rev', 'replace data after rev files', function () {
        grunt.log.subhead(' > start processing REV files');
        processFiles.call(this);
    });
};