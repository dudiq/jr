(function(){
    var app = window.app;
    var route = app('route');
    var helper = app('helper');
    var confirmPlugin = app('confirm');
    var translate = app('translate');
    var logger = app('logger')('close-back');

    var broadcast = app('broadcast');
    var routeEvs = broadcast.events('route');
    var naviEvs = broadcast.events('navigation');

    var closeBack = app('close-back', {});

    var DEF_MAX_CLICKS = 2;
    var CONST_MAX_CLICKS = DEF_MAX_CLICKS;

    var pathHash = [];

    var timerId;

    // set 0 to disable back close
    closeBack.setMaxClicks = function(val){
        if (!val){
            val = DEF_MAX_CLICKS;
        }
        CONST_MAX_CLICKS = val;
    };

    function closeHandler(){
        // cap
    }

    function closeApp(){
        pathHash.clear();
        var mainTitle = translate.getTranslate("closeBack");
        confirmPlugin.confirm(mainTitle, closeHandler, function(){
            // cancel processing
            pathHash.clear();
        });
    }

    function detectClose(){
        var str = pathHash.join(' # ');
        logger.log(str);

        var check = pathHash.reverse();
        if (check.length >= CONST_MAX_CLICKS){

            var firstEl = check[0];
            if (firstEl.lastIndexOf('true') == firstEl.length - 4){
                // last command must be with default action
                var canClose = true;
                for (var i = 0; i < CONST_MAX_CLICKS; i++){
                    if (check[i] != check[i + 2]){
                        canClose = false;
                        break;
                    }
                }

                if (canClose) {
                    closeApp();
                }
            }
        }
    }

    function pushBack(location, isDefault){
        pathHash.push(location + isDefault);
        if (pathHash.length >= 10){
            pathHash.splice(0, 1);
        }
        startDetect();
    }

    function stopDetect(){
        clearTimeout(timerId);
    }

    function startDetect(){
        stopDetect();
        timerId = setTimeout(function(){
            detectClose();
        }, 100);
    }


    function defineCloseBack() {

        broadcast.on(routeEvs.changed, function (data) {
            // pushBack(data.location, data.useDefault);
        });

        broadcast.on(naviEvs.onChanged, function () {
            // drop total inactive back clicks
            // pathHash.clear();
        });

        // route.register('/__drop__', function () {
            // processing back click to terminate app
        // });
    }

    if (helper.isNative) {
        defineCloseBack();
    }

    helper.onStart(function(){

        if (navigator.app && navigator.app.exitApp) {
            closeHandler = navigator.app.exitApp;
        } else if (navigator.device && navigator.device.exitApp) {
            closeHandler = navigator.device.exitApp;
        }

    });

})();
