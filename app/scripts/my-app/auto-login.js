(function (app) {
    var cordovaDevice = app('cordova-device');
    var multiUser = app('multi-user');

    var waiter = app.wait('auto-login');
    cordovaDevice.onReady(function () {
        waiter();
        var device = cordovaDevice.getDevice();
        if (!multiUser.isLoggedIn()){
            // for always init user by device
            multiUser.putUser({
                id: device.uuid,
                fields: device
            });

            // create first pouch

        }
    });


})(window.app);
