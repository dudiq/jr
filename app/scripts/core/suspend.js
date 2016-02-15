/*
* suspend module
*
* one of the important part of the system
*
* it's just suspend, not deferred object
*
*
* soo, what is the logic of this module?
*
* define var sp = app('suspend');
*
*
* at first, when you call sp(), you will have new instance of suspend and it's ready to use
*
*
*  sp.reject() -> calls fail() and always()
*  sp.resole() -> calls done() and always()
*  sp.abort() -> calls aborted() and always()
*  sp.stop() -> calls ONLY stopped()
*
*
* example for how to work suspend located in http module
* */

(function(){
    var app = window.app;
    var helper = app('helper');
    var errors = app('errors');

    // return arguments as array
    var getArgs = helper.getArgs;

    // class for new instance
    function suspend(){
        this.successCalls = [];
        this.errorCalls = [];
        this.abortCalls = [];
        this.alwaysCalls = [];
        this.stoppedCalls = [];
        this.progressCalls = [];
        this.isRejected = false;
        this.isResolved = false;
        this.isAborted = false;
        this.isStopped = false;
        this.isDestroyed = false;
        this.args = null;
    }

    var p = suspend.prototype;

    //walk in calls and run each call
    function callCalls(calls, args){
        var warningHave = false;
        var res = true;
        for (var i = 0, l = calls.length; i < l; i++){
            if (typeof calls[i] == "function") {
                res = calls[i].apply(this, args);
                if (res === false){
                    break;
                }
            } else {
                warningHave = true;
            }
        }
        warningHave && errors.warning('suspend', 'some of callback is not defined? is it ok?');
    }

    function callStop(args){
        if (!this.isDestroyed){
            this.successCalls.clear();
            this.errorCalls.clear();
            this.abortCalls.clear();
            this.alwaysCalls.clear();
            this.progressCalls.clear();
            callCalls.call(this, this.stoppedCalls, args);
            this.stoppedCalls.clear();
        }
    }

    function finish(args){
        if (!this.isDestroyed) {
            this.successCalls.clear();
            this.errorCalls.clear();
            this.abortCalls.clear();
            this.stoppedCalls.clear();
            this.progressCalls.clear();

            callCalls.call(this, this.alwaysCalls, args);
            this.alwaysCalls.clear();
        }
    }

    p.reject = function(){
        if (!this.isDestroyed) {
            var args = getArgs(arguments);
            this.args = args;
            callCalls.call(this, this.errorCalls, args);
            this.isRejected = true;
            finish.call(this, args);
            args = null;
        }
        return this;
    };

    p.resolve = function(){
        if (!this.isDestroyed) {
            var args = getArgs(arguments);
            this.args = args;
            callCalls.call(this, this.successCalls, args);
            this.isResolved = true;
            finish.call(this, args);
            args = null;
        }
        return this;
    };

    p.progressing = function(){
        if (!this.isDestroyed) {
            var args = getArgs(arguments);
            callCalls.call(this, this.progressCalls, args);
            args = null;
        }
        return this;
    };

    p.abort = function(){
        if (!this.isDestroyed) {
            this.successCalls.clear();
            this.errorCalls.clear();

            var args = getArgs(arguments);
            this.args = args;
            callCalls.call(this, this.abortCalls, args);
            this.isAborted = true;
            finish.call(this, args);
            args = null;
        }
        return this;
    };

    p.stop = function(){
        if (!this.isDestroyed) {
            var args = getArgs(arguments);
            this.args = args;
            callStop.call(this, args);
            this.isStopped = true;
            args = null;
        }
        return this;
    };

    p.stopped = function(callback){
        if (!this.isDestroyed){
            if (this.isStopped){
                callback.call(this, this.args);
            } else {
                this.stoppedCalls.push(callback);
            }
        }
        return this;
    };

    p.aborted = function(callback){
        if (!this.isStopped && !this.isDestroyed) {
            if (this.isAborted) {
                callback.apply(this, this.args);
            } else {
                this.abortCalls.push(callback);
            }
        }
        return this;
    };

    p.always = function(callback){
        if (!this.isStopped && !this.isDestroyed) {
            if (this.isRejected || this.isResolved) {
                callback.apply(this, this.args);
            } else {
                this.alwaysCalls.push(callback);
            }
        }
        return this;
    };

    p.success = function(callback){
        if (!this.isStopped && !this.isDestroyed) {
            if (this.isResolved) {
                callback.apply(this, this.args);
            } else {
                this.successCalls.push(callback);
            }
        }
        return this;
    };

    p.error = function(callback){
        if (!this.isStopped && !this.isDestroyed) {
            if (this.isRejected){
                callback.apply(this, this.args);
            } else {
                this.errorCalls.push(callback);
            }
        }
        return this;
    };

    p.progress = function(callback){
        if (!this.isDestroyed && !this.isRejected && !this.isResolved && !this.isStopped){
            this.progressCalls.push(callback);
        }
        return this;
    };

    p.done = p.success;
    p.fail = p.error;


    p.destroy = function(){
        this.stop();
        this.successCalls = null;
        this.errorCalls = null;
        this.abortCalls = null;
        this.alwaysCalls = null;
        this.stoppedCalls = null;

        this.isRejected = false;
        this.isResolved = false;
        this.isAborted = false;
        this.isStopped = false;
        this.isDestroyed = true;
        this.args = null;
    };


    function makeSuspend(){
        /*jshint -W055*/
        return new suspend();
    }

    app('suspend', makeSuspend);


})();