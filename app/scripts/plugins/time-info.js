(function(){
    var app = window.app;
    var helper = app('helper');

    function TimeInfoClass(name, params){
        this._name = name;
        this._startTime = 0;
        this._endTime = 0;
        this._prevTime = 0;
        this._portions = [];
    }

    function getNowMS(){
        return (new Date()).getTime();
    }
    
    helper.extendClass(TimeInfoClass, {
        startTimePiece: function () {
            var ret = getNowMS();
            return ret;
        },
        stopTimePiece: function () {
            var ret = getNowMS();
            return ret;
        },
        startTimer: function(){
            this._prevTime = this._startTime = this._endTime = getNowMS();
            this._portions.clear();
        },
        portionTimer: function(name){
            var nowTime = getNowMS();
            var dx = helper.getTimeInterval(this._prevTime, nowTime);
            this._prevTime = nowTime;
            var ret = name + ' in ' + dx;
            this._portions.push(ret);
            return ret;
        },
        stopTimer: function(){
            this._endTime = getNowMS();
        },
        getTimeTotal: function(start, end){
            var total = getTotal.call(this, start, end);
            return total;
        },
        getFullTimerInfo: function (start, end) {
            var total = this.getTimeTotal(start, end);
            var ret = {
                name: this._name,
                total: total,
                startTime: this._startTime,
                endTime: this._endTime,
                portions: this._portions
            };
            return ret;
        }
    });
    
    function getTotal(start, end) {
        var startTime = start !== undefined ? start : this._startTime;
        var endTime = end !== undefined ? end : this._endTime;
        var total = helper.getTimeInterval(startTime, endTime);
        return total;
    }

    app('time-logger', function(name, params){
        return new TimeInfoClass(name, params);
    });

})();