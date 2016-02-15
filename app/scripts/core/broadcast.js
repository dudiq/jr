/*
* broadcast module
* just callback sender
*
* */
(function(){
    var app = window.app;
    var errors = app('errors');

    function showInfo(msg){
        errors.warning('broadcast', msg);
    }

    function showError(msg){
        errors.error('broadcast', msg);
    }

    /*
     *
     * how to use?
     *
     * 1) messages can be with any symbol, except ".", because it is identifier of namespace
     *
     * 2) namespaces separated from namespaces
     *
     * 3) namespace MUST BE start from "." symbol. it's for separate from messages
     *
     * for examle:
     *
     * // will call on each trigger of 'my-event'
     * broadcast.on('my-event', function(params){
     *   console.log(params.params1); //see 'ohh now'
     * });
     *
     * // 'myHandler' will call only once
     * broadcast.one('my-event', '.my-namespace', myHandler);
     *
     * // bind to different messages to 'myHandler'
     * broadcast.on(['my-event1', 'my-event2'], '.my-namespace', myHandler);
     *
     *
     * // unbind all callbacks from MESSAGE
     * broadcast.off('my-event');
     *
     * unbind all callbacks from NAMESPACE
     * broadcast.off('.namespace');
     *
     * // will trigger immedially from current point
     * broadcast.trig('my-event', {param1: 'ohh now', param2: 2}); // or without params
     *
     * // will trigger after current callstack is done
     * broadcast.aTrig('my-event', params);
     *
     *
     * // will create namespace evs with detection of collisions
     * var evs = broadcast.putEvents('my-namespace', {
     *  myEv1: 'myEv1',
     *  myEv2: 'myEv2'
     * })
     *
     * broadcast.trig(evs.myEv1); - will trigger message
     *
     * // will return evs namespace from other places
     * var evs = broadcast.getEvents('my-namespace');
     *
     *
     * */


    // constructor for new instance of broadcaster
    function BroadcastClass(name){
        // map of all targets
        this.map = {};

        // map of all registered events
        this.eventsMap = {};

        if (!this.broadName){
            this.created = new Date();
            this.broadName = name;
        }
    }

    // just a link to prototype
    var p = BroadcastClass.prototype;

    // split consts
    var MSG_SPLIT = " ";

    // split messages string and call callback for each
    //
    // msgs - array(or string) of messages. can be as ['message1', 'message2'] or 'message1 message2'
    // callback - method for processing single message
    function processMessages(msgs, callback){
        (typeof msgs == "string") && (msgs = msgs.split(MSG_SPLIT));
        if (msgs instanceof Array) {
            for (var i = 0, l = msgs.length; i < l; i++){
                var msg = msgs[i];
                if (!msg || msg == "undefined"){
                    showInfo('some event not dispatched, please check it!');
                } else {
                    callback(msg);
                }
            }
        } else {
            showInfo('something wrong with messages, please check it!');
        }
    }

    // just remove flags from original callback for clearify
    function cleanCallback(callback){
        callback._dirty = null;
        callback._once = null;
        callback._namespace = null;
    }

    // clean all targets, what was dirty
    //
    // targets - link to callbacks array
    // msg - msg for targets
    // map - current map of broadcaster
    // uCallback - single dirty clean for this callback only
    // namespace - just namespace
    function clearTargetsOfDirt(targets, msg, map, namespace, uCallback){
        //setTimeout need for leave callstack as is.


        // !uCallback && namespace - remove all by namespace
        // !namespace && uCallback - remove all from map with single callback
        // !namespace && !uCallback - remove all dirty from targets

        var notCallAndName = (!uCallback && !!namespace);
        var notNameAndCall = (!namespace && !!uCallback);
        var notAll = (!namespace && !uCallback);
        var all = (!!namespace && !!uCallback);

        setTimeout(function(){
            var cleanAllNames = !namespace;
            // clean all dirty callbacks after callstack done
            for (var i = targets.length - 1; i >= 0; i--){
                var tarCall = targets[i];
                if (tarCall._dirty) {
                    if ((notAll) ||
                        (notCallAndName && tarCall._namespace == namespace) ||
                        (notNameAndCall && tarCall._link == uCallback) ||
                        (all && tarCall._link == uCallback && tarCall._namespace == namespace)
                    )
                    {
                        cleanCallback(tarCall);
                        targets.splice(i, 1);
                    }
                }
            }
            if (targets.length == 0){
                map[msg] = null;
                delete map[msg];
            }
        }, 0);
    }

    // drop all namespaced callbacks
    //
    // map - just map of broadcast instance
    // namespace - namespace for clean
    function cleanByNamespace(map, namespace){
        // at first, mark all offcallbacks as dirty
        (function(){
            for (var key in map){
                var targets = map[key];
                for (var i = targets.length - 1; i >= 0; i--){
                    var callback = targets[i];
                    if (callback._namespace == namespace){
                        callback._dirty = true;
                    }
                }
            }
        })();

        // at second, after callstack done, remove them all
        setTimeout(function(){
            for (var key in map){
                var targets = map[key];
                for (var i = targets.length - 1; i >= 0; i--){
                    var callback = targets[i];
                    if (callback._dirty && callback._namespace == namespace){
                        cleanCallback(callback);
                        targets.splice(i, 1);
                    }
                }
                if (targets.length == 0){
                    map[key] = null;
                    delete map[key];
                }
            }
        }, 0);
    }

    // create instance of a broadcaster
    //
    // name - just a name for separate different broadcasts
    // Returns instance of broadcast
    p.instance = function(name){
        var inst = new BroadcastClass(name);
        return inst;
    };

    // bind to each emit of message
    //
    // msgs - messages
    // callback - method, when messages fires
    p.on = function(msgs, namespace, userCallback){
        if (typeof namespace == "function"){
            userCallback = namespace;
            namespace = null;
        }

        if (namespace && namespace[0] != "."){
            throw new Error("#" + this.broadName + " - broadcast can't use namespaces without '.' dot");
        }

        var map = this.map;

        processMessages(msgs, function(msg){
            function callback(){
                //userCallback();
            }

            callback._link = userCallback;
            callback._name = userCallback.name; // to defined, from what callback it was

            if (userCallback._once){
                //remove from '.one()' case
                callback._once = userCallback._once;
                userCallback['_once'] = null;
                delete userCallback['_once'];
            }

            var targets = (!map[msg]) ? (map[msg] = []) : map[msg];
            callback._dirty = false;
            namespace && (callback._namespace = namespace);
            targets.push(callback);
        });
        return this;
    };


    // bind only one emit
    //
    // msgs - messages
    // callback - method, when messages fires
    p.one = function(msg, namespace, callback) {
        if (typeof namespace == "function"){
            callback = namespace;
            namespace = null;
        }
        if (callback){
            callback._once = true;
            this.on(msg, namespace, callback);
        }
        return this;
    };

    // unbind messages
    //
    // msgs - messages
    // callback - method, when messages fires
    p.off = function(msgs, namespace, userCallback){
        if (!namespace && !userCallback && msgs && msgs[0] == "."){
            // this is case for off callbacks with one namespace
            namespace = msgs;
            cleanByNamespace(this.map, namespace);
        } else {
            // normal way
            if (typeof namespace == "function"){
                userCallback = namespace;
                namespace = "";
            }
            var map = this.map;
            var cleanAll = (!namespace && !userCallback);
            processMessages(msgs, function(msg){
                var targets = map[msg];
                if (targets){
                    // set all callbacks to dirty and remove them all
                    var canClean = false;
                    for (var i = 0, l = targets.length; i < l; i++){
                        var tCallback = targets[i];
                        if (cleanAll ||
                            (tCallback._namespace == namespace) ||
                            (tCallback._link == userCallback)
                        ){
                            tCallback._dirty = true;
                            canClean = true;
                        }
                    }

                    // dirty only one callback, or all callbacks defined by namespace, and remove after
                    canClean && clearTargetsOfDirt(targets, msg, map, namespace, userCallback);
                }
            });
        }
        return this;
    };

    // trigger event with params
    //
    // msg - string message
    // params - event params
    p.trig = function(msg, params) {
        var targets = this.map[msg];
        if (targets){
            for (var i = 0, l = targets.length; i < l; i++){
                var callback = targets[i];
                if (!callback._dirty){
                    var handler = callback._link;
                    var context = handler.cont;
                    var res = handler.call(context, params);
                    if (callback._once){
                        // remove them
                        cleanCallback(callback);
                        targets.splice(i, 1);
                        l--;
                        i--;
                    }
                    if (res === false){
                        break;
                    }
                }
            }

            if (l == 0){
                // if all callbacks was .one, remove targets from map
                this.map[msg] = null;
                delete this.map[msg];
            }
        }
        return this;
    };

    // async trigger call
    p.aTrig = function(){
        var self = this;
        var args = arguments;
        setTimeout(function(){
            self.trig.apply(self, args);
            args = null;
        },0);
        return this;
    };

    // clean all events
    p.clean = function(){
        var map = this.map;
        var self = this;

        (function(){
            for (var key in map){
                var targets = map[key];
                for (var i = targets.length - 1; i >= 0; i--){
                    var callback = targets[i];
                    callback._dirty = true;
                }
            }
        })();

        // at second, after callstack done, remove them all
        setTimeout(function(){
            for (var key in map){
                var targets = map[key];
                for (var i = targets.length - 1; i >= 0; i--){
                    var callback = targets[i];
                    if (callback._dirty){
                        cleanCallback(callback);
                        targets.splice(i, 1);
                    }
                }
                if (targets.length == 0){
                    map[key] = null;
                    delete map[key];
                }
            }
        }, 0);

        return this;
    };

    // set events
    p.putEvents = p.events = function(evName, events){
        if (events){
            //setter
            addEvents.call(this, evName, events);
        }

        return this.getEvents(evName);
    };

    // return events by key
    p.getEvents = function(evName, opt){
        var eventsMap = this.eventsMap;
        if (!eventsMap[evName]){
            eventsMap[evName] = {};
        }
        if (opt !== undefined){
            // trying to use get as set!
            showError('trying to use getEvents as setEvent!');
        }
        return eventsMap[evName];
    };

    // return all events map
    p.getAllEvents = function(){
        return this.eventsMap;
    };

    // checking event exist
    //
    // evName - event name
    // events - where need to check
    function isEventsExists(evName, events){
        var map = this.eventsMap[evName];
        var haveSame = false;
        if (map){
            var errorMsg = "";
            for (var key in events){
                if (haveSame) {
                    break;
                }
                if (map[key]){
                    haveSame = true;
                    errorMsg = '"' + key + '" already exists' ;
                    break;
                }
                for (var mk in map){
                    if (map[mk] == events[key]) {
                        errorMsg = '"' + key + '" already exists' ;
                        haveSame = true;
                        break;
                    }
                }
            }

            if (haveSame){
                var msg = 'problems with "' + evName + '". event ' + errorMsg;
                showError(msg);
            }
        }

        return haveSame;
    }

    // add new event names
    //
    // evName - event name
    // events - events map
    function addEvents(evName, events){
        var eventsMap = this.eventsMap;
        var map = eventsMap[evName] || {};
        checkNewEvents(evName, events);
        if (!isEventsExists.call(this, evName, events)){
            for (var key in events){
                map[key] = evName + '#' + events[key];
            }
            eventsMap[evName] = map;
        }
    }

    // checking new event for naming
    function checkNewEvents(evName, events){
        var map = {};
        for (var key in events){
            var val = events[key];
            if (map[val]){
                var msg = 'problems with "' + evName + '". event ' + val + ' trying to define already existed event name';
                showError(msg);
            }
            map[val] = true;
        }
        map = null;
    }


    /*jshint -W055*/
    var inst = new BroadcastClass('core');


    // register ev-storage, deprecated in next releases
    var showedDeprecated = true;
    app('ev-storage', function(evName, events){
        if (showedDeprecated){
            errors.warn('ev-storage', 'deprecated, use broadcast.putEvents("evsNamespace", {evs...}) instead.');
            showedDeprecated = false;
        }

        return inst.putEvents(evName, events);
    });

    app('broadcast', inst);
})();
