'use strict';

var T_DEF = 'none';
var T_JS = 'js';
var T_CSS = 'css';

var ModuleType = 'module';
var ExModuleType = 'exModule';

var viewsReg = '<!--\\s*?views\\(.*?\\)';
var commentsRegHtml = '(<!--.*?-->)';

var fileTypeGetsMap = {
    css: {
        subLen: 6,
        tagReg: '(<link.*?>)',
        fileReg: 'href=("|\')(.*?)("|\')'
    },
    js: {
        subLen: 5,
        tagReg: '(<script.*?/script>)',
        fileReg: 'src=("|\')(.*?)("|\')'
    }
};

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

function ModuleClass(modType, text) {
    this._startWord = '';
    this._moduleType = modType;
    this._fileType = T_DEF;
    this._text = text;
    this._fileName = '';
    this._name = '';
    this._modules = [];
    this._files = [];
    this._views = [];
    this._filesMap = {};
    this._processedFiles = [];
    this._exFiles = [];
    this._root = null;
    this._isExcluded = false;
}

var p = ModuleClass.prototype;

p.name = function (val) {
    if (val !== undefined) {
        this._name = val;
    }
    return this._name;
};

p.setRoot = function (val) {
    this._root = val;
};

p.processedFiles = function () {
    return this._processedFiles;
};

p.exFiles = function () {
    return this._exFiles;
};

p.isExcluded = function () {
    var ret = this._isExcluded;
    ret = ret || (this._moduleType == ExModuleType);
    return ret;
};

p.setExcluded = function () {
    this._isExcluded = true;
};

p.filesMap = function () {
    return this._filesMap;
};

p.startWord = function () {
    return this._startWord;
};

p.getTag = function (fileName) {
    var ret = '';
    var type = this._fileType;
    if (type == T_JS) {
        ret = '<script src="' + fileName + '"></script>';
    } else if (type == T_CSS) {
        ret = '<link rel="stylesheet" href="' + fileName + '">';
    }
    return ret;
};

p.text = function () {
    return this._text;
};

p.fileType = function (val) {
    if (val !== undefined) {
        this._fileType = val;
    }
    return this._fileType;
};

p.fileName = function (val) {
    if (val !== undefined) {
        // set
        this._fileName = val;
    }

    // get for unit
    var ret = this._fileName;

    // get for module
    if (this._root){
        var rootFileName = this._root.fileName();
        var path = getPathFromFile(rootFileName);
        var ext = this.fileType();
        ret = path + '/' + this.name() + '.' + ext;
    }

    return ret;
};

p.files = function (val) {
    if (val !== undefined) {
        var files = this._files;
        files.length = 0;
        var map = this._filesMap;
        for (var key in map) {
            delete map[key];
        }
        for (var i = 0, l = val.length; i < l; i++) {
            var node = val[i];
            var tag = node.tag;
            var path = node.path;
            files.push(path);
            if (!map[path]) {
                map[path] = {
                    tag: tag,
                    module: null
                };
            } else {
                console.error('file already exist in list "' + path + '"');
            }

        }
    }
    return this._files;
};

p.modType = function (val) {
    if (val !== undefined) {
        this._moduleType = val;
    }
    return this._moduleType;
};

p.views = function (val) {
    if (val !== undefined) {
        var views = this._views;
        views.length = 0;
        for (var i = 0, l = val.length; i < l; i++) {
            views.push(val[i]);
        }
    }
    return this._views;
};

p.addModule = function (module) {
    this._modules.push(module);
};

p.modules = function () {
    return this._modules;
};

p.findModules = function (inFlags) {
    var self = this;
    var hereModules = this._modules;
    var fType = this.fileType();
    fillByType([ModuleType, ExModuleType], this.text(), function (module) {
        module.setRoot(self);
        processModuleFile(module, fType, self);
        hereModules.push(module);
        if (inFlags && !module.isExcluded()){
            var moduleText = module.text();
            for (var key in inFlags){
                // key, flag, option - for example
                // key == '--build-type='
                // flag == 'dev'
                // option is '--build-type=dev'
                var flag = inFlags[key];
                var option = key + flag;
                if (moduleText.indexOf(key) != -1){
                    if (moduleText.indexOf(option) == -1){
                        // exclude module, if NOT --build-type=dev
                        module.setExcluded();
                    }
                }
            }
        }
    });
};

