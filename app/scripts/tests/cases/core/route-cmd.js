(function(){
    var app = window.app;
    var tester = app('tester');

    var assert = tester.assert;
    var logger = tester.logger;

    tester.block('checking route-commander', function(it){
        var app = window.app;
        var routeCmd = app('route-commander');
        var route = app('route');
        var templater = app('templater');

        app('pages').create({
            id: 'routeCmdTestCasePage1',
            alias: 'routeCmdTestCasePage1',
            weight: 2,
            hasAccess: function () {
                return true;
            }
        });

        templater.set('routeCmdTestCasePage1', '<div>routeCmdTestCasePage1</div>');

        it('checking init, finalize methods for NOT defined value', function(done){

            var paths = [];
            routeCmd({
                pageId: "routeCmdTestCasePage1",
                key: "routeCmdTest1",
                onSets: function(value){
                    paths.push("set");
                    paths.push(value);
                },
                onChanged: function(value){
                    paths.push(value);
                },
                onRemoved : function(){
                    paths.push("removed");
                }
            });

            route.pushState("/routeCmdTestCasePage1/routeCmdTest1");
            route.pushState("/routeCmdTestCasePage1/routeCmdTest1=10");
            route.pushState("/routeCmdTestCasePage1");
            route.pushState("/routeCmdTestCasePage1/routeCmdTest1=11");
            route.pushState("/routeCmdTestCasePage1");

            var str = paths.join(" ");
            assert.equal(str, "set 10 removed set 11 removed");
            done();
        });

        it('checking init, finalize methods for DEFINED value', function(done){
            var paths = [];
            routeCmd({
                pageId: "routeCmdTestCasePage1",
                key: "routeCmdTest2",
                value: 10,
                onSets: function(value){
                    paths.push("set");
                    paths.push(value);
                },
                onChanged: function(value){
                    paths.push(value);
                },
                onRemoved: function(){
                    paths.push("removed");
                }
            });

            route.pushState("/routeCmdTestCasePage1/routeCmdTest2");
            route.pushState("/routeCmdTestCasePage1/routeCmdTest2/routeCmdTest22");
            route.pushState("/routeCmdTestCasePage1/routeCmdTest2=10");
            route.pushState("/routeCmdTestCasePage1/routeCmdTest2=10/routeCmdTest22");
            route.pushState("/main");
            route.pushState("/routeCmdTestCasePage1");
            route.pushState("/routeCmdTestCasePage1/routeCmdTest2=11");
            route.pushState("/routeCmdTestCasePage1");


            var str = paths.join(" ");
            assert.equal(str, "set 10 removed set 11 removed");
            done();
        });
    });
})();
