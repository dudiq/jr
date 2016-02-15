/*
 * this module for check config items and unset them if some actions are not valid
 * */
(function(){
    var app = window.app;
    var helper = app('helper');
    var config = app('app-config');
    var mixinConfig = app('app-config-mixin');
    var broadcast = app('broadcast');
    var ls = app('local-storage');
    var processConfig = app('process-my-config');
    var configProcessingEvs = broadcast.putEvents('config-processing', {
        _configChanged: 'cc'
    });

    var SAVED_CONF = 'scc';
    var DEF_NAME = 'def';

    var oldConfig = helper.clone(config);

    function mixConfigs(fromObj, toObj){
        for (var key in fromObj){
            if (fromObj.hasOwnProperty(key)){
                if (toObj[key] === undefined){
                    toObj[key] = fromObj[key];
                } else {
                    var type = typeof fromObj[key];
                    if (type == 'array' || type == 'object'){
                        mixConfigs(fromObj[key], toObj[key]);
                    } else {
                        toObj[key] = fromObj[key];
                    }
                }
            }
        }
    }

    mixConfigs(mixinConfig, config);

    var subKeysConfig = getFromLs();
    !helper.isEmpty(subKeysConfig) && mixConfigs(subKeysConfig, config);
    processConfig();

    var waits = [];
    var onDoneWaits;
    function createWaiter(){
        var pos = waits.length;
        var f = function(){
            waits[pos] = false;
            checkWaits();
        };
        waits.push(true);
        return f;
    }
    function setOnDone(cb){
        onDoneWaits = cb;
    }

    function checkWaits(){
        var isDone = true;
        for (var i = 0, l = waits.length; i < l; i++){
            if (waits[i] !== false){
                isDone = false;
                break;
            }
        }
        if (isDone){
            waits.clear();
            onDoneWaits && onDoneWaits();
        }
    }

    function saveToLs(subKeys, params){
        var name = params.name || DEF_NAME;
        var obj = {};
        obj[name] = subKeys;
        ls(SAVED_CONF, obj);
    }

    function getFromLs(){
        var ret;
        var data = ls(SAVED_CONF);
        if (data && data[DEF_NAME]){
            ret = data[DEF_NAME];
        }
        ret = ret || {};
        return ret;
    }

    //helper.deepFreeze(config);
    function useConfig(subKeys, params, onDone){
        if (typeof params == "function"){
            onDone = params;
            params = {};
        }
        if (!params){
            params = {};
        }
        saveToLs(subKeys, params);
        var oldKeys = helper.clone(oldConfig);
        for (var key in config){
            delete config[key];
        }

        mixConfigs(oldKeys, config);
        mixConfigs(mixinConfig, config);

        mixConfigs(subKeys, config);
        subKeysConfig = subKeys;
        processConfig();
        broadcast.trig(configProcessingEvs._configChanged, {useNew: true});
        setOnDone(onDone);
        checkWaits();
    }

    useConfig.on = function(cb){
        broadcast.on(configProcessingEvs._configChanged, cb);
    };

    useConfig.getSubKeys = function(){
        return subKeysConfig;
    };

    useConfig.await = function(){
        return createWaiter();
    };

    app('use-my-config', useConfig);


    helper.onStart(function(){
        broadcast.trig(configProcessingEvs._configChanged, {});
    });

})();