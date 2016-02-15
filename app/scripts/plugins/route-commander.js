(function(){
    var app = window.app;
    var navi = app('navigation');
    var route = app('route');
    var helper = app('helper');
    var broadcast = app('broadcast');
    var routeEvs = broadcast.getEvents('route');
    var naviEvs = broadcast.getEvents('navigation');

    var rCmdEvs = broadcast.putEvents('route-commander', {
        onRemoved: 'removed',
        onSets: 'sets',
        onChanged: 'changed'
    });

    var activeKeys = {};
    var currentAlias;

    function processRouteEv(ev, params, methodName){
        var key = params.key;
        var alias = ev.alias;
        var method = params[methodName];
        var pageId = params.pageId;
        if (ev.keys.hasOwnProperty(key) && method && pageId.indexOf(alias) != -1){
            var evValue = ev.keys[key];
            method(evValue);
        }
    }

    var rCmd = function(params){
        var pageId = params.pageId;
        if (!helper.isArray(pageId)){
            pageId = [pageId];
        }

        var obj = {
            pageId: pageId,
            value: params.value,
            key: params.key,
            onSets: params.onSets,
            onChanged: params.onChanged,
            onRemoved: params.onRemoved
        };

        broadcast.on(rCmdEvs.onSets, function(ev){
            processRouteEv(ev, obj, 'onSets');
        });
        broadcast.on(rCmdEvs.onChanged, function(ev){
            processRouteEv(ev, obj, 'onChanged');
        });
        broadcast.on(rCmdEvs.onRemoved, function(ev){
            processRouteEv(ev, obj, 'onRemoved');
        });
    };


    rCmd.setKey = function(searchKey, newValue){
        setKey(searchKey, newValue);
    };

    rCmd.getKey = function(searchKey){
        var ret;
        processParams(function(key, value){
            if (searchKey == key){
                ret = value;
                return false;
            }
        });
        return ret;
    };

    rCmd.isExist = function(searchKey){
        var exist = false;
        processParams(function(key){
            if (searchKey == key){
                exist = true;
                return false;
            }
        });
        return exist;
    };

    rCmd.removeKey = function(searchKey){
        setKey(searchKey, null, true);
    };

    rCmd.getAll = function(){
        var ret = {};
        processParams(function(key, value){
            ret[key] = value;
        });
        return ret;
    };

    // set/remove key in path
    function setKey(searchKey, newValue, isDrop){
        var pageAlias = navi.getCurrentPage().alias;
        var args = [pageAlias];

        singleSetKey(args, searchKey, newValue, isDrop);

        var str = args.join('/');
        route.pushState(str);
    }

    // getting all chunks from path and processing it by callback
    function processParams(callback){
        var chunks = route.getAddressParams();
        var value;
        var key;
        var haveValue;
        for (var i = 1, l = chunks.length; i < l; i++){
            var chunk = chunks[i];
            var item = chunk.split("=");
            key = item[0];
            value = item[1];
            haveValue = (item.length == 2);
            item.clear();
            item = null;
            if (callback(key, value, haveValue) === false){
                break;
            }
        }
        chunks = null;
        value = null;
        key = null;
        haveValue = null;
    }

    function singleSetKey(args, searchKey, newValue, isDrop){
        //var founded = false;
        if (typeof searchKey != "object"){
            var tmp = {};
            tmp[searchKey] = newValue;
            searchKey = tmp;
        }
        var founded = {};
        processParams(function(key, value, haveValue){
            if (isDrop && (searchKey.hasOwnProperty(key))){
                // remove key here
                founded[key] = true;
                //founded = true;
            } else {
                var str = key;
                // default action to process string
                if (searchKey.hasOwnProperty(key)){
                    founded[key] = true;
                    //founded = true;
                    value = searchKey[key];
                    haveValue = true;
                }
                if (haveValue){
                    str += "=" + value;
                }
                // str must be like "myKey=myValue" or just "myKey" without value
                args.push(str);
            }
        });
        if (!isDrop){
            // add new value, if not defined in string
            for (var key in searchKey){
                if (founded[key] !== true){
                    args.push(key + "=" + searchKey[key]);
                }
                delete founded[key];
            }
        }
        founded = null;
    }

    function onRouteChanged(){
        var keys = rCmd.getAll();
        var changed = {};
        var sets = {};


        for (var key in keys){
            var val = keys[key];
            if (activeKeys.hasOwnProperty(key)){
                if (activeKeys[key] !== keys[key]){
                    activeKeys[key] = changed[key] = val;
                }
            } else {
                activeKeys[key] = sets[key] = val;
            }
        }

        var removed = {};
        for (var key in activeKeys){
            if (!keys.hasOwnProperty(key)){
                delete activeKeys[key];
                removed[key] = true;
            }
        }

        triggerRemoved(removed);
        triggerSet(sets);

        if (!helper.isEmpty(changed)){
            broadcast.trig(rCmdEvs.onChanged, {
                alias: currentAlias,
                keys: changed
            });
        }
    }

    function startProcessingKeys(){
        var keys = rCmd.getAll();
        for (var key in keys){
            activeKeys[key] = keys[key];
        }
        triggerSet(activeKeys);
    }

    function triggerSet(map){
        if (!helper.isEmpty(map)) {
            broadcast.trig(rCmdEvs.onSets, {
                alias: currentAlias,
                keys: map
            });
        }
    }

    function triggerRemoved(map){
        if (!helper.isEmpty(map)) {
            broadcast.trig(rCmdEvs.onRemoved, {
                alias: currentAlias,
                keys: map
            });
        }
    }

    function dropActiveKeys(){
        var map = {};
        for (var key in activeKeys){
            delete activeKeys[key];
            map[key] = true;
        }
        triggerRemoved(map);
    }

    // processing start app
    function onStart(){
        // cleanup(drop) prev commands if page will be changed
        broadcast.on(naviEvs.onChanged, function(ev){
            // drop all set keys
            dropActiveKeys();
            currentAlias = ev.nextId;
            startProcessingKeys();
        });


        // set new commands for new page
        broadcast.on(routeEvs.changed, onRouteChanged);

    }


    helper.onStart(function(){
        onStart();
    });

    app('route-commander', rCmd);

})();