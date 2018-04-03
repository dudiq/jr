(function (app) {
    var appEnv = app('app-env');
    var dataScheme = app('data-scheme');
    var promise = app('promise');
    var helper = app('helper');
    var logger = app('logger')('migrates');
    var broadcast = app('broadcast');
    var migrateEvs = broadcast.events('migrates', {
        onStart: 'oStart',
        onStop: 'oStop'
    });

    var KEY = 'scheme.version';
    var CODE_EMPTY_LIST = 'migrate.404';

    var newVersion = dataScheme.version;
    var oldVersion = getVersion();
    var list = {}; //key is old version

    function getVersion() {
        return appEnv(KEY) || 0;
    }

    function setVersion(v) {
        appEnv(KEY, v);
    }

    function getMigrateScripts(from, processors) {
        var item = list[from];
        if (item) {
            var to = item.to;
            processors.push(item.dumb);
            processors.push(item.processor);
            getMigrateScripts(to, processors);
        }
        return processors;
    }

    app('migrates', {
        getVersion: getVersion,
        setVersion: setVersion,
        needMigrate: function () {
            var needMigrate = (newVersion != oldVersion);
            return needMigrate;
        },
        migrate: function () {
            logger.info('start migrate from "%s" to "%s"', oldVersion, newVersion);
            var holder = promise();
            broadcast.trig(migrateEvs.onStart, {
                oldVersion: oldVersion,
                newVersion: newVersion
            });

            holder.catch(function (err, data) {
                // something goes wrong
                logger.error(err, data);
            });

            var procs = getMigrateScripts(oldVersion, []);
            if (!procs.length) {
                logger.error('no migrate scripts!!!');
                holder.reject(CODE_EMPTY_LIST);
                setVersion(newVersion);
            } else {
                helper.arrayWalk(procs, function (proc) {
                    holder.then(function () {
                        return proc();
                    });
                });

                holder.then(function () {
                    // update env
                    setVersion(newVersion);
                    broadcast.trig(migrateEvs.onStop, {
                        oldVersion: oldVersion,
                        newVersion: newVersion
                    });
                });
                holder.startThens();
            }


            return holder;
        },
        addMigrate: function (from, to, processor, dumb) {
            if (list[from]) {
                logger.error('migrate script for "%s" already exist!!!', from);
            } else {
                if (!dumb){
                    logger.error('migrate NEED dumb scripts before migrate to new scheme data');
                } else {
                    list[from] = {
                        from: from,
                        to: to,
                        processor: processor,
                        dumb: dumb
                    };
                }
            }
        }
    });
})(window.app);
