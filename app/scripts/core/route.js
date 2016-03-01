/*
 * routing module
 *
 * WARNING, this module using jquery.address plugin!!!
 * */
(function(){
    var app = window.app;
    var route = app('route', {});
    var broadcast = app('broadcast');
    var helper = app('helper');
    var warning = app('errors').warning;
    var routeEvs = broadcast.events('route', {
        changed: 'changed',
        beforeChange: 'beforeChange',
        started: 'started'
    });

    var routesMap = {};

    var dropMap = {};

    var prevLocation = "";
    var newLocation = "";
    var beforeDropLocation = "";
    var canProcess = true;
    var firstRunned = false;
    var appStarted = false;

    var addressParamsList = [];
    var addressPageAlias = '';
    var addressPrevLocation = '';

    // when user trying to use not defined url action (wrong page redirect).
    var DEFAULT_REDIRECT = route.DEFAULT_REDIRECT = '/_default';

    setAddressVars();

    // default page, when web started
    var currentPageAlias = addressPageAlias;


    function onLocationChanged(ev){
        var path = ev.value;
        setAddressVars(path);

        if (!appStarted){
            // do not run if app not started
            return;
        }

        //check for 'drop' pages in first run
        if (!firstRunned){
            if (dropMap[path]){
                setTimeout(function(){
                    // timeout need because .change event must done before call redirect to default page
                    if (window.history.replaceState) {
                        // for normal browsers
                        window.history.replaceState({} , '', '/' );
                        redirect('/');
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
        if (!canProcess){
            canProcess = true;
            prevLocation = "";
            route.pushState(newLocation);
            return;
        }

        if (dropMap[path]){
            beforeDropLocation = prevLocation;
        }

        if (!dropMap[prevLocation]){
            //redirect only when app started
            redirect(path);
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
            if (path != beforeDropLocation){
                // forward direction or maybe other page, but not page that was before showing 'drop' page

                // why -2? because, if we go to -1, we returning to dropped page
                // the idea, is just go to prev state and set new correct state.
                // like wrap of history.replaceState;
                window.history.go(-2);
            } else {
                // goto page, that was before 'drop' page
                canProcess = true;
                prevLocation = beforeDropLocation;
                currentPageAlias = null;
                redirect(path);
            }
        }
    }

    // when address bar changed, this event triggers
    $.address.change(function(ev){
        onLocationChanged(ev);
    });

    // return address bar path after hash (location)
    function addrVal(){
        return $.address.value();
    }

    // getting args as array, where first arg is page id
    function getAddrParams(loc){
        loc = (loc === undefined) ? addrVal() : loc;

        var addrParams = [];
        if (loc){
            addrParams = loc.split('/');
            if (loc[0] == '/'){
                addrParams.splice(0, 1); // remove first '/' not defined, after # char
            }
        }
        return addrParams;
    }

    function getPageFromAddr(addrParams){
        var pageName = addrParams[0];
        if (pageName.slice(-1) == "?"){
            pageName = pageName.slice(0, -1);
        }
        return pageName;
    }

    function setAddressVars(loc){
        var addrParams = getAddrParams(loc);
        var pageName = getPageFromAddr(addrParams);
        addressPageAlias = pageName;

        addressParamsList.clear();
        addressParamsList = null;

        addressParamsList = addrParams;

        pageName = null;
        addrParams = null;
    }

    // processing all routes in map
    function redirect(location){
        (location === undefined) && (location = addrVal());
        var params = {
            useDefault: false,
            location: location,
            prevLocation: addressPrevLocation
        };

        if (dropMap[location]){
            // do not process 'drop' pages
            return;
        }

        params.prevPageAlias = currentPageAlias;

        var args = addressParamsList;
        var pageAlias = addressPageAlias;

        params.args = args;


        var ques = "/" + pageAlias;
        if (routesMap[ques]) {
            params.portion = true;
            location = ques;
        }


        var defRoute = routesMap[DEFAULT_REDIRECT];

        var locMap = routesMap[location] || defRoute;
        if (locMap == defRoute){
            pageAlias = null;
        }

        params.pageChanged = (currentPageAlias !== pageAlias);

        params.pageAlias = pageAlias;
        if (locMap) {
            // route founded!
            if (locMap == defRoute) {
                warning("route", "no route for " + location + ", using default page");
                params.useDefault = true;
            }
            broadcast.trig(routeEvs.beforeChange, params);
            locMap(params);
            broadcast.trig(routeEvs.changed, params);
            currentPageAlias = pageAlias;
        } else {
            warning("route", "no route for " + location);
        }
        addressPrevLocation = location;
    }

    // register router in map
    function registerRoute(key, callback){
        if (!routesMap[key]){
            routesMap[key] = callback;
        } else {
            warning("route", 'routes map already have this "' + key + '" route');
        }
    }

    // register list or single route from external
    route.register = function(newRoutes, callback){
        if (callback) {
            registerRoute(newRoutes, callback);
        } else {
            for (var key in newRoutes){
                registerRoute(key, newRoutes[key]);
            }
            newRoutes = null;
        }
        return this;
    };

    // register 'drop' pages
    route.registerDrop = function(loc){
        if (loc && !dropMap[loc]){
            dropMap[loc] = true;
        }
    };


    // set location
    route.pushState = function(location){
        $.address.value(location);
    };

    // deprecated
    // return params of router
    route.params = function(){
        var params = {
            args: addressParamsList,
            pageAlias: addressPageAlias
        };
        return params;
    };

    route.getAddressParams = function(){
        return helper.clone(addressParamsList);
    };

    // return current page alias by location
    // or return parsed value from location
    route.getPageAlias = function(loc){
        var ret = addressPageAlias;
        if (loc !== undefined){
            var addrParams = getAddrParams(loc);
            ret = getPageFromAddr(addrParams);
        }
        return ret;
    };

    // return current location
    route.location = addrVal;

    // set other url
    route.redirect = redirect;

    route.back = function(){
        window.history.go(-1);
    };

    helper.onStartEnd(function(){
        // need wait until all callstack will done before checking appStarted flag
        setTimeout(function(){
            if (!appStarted){
                var isFirstRun = (history.length <=1);
                var val = addrVal();
                if (isFirstRun){
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
