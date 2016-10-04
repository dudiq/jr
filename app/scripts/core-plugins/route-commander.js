(function(){
    var app = window.app;
    var navi = app('navigation');
    var route = app('route');
    var helper = app('helper');
    var broadcast = app('broadcast');
    var routeEvs = broadcast.events('route');
    var naviEvs = broadcast.events('navigation');

    var rCmdEvs = broadcast.events('route-commander', {
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
        if (ev.keys.hasOwnProperty(key) && method){
            if (!pageId || (pageId && pageId.indexOf(alias) != -1)){
                var evValue = ev.keys[key];
                method(evValue);
            }
        }
    }

    function RouteCmdClass(params){
        var pageId = params.pageId;
        if (pageId && !helper.isArray(pageId)){
            pageId = [pageId];
        }

        var obj = this._obj = {
            pageId: pageId,
            value: params.value,
            key: params.key,
            onSets: params.onSets,
            onChanged: params.onChanged,
            onRemoved: params.onRemoved
        };

        this._onSetFn = function(ev){
            processRouteEv(ev, obj, 'onSets');
        };

        this._onChangedFn = function(ev){
            processRouteEv(ev, obj, 'onChanged');
        };

        this._onRemovedFn = function(ev){
            processRouteEv(ev, obj, 'onRemoved');
        };

        broadcast.on(rCmdEvs.onSets, this._onSetFn);
        broadcast.on(rCmdEvs.onChanged, this._onChangedFn);
        broadcast.on(rCmdEvs.onRemoved, this._onRemovedFn);

        params = null;
    }

    helper.extendClass(RouteCmdClass, {
        destroy: function () {
            this._obj && helper.clearObject(this._obj);
            this._obj = null;
            this._onSetFn && broadcast.off(rCmdEvs.onSets, this._onSetFn);
            this._onChangedFn && broadcast.off(rCmdEvs.onChanged, this._onChangedFn);
            this._onRemovedFn && broadcast.off(rCmdEvs.onRemoved, this._onRemovedFn);
        }
    });

    RouteCmdClass.createCommander = function (params) {
        return new RouteCmdClass(params);
    };

    RouteCmdClass.setKey = function(searchKey, newValue){
        setKey(searchKey, newValue);
    };

    RouteCmdClass.getKey = function(searchKey){
        var ret;
        processParams(function(key, value){
            if (searchKey == key){
                ret = value;
                return false;
            }
        });
        return ret;
    };

    RouteCmdClass.isExist = function(searchKey){
        var exist = false;
        processParams(function(key){
            if (searchKey == key){
                exist = true;
                return false;
            }
        });
        return exist;
    };

    RouteCmdClass.removeKey = function(searchKey){
        setKey(searchKey, null, true);
    };

    RouteCmdClass.getAll = function(){
        var ret = {};
        processParams(function(key, value){
            ret[key] = value;
        });
        return ret;
    };

    // set/remove key in path
    function setKey(searchKey, newValue, isDrop){
        var args = [];

        singleSetKey(args, searchKey, newValue, isDrop);

        var str = args.join('/');
        route.pushArgs(str);
    }

    // getting all chunks from path and processing it by callback
    function processParams(callback){
        var chunks = route.getSubKeys();
        var value;
        var key;
        var haveValue;
        for (var i = 0, l = chunks.length; i < l; i++){
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
        var keys = RouteCmdClass.getAll();
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
        var keys = RouteCmdClass.getAll();
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

    app('route-commander', RouteCmdClass);

})();
