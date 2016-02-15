(function(){
    var app = window.app;

    var helper = app('helper');
    var translate = app('translate');
    var cordovaDevice = app('cordova-device');

    var confirmPlugin = app('confirm', {});

    var isNative = helper.isNative;
    var windowConfirm = window.confirm;
    var windowPrompt = window.prompt;
    var navigatorNotify;

    // delay need for correct processing messages in browser and native apps
    function delay(cb){
        setTimeout(function(){
            cb();
        }, 10);
    }

    confirmPlugin.alert = function(msg){
        var title = translate.getTranslate('title');
        delay(function(){
            if (isNative && navigatorNotify) {
                navigatorNotify.alert(msg, function(){}, title);
            } else {
                alert(msg);
            }
        });
    };

    confirmPlugin.confirm = function(msg, btns, onDone, onCancel){
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
                navigatorNotify.confirm(msg, function(btn){
                    (btn == 1) ? onDone() : onCancel && onCancel();
                    onDone = null;
                    onCancel = null;
                }, title, btns);
            } else {
                if (windowConfirm(msg)) {
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
                navigatorNotify.prompt(msg, function(res){
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
                var res = windowPrompt(msg, defStr);
                (res !== null) ? onDone(res) : (onCancel && onCancel());
                onDone = null;
            }
        });

    };

    cordovaDevice.onReady(function(){
        navigatorNotify = navigator.notification;
    });

})();