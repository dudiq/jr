(function (app) {

    var cordovaDevice = app('cordova-device');
    var sqliteDb = app('sqlite-db');
    var logger = app('logger')('sql-storage-api');
    var scheme = app('data-scheme');
    var migrates = app('migrates');
    var broadcast = app('broadcast');
    var storageEvs = broadcast.events('storage-api', {
        onCreate: 'onCreate'
    });

    var myDB = sqliteDb('my-db');
    var waiter = app.wait('sql-storage-api');

    app('sql-storage-api', myDB);

    function onEnd() {
        broadcast.trig(storageEvs.onCreate);
        waiter();
    }

    function initScheme() {
        myDB.initDb(function (err, data) {
            if (err){
                logger.error(err, data);
            }
            if ((migrates.getVersion() === 0) || migrates.needMigrate()) {
                myDB.createTables(scheme)
                    .catch(function (e) {
                        logger.error('scheme err', e);
                        onEnd();
                    })
                    .then(function () {
                        logger.log('scheme create done');
                        onEnd();
                    });
            } else {
                onEnd();
            }
        });
    }

    cordovaDevice.onReady(function () {
        initScheme();
    });

})(window.app);
