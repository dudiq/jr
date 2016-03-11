(function () {
    var app = window.app;
    var navi = app('navigation');
    var watchScope = app('watch-scope');
    var notify = app('notify');
    var logger = app('logger')('second-page');
    var ShowMoreClass = app('show-more-class');

    function fillArray(arr, scope, total) {
        //console.profile();
        var t1 = (new Date).getTime();

        var l = scope.totalCount = total;
        console.log('initial elements: ' + (l));
        for (var i = 0; i < l; i++) {
            arr.push({
                checked: (i == 5),
                radio: (i == 5),
                select: 1,
                label: 'this is ' + i + ' element'
            });
        }

        var t2 = (new Date).getTime();
        var t3 = (new Date).getTime();

        scope.arrayTime = t2 - t1;
        scope.watchTime = t3 - t2;
        scope.totalTime = t3 - t1;
        //console.profileEnd();
    }


    app('pages').create({
        id: 'second',
        weight: 1.5,
        init: function(){
            var scope = this.scope = {
                t: {
                    val: 10
                },
                arrayTime: 0,
                watchTime: 0,
                totalTime: 0,
                totalCount: 0,
                noUsers: true,
                val: 1,
                arrView: [],
                arr: []
            };


            this.viewList = ShowMoreClass({
                max: 5,
                scopeList: scope.arrView,
                createItem: function(item){
                    return {
                        id: item.id,
                        label: item.label,
                        value: item.value
                    }
                },
                isItemsEqual: function(oldItem, item){
                    var ret = (oldItem.id == item.id) &&
                            oldItem.label == item.label &&
                            oldItem.value == item.value;
                    return ret;
                },
                updateItem: function(oldItem, item){
                    oldItem.id = item.id;
                    oldItem.value = item.value;
                    oldItem.label = item.label;
                }
            });
        },
        prepareDomContent: function (content) {
            var self = this;
            this.scopeWatcher && this.scopeWatcher.destroy();

            content.find(".btn-first").on("jrclick", function () {
                navi.switchPage('main');
            });

            content.find(".btn-popup").on("jrclick", function () {
                app('pages')('popup').showPopup();
            });

            content.find(".btn-second").on("jrclick", function () {
                notify.info('hello');
                navi.switchPage('tree');
            });

            content.find('.btn-show-more').on('jrclick', function(){
                self.viewList.showMore();
            });

            var scope = this.scope;

            var sw = this.scopeWatcher = watchScope.watch(content, scope);

            sw.on('change', function () {
                //console.log(arguments);
            });

            watchScope.watch("arr", scope, function () {
                //console.log(arguments);
            });

            scope.val = 10;

            window.$scope = scope;

            setTimeout(function () {
                var arr = scope.arrView;
                arr.clear();
                fillArray(arr, scope, 1000);
                setTimeout(function () {
                    logger.log('remove time', 'started');
                    var t1 = (new Date).getTime();
                    //console.profile();
                    arr.clear();
                    //console.profileEnd();
                    var t2 = (new Date).getTime();
                    var dx = t2 - t1;
                    logger.log('remove time', 'done', dx);
                }, 2000);
            }, 1000);

            var checkList = [];

            for (var i = 0; i < 500; i++){
                checkList.push({
                    id: (i + 1),
                    label: 'label ' + (i + 1),
                    value: i
                });
            }
            //this.viewList.setData(checkList);
        }
    });

})();