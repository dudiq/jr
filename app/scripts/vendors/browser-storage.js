/*
* browser-storage module
*
* how to use:
* var myLocalStorage = JrMakeStorage('prefix', 'local-storage', window.localStorage);
* var mySessionStorage = JrMakeStorage('prefix', 'session-storage', window.sessionStorage);
* myLocalStorage('myKey', 'myWord'); - set single key
* myLocalStorage.remove('myKey); - remove single key
* myLocalStorage.clear(); - remove all keys
* myLocalStorage.setPrefix(); - set prefix to this plugin localStorage keys
* myLocalStorage.map(cb, opt) - walk in stored keys
*
* ... somewhere in far far code ...
*
* myLocalStorage('myKey') // return 'myWord'
*
* licence: MIT, dudiq 2017
*
* */

(function(){
    var canUseConsole = (typeof console == 'object');
    var PREFIX = 'bs';
    var glob = (typeof window !== 'undefined') ? window : {};

    function onError() {
        var list = Array.prototype.slice.apply(arguments);
        list.splice(0, 0, '#browser-storage:');
        canUseConsole && console.error.apply(console, list);
    }

    var eventStorageList = [];

    var EVENT_TAB = 'event-tab';
    var EVENT_STORAGE = 'event-storage';

    function onStorage(ev) {
        for (var i = 0, l = eventStorageList.length; i < l; i++){
            var item = eventStorageList[i];
            if (item.storageArea === ev.storageArea){
                var prefix = item.store.getPrefix();
                var key = ev.key;
                if (key && key.indexOf(prefix) == 0){
                    // all good
                    var viewKey = key.substring(prefix.length);

                    var newValue = ev.newValue;
                    if (newValue){
                        try {
                            var getVal = JSON.parse(newValue);
                            if (getVal){
                                newValue = getVal.val;
                            } else {
                                newValue = null;
                            }
                            getVal = null;
                        } catch(e){
                            newValue = null;
                            onError('#' + 'onStorage event try{}catch{}', item.name, e);
                        }
                    }

                    var storeEv = makeEv(key, newValue, EVENT_STORAGE);
                    item.process(storeEv);
                }
            }
        }
    }

    if (glob.addEventListener) {
        glob.addEventListener('storage', onStorage, false);
    } else if (glob.attachEvent) {
        glob.attachEvent('onstorage', onStorage);
    } else {
        glob.onstorage = onStorage;
    }

    function getStorage(store) {
        if (!store){
            store = {
                setItem: function () {
                    //cap
                },
                getItem: function () {
                    //cap
                },
                removeItem: function () {
                    //cap
                },
                clear: function () {
                    //cap
                }
            }
        }
        return store;
    }

    function makeStorage(prefix, storeName, store) {
        var customPrefix = prefix;
        var evCbs = [];
        var currentStorage = getStorage(store);

        function storageInst(key, value){

            var ret;
            if (value !== undefined){
                //setter
                // for each item creating new object with some params.
                var pattObj = {
                    val: null,
                    time: (new Date()).getTime()
                };
                pattObj.val = value;
                try {
                    var setVal = JSON.stringify(pattObj);
                    currentStorage.setItem(customPrefix + key, setVal);
                    ret = value;
                    var storeEv = makeEv(key, value, EVENT_TAB);
                    trigger(evCbs, storeEv);
                } catch(e){
                    // quota limit exceed
                    ret = null;
                    onError('#' + storeName, 'quota limit exceed',e);
                }
                delete pattObj.val;
                delete pattObj.time;
                pattObj = null;
            } else {
                try {
                    var storedVal = currentStorage.getItem(customPrefix + key);
                    var getVal = JSON.parse(storedVal);
                    if (getVal){
                        ret = getVal.val;
                    } else {
                        ret = null;
                    }
                    getVal = null;
                } catch(e){
                    ret = null;
                    onError('#' + storeName, e);
                }
                //getter
            }
            return ret;
        }

        storageInst.remove = function(key){
            var ret = true;
            try {
                currentStorage.removeItem(customPrefix + key);
                ret = true;
            } catch(e){
                ret = false;
            }
            return ret;
        };

        storageInst.clear = function(){
            currentStorage.clear();
        };

        // define custom prefix for separated items
        // prefix must be NOT empty string
        storageInst.setPrefix = function(newPrefix){
            if (typeof newPrefix == "string"){
                customPrefix = !newPrefix ? PREFIX : newPrefix;
            }
        };

        storageInst.getPrefix = function () {
            return customPrefix;
        };

        // walk in all fields in local storage
        storageInst.map = function(callback, opt){
            opt = opt || {};
            var getValue = opt.getValue;
            var prefixLen = customPrefix ? customPrefix.length : 0;
            for (var key in currentStorage){
                if (currentStorage.hasOwnProperty(key)){
                    var subKey = key;
                    if (prefixLen && key.indexOf(customPrefix) == 0){
                        subKey = key.substring(prefixLen);
                    }

                    var val = getValue ? currentStorage[key] : undefined;
                    var ret = callback(subKey, val);
                    if (ret === false){
                        break;
                    }
                }
            }
            opt = null;
        };

        addEvents(storeName, storageInst, currentStorage, evCbs);

        storageInst.EVENT_TAB = EVENT_TAB;
        storageInst.EVENT_STORAGE = EVENT_STORAGE;

        return storageInst;
    }

    function addEvents(storeName, storageInst, currentStorage, evCbs) {
        var evObj = {
            name: storeName,
            process: function (ev) {
                trigger(evCbs, ev);
            },
            store: storageInst,
            storageArea: currentStorage
        };
        storageInst.on = function (cb) {
            evCbs.push(cb);
        };
        storageInst.off = function (cb) {
            var pos = evCbs.indexOf(cb);
            if (pos != -1){
                evCbs.splice(pos, 1);
            }
        };
        eventStorageList.push(evObj);
    }

    function trigger(evCbs, ev) {
        for (var i = 0, l = evCbs.length; i < l; i++){
            evCbs[i](ev);
        }
    }

    function makeEv(key, newValue, type) {
        return {
            key: key,
            newValue: newValue,
            type: type
        }
    }


    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = makeStorage;
    } else {
        if (typeof define === 'function' && define.amd) {
            define([], function() {
                return makeStorage;
            });
        }
        else {
            glob.JrMakeStorage = makeStorage;
        }
    }

})();
