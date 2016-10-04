/*
* templater module for processing templates, translate and give it to other modules
*
* */
(function(){
    var app = window.app;
    var translate = app('translate');
    var logger = app('logger')('templater');

    var templater = app('templater', {});

    translate._start();

    var templates = {};
    var buffed = {};

    var includesReg = new RegExp("\{\{include\(.*?\)\}\}", "ig");

    // just replace 'template' string by keys in 'data' object
    function replaceData(template, data){
        if (template !== undefined && template !== null){
            for (var key in data){
                template = template.replaceAll(key, data[key]);
            }
        } else {
            logger.error('trying to replace of undefined template, do you really have template?');
        }
        return template;
    }

    function getIncludeNames(regVal){
        var key = regVal[0];
        var subVal = regVal[1];
        var value = subVal.substring(1, subVal.length-1);
        return {
            key: key,
            value: value
        };
    }

    // find {{include(view)}} and getting as object
    // return object like this {'{{include(some-view}}}': 'view text'}
    function findIncludes(text){
        var map = {};
        var result;
        includesReg.lastIndex = 0;
        while((result = includesReg.exec(text)) !== null) {
            var iName = getIncludeNames(result);
            map[iName.key] = iName.value;
        }
        return map;
    }

    // use this '/' for include files, don't use '\' for include in views
    // processing {{includes()}} in text
    function processIncludes(text, preRepeats){
        var map = findIncludes(text);

        for (var key in map){
            var mapItem = map[key];
            var tpl = templater.get(mapItem);
            if (preRepeats.indexOf(key) != -1){
//                recursive include!!!
                includesReg.lastIndex = 0;
                var iName = getIncludeNames(includesReg.exec(key));
                map[iName.key] = iName.value;

                logger.error('Recursive detected! Trying include `'+ iName.key +'` in `/' + iName.value + '.html` view');
                text = "";
                break;
            } else {
                preRepeats.push(key);
                var processed = processIncludes(tpl, preRepeats);
                preRepeats.pop();
                var obj = {};
                obj[key] = processed;
                text = replaceData(text, obj);
            }
        }

        return text;
    }

    // translate template by defined words in translate module
    templater.translate = function(template){
        var translateWords = translate._words();
        var newTpl = replaceData(template, translateWords);
        return newTpl;
    };

    // processing content
    // id - page id
    // data - hash array for replace
    templater.process = function(id, data){
        var template = templates[id];
        if (template && data){
            template = replaceData(template, data);
        }
        return template;
    };

    // get views by id and process data, if needed
    // in dev, calling sync request for getting html content
    // in prod version, all views defined in templater-data.js, when client was builded
    //
    // id - template id
    // processData - data for process
    templater.get = function(id, processData){
        var template = templates[id];
        if (!template) {
            if (buffed[id]){
                template = addTemplate(id, buffed[id]);
            } else {
                $.ajax({
                    cache: false,
                    async: false,
                    url: '/views/' + id + '.html',
                    success: function (data) {
                        template = addTemplate(id, data);
                    }
                });
            }
        }
        template = this.process(id, processData);
        return template;
    };

    // set template by id
    //
    // id - template id
    // data - template content
    templater.set = function(id, data){
        if (typeof id == "object" && !data){
            for (var key in id){
                buffed[key] = id[key];
            }
        } else {
            if (id){
                buffed[id] = data;
            }
        }
    };

    // just add template text to cached templates
    function addTemplate(id, data){
        var template;
        if (templates[id]){
            logger.warning('template "'+ id +'" already defined');
        } else {
            // templates[id] = data;
            template = processIncludes(data, getDefaultInclude(id));
            templates[id] = template;
        }

        return template;
    }

    function getDefaultInclude(id){
        return ['{{include(' + id +')}}'];
    }


})();
