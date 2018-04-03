(function (app) {
    var helper = app('helper');
    var translate = app('translate');
    var cordovaDevice = app('cordova-device');

    var isNative = helper.isNative;

    var navigatorNotify;

    app('confirm', {
        alert: function (msg) {
            var tMsg = translate.text(msg);
            var title = translate('title');
            delay(function () {
                if (isNative && navigatorNotify) {
                    navigatorNotify.alert(tMsg, function () {
                    }, title);
                } else {
                    alert(tMsg);
                }
            });
        },
        confirm: function (msg, btns, onDone, onCancel) {
            var tMsg = translate.text(msg);
            var title = translate('title');
            var yesMsg = translate('confirm.yes');
            var noMsg = translate('confirm.no');
            if (typeof btns == "function") {
                onCancel = onDone;
                onDone = btns;
                btns = [yesMsg, noMsg];
            }

            delay(function () {
                if (isNative && navigatorNotify) {
                    navigatorNotify.confirm(tMsg, function (btn) {
                        (btn == 1) ? onDone() : onCancel && onCancel();
                        onDone = null;
                        onCancel = null;
                    }, title, btns);
                } else {
                    if (window.confirm(tMsg)) {
                        onDone();
                    } else {
                        onCancel && onCancel();
                    }
                    onDone = null;
                    onCancel = null;
                }
            });
        },

        prompt: function (msg, defStr, btns, onDone, onCancel) {
            defStr = defStr || '';
            var tMsg = translate.text(msg);
            var title = translate('title');
            var yesMsg = translate('prompt.add');
            var noMsg = translate('prompt.cancel');
            if (typeof btns == "function") {
                onCancel = onDone;
                onDone = btns;
                btns = [yesMsg, noMsg];
            }

            delay(function () {
                if (isNative && navigatorNotify) {
                    navigatorNotify.prompt(tMsg, function (res) {
                        if (res.buttonIndex == 1) {
                            onDone(res.input1);
                        } else {
                            onCancel && onCancel();
                        }
                        onDone = null;
                        onCancel = null;
                    }, title, btns, defStr);
                } else {
                    var res = window.prompt(tMsg, defStr);
                    (res !== null) ? onDone(res) : (onCancel && onCancel());
                    onDone = null;
                }
            });

        }
    });

    // delay need for correct processing messages in browser and native apps
    function delay(cb) {
        setTimeout(function () {
            cb();
        }, 10);
    }

    cordovaDevice.onReady(function () {
        navigatorNotify = navigator.notification;
    });

})(window.app);
