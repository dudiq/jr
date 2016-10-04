(function(){
    var app = window.app;
    var tester = app('tester');

    var assert = tester.assert;
    var logger = tester.logger;

    tester.block('broadcast processing', function(it){
        // preparation
        var bcParent = app('broadcast');
        var bc = bcParent.instance('for-testing');

        it('multi checking of "on", "off" and "trig" methods', function(done){
            var count = 0;

            function checkEvents(){
                assert.equal(count, 2);
                checkEvents = function(){}; //drop this method
            }

            function secondCheck(){
                assert.equal(count, 3);
            }

            bc.on('test-case1', function(){
                count++;
            }).on('test-case1', '.my-namespace', function(){
                count++;
            }).on('test-case1', '.my-namespace', function(){
                checkEvents();
            });
            bc.trig('test-case1');

            bc.off('test-case1', '.my-namespace');

            bc.on('test-case1', function(){
                secondCheck();
            });

            bc.trig('test-case1');


            bc.off('test-case1');

            bc.trig('test-case1');

            assert.equal(count, 3);
            setTimeout(function(){
                // all events must be called and map in broadcast must be clean
                assert.equal(!!bc.map['test-case1'], false);
                done();
            }, 100);
        });

        it('# one checking', function(block){
            block("count must be == 1, because only firts .one will be triggered", function(done){
                var count = 0;
                bc.one('test-case2', function(){
                    count++;
                });

                function handler(){
                    count++;
                }
                bc.one('test-case2', handler);

                bc.trig('test-case2-1');

                bc.off('test-case2', handler);

                bc.trig('test-case2');
                bc.trig('test-case2');

                setTimeout(function(){
                    assert.equal(count, 1);
                    done();
                }, 100);
            });
        });

        it('# multiple messages on/off', function(block){
            block("should return single object with no binded handlers", function(done){
                var newbc = bcParent.instance('for-testing');
                var count = 0;
                function h(){
                    count++;
                }

                newbc.on(["case1", "case2"], ".test", h);
                newbc.on(["case3", "case4"], ".test", h);

                newbc.trig('case1');
                newbc.trig('case3');

                assert.equal(count, 2);
                newbc.off(".test");


                var binded = 0;
                for (var key in newbc.map){
                    var targets = newbc.map[key];
                    for (var i = 0, l = targets.length; i < l; i++){
                        if (!targets[i]._dirty){
                            binded++;
                        }
                    }
                }

                setTimeout(function(){
                    assert.equal(binded, 0);
                    done();
                }, 100);
            });
        });

        it('performance testing', function(block){
            block("should run more than one million operations per second", function(done){

                var startTime = new Date();
                var opsbc = bcParent.instance('for-testing');

                // bind 1000 points
                var pointsOn = 1000;
                for (var i = 0; i <= pointsOn; i++){
                    (function(i){
                        var event = {
                            id: i
                        };
                        opsbc.on('test', '.namespace', function(params){
                            event.params = params.date;
                            event.last = new Date();
                        });
                    })(i);
                }

                var onTime = new Date();
                // try to trigger 1000 points
                var pointsTrig = 1000;
                for (var i = 0; i <= pointsTrig; i++){
                    (function(i){
                        var params = {
                            date : new Date()
                        };
                        opsbc.trig('test', params);
                    })(i);
                }

                var trigTime = new Date();

                opsbc.off('.namespace');

                var endTime = new Date();

                var howLong = (endTime - startTime);

                logger.log(" > performance testing: pointsOn = " + pointsOn + ", pointsTrig = " + pointsTrig);
                logger.log(" bind time = " + (onTime - startTime) + "ms");
                logger.log(" trig time = " + (trigTime - onTime) + "ms");
                logger.log(" off time = " + (endTime - trigTime) + "ms");
                logger.log(" all time = " + howLong + "ms");
                logger.log(" > ---- ");

                assert.equal(howLong < 1000, true);
                done();
            });
        });

        it('ev1 must be defined', function () {
            var broadcast = app('broadcast');
            var evs = broadcast.events('test1', {
                ev1: 'ev1'
            });

            assert.equal(evs && evs.ev1, 'test1#ev1');
        });

        it('ev2 must be undefined', function () {
            var broadcast = app('broadcast');
            var evs = broadcast.events('test1', {
                ev1: 'ev1'
            });

            assert.equal(evs && evs.ev2, undefined);
        });

    });

})();
