(function(){
    var app = window.app;

    var helper = app('helper');
    var translate = app('translate');
    var templater = app('templater');
    var cordovaDevice = app('cordova-device');
    var deviceOs = app('device-os');

    var confirmPlugin = app('confirm', {});

    var isNative = helper.isNative;
    var windowConfirm = window.confirm;
    var windowPrompt = window.prompt;
    var navigatorNotify;
    var $body;

    var windowClassName = 'windows8-fix-prompt-position';

    var isWindows = deviceOs.os() == deviceOs.TYPE_WINDOWS;

    // delay need for correct processing messages in browser and native apps
    function delay(cb){
        setTimeout(function(){
            cb();
        }, 10);
    }

    confirmPlugin.alert = function(msg){
        var tMsg = templater.translate(msg);
        var title = translate.getTranslate('title');
        delay(function(){
            if (isNative && navigatorNotify) {
                navigatorNotify.alert(tMsg, function(){}, title);
            } else {
                alert(tMsg);
            }
        });
    };

    confirmPlugin.confirm = function(msg, btns, onDone, onCancel){
        var tMsg = templater.translate(msg);
        var title = translate.getTranslate('title');
        var yesMsg = translate.getTranslate('confirm.yes');
        var noMsg = translate.getTranslate('confirm.no');
        if (typeof btns == "function") {
            onCancel = onDone;
            onDone = btns;
            btns = [yesMsg, noMsg];
        }

        delay(function() {
            if (isNative && navigatorNotify) {
                fixWindows8Position(true);
                navigatorNotify.confirm(tMsg, function(btn){
                    fixWindows8Position(false);
                    (btn == 1) ? onDone() : onCancel && onCancel();
                    onDone = null;
                    onCancel = null;
                }, title, btns);
            } else {
                if (windowConfirm(tMsg)) {
                    onDone();
                } else {
                    onCancel && onCancel();
                }
                onDone = null;
                onCancel = null;
            }
        });
    };

    confirmPlugin.prompt = function(msg, btns, onDone, onCancel){
        var tMsg = templater.translate(msg);
        var title = translate.getTranslate('title');
        var yesMsg = translate.getTranslate('prompt.add');
        var noMsg = translate.getTranslate('prompt.cancel');
        if (typeof btns == "function") {
            onCancel = onDone;
            onDone = btns;
            btns = [yesMsg, noMsg];
        }

        delay(function(){
            if (isNative && navigatorNotify) {
                fixWindows8Position(true);
                navigatorNotify.prompt(tMsg, function(res){
                    fixWindows8Position(false);
                    if (res.buttonIndex == 1){
                        onDone(res.input1);
                    } else {
                        onCancel && onCancel();
                    }
                    onDone = null;
                    onCancel = null;
                }, title, btns, '');
            } else {
                var defStr = "";
                var res = windowPrompt(tMsg, defStr);
                (res !== null) ? onDone(res) : (onCancel && onCancel());
                onDone = null;
            }
        });

    };

    function fixWindows8Position(showLast){
        if (isWindows){
            !$body && ($body = app('top-dom-elements').getBody());
            if (showLast){
                $body.addClass(windowClassName);
            } else{
                $body.removeClass(windowClassName);
            }
        }
    }

    cordovaDevice.onReady(function(){
        navigatorNotify = navigator.notification;
    });

})();
