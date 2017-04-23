(function (app) {

    var isNative = !!window.cordova;

    var LEVEL_DEV = 5;
    var LEVEL_PROD = 0;
    var LEVEL_WARN = 4;

    var logLevel = LEVEL_DEV;
    var prevTime = getTimeNow();

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

    function getTimeNow() {
        return (new Date()).getTime();
    }

    var consoleObjLink = (window['console'] && window.console) || {
            log: function(){
                //it's a cap
            },
            warn: function(){
                //it's a cap
            },
            info: function(){
                //it's a cap
            },
            warning : function(){
                //it's a cap
            },
            error: function(){
                //it's a cap
            }
        };

    function replaceItem(item, args, pos) {
        if (item.indexOf('%s') != -1){
            pos++;
            this._pos = pos;
            var val = args[pos];
            item = item.replace('%s', val);
            item = replaceItem.call(this, item, args, pos);
        }
        return item;
    }

    function showData(args, method) {
        var nowTime = (new Date()).getTime();
        var firstArg = "#" + this._name + ' [' + getTimeInterval(prevTime, nowTime) +"]: ";
        prevTime = nowTime;

        var showArgs = [firstArg];
        for (var i = 0, l = args.length; i < l; i++){
            var item = args[i];
            if (typeof item == "string"){
                this._pos = i;
                item = replaceItem.call(this, item, args, i);
                i = this._pos;
            }
            showArgs.push(item);
        }
        args = null;

        if (isNative){
            var str = showArgs.join(", ");
            method.call(consoleObjLink, str);
            str = null;
        } else {
            method.apply(consoleObjLink, showArgs);
        }

        showArgs.length = 0;
        showArgs = null;
    }

    function LoggerClass(name, level) {
        this._name = name;
        this._pos = 0;
        this._enable = true;
        this._logLevel = level || LEVEL_DEV;
    }

    var p = LoggerClass.prototype;

    function myLogLevel() {
        var ret = logLevel;
        if (logLevel > this._logLevel) {
            ret = this._logLevel;
        }
        return ret;
    }

    p.logLevel = function (val) {
        if (val !== undefined){
            this._logLevel = val;
        }
        return this._logLevel;
    };

    p.canLog = function () {
        var ret = this._enable;
        ret = ret && (myLogLevel.call(this) >= LEVEL_DEV);
        return ret;
    };

    p.canWarning = function () {
        var ret = (myLogLevel.call(this) >= LEVEL_WARN);
        return ret;
    };

    p.log = function () {
        if (this.canLog()){
            showData.call(this, arguments, consoleObjLink.log);
        }
    };

    p.warn = p.warning = function () {
        if (this.canWarning()){
            showData.call(this, arguments, consoleObjLink.warn);
        }
    };

    p.error = function () {
        showData.call(this, arguments, consoleObjLink.error);
    };

    p.info = function () {
        showData.call(this, arguments, consoleObjLink.info);
    };

    p.enable = function (val) {
        if (val !== undefined){
            this._enable = val;
        }
        return this._enable;
    };

    function makeLogger(name, level) {
        var inst = new LoggerClass(name, level);
        return inst;
    }

    makeLogger.logLevel = function (val) {
        if (val !== undefined){
            logLevel = val;
        }
        return logLevel;
    };

    makeLogger.console = consoleObjLink;

    makeLogger.LEVEL_DEV = LEVEL_DEV;
    makeLogger.LEVEL_PROD = LEVEL_PROD;
    makeLogger.LEVEL_WARN = LEVEL_WARN;

    app('logger', makeLogger);

})(window.app);
