(function(app){
    // plan review main code
    // communications between jr and plan review

    var helper = app('helper');
    var broadcast = app('broadcast');
    var pageAuth = app('page-auth');
    // var modRequire = app('mod-require');
    var rememberPage = app('remember-page');
    var notify = app('notify');
    var logger = app('logger')('my-app');

    var multiUser = app('multi-user');
    var promise = app('promise');
    // var collLoaders;

    var routeEvs = broadcast.events('route');

    var myAppEvs = broadcast.events('my-app',{
        onStorageCleanup: 'onStorageCleanup',
        onRegister: 'onRegister',
        onUserSessionStarted: 'onUserSessionStarted',
        onLoggedIn: 'onLoggedIn',
        onLogout: 'onLogout'
    });

    // modRequire('collection-loaders', function(cl){
    //     collLoaders = cl;
    //
    //     cl = null;
    // });

    // flag for indicate current state of workspace of user
    var userWorking = false;

    var myApp = {
        enter: function () {
            this.openDefaultPages();
        },
        openDefaultPages: function () {
            var index = multiUser.getCurrentUserNS();
            var defPages = [
                {
                    0: 'expense',
                    1: index
                },
                {
                    0: 'login',
                    1: undefined
                }
            ];
            rememberPage.open(defPages);
        },
        logout: function () {
            logger.log('trying to logout');
            //: todo update to multiple login
            if (isLoggedIn()) {
                userWorking = false;
                multiUser.logout();
                broadcast.trig(myAppEvs.onStorageCleanup);
                prepareUserEnvNS()
                    .catch(function () {
                        broadcast.trig(myAppEvs.onLogout);
                    })
                    .then(function () {
                        // firebaseAuth.logoutMe();
                    })
                    .then(function () {
                        broadcast.trig(myAppEvs.onLogout);
                    });
            }
        },
        onStorageCleanup: function (cb) {
            broadcast.on(myAppEvs.onStorageCleanup, cb);
        },
        login: function (user, cb) {
            userWorking = false;
            if (multiUser.isUserCorrect(user)) {

                var oldNS = multiUser.getCurrentUserNS();
                var userNS = multiUser.putUser(user);

                logger.log('userNS:', userNS, '; oldNS:', oldNS);

                if (!userNS){
                    logger.error('too much logged users');
                    notify.error('{{collLoader.toMuchLoggedUsers}}');
                    cb(true);
                } else {
                    broadcast.trig(myAppEvs.onStorageCleanup);
                    prepareUserEnvNS()
                        .catch(function (code, data) {
                            logger.error('prepareUserEnvNS:catch', code, data);
                            cb(true, code, data);
                        })
                        .then(function () {
                            logger.log('finish prepareUserEnvNS');
                            multiUser.setUserAsLogged();
                            startUserSession();
                            cb();
                        });
                }
            } else {
                notify.error('{{collLoader.userCorrupted}}');
                cb(true);
            }
        },
        onUserSessionStarted: function (cb) {
            if (userWorking && isLoggedIn()) {
                cb();
            } else {
                broadcast.on(myAppEvs.onUserSessionStarted, cb);
            }
        },
        onLogout: function (cb) {
            broadcast.on(myAppEvs.onLogout, cb);
        },
        isLoggedIn: isLoggedIn
    };

    function prepareUserEnvNS() {
        var holder = promise();
        holder
            .catch(function (code, data) {
                logger.error('prepareUserEnvNS()', code, data);
            })
            .then(function () {
                // return collLoaders.dropNS();
            });

        holder.startThens();

        return holder;
    }

    // processing start core action
    function onStart(){
        startUserSession(true);
    }

    // detect login action and trigger ev
    function startUserSession(startedAsLogged){
        if (!userWorking && isLoggedIn()){
            userWorking = true;
            app('app-loading').immediately();
            broadcast.trig(myAppEvs.onUserSessionStarted);
            logger.log('myAppEvs.onUserSessionStarted');
            // var userId = multiUser.getUserId();
            // collLoaders('profile').startLoadColls(userId);
            !startedAsLogged && broadcast.trig(myAppEvs.onLoggedIn);
        }
    }

    //checking login state
    function isLoggedIn(){
        var isLoggedIn = multiUser.isLoggedIn();
        return isLoggedIn;
    }

    function canOpenPage(){
        // is revision ok, and data is loaded
        return isLoggedIn();
    }

    // if (helper.isNative) {
    //     var notStoredPages = ['no-data'];
    //     rememberPage.init(true, notStoredPages);
    // }

    // define ACL for pages
    pageAuth.set({
        login: function(){
            var ret = !isLoggedIn();
            return ret;
        },
        bottom: canOpenPage,
        top: canOpenPage,
        categories: canOpenPage,
        expense: canOpenPage,
        analytic: canOpenPage,
        migrate: canOpenPage,
        settings: canOpenPage
    });

    app('my-app', myApp);

    app.onStartEnd(function () {

        broadcast.one(routeEvs.started, function () {
            var endTime = (new Date()).getTime();
            logger.warn('started at', helper.getTimeInterval(window._startTime, endTime));
        });
        onStart();
    });

    // app.wait();

})(window.app);
