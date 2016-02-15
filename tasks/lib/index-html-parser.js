'use strict';

var T_DEF = 'none';
var T_JS = 'js';
var T_CSS = 'css';

var viewsReg = '<!--\\s*?views\\(.*?\\)';
var commentsRegHtml = '(<!--.*?-->)';

var fileTypeGetsMap = {
    css: {
        subLen : 6,
        tagReg: '(<link.*?>)',
        fileReg: 'href=("|\')(.*?)("|\')'
    },
    js: {
        subLen : 5,
        tagReg: '(<script.*?/script>)',
        fileReg: 'src=("|\')(.*?)("|\')'
    }
};

function ModuleClass(modType, text){
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
}

var p = ModuleClass.prototype;

p.name = function(val){
    if (val !== undefined){
        this._name = val;
    }
    return this._name;
};

p.processedFiles = function(){
    return this._processedFiles;
};

p.exFiles = function(){
    return this._exFiles;
};

p.filesMap = function(){
    return this._filesMap;
};

p.startWord = function(){
    return this._startWord;
};

p.getTag = function(){
    var ret = '';
    var type = this._fileType;
    var fileName = this._fileName;
    if (type == T_JS){
        ret = '<script src="' + fileName + '"></script>';
    } else if (type == T_CSS){
        ret = '<link rel="stylesheet" href="' + fileName + '">';
    }
    return ret;
};

p.text = function(){
    return this._text;
};

p.fileType = function(val){
    if (val !== undefined){
        this._fileType = val;
    }
    return this._fileType;
};

p.fileName = function(val){
    if (val !== undefined){
        this._fileName = val;
    }
    return this._fileName;
};

p.files = function(val){
    if (val !== undefined){
        var files = this._files;
        files.length = 0;
        var map = this._filesMap;
        for (var key in map){
            delete map[key];
        }
        for (var i = 0, l = val.length; i < l; i++){
            var node = val[i];
            var tag = node.tag;
            var path = node.path;
            files.push(path);
            if (!map[path]){
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

p.modType = function(val){
    if (val !== undefined){
        this._moduleType = val;
    }
    return this._moduleType;
};

p.views = function(val){
    if (val !== undefined){
        var views = this._views;
        views.length = 0;
        for (var i = 0, l = val.length; i < l; i++){
            views.push(val[i]);
        }
    }
    return this._views;
};

p.addModule = function(module){
    this._modules.push(module);
};

p.modules = function(){
    return this._modules;
};

p.findModules = function(){
    var self = this;
    var hereModules = this._modules;
    var fType = this.fileType();
    fillByType('module', this.text(), function(module) {
        processModuleFile(module, fType, self);
        hereModules.push(module);
    });
};

p.setModuleStart = function (module) {
    var files = this._files;
    var mapFiles = this._filesMap;

    var modFiles = module.files();
    if (modFiles.length){
        var count = 0;
        var firstFile = modFiles[count];
        for (var i = 0, l = files.length; i < l; i++){
            var filePath = files[i];
            if (filePath == firstFile && mapFiles[filePath]){
                count++;
                mapFiles[filePath].module = module;
                firstFile = modFiles[count];
            } else if (count > 0) {
                break;
            }
        }
    }

};

function processModuleFile(module, fType, parent){
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

function getCommentedMap(text, fileLink, subLen){
    var map = {};
    var commentedLinks = new RegExp(commentsRegHtml, 'ig');

    var matches = text.match(commentedLinks);
    if (matches){
        for (var i = 0, l = matches.length; i < l; i++){
            var tag = matches[i];
            var filePath = getFilePath(tag, fileLink, subLen);
            filePath && (map[filePath] = true);
        }
    }
    return map;
}

function getFilePath(tag, fileLink, subLen){
    var ret = null;
    var fileMatches = tag.match(fileLink);
    if (fileMatches && fileMatches[0]){
        var fileMatch = fileMatches[0];
        ret = (fileMatch + '').substr(subLen, fileMatch.length - (subLen + 1));
    }

    return ret;
}

function getFilesPath(type, text){
    var ret = [];

    var fileDetect = fileTypeGetsMap[type];
    if (fileDetect){
        var subLen = fileDetect.subLen;

        // css
        var regStart = new RegExp(fileDetect.tagReg, 'ig');

        var fileLink = new RegExp(fileDetect.fileReg, 'ig');
        var commentedLinksMap = getCommentedMap(text, fileLink, subLen);

        var matches = text.match(regStart);
        if (matches){
            for (var i = 0, l = matches.length; i < l; i++){
                var tag = matches[i];
                var filePath = getFilePath(tag, fileLink, subLen);
                if (filePath && !commentedLinksMap[filePath]){
                    var node = {
                        tag: tag,
                        path : filePath
                    };
                    ret.push(node);
                }
            }
        }
    }
    return ret;
}

function getViews(text){
    var ret = [];
    var reg = new RegExp(viewsReg, 'igm');
    var matches = text.match(reg);
    if (matches){
        var node = matches[0];
        var list = node.substring(node.indexOf('(') + 1, node.lastIndexOf(')'));
        var items = list.split(',');
        for (var i = 0, l = items.length; i < l; i++){
            var item = items[i].trim();
            ret.push(item);
        }
    }
    return ret;
}

function fillByType(modType, text, cb){
    var data = getTextBlocks(text, modType);
    for (var i = 0, l = data.length; i < l; i++) {
        var node = data[i];
        var unit = new ModuleClass(modType, node);
        cb(unit);
    }
}

function getTextBlocks(text, whatToFind){
    var regStart = new RegExp('(<!--\\s*' + whatToFind + ')', 'ig');
    var regEnd = new RegExp('(end' + whatToFind + '\\s*-->)', 'ig');
    var preUnits = text.split(regStart);
    var preData = [];
    for (var i = 2, l = preUnits.length; i < l; i+=2){
        var item = preUnits[i];
        var preItem = item.split(regEnd);
        preData.push(preItem[0]);
    }
    return preData;
}

function setStartWord(){
    var modType = this.modType();
    this._startWord = new RegExp('<!--.*?' + modType);
}

function processUnitFile(node){
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

function getHtml(arr, text){
    var ret = text;
    for (var i = 0, l = arr.length; i < l; i++) {
        var unit = arr[i];
        var startWord = unit.startWord();
        var unitTag = unit.getTag();
        var unitText = unit.text();
        ret = ret.replace(startWord, unitTag);
        ret = ret.replace(unitText, '');
        ret = ret.replace('endunit -->', '');

    }
    return ret;
}

function processReturnFiles(unit, excludes, opt){
    var files = unit.files();
    var map = unit.filesMap();
    var retFiles = unit._processedFiles;
    var exFiles = unit._exFiles;
    var excludeAll = (opt.excludeAll === true); //false by default
    retFiles.length = 0;
    exFiles.length = 0;
    for (var i = 0, l = files.length; i < l; i++){
        var file = files[i];
        var fMap = map[file];
        if (fMap.module){
            var name = fMap.module.name();
            if (excludeAll || excludes[name]){
                // need drop
                exFiles.push(file);
            } else {
                retFiles.push(file);
            }
        } else {
            retFiles.push(file);
        }
    }
}

function findUnits(text, exModules, opt){
    exModules = exModules || {};
    var opt = opt || {};
    var ret = [];
    fillByType('unit', text, function(node){
        processUnitFile(node);
        node.findModules();
        ret.push(node);
        processReturnFiles(node, exModules, opt);
    });
    ret.html = getHtml(ret, text);
    return ret;
}

module.exports = findUnits;