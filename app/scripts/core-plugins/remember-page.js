(function(){
    var app = window.app;
    var localStorage = app('local-storage');
    var route = app('route');
    var broadcast = app('broadcast');
    var routeEvs = broadcast.getEvents('route');

    var rememberPage = app('remember-page', {});

    var enable = false;

    var CONST_KEY = 'remember-page-plugin';

    var savedPagePath = localStorage(CONST_KEY);

    var notStoredPages = {};

    var noInit = false;

    function onChanged(){
        var pageAlias = route.getPageAlias();
        savedPagePath = route.location();

        if (savedPagePath != '/__drop__' && !notStoredPages[pageAlias]){
            localStorage(CONST_KEY, savedPagePath);
        }
    }

    rememberPage.enable = function(){
        enable = true;
        broadcast.off(routeEvs.changed, onChanged);
        broadcast.on(routeEvs.changed, onChanged);
    };

    rememberPage.disable = function(){
        enable = false;
        broadcast.off(routeEvs.changed, onChanged);
    };

    rememberPage.status = function(){
        return enable;
    };

    rememberPage.value = function(){
        return savedPagePath;
    };

    rememberPage.noInit = function(){
        noInit = true;
    };

    rememberPage.init = function(notStored){
        this.enable();
        if (!noInit) {
            if (notStored && notStored.length) {
                for (var i = 0, l = notStored.length; i < l; i++) {
                    var key = notStored[i];
                    notStoredPages[key] = true;
                }
            }
            if (route.location() != savedPagePath && savedPagePath) {
                route.pushState(this.value());
            }
        }
    };

})();