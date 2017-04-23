/*
 * plugin for process cordova device events and methods
 *
 *
 *
 * */
(function(){
    var app = window.app;
    var broadcast = app('broadcast');
    var helper = app('helper');
    var logger = app('logger')('cordova-device');

    var deviceEvs = broadcast.events('device', {
        _ready: '_ready', // for internal use only
        pause: 'pause',
        menubutton: 'menubbtn',
        resume: 'resume',
        searchbutton: 'searchbtn'
    });

    var isReady = false;
    var isDomReady = false;
    var isNative = helper.isNative;

    // wait cordova device ready for start app correctly
    var appWaiter = app.wait('cordova-device');

    var deviceObject = {};

    app('cordova-device', {
        // return cordova device object or empty object, if not defined
        getDevice: function () {
            return deviceObject;
        },
        isReady: function () {
            return isReady && isDomReady;
        },
        onReady: function (method) {
            if (isReady && isDomReady){
                method();
            } else {
                broadcast.one(deviceEvs._ready, method);
            }
        },
        onPause: function (cb) {
            broadcast.on(deviceEvs.pause, cb);
        },
        onResume: function (cb) {
            broadcast.on(deviceEvs.resume, cb);
        }
    });

    // bind to device events and trigger them into app
    function bindDeviceEvents(){
        document.addEventListener("pause", function(ev){
            broadcast.trig(deviceEvs.pause, ev);
            logger.log('on pause');
        }, false);
        document.addEventListener("resume", function(ev){
            broadcast.trig(deviceEvs.resume, ev);
            logger.log('on resume');
        }, false);
        document.addEventListener("menubutton", function(ev){
            broadcast.trig(deviceEvs.menubutton, ev);
            logger.log('on menubutton');
        }, false);
        // please, don't bind backbutton click. this is processed by router
        //document.addEventListener("backbutton", function(ev){
        //    broadcast.trig(deviceEvs.backbutton, ev);
        //}, false);
        document.addEventListener("searchbutton", function(ev){
            broadcast.trig(deviceEvs.searchbutton, ev);
            logger.log('on searchbutton');
        }, false);
    }

    function fillDeviceObject(windowDevice){
        if (windowDevice){
            for (var key in windowDevice){
                deviceObject[key] = windowDevice[key];
            }
        }
    }

    // need check as dom ready and device ready, because windows `device ready` event triggered to fast, and code works incorrect
    function checkDeviceReady() {
        if (isDomReady && isReady) {
            fillDeviceObject(window['device']);
            isNative && bindDeviceEvents();
            appWaiter();
            broadcast.trig(deviceEvs._ready);
        }
    }

    function onCordovaDeviceReady(){
        document.removeEventListener("deviceready", onCordovaDeviceReady, false);
        isReady = true;
        checkDeviceReady();
    }

    if (isNative){
        document.addEventListener("deviceready", onCordovaDeviceReady, false);
    } else {
        onCordovaDeviceReady();
    }


    helper.onDomReady(function () {
        isDomReady = true;
        checkDeviceReady();
    });

})();
