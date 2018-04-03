(function (app) {
    var collPeriod = app('coll-period');
    var portal = app('portal');

    function setPeriod(period) {
        this.setValue(period);
        var parent = this.getParent();
        var barGrid = parent.find('bar-grid');
        barGrid.setPeriod(period.dateBegin, period.dateEnd);
    }

    var expensePopup = {
        id: 'analytic-details',
        tpl: 'scripts/ui-controllers/pages/analytic/analytic-details'
    };

    app('data-processor')({
        'analytic.showDetails': function () {
            var port = portal(expensePopup);
            var popup = port.find('analytic-details');

            port.showPortal();
            popup.showPopup();
        },
        'analytic.goPrevMonth': function () {
            var value = this.getValue();
            var period = collPeriod.getPeriodPrev(value.dateBegin);
            setPeriod.call(this, period);
        },
        'analytic.goNextMonth': function () {
            var value = this.getValue();
            var period = collPeriod.getPeriodNext(value.dateEnd);
            var currPeriod = collPeriod.getCurrPeriod();
            if (period.dateEnd <= currPeriod.dateEnd) {
                setPeriod.call(this, period);
            }
        },
        'analytic.updateView': function () {
            var data = this.getValue();
            var parent = this.getParent();
            var barGrid = parent.find('bar-grid');
            barGrid.setPeriod(data.dateBegin, data.dateEnd);
        }
    });

})(window.app);
