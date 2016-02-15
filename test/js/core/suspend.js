describe('checking suspend', function() {
    var app = window.app;
    var suspend = app('suspend');

    function createSuspend(){
        var sp = suspend();

        var ret = {
            suspend: sp,
            count: 0,
            data: '',
            last: ''
        };


        sp
            .stopped(function(data){
                ret.count++;
                ret.last = 'stop';
                ret.data = data;
            })
            .aborted(function(data){
                ret.count++;
                ret.last = 'abort';
                ret.data = data;
            })
            .always(function(data){
                ret.count++;
                ret.last = 'always';
                ret.data = data;
            })
            .done(function(data){
                ret.count++;
                ret.last = 'done';
                ret.data = data;
            })
            .fail(function(data){
                ret.count++;
                ret.last = 'fail';
                ret.data = data;
            });

        return ret;
    }

    it('check fail', function (done) {
        var obj = createSuspend();

        var sp = obj.suspend;

        var failProcess = false;
        sp.fail(function(){
            failProcess = true;
        });

        sp.reject('some data');
        sp.reject('some data1');
        sp.reject('some data2');
        sp.resolve('some data3');

        assert.equal(obj.data, 'some data');
        assert.equal(obj.count, 2);
        assert.equal(obj.last, 'always');
        assert.equal(failProcess, true);

        done();
    });


    it('check done', function (done) {
        var obj = createSuspend();

        var sp = obj.suspend;

        var process = false;
        sp.done(function(){
            process = true;
        });

        sp.resolve('some data');
        sp.resolve('some data1');
        sp.resolve('some data2');
        sp.reject('some data3');

        assert.equal(obj.data, 'some data');
        assert.equal(obj.count, 2);
        assert.equal(obj.last, 'always');
        assert.equal(process, true);

        done();
    });


    it('check abort', function (done) {
        var obj = createSuspend();

        var sp = obj.suspend;

        var process = false;
        sp.aborted(function(){
            process = true;
        });

        sp.abort('some data');
        sp.resolve('some data1');
        sp.resolve('some data2');
        sp.reject('some data3');

        assert.equal(obj.data, 'some data');
        assert.equal(obj.count, 2);
        assert.equal(obj.last, 'always');
        assert.equal(process, true);

        done();
    });

    it('check stop', function (done) {
        var obj = createSuspend();

        var sp = obj.suspend;

        var process = false;
        sp.stopped(function(){
            process = true;
        });

        sp.stop('some data');
        sp.resolve('some data1');
        sp.resolve('some data2');
        sp.reject('some data3');

        assert.equal(obj.data, 'some data');
        assert.equal(obj.count, 1);
        assert.equal(obj.last, 'stop');
        assert.equal(process, true);

        done();
    });

});