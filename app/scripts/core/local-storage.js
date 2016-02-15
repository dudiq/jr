/*
* local-storage module
* how to use:
*
* var ls = app('local-storage');
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
    var localStorage = window.localStorage;

    // prefix for separate items in storage
    var PREFIX = "jr-";

    var customPrefix = PREFIX;

    var ls = app('local-storage', function(key, value){

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
                localStorage.setItem(customPrefix + key, setVal);
                ret = value;
            } catch(e){
                ret = null;
            }
            delete pattObj.val;
            delete pattObj.time;
            pattObj = null;
        } else {
            try {
                var getVal = JSON.parse(localStorage.getItem(customPrefix + key));
                ret = getVal.val;
                getVal = null;
            } catch(e){
                ret = null;
            }
            //getter
        }
        return ret;
    });

    ls.remove = function(key){
        var ret = true;
        try {
            var getVal = localStorage.removeItem(customPrefix + key);
            getVal = null;
            ret = true;
        } catch(e){
            ret = false;
        }
        return ret;
    };

    ls.clear = function(){
        localStorage.clear();
    };

    // define custom prefix for separated items
    // prefix must be NOT empty string
    ls.setPrefix = function(newPrefix){
        if (typeof newPrefix == "string"){
            customPrefix = !newPrefix ? PREFIX : newPrefix;
        }
    };

    // walk in all fields in local storage
    ls.map = function(callback, opt){
        opt = opt || {};
        var getValue = opt.getValue;
        var prefixLen = customPrefix ? customPrefix.length : 0;
        for (var key in localStorage){
            if (localStorage.hasOwnProperty(key)){
                var subKey = key;
                if (prefixLen && key.indexOf(customPrefix) == 0){
                    subKey = key.substring(prefixLen);
                }

                var val = getValue ? localStorage[key] : undefined;
                var ret = callback(subKey, val);
                if (ret === false){
                    break;
                }
            }
        }
        opt = null;
    };

})();