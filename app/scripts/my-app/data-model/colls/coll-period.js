(function (app) {
    var tp = app('time-processor');

    var prevPeriod = {
        title: '',
        dateBegin: 0,
        dateEnd: 0
    };

    var nextPeriod = {
        title: '',
        dateBegin: 0,
        dateEnd: 0
    };

    var currPeriod = {
        title: '',
        dateBegin: 0,
        dateEnd: 0
    };

    function setPeriods(obj, dx) {
        obj.dateBegin = tp.getMonthStart(dx);
        obj.dateEnd = tp.getMonthEnd(dx);
        obj.title = tp.format(obj.dateBegin, 'tm');
    }

    app('collection-maker')('coll-period', {
        getCurrPeriod: function (date) {
            var monthEnd = tp.getMonthEnd(date);
            setPeriods(currPeriod, monthEnd);
            return currPeriod;
        },
        getPeriodPrev: function (date) {
            var monthStart = tp.getMonthStart(date);
            setPeriods(prevPeriod, monthStart - 2000);
            return prevPeriod;
        },
        getPeriodNext: function (date) {
            var monthEnd = tp.getMonthEnd(date);
            setPeriods(nextPeriod, monthEnd + 2000);
            return nextPeriod;
        }
    });

})(window.app);
