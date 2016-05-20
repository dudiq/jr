(function(){
    var app = window.app;
    var logger = app('logger')('tester');
    var helper = app('helper');

    var tester = app('tester', {});

    var msgs = [];
    
    var testsMap = {};

    var root = new ItBlockClass();

    var MS_SEC = 1000;
    var MS_MIN = MS_SEC * 60;
    var MS_HOUR = MS_MIN * 60;

    function getTimeInterval(start, end){
        var dx = end - start;
        var time = dx;
        if (dx < MS_SEC) {
            time = dx + " ms";
        } else if (dx < MS_MIN) {
            time = Math.floor((dx / MS_SEC) * 100) / 100 + 's';
        } else if (dx < MS_HOUR) {
            time = Math.floor((dx / MS_MIN) * 100) / 100 + 'm';
        } else {
            time = Math.floor((dx / MS_HOUR) * 100) / 100 + 'h';
        }
        return time;
    }

    tester.prepare = function(){
        var correctPath = window.location.origin + '/#/tester-page';
        window.location = correctPath;
        window.location.reload();
    };

    tester.run = function(){
        // run all

        msgs.length = 0;
        helper.clearObject(testsMap);

        var startTime = new Date();
        logger.info('---');
        logger.info('tests started');
        logger.info('---');
        root.start(function(){
            var endTime = new Date();
            var totalTests = 0;
            var failTests = 0;
            for (var key in testsMap){
                totalTests++;
                if (!testsMap[key]){
                    failTests++;
                }
            }
            var totalTime = getTimeInterval(startTime, endTime);
            logger.info('---');
            logger.info('total tests: ' + totalTests);
            logger.info('fail tests: ' + failTests);
            logger.info('totalTime: ' + totalTime);
            logger.info('---');
        });
    };

    tester.block = function(name, func){
        root.putIt(name, func);
    };

    tester.logger = logger;

    tester.assert = {
        equal: function(arg1, arg2, msg){
            var ret = (arg1 == arg2);
            pushMap();
            if (!ret){
                assertFail();
                msg && logger.info(msg);
            }
        }
    };

    function ItBlockClass(name, cb){
        this._cases = [];
        this._index = 0;
    }

    var p = ItBlockClass.prototype;

    p.putIt = function(name, done){
        this._cases.push({
            name: name,
            cb: done
        });
    };

    p.start = function(cb){
        this._cb = cb;
        this._index = 0;
        this.run();
    };

    p.run = function(){
        var self = this;
        var currCase = this._cases[this._index];
        if (currCase){
            msgs.push(currCase.name);
            var itBlock = new ItBlockClass();
            var isDone = false;
            var isCalled = false;
            currCase.cb(function(name, done){
                isCalled = true;
                if (!name){
                    // do next
                    isDone = true;
                    showCaseInfo();
                    self.next();
                } else {
                    itBlock.putIt(name, done);
                }
            });
            if (!isCalled){
                if (!isAsync(currCase.cb)){
                    // do next
                    showCaseInfo();
                    self.next();
                }
            } else {
                if (!isDone){
                    itBlock.start(function(){
                        self.next();
                    });
                }
            }

        } else {
            this._cb();
        }
    };

    p.next = function(){
        msgs.pop();
        this._index++;
        this.run();
    };

    function showCaseInfo(){
        var msg = getFullMsg();
        var state = testsMap[msg] ? '[DONE]' : '[FAIL]';
        if (testsMap[msg]){
            logger.log(state + ' : ' + msg);
        } else {
            logger.error(state + ' : ' + msg);
        }
    }

    function getFullMsg(){
        return msgs.join(' -> ');
    }

    function isAsync(func){
        var ret = true;
        var str = func.toString();
        var reg = /(function\s*\(\))/;
        if (str.search(reg) == 0){
            ret = false;
        }
        return ret;
    }

    function pushMap(){
        var key = getFullMsg();
        if (!testsMap.hasOwnProperty(key)){
            testsMap[key] = true;
        }
    }
    
    function assertFail(){
        var key = getFullMsg();
        testsMap[key] = false;
    }

})();