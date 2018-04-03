(function(){
    var app = window.app;
    var logger = app('logger')('promise');

    var STATE_PROCESS = 1;
    var STATE_REJECTED = 2;
    var STATE_RESOLVED = 3;

    var cnt = 0;

    // window._promises = [];

    function PromiseClass (){
        cnt++;
        if (cnt > 6553665536){
            cnt = -6553665536;
        }

        // window._promises.push(this);

        this._pointName = cnt;
        this._thens = [];
        this._catchs = [];
        this._isDestroyed = false;
        this._canDropArgs = false;
        this._state = STATE_PROCESS;
        this._args = undefined;
    }

    var p = PromiseClass.prototype;

    p.then = function(cb){
        var state = this._state;
        if (state == STATE_RESOLVED) {
            cb.apply(this, this._args);
        } else {
            if (!this._isDestroyed){
                if (!this._catchs.length){
                    this.catch(function(err, data){
                        logger.error(err, data);
                    });
                }
                this._thens.push(cb);
            } else {
                if (state == STATE_PROCESS){
                    cb.apply(this, this._args);
                }
            }
        }
        return this;
    };

    p.catch = function(cb){
        if (this._state == STATE_REJECTED){
            cb.apply(this, this._args);
        } else {
            if (!this._isDestroyed){
                this._catchs.push(cb);
            }
        }
        return this;
    };

    p.startThens = function(){
        runThenItem.call(this, arguments);
    };

    p.resolve = function(){
        if (this._state == STATE_PROCESS){
            this._state = STATE_RESOLVED;
            runThenItem.call(this, arguments);
        }
    };

    p.reject = function(){
        runCatchItems.call(this, arguments);
    };

    p.resultWait = function(){
        var self = this;
        return function (err, data){
            if (err){
                self.reject(err, data);
            } else {
                self.resolve(data);
            }
        };
    };

    p.destroy = function(){
        this._thens.clear();
        this._catchs.clear();
        this._isDestroyed = true;
        if (this._canDropArgs){
            this.dropArguments();
        }
    };

    p.dropArguments = function(){
        //this._args = null;
        //this._state = null;
    };

    function runThenItem(args){
        var self = this;
        var thens = this._thens;
        if (thens.length == 0){
            this.destroy();
        } else {
            this._canDropArgs = true;
            var item = thens.shift();
            this._args = args;
            var res = item.apply(this, args);
            if (res instanceof PromiseClass) {
                var subPromise = res;
                var subPromiseState = subPromise._state;
                var subPromiseArgs = subPromise._args;
                if (subPromiseState == STATE_PROCESS) {
                    // await
                    res
                        .catch(function(){
                            //:todo run catch item
                            runCatchItems.call(self, arguments);
                        })
                        .then(function(){
                            runThenItem.call(self, arguments);
                        });
                } else if (subPromiseState == STATE_RESOLVED){
                    // do next then call
                    runThenItem.call(self, subPromiseArgs);
                } else if (subPromiseState == STATE_REJECTED){
                    // do catch call
                    runCatchItems.call(self, subPromiseArgs);
                } else {
                    // subPromise was destroyed??? without any result... =(
                    runThenItem.call(self, self._args);
                }
            } else {
                var currState = this._state;
                var nextArgs = (res !== undefined) ? [res] : this._args;
                if (currState == STATE_RESOLVED || currState == STATE_PROCESS){
                    // do next then call
                    runThenItem.call(this, nextArgs);
                } else if (currState == STATE_REJECTED) {
                    runCatchItems.call(self, nextArgs);
                }
            }
        }
    }

    function runCatchItems(args){
        this._state = STATE_REJECTED;
        var catchs = this._catchs;
        if (catchs.length == 0){
            if (!this._args) {
                this._args = args;
            }
            this.destroy();
        } else {
            this._canDropArgs = true;
            var item = catchs.shift();
            item.apply(this, args);
            runCatchItems.call(this, args);
        }
    }

    app('promise', function(){
        return new PromiseClass();
    });


})();
