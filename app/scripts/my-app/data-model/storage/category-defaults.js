(function (app) {
    var sqlStorageApi = app('sql-storage-api');
    var helper = app('helper');
    var appEnv = app('app-env');
    var dataProcessor = app('data-processor');
    var broadcast = app('broadcast');
    var storageEvs = broadcast.events('storage-api');
    var KEY = 'category.defaults-set';


    var defList = [{
        id: "123456", title: "First", catId: null
    }];


    dataProcessor('categories.defaults', function () {
        var setList = [];
        helper.arrayWalk(defList, function (item) {
            setList.push([item.id, item.title, item.catId]);
        });

        return sqlStorageApi.createRecords('categories',
            ['id', 'title', 'catId'],
            setList
        );
    });


    var waiter = app.wait('sql-storage-api');
        broadcast.one(storageEvs.onCreate, function () {
            var isStoredDefaults = appEnv(KEY);
            if (!isStoredDefaults) {
                dataProcessor('categories.defaults')()
                    .catch(function () {
                        waiter();
                    })
                    .then(function () {
                        appEnv(KEY, true);
                        waiter();
                    });
            } else {
                waiter();
            }
        });

})(window.app);
