/**
 * module for correct resolve define collisions in index.html structure
 *
 * using:
 *
 * var modReq = app('mod-require');
 * modReq('mymod', 'helper/overflow', 'myMod/mySubMod', function(myMod, oveflow, subMod){
 *
 *  });
 *
 *
 **/
(function(){
    var app = window.app;
    var helper = app('helper');

    app('mod-require', modRequire);

    function isMapFilled(map){
        var defined = true;
        for (var key in map){
            if (!map[key]){
                defined = false;
                break;
            }
        }
        return defined;
    }

    function getModsMap(mods, map){
        var returnMap = [];
        for (var i = 0, l = mods.length; i < l; i++){
            var pos = mods[i];
            returnMap.push(map[pos]);
        }
        return returnMap;
    }

    function modRequire(){
        var args = helper.getArgs(arguments);
        var callback = args.pop();
        var mods = args;
        var map = {};

        for (var i = 0, l = mods.length; i < l; i++) {
            var item = mods[i];
            map[item] = false;
        }

        for (var i = 0, l = mods.length; i < l; i++){
            var item = mods[i];
            (function(item){
                app.onModuleDefined(item, function(mod){
                    map[item] = mod;
                    if (isMapFilled(map)){
                        var reqMods = getModsMap(mods, map);
                        callback.apply(this, reqMods);
                        map = null;
                        mods.clear();
                        mods = null;
                        reqMods.clear();
                        reqMods = null;
                        callback = null;
                    }
                });
            })(item);
        }
    }



})();