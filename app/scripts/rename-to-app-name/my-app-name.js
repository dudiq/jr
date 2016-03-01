(function(){
    // plan review main code
    // communications between jr and plan review

    var app = window.app;
    var route = app('route');
    var pageAuth = app('page-auth');
    var helper = app('helper');
    var userMod = app('user');
    var navi = app('navigation');
    var rememberPage = app('remember-page');

    rememberPage.init(true);

    var myApp = app('my-app', {});

    myApp.logout = function(){
        userMod.removeUser();
        navi.switchPage('login');
    };

    function isLoggedIn(){
        return userMod.isLoggedIn();
    }

    function openPages(){
        //make list of default pages for redirect, when url changed manually or app started
        rememberPage.open(['main', 'login']);
    }

    function onStart(){

        //redirect if user logged in or not

        route.register('/_default', function(){
            openPages();
        });

        openPages();
    }

    // define rules for access to pages
    // not required for simple pages
    pageAuth.set({
        login: function(){
            return !isLoggedIn();
        },
        main: isLoggedIn,
        second: isLoggedIn,
        thr: isLoggedIn,
        popup: isLoggedIn,
        gestures: isLoggedIn,
        tree: isLoggedIn
    });

    // for showing, how waiter works, added this timeout
    var timeWaiter = app.wait();
    setTimeout(function(){
        timeWaiter();
    }, 1000);

    helper.onStartEnd(function(){
        onStart();
    });

})();