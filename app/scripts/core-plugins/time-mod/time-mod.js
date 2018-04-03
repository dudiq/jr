/*
* time module for process date into string
* */
(function () {
    var app = window.app;
    var logger = app('logger')('time-mod');
    var translate = app('translate');

    var minInMs = (1000 * 60);
    var hourInMs = (minInMs * 60);
    var dayInMs = (hourInMs * 24);

    var formers = {};

    var sorted = [];
    var len = 0;
    var map = {};

    var translates = {};

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

    function getEdgeOfWeek(date, type) {
        var today = new Date(getEdgeOfDay(date, type));
        var daysToSat = (type == 'begin') ? today.getDay() - 1 : 7 - today.getDay();
        var incedDays = daysToSat * dayInMs;
        incedDays = (type == 'begin') ? incedDays : (0 - incedDays) + 1;
        var endDate = new Date(today.getTime() - incedDays);

        return getEdgeOfDay(endDate, type);
    }

    app('time-processor', {

        // after added all formers, need to sort them for correct replace in string
        start: function () {
            len = sorted.length;
            sorted.sort();
            sorted.reverse();
        },

        getWeekStart: function (today) {
            !today && (today = new Date());
            return getEdgeOfWeek(today, 'begin');
        },

        getWeekEnd: function (today) {
            !today && (today = new Date());
            return getEdgeOfWeek(today, 'end');
        },

        getDayStart: function (today) {
            !today && (today = new Date());
            return getEdgeOfDay(today, 'begin');
        },

        getDayEnd: function (today) {
            !today && (today = new Date());
            return getEdgeOfDay(today, 'end');
        },

        getWeekByEndDay: function (today) {
            !today && (today = new Date());
            var edgeDay = getEdgeOfDay(today, 'end');
            var startDay = edgeDay - (dayInMs * 8) + 1;
            return startDay;
        },

        getMonthStart: function (today) {
            !today && (today = new Date());
            var dToday = new Date(today);
            var month = new Date(dToday.getFullYear(), dToday.getMonth());
            var ret = month.getTime();
            return ret;
        },

        getMonthEnd: function (today) {
            var startMonthMs = this.getMonthStart(today);
            var dToday = new Date(startMonthMs);
            var days = new Date(dToday.getFullYear(), dToday.getMonth() + 1, 0).getDate();
            var ret = startMonthMs + (days * dayInMs) - 1;
            return ret;
        },

        // compare two dates
        compare: function (d1, d2) {
            var ret = false;
            if (d1 && d2) {
                var dx1 = new Date(d1);
                var dx2 = new Date(d2);
                ret = (dx1.getTime() == dx2.getTime());
            } else {
                ret = (d1 == d2);
            }
            return ret;
        },

        // format date to formatted string
        format: function (timeObj, format) {
            var tmp = new Date(timeObj);
            var ret = '';
            if (tmp.getTime && isNaN(tmp.getTime())) {
                // invalid date!!!
            } else {
                ret = format;

                for (var i = 0; i < len; i++) {
                    var key = sorted[i];
                    var uid = map[key];
                    ret = ret.replaceAll(key, uid);
                }

                for (var key in map) {
                    var uid = map[key];
                    var method = formers[key];
                    ret = ret.replaceAll(uid, method(tmp));
                }
            }
            return ret;
        },

        // add new translate for formats
        addTranslate: function (key, values) {
            if (values) {
                if (translates[key]) {
                    logger.error('translates for "' + key + '" already defined');
                } else {
                    translates[key] = translate.buildWords(values);
                }
            }
            return translates[key];
        },

        translateWord: function (toTrans) {
            var lang = translate.getCurrLang();
            var coll = translates[lang];
            var ret = toTrans;
            var key = '{{' + toTrans + '}}';
            if (coll && coll[key]) {
                ret = coll[key];
            }
            return ret;
        },

        setDecInt: function (num) {
            if (num < 10) {
                num = "0" + num;
            }
            return num;
        },

        toFixed: function (number, val) {
            var dx = Math.pow(10, val);
            var ret = Math.floor(number * dx) / dx;
            return ret;
        },

        registerFormer: function(mask, method){
            if (formers[mask]){
                logger.error('Mask "' + mask + '" already defined');
            } else {
                formers[mask] = method;
                sorted.push(mask);
                var rand = Math.floor((Math.random() * 32000));
                var date = (new Date()).getTime();
                var uid = "[" + date + "0" + rand + "-" + sorted.length + "]";
                map[mask] = uid;
            }
        }
    });

})();
