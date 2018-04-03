(function (app) {
    var collExpense = app('coll-expense');
    var collCategory = app('coll-category');
    var collPouch = app('coll-pouch');
    var promise = app('promise');
    var cordovaFile = app('cordova-file');
    var cordovaUtils = app('cordova-file-utils');
    var tp = app('time-processor');
    var logger = app('logger')('migrate.js');
    var notify = app('notify');
    var appMigrates = app('migrates');

    var exportParams = {
        limit: 0,
        withRemoved: true
    };

    // function insertExpense(max) {
    //     var helper = app('helper');
    //     var collExpense = app('coll-expense');
    //     for (var i = 0; i < max; i++) {
    //         var item = {
    //             "id": helper.mongoId(),
    //             "time": 1516735546382,
    //             "cost": 3600,
    //             "desc": "",
    //             "state": -1,
    //             "catId": "5a2315c4140f334092bb38ba"
    //         };
    //         collExpense.pushExpense(item);
    //     }
    // }

    function exportData() {
        var ret = {
            expense: null,
            category: null,
            pouch: null
        };
        var holder = promise();
        holder
            .then(function () {
                return collExpense.getExpenses(exportParams);
            })
            .then(function (expList) {
                ret.expense = expList;
                return collCategory.getCategoriesWithRemoved();
            })
            .then(function (catList) {
                ret.category = catList;
                return collPouch.getPouches();
            })
            .then(function (pouchList) {
                ret.pouch = pouchList;
                return ret;
            });
        holder.startThens();
        return holder;
    }

    function importData(obj) {
        var holder = collCategory.fillCategory(obj.category)
            .then(function () {
                return collExpense.fillExpense(obj.expense);
            })
            .then(function () {
                if (obj.pouch) {
                    return collPouch.fillPouch(obj.pouch);
                }
            });
        return holder;
    }

    function saveToFile(data, cb) {
        var time = tp.format(new Date(), 'yyyy-mm-dd_hh-m-s');
        var folder = cordovaUtils.getSharedDocumentsDir();
        var path = folder + 'coinote-' + time + '.json';
        logger.log('path', path);
        cordovaFile.writeFile(path, data, function (err, res) {
            logger.log(err, res);
            cb && cb(err, res, path);
        });
    }

    app('data-processor')({
        'migrate.importData': importData,
        'migrate.export': function () {
            notify.clear();
            exportData()
                .catch(function () {
                    // wrong something
                })
                .then(function (data) {
                    // save to file
                    var saveData = {
                        dbVersion: appMigrates.getVersion(),
                        stats: {
                            expenses: data.expense.length,
                            cats: data.category.length,
                            pouch: data.pouch.length
                        },
                        data: data
                    };
                    var str = JSON.stringify(saveData);
                    var saveStr = LZString.compressToBase64(str);
                    // :todo save version of DB
                    saveToFile(saveStr, function (err, data, path) {
                        // end animate
                        if (!err) {
                            notify.info('{{migrate.exportDone}} ' + path);
                        } else {
                            notify.error('{{migrate.error}}');
                        }
                    });
                });
        },
        'migrate.fileImport': function (code, files) {
            if (!code) {
                var file = files[0];
                notify.clear();
                cordovaFile.readTextFile(file, function (err, metaData) {
                    if (!err) {
                        var obj;
                        try {
                            var str = LZString.decompressFromBase64(metaData);
                            if (!str) {
                                str = metaData;
                            }
                            obj = JSON.parse(str);
                        }
                        catch (e) {
                            obj = null;
                            logger.error(e);
                        }
                        if (obj) {
                            var data = obj;
                            if (obj.data) {
                                // old import support
                                data = obj.data;
                                appMigrates.setVersion(obj.dbVersion);
                            }
                            importData(data)
                                .catch(function (err) {
                                    notify.error('{{migrate.error}}');
                                })
                                .then(function (res) {
                                    notify.info('{{migrate.importDone}}');
                                    location.reload();
                                });
                        } else {
                            notify.error('{{migrate.error}}');
                            logger.error(obj);
                        }

                    } else {
                        notify.error('{{migrate.error}}');
                        logger.error(err, metaData);
                    }
                });
            }
            logger.log(file);
        }
    });


})(window.app);
