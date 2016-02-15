/*
* Processing errors module
*
* var errors = app('errors');
*
* errors.log('myModule', 'some messageError');
* //or
* errors.log('myModule', 'some messageError', data, data2, etc...);
*
* */
(function(){
    var app = window.app;

    var errors = app('errors', {});

    errors.LEVEL_DEV = 5;
    errors.LEVEL_PROD = 0;
    errors.LEVEL_WARN = 4;

    var logLevel = errors.LEVEL_DEV;

    var showTimeIntervals = false;
    var prevTime = (new Date()).getTime();
    var timeIds = {};
    var helper;
    var isNative = false;


    // wrap for window.console
    var manConsole = (window['console'] && window.console) || {
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
        },
        time: function(){
            //it's a cap
        },
        timeEnd: function(){
            //it's a cap
        }
    };

    function defineHelper(){
        !helper && (helper = app('helper'));
        isNative = helper.isNative;
    }

    function apply(action, args){
        if (manConsole[action]){
            defineHelper();
            args = helper.getArgs(args);
            var firstArg = "#" + args[0] + getTimeInterval() +": ";
            args[0] = firstArg;
            if (isNative){
                args = [args.join(", ")];
            }
            manConsole[action].apply(manConsole, args);
            args = null;

        }
    }

    var MS_SEC = 1000;
    var MS_MIN = MS_SEC * 60;
    var MS_HOUR = MS_MIN * 60;

    function getTimeInterval(){
        var ret = '';
        if (showTimeIntervals){
            var newTime = (new Date()).getTime();
            var dx = newTime - prevTime;
            prevTime = newTime;
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
            ret = ' [' + time + ']';
        }
        return ret;
    }

    errors.showTimeIntervals = function(val){
        showTimeIntervals = val ? true : false;
    };

    // set log level
    errors.setLevel = function(lev){
        logLevel = lev;
    };

    errors.getLevel = function(){
        return logLevel;
    };

    // first argument is module name, where error appear, others - it's just a params to show...
    errors.log = function(){
        if (logLevel){
            apply('log', arguments);
        }
    };

    errors.warning = errors.warn = function(){
        apply('warn', arguments);
    };

    errors.error = function(){
        apply('error', arguments);
    };

    errors.info = function(){
        apply('info', arguments);
    };

    errors.time = function(id, message){
        if (logLevel){
            if (!timeIds[id]){
                timeIds[id] = [];
            }
            pushTime(id, message);
        }
    };

    errors.timeEnd = function(id, message, header){
        if (logLevel){
            !header && (header = id);
            if (timeIds[id]){
                var timer = timeIds[id];
                pushTime(id, message);
                var title = "time";
                var total = 0;
                errors.warn(header, "---------- '" + id + "' ----------");
                for (var i = 0, l = timer.length - 1; i < l; i++){
                    var item = timer[i];
                    var nextItem = timer[i + 1];
                    var dx = nextItem.time - item.time;
                    total += dx;
                    errors.warn(title, item.message + " : " + dx + 'ms');
                }

                var last = timer[timer.length - 1];
                errors.warn(title, "total: " + total + "ms | " + last.message);
                errors.warn(header, "----------------------------");

                timer.clear();
                timer = null;
                timeIds[id] = null;
            } else {
                errors.warning('timeEnd', 'wrong End for "' + id + '" timer');
            }
        }
    };

    function pushTime(id, message){
        message = message || id;
        timeIds[id].push({
            time: getNow(),
            message: message
        });
    }

    function getNow(){
        return (new Date()).getTime();
    }

    var mainLogger = null;
    // Logger
    function LoggerClass(name){
        this._name = name;
        this._enable = true;
    }

    function applyLogger(name, type, params){
        var args = helper.getArgs(params);
        args.splice(0, 0, name);
        errors[type].apply(errors, args);
    }

    function canILog(){
        var ret = this._enable;
        if (mainLogger && this != mainLogger){
            ret = false;
        }
        return ret;
    }

    var p = LoggerClass.prototype;

    p.enable = function(val){
        if (val !== undefined){
            this._enable = val;
        }
        return this._enable;
    };

    p.setAsMain = function(val){
        if (val){
            mainLogger && (mainLogger._isMain = false);
            mainLogger = this;
        }
    };

    p.log = function(){
        canILog.call(this) && applyLogger(this._name, 'log', arguments);
    };

    p.error = function(){
        canILog.call(this) && applyLogger(this._name, 'error', arguments);
    };

    p.warn = p.warning = function(){
        canILog.call(this) && applyLogger(this._name, 'warn', arguments);
    };

    p.info = function(){
        canILog.call(this) && applyLogger(this._name, 'info', arguments);
    };

    p.time = function(){
        canILog.call(this) && errors.time.apply(errors, arguments);
    };

    p.timeEnd = function(id, message){
        canILog.call(this) && errors.timeEnd.call(errors, id, message, this._name);
    };

    function createLogger(name){
        defineHelper();
        return new LoggerClass(name);
    }

    var infoShown = false;
    // return new logger instance by defined name
    errors.getLogger = function(name){
        !infoShown && errors.warn('errors', " app('errors').getLogger(loggerName) deprecated, use app('logger')(loggerName) instead.");
        infoShown = true;
        return createLogger(name);
    };

    app('logger', createLogger);


})();