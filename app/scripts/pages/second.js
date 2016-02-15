(function(){
    var app = window.app;
    var pages = app('pages');
    var helper = app('helper');
    var navi = app('navigation');
    var watchScope = app('watch-scope');
    var notify = app('notify');

    var page = pages.createClass();

    var p = page.prototype;

    p.prepareDomContent = function(content){
        this.scopeWatcher && this.scopeWatcher.destroy();

        content.find(".btn-first").on("jrclick", function(){
            navi.switchPage('main');
        });

        content.find(".btn-second").on("jrclick", function(){
            notify.info('hello');
            navi.switchPage('tree');
        });

        function fillArray(){
            var t1 = (new Date).getTime();

            var arr = scope.arr;
            var l = scope.totalCount = 20;
            console.log('initial elements: ' + (l));
            for (var i = 0; i < l; i++){
                arr.push({
                    checked: (i == 5),
                    radio: (i == 5),
                    select: 1,
                    label: 'this is ' + i + ' element'
                });
            }

            var t2 = (new Date).getTime();
//        console.profile();
            var t3 = (new Date).getTime();

            scope.arrayTime = t2 - t1;
            scope.watchTime = t3 - t2;
            scope.totalTime = t3 - t1;
        }

        var scope = {
            t: {
                val: 10
            },
            arrayTime: 0,
            watchTime: 0,
            totalTime: 0,
            totalCount: 0,
            noUsers: true,
            val: 1,
            arr: [
                {
                    arr2:[
                        {lofi:"hello"},
                        {lofi:"hello2"}
                    ],
                    select: 1,
                    checked: true,
                    radio: true,
                    label: "hello"
                },
                {
                    select: 1,
                    checked: false,
                    radio: false,
                    label: "second"
                }
            ]
        };

        window.$scope = scope;

        var sw = this.scopeWatcher = watchScope.watch(content, scope);

        sw.on('change', function(){
            //console.log(arguments);
        });

        watchScope.watch("arr", scope, function(){
            //console.log(arguments);
        });

//        console.profileEnd();

        setTimeout(function(){
            scope.arr.clear();
            fillArray();
            scope.val = 10;
            scope.arr.push({label:'new element', checked: true});


        }, 1000);


        return content;
    };

    page.createPage({
        id: 'second',
        alias: 'second',
        weight: 1.5
    });

})();