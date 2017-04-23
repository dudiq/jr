/*
* browser-storage module
* how to use:
*
* var ls = app('local-storage'); // or ss = app('session-storage');
* ls('myKey', 'myWord'); - set single key
* ls.removeKey('myKey); - remove single key
* ls.clear(); - remove all keys
* ls.setPrefix(); - set prefix to this plugin localStorage keys
* ls.map(cb, opt) - walk in stored keys
*
* ... somewhere in far far code ...
*
* ls('myKey') // return 'myWord'
*
* */
(function(){
    var app = window.app;
    var logger = app('logger')('browser-storage');

    var eventStorageList = [];

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
                            logger.error('onStorage event try{}catch{}', item.name, e);
                        }
                    }

                    var storeEv = {
                        key: viewKey,
                        newValue: newValue
                    };
                    item.process(storeEv);
                }
            }
        }
    }

    if (window.addEventListener) {
        window.addEventListener('storage', onStorage, false);
    } else if (window.attachEvent) {
        window.attachEvent('onstorage', onStorage);
    } else {
        window.onstorage = onStorage;
    }

    function makeStorage(nameInApp, nameInWindow) {
        var currentStorage = window[nameInWindow];
        var logger = app('logger')(nameInApp);

        // prefix for separate items in storage from others
        var PREFIX = app.prefix;

        var customPrefix = PREFIX;

        var storageInst = app(nameInApp, function(key, value){

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
                } catch(e){
                    // quota limit exceed
                    ret = null;
                    logger.error('quota limit exceed',e);
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
                    logger.error(e);
                }
                //getter
            }
            return ret;
        });

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

        addEvents(nameInApp, storageInst, currentStorage);

        return storageInst;
    }

    function addEvents(nameInApp, storageInst, currentStorage) {
        var evCbs = [];
        var evObj = {
            name: nameInApp,
            process: function (ev) {
                for (var i = 0, l = evCbs.length; i < l; i++){
                    evCbs[i](ev);
                }
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

    makeStorage('local-storage', 'localStorage');
    makeStorage('session-storage', 'sessionStorage');

    app('browser-storage-maker', makeStorage);

})();
