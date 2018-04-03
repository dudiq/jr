/*
 * routing module
 *
 * WARNING, this module using jquery.address plugin!!!
 * */
(function () {
    var app = window.app;
    var broadcast = app('broadcast');
    var helper = app('helper');
    var logger = app('logger')('route');
    var routeEvs = broadcast.events('route', {
        changed: 'changed',
        beforeChange: 'beforeChange',
        started: 'started'
    });

    var dropMap = {};

    var prevLocation = "";
    var newLocation = "";
    var beforeDropLocation = "";
    var canProcess = true;
    var firstRunned = false;
    var appStarted = false;

    var mainFields = {};
    var mainFieldsIndex = [];

    var pathAsAllKeys = [];
    var pathAsMainKeys = [];
    var pathAsSubKeys = [];
    var oldSubKeys = '';


    var route = app('route', {
        DEFAULT_REDIRECT: '/_default',
        startRoute: function () {
            setAddressVars();
        },
        addMainField: function (name, opt) {
            var index = opt.index;
            var obj = {};
            if (mainFields[name] || mainFieldsIndex[index]) {
                logger.error('trying to define already defined route main field', name, index);
            } else {
                helper.extendObject(obj, {
                    name: name,
                    value: undefined,
                    subVal: undefined,
                    index: opt.index,
                    onChanged: opt.onChanged,
                    onArgsChanged: opt.onArgsChanged,
                    onSet: opt.onSet,
                    onRemoved: opt.onRemoved
                });

                mainFields[name] = obj;
                mainFieldsIndex[index] = obj;
            }
        },
        // set location
        pushState: function (location) {
            $.address.value(location);
        },
        replaceState: function (newLocation) {
            if (window.history.replaceState) {
                // for normal browsers
                window.history.replaceState({}, '', '#' + newLocation);
            } else {
                // for browsers, that does not support replaceState;
                route.pushState(newLocation);
            }
        },
        pushByField: function (fieldIndex, val, args) {
            var loc = getFieldLoc(fieldIndex, val, args);

            route.pushState(loc);
        },
        replaceByField: function (fieldIndex, val, args) {
            var loc = getFieldLoc(fieldIndex, val, args);

            route.replaceState(loc);
        },
        // return sub keys of router
        getSubKeys: function () {
            return helper.clone(pathAsSubKeys);
        },
        getFieldValueByIndex: function (index, loc) {
            var main = [];
            var sub = [];
            collectMainAndSub(loc, main, sub);
            var ret = main[index];
            return ret;
        },
        // return current location
        location: addrVal,
        back: function () {
            window.history.go(-1);
        }
    });

    function getFieldLoc(fieldIndex, val, args) {
        if (typeof fieldIndex != "object") {
            var tmp = {};
            tmp[fieldIndex] = val;
            fieldIndex = tmp;
            tmp = null;
        } else {
            args = val;
        }
        var toPath = [];
        helper.arrayWalk(mainFieldsIndex, function (field, index) {
            if (fieldIndex.hasOwnProperty(index)) {
                if (fieldIndex[index] !== undefined) {
                    toPath.push(fieldIndex[index]);
                } else {
                    field.value = undefined;
                }
            } else {
                if (field.value !== undefined) {
                    toPath.push(field.value);
                }
            }
        });

        toPath.reverse();
        var loc = toPath.join('/');
        (loc != '') && (loc = '/' + loc);
        if (args) {
            (args[0] != '/') && (args = '/' + args);
            loc += args;
        }
        return loc;
    }

    function setAddressVars(loc) {
        pathAsAllKeys.clear();
        oldSubKeys = pathAsSubKeys.join('/');
        collectMainAndSub(loc, pathAsMainKeys, pathAsSubKeys, pathAsAllKeys);
    }

    function collectMainAndSub(loc, main, sub, all) {
        loc = (loc === undefined) ? addrVal() : loc;
        all = all || [];

        if (loc) {
            if (loc[0] == '/') {
                loc = loc.substring(1);
            }
            var addrParams = loc.split('/');
            if (addrParams[addrParams.length - 1] == '') {
                addrParams.splice(addrParams.length - 1, 1);
            }
            helper.push(all, addrParams);
        }

        main.clear();
        sub.clear();

        var fillMain = true;
        for (var i = 0, l = all.length; i < l; i++) {
            var item = all[i];
            if (item.indexOf('=') != -1) {
                fillMain = false;
            }
            if (fillMain) {
                main.push(item);
            } else {
                sub.push(item);
            }
        }

        main.reverse();
    }

    function processMainFields() {

        var newSubKeys = pathAsSubKeys.join('/');

        helper.arrayWalk(mainFieldsIndex, function (field, index) {
            var val = pathAsMainKeys[index];
            if (val !== undefined) {
                if (field.value === undefined) {
                    field.value = val;
                    field.subVal = newSubKeys;
                    field.onSet && field.onSet(val);
                } else {
                    if (field.value !== val) {
                        field.value = val;
                        field.subVal = newSubKeys;
                        field.onChanged && field.onChanged(val);
                    }
                }
            } else {
                if (field.value !== val) {
                    // removed
                    field.value = val;
                    field.subVal = newSubKeys;
                    field.onRemoved && field.onRemoved();
                }
            }
        });
        if (newSubKeys != oldSubKeys) {
            helper.arrayWalk(mainFieldsIndex, function (field) {
                if (field.subVal != newSubKeys) {
                    field.subVal = newSubKeys;
                    field.onArgsChanged && field.onArgsChanged(pathAsSubKeys);
                }
            });
        }
    }

    // processing all routes in map
    function onPathProcess(location) {
        (location === undefined) && (location = addrVal());
        broadcast.trig(routeEvs.beforeChange);
        processMainFields(location);
        broadcast.trig(routeEvs.changed);
    }

    /// main

    function onLocationChanged(ev) {
        var path = ev.value;
        setAddressVars(path);

        if (!appStarted) {
            // do not run if app not started
            return;
        }

        //check for 'drop' pages in first run
        if (!firstRunned) {
            if (dropMap[path]) {
                setTimeout(function () {
                    // timeout need because .change event must done before call redirect to default page
                    if (window.history.replaceState) {
                        // for normal browsers
                        window.history.replaceState({}, '', '/');
                        onPathProcess('/');
                    } else {
                        // for browsers, that does not support replaceState;
                        route.pushState('/');
                    }
                }, 0);
                return;
            }
        }
        firstRunned = true;

        // check forward direction for remove 'drop' pages from history
        if (!canProcess) {
            canProcess = true;
            prevLocation = "";
            route.pushState(newLocation);
            return;
        }

        if (dropMap[path]) {
            beforeDropLocation = prevLocation;
        }

        if (!dropMap[prevLocation]) {
            //redirect only when app started
            onPathProcess(path);
            prevLocation = path;
        } else {
            // if prevLocation is 'drop' page, we need to run special mechanizm for correcting history states
            // 1) set newLocation as new page
            // 2) history.go(-2) in history list(if forward) or just call redirect() (if backward)
            // 3) when processing changed with new location history,
            //    set new location to pushState (as it must be in default way)
            // 4) profit!!! 'drop' pages are not in history and we are located in next page

            canProcess = false;
            newLocation = path;

            // if new page == page before 'drop' page, we need just return without
            if (path != beforeDropLocation) {
                // forward direction or maybe other page, but not page that was before showing 'drop' page

                // why -2? because, if we go to -1, we returning to dropped page
                // the idea, is just go to prev state and set new correct state.
                // like wrap of history.replaceState;
                window.history.go(-2);
            } else {
                // goto page, that was before 'drop' page
                canProcess = true;
                prevLocation = beforeDropLocation;
                for (var key in mainFields) {
                    mainFields[key].value = undefined;
                }
                onPathProcess(path);
            }
        }
    }

    // return address bar path after hash (location)
    function addrVal() {
        return $.address.value();
    }

    // when address bar changed, this event triggers
    $.address.change(function (ev) {
        onLocationChanged(ev);
    });

    app.onStartEnd(function () {
        // need wait until all callstack will done before checking appStarted flag
        setTimeout(function () {
            if (!appStarted) {
                var isFirstRun = (history.length <= 1);
                var val = addrVal();
                if (isFirstRun) {
                    // drop need for correct processing drop pages when calling back button (when drop page is a second page)
                    route.pushState('__drop__');
                }
                appStarted = true;
                isFirstRun ? route.pushState(val) : onLocationChanged({value: val});
                broadcast.trig(routeEvs.started);
            }
        }, 10);
    });

})();
