(function (app) {
    var logger = app('logger')('data-event');
    var broadcast = app('broadcast');

    var _dataEventsEv = broadcast.events('_data-event', {
        onChanged: 'onChanged',
        onAdded: 'onAdded',
        onRemoved: 'onRemoved',
        onUpdated: 'onUpdated'
    });

    var storage = {};
    var sep = '[***]';

    function getMsg(msg, key) {
        return msg + sep + key;
    }

    function keyError(key, methodName) {
        if (!key) {
            logger.error(methodName, 'key is not defined!');
        }
    }

    app('data-event', {
        clearBlock: function (key) {
            keyError(key, 'clearBlock');
            delete storage[key];
            broadcast.trig(getMsg(_dataEventsEv.onRemoved, key));
            broadcast.trig(getMsg(_dataEventsEv.onChanged, key));
        },
        putBlock: function (key, data) {
            if (!app.started) {
                return;
            }
            keyError(key, 'putBlock');
            if (storage.hasOwnProperty(key)){
                var oldData = storage[key];
                storage[key] = data;
                broadcast.trig(getMsg(_dataEventsEv.onUpdated, key), data, oldData);
            } else {
                storage[key] = data;
                broadcast.trig(getMsg(_dataEventsEv.onAdded, key), data);
            }
            broadcast.trig(getMsg(_dataEventsEv.onChanged, key), data);
        },
        onBlock: function (key, cb) {
            keyError(key, 'onBlock');
            if (storage.hasOwnProperty(key)){
                cb(storage[key]);
            }
            broadcast.on(getMsg(_dataEventsEv.onChanged, key), cb);
        },
        offBlock: function (key, cb) {
            keyError(key, 'offBlock');
            broadcast.off(getMsg(_dataEventsEv.onChanged, key), cb);
        }
    });

    app('my-app').onStorageCleanup(function () {
        for (var key in storage){
            delete storage[key];
        }
    });

})(window.app);
