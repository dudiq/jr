describe('checking, that DOM is ok for tests', function(){
    var templater = app('templater');
    it('templater should return content. checking templater.set() also', function(done){
        var data = templater.get('login');
        assert.equal((data && (data.length >= 10)), true);
        done();
    });

    it('container from config must be in document DOM', function(){
        var config = app('config');
        var mc = $(config.container);
        assert.equal(mc.length, 1);
    });
});