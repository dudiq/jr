/*
* base class for child watcher (binds)
*
* */
(function(){
    var app = window.app;
    var watchScope = app('watch-scope');
    var watchBro = watchScope.broadcast();

    var findObjectByPath = watchScope._findObjectByPath;

    // constructor
    function BaseWatcherClass(params){
        this.parent = params.parent;
        this.el = params.el;
        this.path = params.path;
        this.scope = params.scope;
        this.message = params.message;
        this.subData = params.subData;

        // when set value from DOM don't need set to object and when from object sets, don't need to set to DOM
        this.stopSet = false;

        params = null;
        this.init();
    }

    var p = BaseWatcherClass.prototype;

    // default init
    p.init = function(){

        //define initial value (first)
        var value = this.getPropValue();
        this.setVal(value);

        // bind object changes
        this.bindObjectChanges();
    };

    // set value to DOM element
    p.setVal = function(value){
        // defined in each instance of watcher
    };

    // bind object changes
    p.bindObjectChanges = function(callback){
        // handler for detect object changes
        var self = this;
        this.objectCallback = function(data){
            if (!self.stopSet){
                self.stopSet = true;

                // if callback defined, use callback for setVal call
                // else just setVal
                callback
                    ? callback(data)
                    : self.setVal(data.val);

                self.stopSet = false;
            }
        };

        // listen broadcast to call setVal
        watchBro.on(this.message, this.objectCallback);
    };

    p.bindGroup = function(groupName, callback){
        this.groupMessage = "groupmsg#" + groupName;
        this.groupCallback = callback;
        watchBro.on(this.groupMessage, callback);
    };

    p.triggerGroup = function(param){
        watchBro.trig(this.groupMessage, param);
    };

    // bind defined events to DOM element
    //
    // evs - array of events to bind, for example ["mousedown", "mouseup"]
    // callback - handler returned new value
    p.bindElementChanges = function(evs, callback){
        var self = this;
        this._binded = true;
        this.el.on(this.getEventMessage(evs), function(){
            if (!self.stopSet){
                self.stopSet = true;
                var oldVal = self.getPropValue();
                var newVal = callback(oldVal);

                if (oldVal !== newVal){
                    self.setPropValue(newVal);
                }
                self.stopSet = false;
            }
        });
    };

    // link to find object
    p.findObjectByPath = function(scope, path){
        return findObjectByPath(scope, path);
    };

    // set value to object
    p.setPropValue = function(val){
        var prop = this.findObjectByPath(this.scope, this.path);
        if (prop){
            prop.obj[prop.key] = val;
            prop = null;
        }
        return val;
    };

    // get value from object
    p.getPropValue = function(){
        var prop = this.findObjectByPath(this.scope, this.path);
        var val;
        if (prop){
            val = prop.obj[prop.key];
            prop = null;
        }
        return val;
    };

    // return correct namespace for DOM element events
    p.getNameSpace = function(){
        return '.watch-scope' + this.parent.getId();
    };

    // return correct events with namespace for DOM events
    p.getEventMessage = function(arr){
        var namespace = this.getNameSpace();
        var res = "";
        for (var i = 0, l = arr.length; i < l; i++){
            res = res + arr[i] + namespace;
            if (i < (l - 1)){
                res = res + " ";
            }
        }
        return res;
    };

    // drop all and clean memory
    p.destroy = function(){
        this.groupCallback && watchBro.off(this.groupMessage, this.groupCallback);
        this.groupCallback = null;
        this.groupMessage = null;

        this.objectCallback && watchBro.off(this.message, this.objectCallback);
        this.objectCallback = null;

        if (this._binded){
            this.el.off(this.getNameSpace());
        }
        this.el = null;

        this.parent = null;
        this.path = null;
        this.scope = null;
        this.message = null;
        this.stopSet = null;
        this.subData = null;
    };
    
    watchScope('base', BaseWatcherClass);

})();