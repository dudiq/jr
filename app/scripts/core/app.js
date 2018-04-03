/*
 * 'jr' framework for create simple lightweight SPA
 * using jquery for events, ajax and DOM manipulating
 *
 *
 * license: mit
 * author: idudiq
 * created: 2014-01-10
 * */

(function(app){
    app.version = '0.5.1';
    app.prefix = 'jr-';

    var logger = app('logger')('app');
    var broadcast = app('broadcast');
    var systemEvs = broadcast.events('system', {
        onStartBegin: 'app-start-begin',
        onStartEnd: 'app-start-end',
        onDomReady: 'domReady'
    });

    //this is just a flag to check started app or still not...
    app.started = false;
    app.startEnd = false;
    app.domReady = false;

    var waitCallbacks = [];

    var startPrevented = !!window.preventJr;

    // for debug only
    app._getWaitCallbacksNames = function () {
        var ret = [];
        for (var i = 0, l = waitCallbacks.length; i < l; i++){
            var cb = waitCallbacks[i];
            if (cb){
                ret.push(cb._name);
            }
        }
        return ret.join(',');
    };

    // awaiting to start app. for example need load views, before run
    //
    // this method must be run before app started ( helper.onStartEnd() ). else it will be just simple function(){}
    app.wait = function(name){
        var pos = waitCallbacks.length;
        var callback;
        if (app.started){
            logger.info('app', 'app.wait called after started app, is it ok?');
            callback = function(){
                //no need to start app again
                //wait was called before app start
            };
        } else {
            callback = function(){
                waitCallbacks[pos] = false;
                start();
            };
        }
        callback._name = name;
        waitCallbacks.push(callback);
        return callback;
    };

    // for getting modules as callback
    app.modules = function(modules, callback){
        var returnModules = [];
        for (var i = 0, l = modules.length; i < l; i++){
            returnModules.push(app(modules[i]));
        }
        callback.apply(app, returnModules);
    };


    app.onStart = function (cb) {
        if (app.started) {
            cb();
        } else {
            broadcast.one(systemEvs.onStartBegin, cb);
        }
    };

    app.onStartEnd = function (cb) {
        if (app.startEnd) {
            cb();
        } else {
            broadcast.one(systemEvs.onStartEnd, cb);
        }
    };

    app.onDomReady = function (cb) {
        if (app.domReady) {
            cb();
        } else {
            broadcast.one(systemEvs.onDomReady, cb);
        }
    };

    // start application before all loaded
    function start(){
        if (!startPrevented && isWaitCallbacksDone() && !app.started && app.domReady) {
            waitCallbacks.length = 0;
            app.started = true;

            // process all onStart
            broadcast.trig(systemEvs.onStartBegin);
            // start point here

            // process all after onStart
            setTimeout(function(){
                app.startEnd = true;
                broadcast.trig(systemEvs.onStartEnd);
            }, 10);

        }
    }

    // check that all awaiting callbacks was called for run app
    function isWaitCallbacksDone(){
        var ready = true;
        for (var i = 0, l = waitCallbacks.length; i < l; i++){
            if (waitCallbacks[i]){
                ready = false;
            }
        }
        return ready;
    }


    //initial dom ready state for call run OWN app
    // dom Ready init


    app._onDomReady(function(){
        app.domReady = true;
        broadcast.trig(systemEvs.onDomReady);
        !startPrevented && start();
    });


})(window.app);
