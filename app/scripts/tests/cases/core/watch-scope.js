(function(){
    var app = window.app;
    var tester = app('tester');

    var assert = tester.assert;

    tester.block('watch scope', function(describe){
        var watchScope = app('watch-scope');

        describe('object changes', function(it){
            it('return correct value from DOM element, when object was changed', function(done){
                var input = $("<input jr-watch='change(val)' type='number'>");

                var scope = {
                    val: 1
                };

                var watcher = watchScope.watch(input, scope);

                scope.val = 10;
                assert.equal(input.val(), 10);


                input.val(100).change(); // need call change trigger !!!
                assert.equal(scope.val, 100);

                input.val("abc").change(); // need call change trigger !!!
                assert.equal(scope.val, "");

                watcher.destroy();

                setTimeout(function(){
                    var map = watchScope.broadcast().map;
                    var count = 0;
                    for (var key in map){
                        count++;
                    }
                    assert.equal(count, 0);
                    done();
                }, 100);
            });

            it('return correct value from DOM element, when object was changed for long paths', function(done){
                var div = $("<div>" +
                    "<input jr-watch='change(val)' type='number'/>" +
                    "<input type='text' jr-watch='change(test.def)' />" +
                    "<div class='div' jr-watch='change(test.def)' ></div>" +
                    "</div>");
                var input = div.find('input:last');
                var divView = div.find('.div');

                var scope = {
                    val: 1,
                    test:{
                        def: "a"
                    }
                };

                var watcher = watchScope.watch(div, scope);

                scope.test.def = "test";
                assert.equal(input.val(), "test");
                assert.equal(divView.html(), "test");


                input.val("new").change(); // need call change trigger !!!
                assert.equal(scope.test.def, "new");

                watcher.destroy();

                setTimeout(function(){
                    var map = watchScope.broadcast().map;
                    var count = 0;
                    for (var key in map){
                        count++;
                    }
                    assert.equal(count, 0);
                    done();
                }, 100);
            });

            it('checking bind to changes of object only, and call callback', function(done){
                var scope = {
                    val: 1,
                    test:{
                        def: "a"
                    }
                };

                var watcher = watchScope.watch("test.def", scope, function(data){
                    assert.equal(data.val, "b");
                });

                scope.test.def = "b";

                watcher.destroy();

                setTimeout(function(){
                    var map = watchScope.broadcast().map;
                    var count = 0;
                    for (var key in map){
                        count++;
                    }
                    assert.equal(count, 0);
                    done();
                }, 100);
            });


            it('complex test of watch', function(done){
                var div = $("<div>" +
                    "<input jr-watch='change(val)' type='number'/>" +
                    "<input type='text' jr-watch='change(test.def)' />" +
                    "<div class='div' jr-watch='change(test.def)' ></div>" +
                    "</div>");
                var input = div.find('input:last');
                var divView = div.find('.div');

                var scope = {
                    val: 1,
                    test:{
                        def: "a"
                    }
                };

                var watcher = watchScope.watch(div, scope);

                scope.test.def = "test";
                assert.equal(input.val(), "test");
                assert.equal(divView.html(), "test");


                input.val("new").change(); // need call change trigger !!!
                assert.equal(scope.test.def, "new");

                watcher.destroy();

                var watcher = watchScope.watch("test.def", scope, function(data){
                    assert.equal(data.val, "b");
                });

                scope.test.def = "b";

                watcher.destroy();

                setTimeout(function(){
                    var map = watchScope.broadcast().map;
                    var count = 0;
                    for (var key in map){
                        count++;
                    }
                    assert.equal(count, 0);
                    done();
                }, 100);
            });

            it('checking defined watcher', function(done){
                var t1 = function(){

                };
                watchScope('test', t1);

                var t2 = function(){

                };
                watchScope('test', t2);

                assert.equal(watchScope('test'), t1);
                done();

            });

        });
    });
})();
