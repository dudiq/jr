/*
 * 'jr' framework for create simple lightweight SPA
 * using jquery for events, ajax and DOM manipulating
 *
 *
 * license: mit
 * author: idudiq
 * created: 2014-01-10
 * */

(function(){
    var app = window.app;
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

    // awaiting to start app. for example need load views, before run
    //
    // this method must be run before app started ( helper.onStartEnd() ). else it will be just simple function(){}
    app.wait = function(){
        var pos = waitCallbacks.length;
        var callback;
        if (app.started){
            app('errors').info('app', 'app.wait called after started app, is it ok?');
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

    // start application before all loaded
    function start(){
        if (!startPrevented && checkReady() && !app.started && app.domReady) {
            var helper = app('helper');
            (!helper.isMobile && !helper.isNative) && $(document.body).addClass('jr-desktop');
            waitCallbacks.clear();
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
    function checkReady(){
        var ready = true;
        for (var i = 0, l = waitCallbacks.length; i < l; i++){
            if (waitCallbacks[i]){
                ready = false;
            }
        }
        return ready;
    }


    //initial dom ready state for call run OWN app
    $(document).ready(function(){
        app.domReady = true;
        broadcast.trig(systemEvs.onDomReady);
        !startPrevented && start();
    });

})();