/**
* This is javascript framework to create simple Single Page Applications
*  and this is main file for define all modules, submodules and deeper
**/

(function(){

    function logError(msg){
        window['console'] && window['console'].error('Jr error: ' + msg);
    }

    // checking empty object
    function isEmptyObject( obj ) {
        for (var name in obj ) {
            return false;
        }
        return true;
    }

    // list of already defined modules and own callbacks for correct process onModuleDefined method
    var appDefinedModsCalls = {};

    function onModDefined(parent, modName, mod){
        var coll = appDefinedModsCalls[modName];
        if (coll && coll.length){
            for (var i = 0, l = coll.length; i < l; i++){
                var item = coll[i];
                if (item.parent == parent){
                    item.callback(mod);
                    item.parent = null;
                    item.callback = null;
                }
                item = coll[i] = null;
            }

            // cleanup
            for (var j = coll.length - 1; j >= 0; j--){
                if (!coll[j]){
                    coll.splice(1, i);
                }
            }
            if (coll.length == 0){
                delete appDefinedModsCalls[modName];
            }
        }
    }

    // base class for all modules
    function Mod(){

        //defined components in module instance
        var components = {};

        function moduleC(name, component, params){
            //set/get components
            if (typeof name == "string"){
                if (component !== undefined){
                    if (components[name] !== undefined){
                        logError('component "' + name + '" is already defined. terminating...');
                        return;
                    }

                    //defining new component is here
                    var newComp = (typeof component == "function")
                        ? component
                        : (isEmptyObject(component))
                            ? new Mod()
                            : component;

                    components[name] = newComp;
                    onModDefined(moduleC, name, newComp);
                }
                if (name && !components[name]){
                    if (params && params.silent){
                        // do nothing
                    } else {
                        logError('component "' + name + '" is not defined...');
                    }
                    return;
                }

                return components[name];
            }
        }

        return moduleC;
    }

    // all is module
    var app = new Mod();

    // special define callback for resolve dependencies
    // callback will be called before system start. calls when module defined in MOD collection
    app.onModuleDefined = function(parent, name, callback){
        if (typeof parent == 'string'){
            callback = name;
            name = parent;
            parent = app;
        }
        if (name.indexOf('/') != -1){
            // recursive search
            var mods = name.split('/');
            var firstName = mods[0];
            mods.splice(0, 1);
            var ns = mods.join('/');
            app.onModuleDefined(parent, firstName, function(mod){
                app.onModuleDefined(mod, ns, callback);
            });
        } else {
            var definedMod = parent(name, undefined, {silent: true});
            if (definedMod){
                // mod defined
                callback(definedMod);
            } else {
                var item = {
                    parent: parent,
                    callback: callback
                };

                var coll = appDefinedModsCalls[name] = appDefinedModsCalls[name] || [];
                coll.push(item);
            }
        }
    };


    window.app = app;
})();