p.setModuleStart = function (module) {
    var files = this._files;
    var mapFiles = this._filesMap;

    var modFiles = module.files();
    if (modFiles.length) {
        var count = 0;
        var firstFile = modFiles[count];
        for (var i = 0, l = files.length; i < l; i++) {
            var filePath = files[i];
            if (filePath == firstFile && mapFiles[filePath]) {
                count++;
                mapFiles[filePath].module = module;
                firstFile = modFiles[count];
            } else if (count > 0) {
                break;
            }
        }
    }
};

function processModuleFile(module, fType, parent) {
    var text = module.text();
    var files = getFilesPath(fType, text);
    var reg = new RegExp('\\(.*?\\)', 'ig');
    var regRes = text.match(reg, 'ig');
    var resFirst = (regRes[0] + '');
    var modName = regRes ? resFirst.substr(1, resFirst.length - 2) : '';
    module.name(modName);
    module.files(files);
    module.fileType(fType);
    module._startWord = new RegExp('<!--.*?\\(' + modName + '\\).*?-->');
    var views = getViews(text);
    module.views(views);
    parent.setModuleStart(module);
}

function getCommentedMap(text, fileLink, subLen) {
    var map = {};
    var commentedLinks = new RegExp(commentsRegHtml, 'ig');

    var matches = text.match(commentedLinks);
    if (matches) {
        for (var i = 0, l = matches.length; i < l; i++) {
            var tag = matches[i];
            var filePath = getFilePath(tag, fileLink, subLen);
            filePath && (map[filePath] = true);
        }
    }
    return map;
}

function getFilePath(tag, fileLink, subLen) {
    var ret = null;
    var fileMatches = tag.match(fileLink);
    if (fileMatches && fileMatches[0]) {
        var fileMatch = fileMatches[0];
        ret = (fileMatch + '').substr(subLen, fileMatch.length - (subLen + 1));
    }

    return ret;
}

function getFilesPath(type, text) {
    var ret = [];

    var fileDetect = fileTypeGetsMap[type];
    if (fileDetect) {
        var subLen = fileDetect.subLen;

        // css
        var regStart = new RegExp(fileDetect.tagReg, 'ig');

        var fileLink = new RegExp(fileDetect.fileReg, 'ig');
        var commentedLinksMap = getCommentedMap(text, fileLink, subLen);

        var matches = text.match(regStart);
        if (matches) {
            for (var i = 0, l = matches.length; i < l; i++) {
                var tag = matches[i];
                var filePath = getFilePath(tag, fileLink, subLen);
                if (filePath && !commentedLinksMap[filePath]) {
                    var node = {
                        tag: tag,
                        path: filePath
                    };
                    ret.push(node);
                }
            }
        }
    }
    return ret;
}

function getViews(text) {
    var ret = [];
    var reg = new RegExp(viewsReg, 'igm');
    var matches = text.match(reg);
    if (matches) {
        var node = matches[0];
        var list = node.substring(node.indexOf('(') + 1, node.lastIndexOf(')'));
        var items = list.split(',');
        for (var i = 0, l = items.length; i < l; i++) {
            var item = items[i].trim();
            ret.push(item);
        }
    }
    return ret;
}

function fillByType(modType, text, cb) {
    if (isArray(modType)){
        modType.map(function (item) {
            fillSingleByType(item, text, cb);
        });
    } else {
        fillSingleByType(modType, text, cb);
    }
}

function fillSingleByType(modType, text, cb) {
    var data = getTextBlocks(text, modType);
    for (var i = 0, l = data.length; i < l; i++) {
        var node = data[i];
        var unit = new ModuleClass(modType, node);
        cb(unit);
    }
}

function getTextBlocks(text, inputWhat) {
    var whatToFind = inputWhat;
    var regStart = new RegExp('(<!--\\s*' + whatToFind + ')', 'ig');
    var regEnd = new RegExp('(end' + whatToFind + '\\s*-->)', 'ig');
    var preUnits = text.split(regStart);
    var preData = [];
    for (var i = 2, l = preUnits.length; i < l; i += 2) {
        var item = preUnits[i];
        var preItem = item.split(regEnd);
        preData.push(preItem[0]);
    }
    return preData;
}

