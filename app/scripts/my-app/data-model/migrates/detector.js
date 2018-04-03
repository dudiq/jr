(function (app) {
    var migrates = app('migrates');
    var broadcast = app('broadcast');
    var storageEvs = broadcast.events('storage-api');

    var waiter = app.wait('migrates.detector');

    broadcast.one(storageEvs.onCreate, function () {
        if (migrates.needMigrate()) {
            // run migrate scripts dependencies
            migrates.migrate()
                .catch(function (err, data) {
                    // todo show error migrate!!!
                    waiter();
                })
                .then(function () {
                    waiter();
                });
        } else {
            waiter();
        }
    });

})(window.app);
