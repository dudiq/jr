(function () {
    var app = window.app;
    var tester = app('tester');

    var assert = tester.assert;

    makeBlocks('local-storage');
    makeBlocks('session-storage');

    function makeBlocks(currStorage) {
        tester.block('checking ' + currStorage, function (it) {
            it("should return null", function (done) {
                var ls = app(currStorage);

                ls('test', 10);

                ls.clear();

                assert.equal(ls('test'), null);
                done();
            });

            it("should return 10", function (done) {
                var ls = app(currStorage);

                ls('test', 10);

                assert.equal(ls('test'), 10);
                done();
            });

            it("when we call .remove(), it should return true", function (done) {
                var ls = app(currStorage);

                ls('test', 100);

                assert.equal(ls.remove('test'), true);
                done();
            });

            it("setPrefix should return not the same value, as it was sets before", function (done) {
                var ls = app(currStorage);

                ls.setPrefix("");
                
                ls('test', 45);

                ls.setPrefix("test");

                assert.equal(ls('test'), null);

                ls.setPrefix("");

                assert.equal(ls('test'), 45);

                done();
            });

        });
    }

})();