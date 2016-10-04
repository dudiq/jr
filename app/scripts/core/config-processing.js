/*
 * this module for check config items and unset them if some actions are not valid
 * */
(function(){
    var app = window.app;
    var helper = app('helper');
    var config = app('app-config');
    var mixinConfig = app('app-config-mixin');
    var broadcast = app('broadcast');
    var processConfig = app('process-my-config');
    var configProcessingEvs = broadcast.events('config-processing', {
        _configChanged: 'cc'
    });

    var subKeysConfig;

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

    // prepare normal config, defined in scripts
    // we have two parts. config.js and mixin-config.js
    // and just need to mix them into one
    mixConfigs(mixinConfig, config);
    processConfig(); // set default keys, states and groups in config
    var firstStateConfig = helper.clone(config);

    function useConfig(subKeys){
        subKeys = helper.clone(subKeys);

        var oldKeys = helper.clone(firstStateConfig);
        for (var key in config){
            delete config[key];
        }

        mixConfigs(oldKeys, config);
        mixConfigs(mixinConfig, config);

        mixConfigs(subKeys, config);
        subKeysConfig = subKeys;
        processConfig();
        // useNew will be deprecated
        broadcast.trig(configProcessingEvs._configChanged);
    }
    
    helper.mixinClass(useConfig, {
        onChanged: function (cb) {
            broadcast.on(configProcessingEvs._configChanged, cb);
        },
        getSubKeys: function () {
            return subKeysConfig;
        }
    });

    app('use-my-config', useConfig);
})();