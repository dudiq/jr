(function(){
    var app = window.app;

    var setTimeout = window.setTimeout;
    var TIMEOUT = 10;

    function doTimeout(){
        var self = this;
        if (this._working){
            clearTimeout(this._timerId);
            this._timerId = setTimeout(function(){
                processArray.call(self);
            }, this._timeout);
        }
    }

    function PortionClass(params){
        this._step = params.step;
        this._timeout = params.timeout || TIMEOUT;
        this._pos = 0;
        this._len = 0;
        this._timerId = null;
        this._stepCb = null;
        this._finishCb = null;
        this._working = true;
    }

    var p = PortionClass.prototype;

    p.run = function(arr, stepCb){
        this._working = true;
        this._pos = 0;
        this._len = arr.length;
        this._stepCb = stepCb;
        doTimeout.call(this);
        return this;
    };

    p.finish = function(cb){
        this._finishCb = cb;
    };

    p.stop = function(){
        this._working = false;
        clearTimeout(this._timerId);
    };

    function processArray(){
        if (!this._working){
            clearTimeout(this._timerId);
            return;
        }
        var start = this._pos;
        var end = Math.min(this._len, start + this._step);
        this._stepCb && this._stepCb(start, end);
        this._pos = end;

        if (end == start){
            this._finishCb && this._finishCb();
            this.stop();
        }
        doTimeout.call(this);
    }

    app('portion', function(params){
        return new PortionClass(params);
    });
})();
