/*
 * this module for check config items and unset them if some actions are not valid
 * */
(function(app){
    var helper = app('helper');
    var config = app('app-config');
    var mixinConfig = app('app-config-mixin');
    var broadcast = app('broadcast');
    var processConfig = app('process-my-config');
    var configProcessingEvs = broadcast.events('config-processing', {
        configChanged: 'cc'
    });

    var additionalKeys;

    function extendObject(toObj, fromObj){
        for (var key in fromObj){
            if (fromObj.hasOwnProperty(key)){
                if (toObj[key] === undefined){
                    toObj[key] = fromObj[key];
                } else {
                    var type = typeof fromObj[key];
                    if (type == 'array' || type == 'object'){
                        extendObject(toObj[key], fromObj[key]);
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
    extendObject(config, mixinConfig);
    processConfig(); // set default keys, states and groups in config

    var startStateConfig = helper.clone(config);

    function useConfig(newKeys){
        var addKeys = helper.clone(newKeys);

        helper.clearObject(config);

        var clonedStartState = helper.clone(startStateConfig);
        extendObject(config, clonedStartState);

        extendObject(config, addKeys);
        additionalKeys = addKeys;
        processConfig();
        // useNew will be deprecated
        broadcast.trig(configProcessingEvs.configChanged);
    }

    helper.mixinClass(useConfig, {
        onChanged: function (cb) {
            broadcast.on(configProcessingEvs.configChanged, cb);
        },
        hasAdditionalKeys: function () {
            var ret = helper.isEmpty(additionalKeys);
            return ret;
        }
    });

    app('use-my-config', useConfig);
})(window.app);
