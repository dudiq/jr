(function(){
    var app = window.app;
    var tester = app('tester');

    var assert = tester.assert;

    tester.block('main module define', function(it) {
        var app = window.app;
        it("onModuleDefined define module immediately", function (done) {
            var testModDefined = false;
            app.onModuleDefined('test-mod1', function(){
                testModDefined = true;
            });
            assert.equal(testModDefined, false);
            app('test-mod1', {});
            assert.equal(testModDefined, true);
            done();
        });

        it("onModuleDefined define module after timeout", function (done) {

            var testModDefined = false;
            app.onModuleDefined('test-mod2', function(){
                testModDefined = true;
            });
            setTimeout(function(){
                assert.equal(testModDefined, false);
                app('test-mod2', {});
                assert.equal(testModDefined, true);
                done();
            }, 100);

            assert.equal(testModDefined, false);
        });

    });
})();
