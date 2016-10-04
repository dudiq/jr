(function(){
    var app = window.app;
    var logger = app('logger')('tester');
    var helper = app('helper');
    var ss = app('session-storage');

    var SS_CURR_SESS = 'tests-current';
    var currentSession = ss(SS_CURR_SESS) || {};

    var msgs = [];
    var testsMap = {};

    var root = new ItBlockClass();

    function assert(exp, msg) {
        var ret = exp;
        pushMap(msg);
        if (arguments.length && !ret) {
            assertFail();
            var text = '[ASSERT] : expression is' + exp + ';' + msg;
            logger.info(text);
        }
    }

    helper.mixinClass(assert, {
        equal: function (arg1, arg2, msg) {
            var ret = (arg1 == arg2);
            pushMap(msg);
            if (!ret) {
                assertFail();
                var text = '[EQUAL] : ' + arg1 + ' is no equal ' + arg2 + ';' + msg;
                logger.info(text);
            }
        },
        continueWithRefresh: function () {
            currentSession.testsMap = testsMap;
            currentSession.lastProcessed = getFullMsg();
            ss(SS_CURR_SESS, currentSession);
            tester.runner.prepare();
        }
    });

    var tester = app('tester', {
        // running
        runner: {
            prepare: function () {
                var correctPath = window.location.origin + '/#/tester-page';
                window.location = correctPath;
                window.location.reload();
            },
            run: function (name, startFromKey) {
                // run all

                msgs.length = 0;
                if (!startFromKey){
                    helper.clearObject(testsMap);
                    helper.clearObject(currentSession);
                    currentSession.rootTestName = name || '';
                    currentSession.startTime = new Date();
                    logger.info('---');
                    logger.info('tests started');
                    logger.info('---');
                }

                root.start(name, function () {
                    ss.remove(SS_CURR_SESS);
                    var endTime = new Date();
                    var totalTests = 0;
                    var failTests = 0;
                    for (var key in testsMap) {
                        totalTests++;
                        if (!testsMap[key].state) {
                            failTests++;
                        }
                    }
                    var startTime = new Date(currentSession.startTime);
                    var totalTime = helper.getTimeInterval(startTime, endTime);
                    logger.info('---');
                    logger.info('total tests: ' + totalTests);
                    logger.info('fail tests: ' + failTests);
                    logger.info('totalTime: ' + totalTime);
                    logger.info('---');
                    helper.clearObject(currentSession);
                }, startFromKey);
            }
        },

        // cases
        block: function (name, func) {
            root.putIt(name, func);
        },
        logger: logger,
        assert: assert
    });

    function ItBlockClass(name, cb) {
        this._cases = [];
        this._runCases = [];
        this._index = 0;
    }

    helper.extendClass(ItBlockClass, {
        putIt: function (name, done) {
            this._cases.push({
                name: name,
                cb: done
            });
        },
        start: function (name, cb, startFromKey) {
            var runCases;
            if (typeof name == "function") {
                startFromKey = cb;
                cb = name;
                runCases = this._cases;
            } else {
                if (!name) {
                    runCases = this._cases;
                } else {
                    runCases = [];
                    var cases = this._cases;
                    for (var i = 0, l = cases.length; i < l; i++) {
                        var item = cases[i];
                        if (item.name == name) {
                            runCases.push(item);
                        }
                    }
                }
            }
            this._cb = cb;
            this._index = 0;
            this._runCases = runCases;
            this.callNext(startFromKey);
        },
        callNext: function (startFromKey) {
            var self = this;
            var currCase = this._runCases[this._index];
            if (currCase) {
                msgs.push(currCase.name);
                var itBlock = new ItBlockClass();
                var isDone = false;
                var isCalled = false;
                var mustBePass = false;
                if (startFromKey){
                    //
                    mustBePass = true;
                    if (startFromKey == getFullMsg()){
                        // mustBePass = false;
                        // start point, next test must be run
                        startFromKey = undefined;
                    }

                }
                if (!mustBePass){
                    currCase.cb(function (name, done) {
                        isCalled = true;
                        if (!name) {
                            // do next
                            isDone = true;
                            showCaseInfo();
                            self.next(startFromKey);
                        } else {
                            itBlock.putIt(name, done);
                        }
                    });
                    if (!isCalled) {
                        if (!isAsync(currCase.cb)) {
                            // do next
                            showCaseInfo();
                            self.next(startFromKey);
                        }
                    } else {
                        if (!isDone) {
                            itBlock.start(function () {
                                self.next(startFromKey);
                            });
                        }
                    }
                } else {
                    // pass current case
                    if (isNotDone(currCase.cb)){
                        currCase.cb(function (name, done) {
                            itBlock.putIt(name, done);
                        });
                        itBlock.start(function (subKey) {
                            self.next(subKey);
                        }, startFromKey);
                    } else {
                        self.next(startFromKey);
                    }
                }

            } else {
                this._cb(startFromKey);
            }
        },

        next: function (startFromKey) {
            msgs.pop();
            this._index++;
            this.callNext(startFromKey);
        }

    });

    function showCaseInfo(){
        var msg = getFullMsg();
        var tState = testsMap[msg].state;
        var state = tState ? '[DONE]' : '[FAIL]';
        if (tState){
            logger.log(state + ' : ' + msg);
        } else {
            logger.error(state + ' : ' + msg);
        }
    }

    function showTestMapResults() {
        for (var key in testsMap){
            var tState = testsMap[key].state;
            var state = tState ? '[DONE]' : '[FAIL]';
            if (tState){
                logger.log(state + ' : ' + key);
            } else {
                logger.error(state + ' : ' + key);
            }
        }
    }

    function getFullMsg(){
        return msgs.join('|,|');
    }

    function isNotDone(func) {
        var ret = true;
        var str = func.toString();
        var lines = str.split('\n');
        var l = lines[0] || '';
        var reg = /(function\s*\(\s*done\s*\))/ig;
        if (l.search(reg) == 0){
            ret = false;
        }
        return ret;
    }

    function isAsync(func){
        var ret = true;
        var str = func.toString();
        var lines = str.split('\n');
        var l = lines[0] || '';
        var reg = /(function\s*\(\))/;
        if (l.search(reg) == 0){
            ret = false;
        }
        return ret;
    }

    function pushMap(msg){
        var key = getFullMsg();
        if (!testsMap.hasOwnProperty(key)){
            testsMap[key] = {
                state: true,
                msg: msg
            };
        }
    }

    function assertFail(){
        var key = getFullMsg();
        testsMap[key].state = false;
    }


    /// process continue run tests
    if (!helper.isEmpty(currentSession) && currentSession.lastProcessed){
        // continue run
        helper.onStartEnd(function () {

            // timeout needed for correct processing all other modules
            setTimeout(function () {
                logger.log(currentSession);
                testsMap = currentSession.testsMap;
                showTestMapResults();
                logger.info('-last results-');
                tester.runner.run(currentSession.rootTestName, currentSession.lastProcessed);
            }, 1000);
        });
    }


})();
