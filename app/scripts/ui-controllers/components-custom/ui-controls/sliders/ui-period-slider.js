(function (app) {
    var collPeriod = app('coll-period');
    var dataProcessor = app('data-processor');

    function updatePeriod(periodObj) {
        var scope = this.getScope();
        var now = (new Date).getTime();
        this._value = {
            dateBegin: periodObj.dateBegin,
            dateEnd: periodObj.dateEnd,
            title: periodObj.title
        };

        scope.dateBegin = periodObj.dateBegin;
        scope.dateEnd = periodObj.dateEnd;
        scope.title = periodObj.title;
        scope.subClasses = ((periodObj.dateBegin <= now) && (now <= periodObj.dateEnd)) ? 'is-end' : '';
    }

    var UiPeriodSlider = app('bb-co')('ui-period-slider', {
        tpl: 'scripts/ui-controllers/components-custom/ui-controls/sliders/ui-period-slider',
        init: function () {
            this.defineScope({
                dateBegin: 0,
                dateEnd: 0,
                title: '',
                subClasses: ''
            });
            var currPeriod = collPeriod.getCurrPeriod();
            updatePeriod.call(this, currPeriod);
        },
        processContent: function (content) {
            var self = this;
            content.on('jrclick', function (ev) {
                self.contentCallClick(ev, self);
            });
        },
        onShow: function () {
            dataProcessor('analytic.updateView').call(this);
            UiPeriodSlider._parent.onShow.apply(this, arguments);
        },
        setValue: function (period) {
            period && updatePeriod.call(this, period);
        },
        getValue: function () {
            return this._value;
        }
    });

})(window.app);