function setStartWord() {
    var modType = this.modType();
    this._startWord = new RegExp('<!--.*?' + modType);
}

function processUnitFile(node) {
    var text = node.text();
    var data = text.match(/\(.*?\)/);
    if (data && data[0]) {
        var preData = data[0];
        var preNodes = (preData + '').substr(1, preData.length - 2);
        setStartWord.call(node, preNodes);
        var nodes = preNodes.split(',');
        var fType = nodes[0].trim().toLowerCase();
        var unitFile = nodes[1].trim();
        node.fileType(fType);
        node.fileName(unitFile);
        node.name(fType);
        var files = getFilesPath(fType, text);
        node.files(files);
    }
}

function getHtml(arr, text, modList) {
    var ret = text;
    var replaceAll = isEmptyObject(modList);
    arr.map(function (unit) {
        var fileName = unit.fileName();
        if (replaceAll){
            var startWord = unit.startWord();
            var unitTag = unit.getTag(fileName);
            var unitText = unit.text();
            ret = ret.replace(startWord, unitTag);
            ret = ret.replace(unitText, '');
            ret = ret.replace('endunit -->', '');
        } else {
            // replace only modules in modList
            var mods = unit.modules();
            mods.map(function (item) {
                var name = item.name();
                if (modList[name]){
                    // need replace
                    var whatReplace = item.text();
                    var unitFileName = item.fileName();
                    var toReplace = '(' + name + ') --> \n' + item.getTag(unitFileName) + '\n<!-- ';
                    ret = ret.replace(whatReplace, toReplace);
                }
            });
        }
    });
    return ret;
}

function getPathFromFile(file) {
    var path = (file + '').split('/');
    path.pop();
    var ret = path.join('/');
    return ret;
}

function isEmptyObject(obj) {
    if (obj){
        for (var key in obj){
            return false;
        }
    }
    return true;
}

function pushToDrop(retEx, exFiles, name, file) {
    retEx[name] = true;
    exFiles.push(file);
}

function processReturnFiles(unit, opt, retEx) {
    var excludes = opt.excludes;
    var includes = opt.includes;
    var isIncludesEmpty = isEmptyObject(includes);
    var files = unit.files();
    var map = unit.filesMap();
    var retFiles = unit.processedFiles();
    var exFiles = unit.exFiles();
    var excludeAll = (opt.excludeAll === true); //false by default
    retFiles.length = 0;
    exFiles.length = 0;
    for (var i = 0, l = files.length; i < l; i++) {
        var file = files[i];
        var fMap = map[file];
        var mod = fMap.module;
        if (mod) {
            var name = mod.name();
            var isExcluded = mod.isExcluded();
            if (isExcluded && !includes[name]){
                // need drop
                pushToDrop(retEx, exFiles, name, file);
            } else if (excludeAll || (excludes[name] && !includes[name])) {
                // need drop
                pushToDrop(retEx, exFiles, name, file);
            } else if (isIncludesEmpty || includes[name]){
                retFiles.push(file);
            } else {
                pushToDrop(retEx, exFiles, name, file);
            }
        } else {
            retFiles.push(file);
        }
    }
}

function getOptMap(grunt, optionName){
    var optionModules = {};
    var str = grunt.option(optionName) || '';
    var list = str.split(',');
    for (var i = 0, l = list.length; i < l; i++){
        var item = list[i];
        if (item){
            optionModules[list[i]] = true;
        }
    }
    return optionModules;
}

module.exports = function (grunt, params) {
    var source = params.source;
    var inFlags = params.inFlags;
    var modulesForMinify = params.modulesForMinify;

    var excludedModules = getOptMap(grunt, "exclude");
    var includedModules = getOptMap(grunt, "include");

    var text = grunt.file.read(source + '/index.html', {
        encoding: 'utf8'
    });
    var opt = {
        excludes: excludedModules,
        includes: includedModules,
        excludeAll: (grunt.option("excludeAll") === true) // false by default
    };

    var ret = [];
    var retEx = {};

    fillByType('unit', text, function (node) {
        processUnitFile(node);
        node.findModules(inFlags);
        ret.push(node);
        processReturnFiles(node, opt, retEx);
    });
    ret.html = getHtml(ret, text, modulesForMinify);
    ret.excludes = retEx;
    return ret;
};

module.exports.types = {
    js: T_JS,
    css: T_CSS
};
