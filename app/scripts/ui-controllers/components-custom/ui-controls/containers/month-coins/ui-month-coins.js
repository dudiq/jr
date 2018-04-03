(function (app) {
    var dataEvent = app('data-event');
    var collExpense = app('coll-expense');
    var collPeriod = app('coll-period');
    var logger = app('logger')('ui-month-coins-counts');
    var tp = app('time-processor');
    var broadcast = app('broadcast');
    var pouchProcEvs = broadcast.events('pouch-processor');

    var UiListClass = app('bb-co')('ui-month-coins', {
        tpl: 'scripts/ui-controllers/components-custom/ui-controls/containers/month-coins/ui-month-coins',
        init: function () {
            this.defineScope({
                today: '',
                current: '',
                prev: '',
                currentPeriod: '',
                prevPeriod: ''
            });
            updateSummary.call(this);
            bindDataChanges.call(this);
        },
        destroy: function () {
            UiListClass._parent.destroy.apply(this, arguments);
            var blockActions = collExpense.getBlockActions();
            dataEvent.offBlock(blockActions.PUSH, this._dbExpense);
            dataEvent.offBlock(blockActions.REMOVE, this._dbExpenseDrop);
            dataEvent.offBlock(blockActions.UPDATE, this._dbExpenseUpdate);
            broadcast.off(pouchProcEvs.onChanged, this._onPouch);
        }
    });

    function getCountByPeriod(name, from, to) {
        var scope = this.getScope();
        logger.log(name, new Date(from), new Date(to));
        collExpense.getCountByPeriod(from, to)
            .then(function (data) {
                scope[name] = data[0].summary;
                logger.log('----------',data);
            });
    }

    function updateSummary() {
        var scope = this.getScope();
        var nowDayBegin = tp.getDayStart();
        var nowDayEnd = tp.getDayEnd();

        var currPeriod = collPeriod.getCurrPeriod(nowDayBegin);
        var prevPeriod = collPeriod.getPeriodPrev(nowDayBegin);

        scope.currentPeriod = currPeriod.title;
        scope.prevPeriod = prevPeriod.title;

        getCountByPeriod.call(this, 'today', nowDayBegin, nowDayEnd);
        // getCountByPeriod.call(this, 'current', currPeriod.dateBegin, currPeriod.dateEnd);
        // getCountByPeriod.call(this, 'prev', prevPeriod.dateBegin, prevPeriod.dateEnd);
    }


    function bindDataChanges() {
        var self = this;

        broadcast.on(pouchProcEvs.onChanged, this._onPouch = function () {
            updateSummary.call(self);
        });

        var blockActions = collExpense.getBlockActions();
        dataEvent.onBlock(blockActions.REMOVE, this._dbExpenseDrop = function (removedId) {
            updateSummary.call(self);
            logger.log('dataEvent.onBlock(REMOVE)', removedId);
        });
        dataEvent.onBlock(blockActions.PUSH, this._dbExpensePush = function (item) {
            updateSummary.call(self);
            logger.log('dataEvent.onBlock(PUSH)', item);
        });
        dataEvent.onBlock(blockActions.UPDATE, this._dbExpenseUpdate = function (data) {
            updateSummary.call(self);
            logger.log('dataEvent.onBlock(UPDATE)', data);
        });

    }

})(window.app);
