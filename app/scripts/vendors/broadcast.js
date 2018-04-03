/**
 *
 * Broadcast.
 *  simple events broadcasting using list of callbacks
 *  on, off, one, trig, aTrig, clean, events, getAllEvents
 *
 * Rules for how to use:
 *
 * - messages can be with any symbol, except ".", because it is identifier for namespace
 *
 * - namespace MUST BE start from "." symbol. it's for separate from messages
 *
 * - maximum arguments for .trig() = 3, if you need more arguments for send data, use object structures
 *
 * examples:
 *
 * // will create group of events with collision detect
 * var eventsGroup = broadcast.events('my-group', {
 *     myEv1: 'myEv1',
 *     myEv2: 'myEv2'
 * })
 *
 * var eventsGroup2 = broadcast.events('my-group-2', {
 *     myEv1: 'myEv1',
 *     myEv2: 'myEv2'
 * })
 *
 * broadcast.trig(evs.myEv1, opt1, opt2); - will trigger message with arguments
 *
 * // will return evs group
 * var evs = broadcast.events('my-group');
 *
 * // bind handler to evs.myEv1 = 'my-group' trigger
 * broadcast.on(evs.myEv1, function(params){
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
 * licence: MIT, dudiq 2012
 *
 **/
(function () {

    var canUseConsole = (typeof console == 'object');
    var isSilent = false;
    var showTriggers = false;

    function showWarning(msg) {
        if (canUseConsole && !isSilent) {
            console.warn(getLogPrefix.call(this) + msg);
        }
    }

    function showError(msg) {
        if (canUseConsole && !isSilent) {
            console.error(getLogPrefix.call(this) + msg);
        }
    }

    function getLogPrefix() {
        return "#" + this._broadName + ": ";
    }

    var GROUP_DELIMITER = '_^_';
    var MSG_SPLIT = " ";

    // constructor for new instance of broadcaster
    function BroadcastClass(name) {
        // map of all targets
        this._map = {};

        // map of all registered events
        this._eventsMap = {};

        if (!this._broadName) {
            this._created = new Date();
            this._broadName = name;
        }
    }

    BroadcastClass.silent = function (val) {
        if (val !== undefined){
            isSilent = val ? true : false;
        }
        return isSilent;
    };

    BroadcastClass.showTriggers = function (val) {
        if (val !== undefined){
            showTriggers = val;
        }
        return showTriggers;
    };

    // split messages string and call callback for each
    //
    // msgs - array(or string) of messages. can be as ['message1', 'message2'] or 'message1 message2'
    // callback - method for processing single message
    function processMessages(msgs, callback) {
        (typeof msgs == "string") && (msgs = msgs.split(MSG_SPLIT));
        if (msgs instanceof Array) {
            for (var i = 0, l = msgs.length; i < l; i++) {
                var msg = msgs[i];
                if (!msg || msg == "undefined") {
                    showWarning.call(this, 'some event not dispatched, please check it!');
                } else {
                    callback(msg);
                }
            }
        } else {
            showWarning.call(this, 'something wrong with messages, please check it!');
        }
    }

    // just remove flags from original callback for clearify
    function cleanCallback(callback) {
        callback._dirty = null;
        callback._once = null;
        callback._namespace = null;
        callback._context = null;
    }

    // clean all targets, what was dirty
    //
    // targets - link to callbacks array
    // msg - msg for targets
    // map - current map of broadcaster
    // uCallback - single dirty clean for this callback only
    // namespace - just namespace
    function clearTargetsOfDirt(targets, msg, map, namespace, uCallback) {
        //setTimeout need for leave callstack as is.


        // !uCallback && namespace - remove all by namespace
        // !namespace && uCallback - remove all from map with single callback
        // !namespace && !uCallback - remove all dirty from targets

        var notCallAndName = (!uCallback && !!namespace);
        var notNameAndCall = (!namespace && !!uCallback);
        var notAll = (!namespace && !uCallback);
        var all = (!!namespace && !!uCallback);

        setTimeout(function () {
            // clean all dirty callbacks after callstack done
            for (var i = targets.length - 1; i >= 0; i--) {
                var tarCall = targets[i];
                if (tarCall._dirty) {
                    if ((notAll) ||
                        (notCallAndName && tarCall._namespace == namespace) ||
                        (notNameAndCall && tarCall._link == uCallback) ||
                        (all && tarCall._link == uCallback && tarCall._namespace == namespace)
                    ) {
                        cleanCallback(tarCall);
                        targets.splice(i, 1);
                    }
                }
            }
            if (targets.length == 0) {
                map[msg] = null;
                delete map[msg];
            }
        }, 0);
    }

    // drop all namespaces callbacks
    //
    // map - just map of broadcast instance
    // namespace - namespace for clean
    function cleanByNamespace(map, namespace) {
        // at first, mark all 'off' callbacks as dirty
        (function () {
            for (var key in map) {
                var targets = map[key];
                for (var i = targets.length - 1; i >= 0; i--) {
                    var callback = targets[i];
                    if (callback._namespace == namespace) {
                        callback._dirty = true;
                    }
                }
            }
        })();

        // at second, after call stack is done, remove them all
        setTimeout(function () {
            for (var key in map) {
                var targets = map[key];
                for (var i = targets.length - 1; i >= 0; i--) {
                    var callback = targets[i];
                    if (callback._dirty && callback._namespace == namespace) {
                        cleanCallback(callback);
                        targets.splice(i, 1);
                    }
                }
                if (targets.length == 0) {
                    map[key] = null;
                    delete map[key];
                }
            }
        }, 0);
    }

    // add new group with events
    //
    // evName - group event name
    // events - events map
    function addEventGroup(evName, events) {
        var eventsMap = this._eventsMap;
        var map = eventsMap[evName] || {};
        checkGroupExist.call(this, evName, events);
        if (!isEventsExists.call(this, evName, events)) {
            for (var key in events) {
                map[key] = evName + GROUP_DELIMITER + events[key];
            }
            eventsMap[evName] = map;
        }
    }

    // checking new group event for crossing with other names
    function checkGroupExist(evName, events) {
        var map = {};
        for (var key in events) {
            var val = events[key];
            if (map[val]) {
                var msg = 'problems with "' + evName + '". event ' + val + ' trying to define already existed event name';
                showError.call(this, msg);
            }
            map[val] = true;
        }
        map = null;
    }

    // checking event exist
    //
    // evName - event name
    // events - where need to check
    function isEventsExists(evName, events) {
        var map = this._eventsMap[evName];
        var haveSame = false;
        if (map) {
            var errorMsg = "";
            for (var key in events) {
                if (haveSame) {
                    break;
                }
                if (map[key]) {
                    haveSame = true;
                    errorMsg = '"' + key + '" already exists';
                    break;
                }
                for (var mk in map) {
                    if (map[mk] == events[key]) {
                        errorMsg = '"' + key + '" already exists';
                        haveSame = true;
                        break;
                    }
                }
            }

            if (haveSame) {
                var msg = 'problems with "' + evName + '". event ' + errorMsg;
                showError.call(this, msg);
            }
        }

        return haveSame;
    }

    // register methods for broadcast
    (function (methods) {
        var p = BroadcastClass.prototype;
        for (var key in methods) {
            p[key] = methods[key];
        }
    })({
        // create instance of a broadcaster
        //
        // name - just a name for separate different broadcasts
        // Returns instance of broadcast
        instance: function (name) {
            var inst = new BroadcastClass(name);
            return inst;
        },

        // bind to each emit of message
        //
        // msgs - messages
        // callback - method, when messages fires
        on: function (msgs, namespace, userCallback, context) {
            if (typeof namespace == "function") {
                context = userCallback;
                userCallback = namespace;
                namespace = null;
            }

            if (namespace && namespace[0] != "." && canUseConsole) {
                console.error("#" + this._broadName + " - broadcast can't use namespaces without '.' dot");
            }

            var map = this._map;

            processMessages.call(this, msgs, function (msg) {
                function callback() {
                    //userCallback();
                }

                callback._context = context;
                callback._link = userCallback;
                callback._name = userCallback.name; // to defined, from what callback it was

                if (userCallback._once) {
                    //remove from '.one()' case
                    callback._once = userCallback._once;
                    userCallback._once = null;
                    delete userCallback._once;
                }

                var targets = (!map[msg]) ? (map[msg] = []) : map[msg];
                callback._dirty = false;
                namespace && (callback._namespace = namespace);
                targets.push(callback);
            });
            return this;
        },


        // bind only one emit
        //
        // msgs - messages
        // callback - method, when messages fires
        one: function (msg, namespace, callback, context) {
            if (typeof namespace == "function") {
                context = callback;
                callback = namespace;
                namespace = null;
            }
            if (callback) {
                callback._once = true;
                this.on(msg, namespace, callback, context);
            }
            return this;
        },

        // unbind messages
        //
        // msgs - messages
        // callback - method, when messages fires
        off: function (msgs, namespace, userCallback) {
            if (!namespace && !userCallback && msgs && msgs[0] == ".") {
                // this is case for off callbacks with one namespace
                namespace = msgs;
                cleanByNamespace(this._map, namespace);
            } else {
                // normal way
                if (typeof namespace == "function") {
                    userCallback = namespace;
                    namespace = "";
                }
                var map = this._map;
                var cleanAll = (!namespace && !userCallback);
                processMessages.call(this, msgs, function (msg) {
                    var targets = map[msg];
                    if (targets) {
                        // set all callbacks to dirty and remove them all
                        var canClean = false;
                        for (var i = 0, l = targets.length; i < l; i++) {
                            var tCallback = targets[i];
                            if (cleanAll ||
                                (tCallback._namespace == namespace) ||
                                (tCallback._link == userCallback)
                            ) {
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
        },

        // trigger event with params
        //
        // msg - string message
        // params - event params
        trig: function (msg, param1, param2, param3) {
            if (canUseConsole && (showTriggers === true || showTriggers == this._broadName)){
                console.log('#Broadcast[' + this._broadName + ']', msg, param1, param2, param3);
            }
            var targets = this._map[msg];
            if (targets) {
                for (var i = 0, l = targets.length; i < l; i++) {
                    var callback = targets[i];
                    if (!callback._dirty) {
                        var handler = callback._link;
                        var context = callback._context;
                        var res = handler.call(context, param1, param2, param3);
                        if (callback._once) {
                            // remove them
                            cleanCallback(callback);
                            targets.splice(i, 1);
                            l--;
                            i--;
                        }
                        if (res === false) {
                            break;
                        }
                    }
                }

                if (targets.length == 0) {
                    // heed check `targets.length`, because when trigger event, handler can bind again new event as cyclic
                    // if all callbacks was .one, remove targets from map
                    this._map[msg] = null;
                    delete this._map[msg];
                }
            }
            return this;
        },

        // async trigger call using setTimeout
        aTrig: function () {
            var self = this;
            var args = arguments;
            setTimeout(function () {
                self.trig.apply(self, args);
                args = null;
            }, 0);
            return this;
        },

        // clean all events
        clean: function () {
            var map = this._map;

            for (var key in map) {
                var targets = map[key];
                for (var i = targets.length - 1; i >= 0; i--) {
                    var callback = targets[i];
                    callback._dirty = true;
                }
            }

            // at second, after callstack done, remove them all
            setTimeout(function () {
                for (var key in map) {
                    var targets = map[key];
                    for (var i = targets.length - 1; i >= 0; i--) {
                        var callback = targets[i];
                        if (callback._dirty) {
                            cleanCallback(callback);
                            targets.splice(i, 1);
                        }
                    }
                    if (targets.length == 0) {
                        map[key] = null;
                        delete map[key];
                    }
                }
            }, 0);

            return this;
        },

        // set/get events groups
        events: function (evName, events) {
            if (events) {
                //setter
                addEventGroup.call(this, evName, events);
            }
            // getter
            var eventsMap = this._eventsMap;
            if (!eventsMap[evName]) {
                eventsMap[evName] = {};
            }

            return eventsMap[evName];
        },

        // return all events map
        getAllEvents: function () {
            return this._eventsMap;
        }
    });

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = BroadcastClass;
    }
    else {
        if (typeof define === 'function' && define.amd) {
            define([], function() {
                return BroadcastClass;
            });
        }
        else {
            window.JrBroadcastClass = BroadcastClass;
        }
    }

})();
