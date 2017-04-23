/*
 * templater module for processing templates, translate and give it to other modules
 *
 * */
(function(){
    var app = window.app;
    var translate = app('translate');
    var helper = app('helper');
    var logger = app('logger')('templater');

    var compiledTemplates = {};
    var rawTemplates = {};
    var linkToParentMap = {};
    var parentsDelimiter = '*';
    var extRawTemplates = {};
    var includesReg = new RegExp("\{\{include\(.*?\)\}\}", "ig");

    app('templater', {
        // translate template by defined words in translate module
        translate: function (template) {
            var translateWords = translate.getWordsAsList();
            var newTpl = helper.replaceInText(template, translateWords);
            return newTpl;
        },
        setSubstitute: function (struct) {
            var toRecompile = {};
            var listTplIds = [];
            collectForRecompile(extRawTemplates, toRecompile);

            // clear old compiled structures
            helper.clearObject(extRawTemplates);

            if (toRecompile || struct) {

                if (struct){
                    // set new templates
                    collectForRecompile(struct, toRecompile);
                    for (var id in struct) {
                        extRawTemplates[id] = struct[id];
                    }
                }

                // need recompile changed templates (substates and parents)
                for (var key in toRecompile){
                    delete compiledTemplates[key];
                    delete linkToParentMap[key];
                    listTplIds.push(key);
                }
            }
            toRecompile = null;

            // redraw pages if detected
            var pageViewIds = getPagesViewId();
            var toRedrawPages = [];
            if (listTplIds.length){
                for (var i = 0, l = listTplIds.length; i < l; i++){
                    var viewId = listTplIds[i];
                    var pageId = pageViewIds[viewId];
                    if (pageId){
                        toRedrawPages.push(pageId);
                        delete pageViewIds[viewId];
                    }
                }
            }
            toRedrawPages.length && app('navigation').redraw(toRedrawPages);
        },
        // processing content
        // id - page id
        // data - hash array for replace
        process: function (id, data) {
            return processContent(id, data);
        },
        // get views by id and process data, if needed
        // in dev, calling sync request for getting html content
        // in prod version, all views defined in templater-data.js, when client was builded
        //
        // id - template id
        // processData - data for process
        get: function (id, processData) {
            return getViewById(id, processData);
        },
        // set template by id
        //
        // id - template id
        // data - template content
        set: function (id, data) {
            if (typeof id == "object" && !data) {
                for (var key in id) {
                    if (rawTemplates[key]) {
                        logger.warning('template "' + key + '" already defined');
                    } else {
                        rawTemplates[key] = id[key];
                    }
                }
            } else {
                if (id) {
                    if (rawTemplates[id]) {
                        logger.warning('template "' + id + '" already defined');
                    } else {
                        rawTemplates[id] = data;
                    }
                }
            }
        }
    });

    function getPagesViewId() {
        var pagesViewIdsMap = {};
        var pages = app('pages');
        pages.map(function (key, page) {
            pagesViewIdsMap[page.viewId] = key;
        });
        return pagesViewIdsMap;
    }

    function collectForRecompile(struct, toRecompile) {
        var list = '';
        for (var id in struct){
            list += parentsDelimiter + linkToParentMap[id];
            toRecompile[id] = true;
        }
        var parents = list.split(parentsDelimiter);
        for (var i = 0, l = parents.length; i < l; i++){
            var item = parents[i];
            if (item){
                toRecompile[item] = true;
            }
        }
    }

    function getViewById(id, processData) {
        var template = compiledTemplates[id];
        if (!template) {
            compileTpl(id);
        }
        template = processContent(id, processData);
        return template;
    }

    function processContent(id, data) {
        var template = compiledTemplates[id];
        if (template && data) {
            template = helper.replaceInText(template, data);
        }
        return template;
    }

    function getIncludeNames(regVal){
        var key = regVal[0];
        var subVal = regVal[1];
        var value = subVal.substring(1, subVal.length-1);
        var argsRet;
        var splitPos = value.indexOf(',');
        if (splitPos != -1){
            var args = (value.substring(splitPos + 1)).trim();
            value = value.substring(0, splitPos);
            try {
                var data = JSON.parse(args);
                argsRet = {};
                for (var dataKey in data){
                    var newKey = '{{' + dataKey + '}}';
                    argsRet[newKey] = data[dataKey];
                }
                data = null;
            } catch(e){
                argsRet = undefined;
                logger.error('trying to parse not correct template include() variables', args);
            }
        }
        return {
            key: key,
            value: value,
            args: argsRet
        };
    }

    // find {{include(view)}} and getting as object
    // return object like this {'{{include(some-view}}}': 'view text'}
    function findIncludes(text){
        var map = {};
        var result;
        includesReg.lastIndex = 0;
        while((result = includesReg.exec(text)) !== null) {
            putIncludes(map, result);
        }
        return map;
    }

    function putIncludes(map, result) {
        var iName = getIncludeNames(result);
        map[iName.key] = iName;
        return iName;
    }

    // use this '/' for include files, don't use '\' for include in views
    // processing {{includes()}} in text
    function processIncludes(text, preRepeats, parents){
        var map = findIncludes(text);
        var newParents = '';
        for (var key in map){
            var mapItem = map[key];
            var mapValue = mapItem.value;
            var tpl = getViewById(mapItem.value, mapItem.args);
            if (preRepeats[key]){
//                recursive include!!!
                includesReg.lastIndex = 0;
                var iName = putIncludes(map, includesReg.exec(key));
                logger.error('Recursive detected! Trying include `'+ iName.key +'` in `/' + iName.value + '.html` view');
                text = "";
                break;
            } else {

                if (linkToParentMap[mapValue]){
                    linkToParentMap[mapValue] = linkToParentMap[mapValue] + parentsDelimiter + parents;
                } else {
                    linkToParentMap[mapValue] = parents;
                }
                newParents = parents + parentsDelimiter + mapValue;

                preRepeats[key] = true;
                var processed = processIncludes(tpl, preRepeats, newParents);
                delete preRepeats[key];
                text = helper.replaceInText(text, key, processed);
            }
        }
        map = null;

        return text;
    }

    // just add template text to cached templates
    function compileTpl(id){
        if (!rawTemplates[id]) {
            // for dev only
            if (!extRawTemplates[id]){
                logger.error('trying to get not defined template', id);
            }
        }

        var compiledTpl;
        if (compiledTemplates[id]){
            logger.error('template "'+ id +'" already compiled');
        } else {
            var data = extRawTemplates[id] || rawTemplates[id];

            var startPreRepeats = {};
            startPreRepeats['{{include(' + id +')}}'] = true;

            compiledTpl = processIncludes(data, startPreRepeats, id);
            compiledTemplates[id] = compiledTpl;
        }

        return compiledTpl;
    }

})();
