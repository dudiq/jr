(function(){
    var app = window.app;
    var tester = app('tester');
    var promise = app('promise');
    var assert = tester.assert;


    tester.block('promises', function(block){
        block('then async processing', function(done){
            var holder = promise();
            var cnt = 0;

            var subHolder = promise();

            var res = holder
                .catch(function(err){
                    cnt = cnt - 10;
                    assert.equal(cnt, -6);
                })
                .then(function(){
                    cnt++;
                    assert.equal(cnt, 1);
                })
                .then(function(){
                    cnt++; // 2
                    return subHolder;
                })
                .then(function(){
                    cnt++; // 4
                    assert.equal(cnt, 4);
                })
                .then(function(){
                    cnt++; // 5
                    done();
                });

            setTimeout(function(){
                cnt++;
                subHolder.resolve();
            }, 100);

            res.startThens();
        });

        block('catch async processing', function(done){
            var holder = promise();
            var cnt = 0;

            var subHolder = promise();

            var res = holder
                .catch(function(err, data){
                    cnt = cnt - 10;
                    assert.equal(cnt, -7);
                    assert.equal(err, -100);
                    assert.equal(data, 'second arg');
                    done();
                })
                .then(function(){
                    cnt++;
                    assert.equal(cnt, 1);
                })
                .then(function(){
                    cnt++; // 2
                    return subHolder;
                })
                .then(function(){
                    cnt++; // 4
                    assert.equal(cnt, 4);
                })
                .then(function(){
                    cnt++; // 5
                });

            setTimeout(function(){
                cnt++;
                subHolder.reject(-100, 'second arg');
            }, 100);

            res.startThens();
        });

        block('resultWait checking catch', function(done){
            var holder = promise();

            var cnt = 0;

            var cb = holder.resultWait();

            setTimeout(function(){
                cnt++;
                cb(10, 'data');
            });

            holder.catch(function(err, data){
                assert.equal(cnt, 1);
                assert.equal(err, 10);
                assert.equal(data, 'data');
                done();
            });
        });

        block('resultWait checking then', function(done){
            var holder = promise();

            var cnt = 0;

            var cb = holder.resultWait();

            setTimeout(function(){
                cnt++;
                cb(0, 'data');
            }, 100);

            holder.then(function(data){
                assert.equal(cnt, 1);
                assert.equal(data, 'data');
                done();
            });
        });

        block('define holder without then call', function(done){
            var holder = promise();

            var cnt = 0;

            holder
                .catch(function(){
                    cnt++;
                })
                .then(function(){
                    assert.equal(cnt, 0);
                    done();
                });

            holder.startThens();
        });


    });
})();
