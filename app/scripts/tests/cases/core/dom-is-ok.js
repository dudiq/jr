(function(){
    var app = window.app;
    var tester = app('tester');

    var assert = tester.assert;

    tester.block('checking, that DOM is ok for tests', function(it){
        var templater = app('templater');
        it('templater should return content. checking templater.set() also', function(done){
            var data = templater.get('scripts/core-plugins/overflow/overflow');
            assert.equal((data && (data.length >= 10)), true);
            done();
        });

        it('container from config must be in document DOM', function(){
            var config = app('config');
            var mc = $(config.container);
            assert.equal(mc.length, 1);
        });
    });
})();
