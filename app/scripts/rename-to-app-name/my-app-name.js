(function(){
    // plan review main code
    // communications between jr and plan review

    var app = window.app;
    var route = app('route');
    var pageAuth = app('page-auth');
    var helper = app('helper');
    var userMod = app('user');
    var navi = app('navigation');

    var myApp = app('my-app', {});

    myApp.logout = function(){
        userMod.removeUser();
        navi.switchPage('login');
    };

    function defaultRedirect(){
        var isLogged = isLoggedIn();
        if (isLogged){
            // if location in login page and user logged in, go to main page
            navi.switchPage('main');
        } else if (!isLogged){
            navi.switchPage('login');
        }
    }

    function isLoggedIn(){
        return userMod.isLoggedIn();
    }

    function onStart(){

        //redirect if user logged in or not

        route.register('/_default', function(){
            defaultRedirect();
        });

        if (!isLoggedIn()){
            navi.switchPage('login');
        } else {
            defaultRedirect();
        }
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