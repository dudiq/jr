(function(){
    var app = window.app;
    var ls = app('local-storage');
    var route = app('route');
    var helper = app('helper');
    var pageAuth = app('page-auth');
    var navi = app('navigation');
    var broadcast = app('broadcast');
    var logger = app('logger')('remember-page');
    var routeEvs = broadcast.events('route');

    var rememberPage = app('remember-page', {});

    var enable = false;

    var CONST_KEY = 'remember-page-plugin';

    var savedPagePath = ls(CONST_KEY);

    var notStoredPages = {};

    function onChanged(){
        var pageAlias = route.getPageAlias();
        var prePath = route.location();

        if (prePath != '/__drop__' && !notStoredPages[pageAlias]){
            savedPagePath = prePath;
            ls(CONST_KEY, prePath);
        }
    }

    rememberPage.remember = function(){
        onChanged();
    };

    rememberPage.enable = function(){
        enable = true;
        broadcast.off(routeEvs.changed, onChanged);
        broadcast.on(routeEvs.changed, onChanged);
    };

    rememberPage.disable = function(){
        enable = false;
        broadcast.off(routeEvs.changed, onChanged);
    };

    // start remember page
    //
    // isEnable - set true/false for plugin
    // notStored - page ids for no storing in plugin
    rememberPage.init = function(isEnable, notStored){
        isEnable && this.enable();
        if (notStored && notStored.length) {
            for (var i = 0, l = notStored.length; i < l; i++) {
                var key = notStored[i];
                notStoredPages[key] = true;
            }
        }
    };

    // define pages in priority list
    // rememberPage.open(['main', 'login', 'settings', etc...]);
    // if some of page will not access, plugin asc next in list.
    // and when founded with access, will trying to show this page
    //
    // accessPages - priority pages. first - is main priority
    rememberPage.open = function(accessPages){
        var loc = savedPagePath || route.location();
        if (pageAuth(route.getPageAlias(loc))){
            // checking access to saved path page id, if ok, do redirect
            route.pushState(loc);
        } else {
            doDefaultRedirect(accessPages);
        }
    };

    function doDefaultRedirect(pages){
        var redirected = false;
        for (var i = 0, l = pages.length; i < l; i++){
            var pageId = pages[i];
            if (pageAuth(pageId)){
                redirected = true;
                logger.warn('address page redirected to default');
                navi.switchPage(pageId);
                break;
            }
        }
        if (!redirected){
            logger.error('something wrong with redirect of page, please see rules and workflow of opening pages');
        }
    }

})();