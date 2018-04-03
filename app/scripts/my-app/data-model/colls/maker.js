(function (app) {

    var sqlStorageApi = app('sql-storage-api');
    var helper = app('helper');
    var dataScheme = app('data-scheme');
    var dataEvent = app('data-event');
    var logger = app('logger')('coll-[basic]::maker');

    function CollectionBaseClass(name, params){
        this._name = name;
        this._params = params = params || {};
        var blockActions = params.blockActions || {};
        helper.defineFieldsPrefix(name + '.', blockActions);
    }

    helper.extendClass(CollectionBaseClass, {
        fillCollection: function (tableName, data) {
            var schemeFields = dataScheme.getFieldsNames(tableName);
            var setList = [];
            helper.arrayWalk(data, function (item) {
                var node = [];
                helper.arrayWalk(schemeFields, function (schemeItem) {
                    node.push(item[schemeItem]);
                });
                setList.push(node);
            });
            var scheme = dataScheme.getScheme(tableName);
            var storage = this.getStorage();
            // clear coll
            // fill coll
            var holder = storage.dropTable(tableName)
                .then(function () {
                    return storage.createTables(scheme);
                })
                .then(function () {
                    return storage.createRecords(tableName, schemeFields, setList);
                });
            return holder;
        },
        getParams: function () {
            return this._params;
        },
        getStorage: function () {
            return sqlStorageApi;
        },
        getBlockActions: function () {
            return this._params.blockActions;
        },
        pushToColl: function (TABLE_NAME, data) {
            var blockActions = this.getBlockActions();
            return this.getStorage().createRecord(TABLE_NAME, data)
                .catch(function (e) {
                    logger.error(e);
                })
                .then(function () {
                    logger.log('done');
                    // done
                    dataEvent.putBlock(blockActions.PUSH, data);
                });

        },
        updateColl: function (TABLE_NAME, id, toUpdate) {
            var blockActions = this.getBlockActions();
            return this.getStorage().updateRecord(TABLE_NAME, 'id = ?', [id], toUpdate)
                .then(function () {
                    dataEvent.putBlock(blockActions.UPDATE, {
                        id: id,
                        newFields: toUpdate
                    });
                });
        },
        removeFromColl: function (TABLE_NAME, id) {
            var dateEnd = (new Date).getTime();
            var blockActions = this.getBlockActions();
            return this.getStorage().updateRecord(TABLE_NAME, 'id = ?', [id], {
                dateEnd: dateEnd
            })
                .then(function () {
                    dataEvent.putBlock(blockActions.REMOVE, id);
                });

        }
    });

    app('collection-maker', function (name, methods, params) {
        var CollClass = helper.createClass(CollectionBaseClass, methods);

        var item = new CollClass(name, params);
        app(name, item);
        return item;
    });

})(window.app);
