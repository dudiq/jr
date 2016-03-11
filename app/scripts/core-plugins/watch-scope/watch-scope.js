/*
* watch scope is module for detect changes in object or DOM element and sync them
*
*
*
* how to use:
* ----
* var ws = app('watch-scope');
*
* var el = context.find(".container");
*
* var myObj = {myData: "test"};
*
*
* var inst = ws.watch(el, myObj);
*
*
* // when you need drop watch, just call. for cleanup
* inst.destroy();
*
*
* ----
*
*
* when defined DOM elements will changed, object keys will changed too and the same, when object changed, DOM elements will changed too
*
* */
(function(){
    var app = window.app;
    var logger = app('logger')('watch-scope');
    var helper = app('helper');
    var inherit = helper.inherit;
    var broadcast = app('broadcast');

    // own instance of broadcast for bind/unbind object prop changes
    var watchBro = broadcast.instance('Watch Scope');

    // defined watchers in DOM, for example "jr-watch='change(scopePath)'" as attr in element
    var watchers = {};

    var CONST_SYSTEM_KEY = '___system__cl___';

    var CONST_LINK = '___system_lk___';

    var useObserve = false;

    // storage of all watchers and external interface
    function watchScope(name, params){
        var ret;
        if (params){
            if (typeof params == "function"){
                // constructor
                ret = putToStorage(name, params);
            } else {
                var BaseClass = watchers['base'];
                var WatcherClass = helper.createClass(BaseClass, params);
                ret = putToStorage(name, WatcherClass);
            }
        } else {
            // getter
            ret = watchers[name];
        }
        return ret;
    }

    watchScope.CONST_LINK = CONST_LINK;

    function putToStorage(name, val){
        if (val){
            if (watchers[name]){
                logger.error('watcher "' + name + '" already exists.');
            } else {
                watchers[name] = val;
            }
        } else {
            val = watchers[name];
        }
        return val;
    }

    // storage for all scopes, for correct define different DOM elements for one scope
    var scopeStorage = {};

    function watchKeyChanges(obj, key, handler){
        var oldval = obj[key];
        var newval = oldval;

        function getter() {
            return newval;
        }

        function setter(val) {
            if (val !== oldval){
                newval = val;
                var params = {
                    val: val,
                    old: oldval
                };
                handler(params);
                oldval = val;
            }
        }

        Object.defineProperty(obj, key, {
            enumerable: true,
            configurable: true,
            get: getter,
            set: setter
        });
    }

    function checkArrayBug(){
        /* jshint ignore:start */
        var isChrome = /Chrome/.test(navigator.userAgent);
        var hasBug = false;
        if (isChrome){
            var major = 0;
            var matches = window.navigator.appVersion.match(/Chrome\/(.*?) /);
            if (matches){
                var versionStr = (matches[1]) + "";
                var version = versionStr.split('.');
                major = version[0];
            }
            if (major >= 37 && major <= 40){
                //need check
                var arr = [];

                function fillArray() {
                    for (var i = 0; i < 10; i++) {
                        var item = {
                            test: 'test'
                        };

                        if (arr[i]) {
                            hasBug = true;
                            break;
                        }

                        arr.push(item);

                        // watch to item change
                        watchKeyChanges(arr, i);
                    }
                }

                function clear () {

                    // drop watch to object item
                    for (var i = 0, l = arr.length; i < l; i++) {
                        unwatchKeyChanges(arr, i);
                    }

                    // clear array
                    while (arr.length > 0) {
                        arr.pop();
                    }

                }
                fillArray();
                clear();
                if (!hasBug){
                    fillArray();
                    clear();
                }
                if (!hasBug){
                    fillArray();
                    clear();
                }
            } else {
                // all is ok
            }
        }

        if (hasBug){
            logger.error('You are using broken version of Chrome browser, please update as soon as it possible');
            if (Object.observe) {
                useObserve = true;
                watchKeyChanges = function (obj, key, handler) {
                    // hack for CHROME 37
                    // http://stackoverflow.com/questions/25565237/defineproperty-to-array-item-on-chrome-browser
                    var cl = function (changes) {
                        for (var i = 0, l = changes.length; i < l; i++) {
                            var item = changes[i];
                            if (item.name === key) {
                                // console.log(key);
                                var params = {
                                    val: item.object[item.name],
                                    old: item.oldValue
                                };
                                handler(params);
                            }
                        }
                    };
                    Object.observe(obj, cl);
                    obj[CONST_SYSTEM_KEY] = cl;
                };
            }
        }
        /* jshint ignore:end */
    }

    checkArrayBug();

    // remove accessors
    function unwatchKeyChanges(obj, key){
        if (useObserve && Object.unobserve) {
            var cl = obj[CONST_SYSTEM_KEY];
            cl && Object.unobserve(obj, cl);
        }
        var val = obj[key];
        delete obj[key]; // remove accessors
        obj[key] = val;
    }

    function watchArray(arr, handler){
        //define array methods
    }

    function unwatchArray(arr){
        // drop defined array methods
    }

    // watch changes in object (scope) and call handler
    function watchObject(obj, key, handler){
        if (obj.hasOwnProperty(key)){
            var oldval = obj[key];
            if (oldval instanceof Array){
                // array variable
                watchArray(oldval, handler);
            } else {
                // simple variable
                watchKeyChanges(obj, key, handler);
            }
        }
    }

    // drop watch to object (scope)
    function unwatchObject(obj, path){
        var prop = findObjectByPath(obj, path);
        if (prop){
            if (prop.obj.hasOwnProperty(prop.key)){
                var val = prop.obj[prop.key];
                if (val instanceof Array){
                    unwatchArray(val);
                } else {
                    unwatchKeyChanges(prop.obj, prop.key);
                }
            }
        }
    }

    // get object and key for manipulate
    //
    // scope - root object
    // path - path to needed object
    //
    // returns last object with one key.
    // for example:
    // scope = {t: {a : 10}},
    // this method returns res = {obj: scope.t, key: "a"}
    // for manupulate object you can use res.obj[res.key] = "newValue";
    function findObjectByPath(scope, path){
        var portions = path.split('.');
        var currObj = scope;
        for (var i = 0, l = portions.length - 1; i < l; i++){
            var key = portions[i];
            currObj = currObj[key];
        }
        var lastKey = portions[l];

        var ret = {
            obj: currObj,
            key: lastKey
        };

        if (!ret.obj || ret.key === undefined){
            ret = null;
        }
        return ret;
    }

    // return scope by link from storage
    function getStoreItem(scope){
        var ret = false;
        if (scope[CONST_LINK]){
            ret = scope[CONST_LINK];
        }
        return ret;
    }

    // return broadcast
    watchScope.broadcast = function(){
        return watchBro;
    };

    // external method for watch to scope
    //
    // el - DOM element for process scopes
    // scope - link to scope
    //
    // return instance of watch scope
    watchScope.watch = function(el, scope, callback){
        var item = getStoreItem(scope);
        if (!item){
            var guid = helper.guid();
            item = scopeStorage[guid] = {
                guid: guid,
                scope: scope,
                pathHandlers: {},
                pWatchers: []
            };
            scope[CONST_LINK] = item;
        }
        var ParentClass = watchScope('parent');
        var inst = new ParentClass(el, item, callback);
        item.pWatchers.push(inst);
        return inst;
    };

    // drop watch instance from scope
    function unwatchInst(scope, watchInst){
        var item = getStoreItem(scope);
        var pos = item.pWatchers.indexOf(watchInst);
        if (pos != -1){
            item.pWatchers.splice(pos, 1);
        }
        if (item.pWatchers.length == 0){
            var pathHandlers = item.pathHandlers;
            for (var key in pathHandlers) {
                unwatchObject(item.scope, key);
            }
            item.pathHandlers = null;
            item.pWatchers = null;
            item.scope && (item.scope[CONST_LINK] = null);
            item.scope = null;
            var guid = item.guid;
            item.guid = null;
            item = null;

            scopeStorage[guid] = null;
            delete scopeStorage[guid];

            guid = null;
        }
    }


    watchScope._findObjectByPath = findObjectByPath;
    watchScope._watchObject = watchObject;
    watchScope._unwatchInst = unwatchInst;
    watchScope._watchKeyChanges = watchKeyChanges;
    watchScope._unwatchKeyChanges = unwatchKeyChanges;

    // old way
    app('watch-scope', watchScope);

    // new way
    app('scope', function(el, scope, cb){
        return watchScope.watch(el, scope, cb);
    });

})();