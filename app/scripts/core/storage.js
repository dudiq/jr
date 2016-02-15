/*
* storage, it's just storage for store some data and set/get from one module to other
*
* it's not localStorage!
* */
(function(){
    var app = window.app;
    var storage = app('storage', {});

    var data = {};

    storage.set = function(key, value){
        data[key] = value;
        return data[key];
    };

    storage.get = function(key){
        return data[key];
    };

    storage.remove = function(key){
        data[key] = null;
        delete data[key];
    };

})();