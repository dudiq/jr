/*
* adapter for store some data in phonegap and store in cookies if standart browser
* */
(function(){
    var app = window.app;

    var ls = app('local-storage');
    var cookie = app('cookie');
    var helper = app('helper');

    var isNative = helper.isNative;

    var store, getting, remove;

    if (isNative){
        //using localstorage
        store = getting = ls;
        remove = function(key){
            return ls.remove(key);
        };
    } else {
        //using cookies
        store = function(key, value){
            cookie.set(key, value, {json: true, expires: Infinity, path: "/"});
        };
        getting = function(key){
            return cookie.get(key, {json: true});
        };
        remove = function(key){
            cookie.remove(key, {path: "/"});
        };
    }

    var sbook = app('local-cookie', function(key, val){
        (val !== undefined) && store(key, val);
        return getting(key);
    });

    sbook.remove = function(key){
        remove(key);
    };

})();