(function(){
    var app = window.app;
    var route = app('route');
    var helper = app('helper');
    var rememberPage = app('remember-page');
    var deviceOs = app('device-os');
    var pageAuth = app('page-auth');
    var pages = app('pages');
    var broadcast = app('broadcast');
    var openAppByUrlEvs = broadcast.events('open-app-by-url',{
        onOpen: 'onOpen'
    });

    function initLaunchAppByUrl(){
        var windowLoc = window.location + '';
        var replaceUrl = 'plotpad:///';
        if (windowLoc.indexOf('#') != -1){
            replaceUrl = 'plotpad:///#' + windowLoc.split('#')[1];
        }

        var iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = replaceUrl;
        iframe.onload = function(){
            window.location.href = replaceUrl;
        };

        document.body.appendChild(iframe);

        setTimeout(function(){
            iframe.src = '';
            document.body.removeChild(iframe);
            iframe = null;
        }, 3000);
    }

    function pushState(url){
        var paths = url.split('/');
        var id;
        if (paths.length){
            id = paths[0];
            if (!id){
                id = paths[1];
            }
        }
        var pushed = false;
        if (id && ((pages(id) && pageAuth(id) !== false) || !pages(id))) {
            pushed = true;
            route.pushState(url);
        }
        broadcast.trig(openAppByUrlEvs.onOpen, {
            url: url,
            pageId: id,
            pushed: pushed
        });
    }

    function defineUrlCatcher(){

        // This method is needed to run the installed application when opening links through the browser.
        // The application uses for this special plug https://github.com/EddyVerbruggen/Custom-URL-scheme
        window.handleOpenURL = function (url) {
            url = url.replace('plotpad:///#/', '');
            pushState(url);
            rememberPage.remember();
        };
    }

    if (helper.isNative){
        defineUrlCatcher();
    } else {
        //must run only in NON native mode, in any browser
        var devOs = deviceOs.os();
        if (helper.isMobile || devOs == deviceOs.TYPE_ANDROID){
            initLaunchAppByUrl();
        }
    }

})();