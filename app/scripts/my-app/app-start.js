(function(app){
    var helper = app('helper');
    var route = app('route');
    var deviceOs = app('device-os');
    var navi = app('navigation');
    var storage = app('storage');
    var translate = app('translate');
    var myApp = app('my-app');
    var notify = app('notify');

    var broadcast = app('broadcast');
    var translateEvs = broadcast.events('translate');
    var myAppEvs = broadcast.events('my-app');

    var STORAGE_KEY_LOGIN_PARAMS = 'lpp';

    function openPages(){
        //make list of default pages for redirect, when url changed manually or app started
        myApp.openDefaultPages();
    }

    function setHtmlDocumentStyles(){
        // define os-type-[device]
        var typeDevice = deviceOs.os();
        var root = document.getElementsByTagName( 'html' )[0];
        root.className += ' os-type-' + typeDevice;


        // define is-native

        var appMode = ' mode-is-' + (helper.isNative ? 'native' : 'web');
        if (helper.support.touch){
            appMode += ' is-support-touch';
        }
        root.className += appMode;
    }

    function setDocTitle(){
        document.title = translate('docTitle');
    }

    function bindEvents(){
        broadcast.on(myAppEvs.onLogout, function(){
            notify.clean();
            storage.remove(STORAGE_KEY_LOGIN_PARAMS);
            openPages();
        });
        broadcast.on(translateEvs.onLangSet, setDocTitle);
    }

    function onStart(){
        setHtmlDocumentStyles();
        setDocTitle();
        bindEvents();

        navi.onDefaultPage(function () {
            openPages();
        });

        var routeParamsArgs = route.getSubKeys();
        var pageId = route.getFieldValueByIndex(0);

        var routeCmd = app('route-commander');

        var dropAliases = ['register', 'start'];

        if (dropAliases.indexOf(pageId) != -1){
            myApp.logout();
        }

        var lpp = {
            pageId: pageId,
            routeParams: routeParamsArgs,
            params: routeCmd.getAll()
        };

        storage.set(STORAGE_KEY_LOGIN_PARAMS, lpp);

        openPages();
    }

    app.onStartEnd(onStart);

})(window.app);
