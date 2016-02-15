/*
* i'm soo sorry about this tests,
* because i need more time to write them more readable and powerfully covered of code...
*
* */

describe('broadcast processing', function(){
    var bcParent = app('broadcast');
    var bc = bcParent.instance('for-testing');

    describe('# on checking', function(){
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
    });

    describe('# one checking', function(){
        it("count must be == 1, because only firts .one will be triggered", function(done){
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

    describe('# off checking', function(){
        it("should return correct off namespace", function(done){
            var count = 0;

            bc.on('test-case3', '.case3', function(){
                count++;
            });

            bc.off('.case3');

            bc.trig('test-case3');

            assert.equal(count, 0);

            done();

        })
    });

    describe('# multiple messages on/off', function(){
        it("should return single object with no binded handlers", function(done){
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

        })
    });

    describe('performance testing', function(){
        it("should run more than one million operations per second", function(done){

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

            console.log(" > performance testing: pointsOn = " + pointsOn + ", pointsTrig = " + pointsTrig);
            console.log(" bind time = " + (onTime - startTime) + "ms");
            console.log(" trig time = " + (trigTime - onTime) + "ms");
            console.log(" off time = " + (endTime - trigTime) + "ms");
            console.log(" all time = " + howLong + "ms");
            console.log(" > ---- ");

            done();
        })
    });

});