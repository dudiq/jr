describe('broadcast ev storage testing', function(){
    it('ev1 must be defined', function (done) {
        var broadcast = app('broadcast');

        var evs = broadcast.putEvents('test1', {
            ev1: 'ev1'
        });

        assert.equal(evs && evs.ev1, 'test1#ev1');

        done();
    });
    it('ev2 must be undefined', function (done) {
        var broadcast = app('broadcast');

        var evs = broadcast.putEvents('test1', {
            ev1: 'ev1'
        });

        assert.equal(evs && evs.ev2, undefined);
        done();
    });
});