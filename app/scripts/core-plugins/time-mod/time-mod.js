/*
* time module for process date into string
* */
(function(){
    var app = window.app;
    var timeMod = app('time-processor', {});
    var errors = app('errors');
    var logger = errors.getLogger('time-mod');
    var translate = app('translate');

    var minInMs = (1000 * 60);
    var hourInMs = (minInMs * 60);
    var dayInMs = (hourInMs * 24);

    var formers = {};

    var sorted = [];
    var len = 0;
    var map = {};

    var translates = {};

    function registerFormer(mask, method){
        if (formers[mask]){
            logger.error('Mask "' + mask + '" already defined');
        } else {
            formers[mask] = method;
            sorted.push(mask);
            var rand = Math.floor((Math.random() * 32000));
            var date = (new Date()).getTime();
            var uid = "[" + date + "0" + rand + "]";
            map[mask] = uid;
        }
    }

    // after added all formers, need to sort them for correct replace in string
    function sortThem(){
        len = sorted.length;
        sorted.sort();
        sorted.reverse();
    }

    function getEdgeOfDay(date, type) {
        date = (date - 0);
        var edgeDate = new Date(date);
        edgeDate.setHours(0, 0, 0, 0);
        var ret = edgeDate.getTime();
        if (type != 'begin') {
            ret = ret + dayInMs - 1;
        }
        return (ret);
    }

    function getEdgeOfWeek(date, type){
        var today = new Date(getEdgeOfDay(date, type));
        var daysToSat = (type == 'begin') ? today.getDay() - 1: 7 - today.getDay();
        var incedDays = daysToSat * dayInMs;
        incedDays = (type == 'begin') ? incedDays : (0 - incedDays) + 1;
        var endDate = new Date(today.getTime() - incedDays);

        return getEdgeOfDay(endDate, type);
    }


    timeMod.getWeekStart = function(today){
        !today && (today = new Date());
        return getEdgeOfWeek(today, 'begin');
    };

    timeMod.getWeekEnd = function(today){
        !today && (today = new Date());
        return getEdgeOfWeek(today, 'end');
    };

    timeMod.getDayStart = function(today){
        !today && (today = new Date());
        return getEdgeOfDay(today, 'begin');
    };

    timeMod.getDayEnd = function(today){
        !today && (today = new Date());
        return getEdgeOfDay(today, 'end');
    };

    timeMod.getWeekByEndDay = function(today){
        !today && (today = new Date());
        var edgeDay = getEdgeOfDay(today, 'end');
        var startDay = edgeDay - (dayInMs * 8) + 1;
        return startDay;
    };

    timeMod.getMonthStart = function(today){
        !today && (today = new Date());
        var dToday = new Date(today);
        var ms = (dToday.getDate() - 1) * dayInMs;
        var edgeDay = getEdgeOfDay(today, 'begin');
        var ret = edgeDay - ms;
        return ret;
    };

    timeMod.getMonthEnd = function(today){
        var startMonthMs = this.getMonthStart(today);
        var dToday = new Date(startMonthMs);
        var days = new Date(dToday.getYear(), dToday.getMonth(), 0).getDate();
        var ret = startMonthMs + (days * dayInMs) - 1;
        return ret;
    };

    // compare two dates
    timeMod.compare = function(d1, d2){
        var ret = false;
        if (d1 && d2){
            var dx1 = new Date(d1);
            var dx2 = new Date(d2);
            ret = (dx1.getTime() == dx2.getTime());
        } else {
            ret = (d1 == d2);
        }
        return ret;
    };

    // format date to formatted string
    timeMod.format = function(timeObj, format){
        var tmp = new Date(timeObj);
        var ret = '';
        if (tmp.getTime && isNaN(tmp.getTime())){
            // invalid date!!!
        } else {
            ret = format;


            for (var i = 0; i < len; i++){
                var key = sorted[i];
                var uid = map[key];
                ret = ret.replaceAll(key, uid);
            }

            for (var key in map){
                var uid = map[key];
                var method = formers[key];
                ret = ret.replaceAll(uid, method(tmp));
            }
        }
        return ret;
    };

    // add new translate for formats
    timeMod.addTranslate = function(key, values){
        if (values){
            if (translates[key]){
                logger.error('translates for "' + key + '" already defined');
            } else {
                translates[key] = translate.buildWords(values);
            }
        }
        return translates[key];

    };

    timeMod.translateWord = translateWord;

    function translateWord(toTrans){
        var lang = translate.getCurrLang();
        var coll = translates[lang];
        var ret = toTrans;
        var key = '{{' + toTrans + '}}';
        if (coll && coll[key]){
            ret = coll[key];
        }
        return ret;
    }

    function setDecInt(num){
        if (num < 10){
            num = "0" + num;
        }
        return num;
    }

    function toStr(num){
        return num + "";
    }

    registerFormer('h', function(date){
        var ret = date.getHours();
        return toStr(ret);
    });

    registerFormer('m', function(date){
        var ret = date.getMinutes();
        ret = setDecInt(ret);
        return toStr(ret);
    });

    registerFormer('s', function(date){
        var ret = date.getSeconds();
        ret = setDecInt(ret);
        return toStr(ret);
    });

    registerFormer('yy', function(date){
        var ret = date.getFullYear() + "";
        ret = ret.substring(2);
        return toStr(ret);
    });

    registerFormer('yyyy', function(date){
        var ret = date.getFullYear();
        return toStr(ret);
    });

    registerFormer('sm', function(date){
        var ret = date.getMonth();
        var rets = translateWord("short-month." + ret);
        return toStr(rets);
    });

    registerFormer('dofweek', function(date){
        var ret = date.getDay();
        var rets = translateWord("week." + ret);
        return toStr(rets);
    });

    registerFormer('mfull', function(date){
        var ret = date.getMonth();
        var rets = translateWord("month-f." + ret);
        return toStr(rets);
    });

    registerFormer('tm', function(date){
        var ret = date.getMonth();
        var rets = translateWord("month." + ret);
        return toStr(rets);
    });

    registerFormer('mm', function(date){
        var ret = date.getMonth() + 1;
        ret = setDecInt(ret);
        return toStr(ret);
    });

    registerFormer('dd', function(date){
        var ret = date.getDate();
        ret = setDecInt(ret);
        return toStr(ret);
    });


    sortThem();

})();