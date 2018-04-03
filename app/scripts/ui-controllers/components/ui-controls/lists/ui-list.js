(function (app) {
    var ShowMoreClass = app('show-more-class');
    var timeLogger = app('time-logger')('ui-list');
    var logger = app('logger')('ui-list');

    var MAX_ITEMS = 150;

    var UiListClass = app('bb-co')('ui-list', {
        tpl: 'scripts/ui-controllers/components/ui-controls/lists/ui-list',
        init: function (opt) {
            this.defineScope({
                isAllShown: true,
                items: []
            });

            defineShowMore.call(this, opt.max, opt.fields);
        },
        setItems: function (data) {
            timeLogger.startTimer();
            this._showMore.setData(data);
            timeLogger.stopTimer();
            var timerInfo = timeLogger.getTimeTotal();
            logger.info(this.getName(), '->setItems() len=', data ? data.length : 'null', timerInfo);
        },
        pushItem: function (item, pos) {
            return this._showMore.pushItem(item, pos);
        },
        processContent: function (content) {
            var self = this;
            content.on('jrclick', function (ev) {
                // self.contentCallClick(ev, self);
            });
        },
        callShowMore: function () {
            //:todo think about how to change logic with set new data or get all and show part of data
            var selParams = this._selectorParams;
            if (!selParams.$limit){
                selParams.$limit = this._maxShowMoreItems;
            } else {
                selParams.$limit += this._maxShowMoreItems;
            }
            this.onDataListen();
        },
        callItemClick: function () {

        },
        destroy: function () {
            UiListClass._parent.destroy.apply(this, arguments);
            this._showMore && this._showMore.destroy();
            this._showMore = null;
        }
    }, {
        doSetViewTable: function () {

        },
        doSetViewList: function () {

        },
        doClearList: function () {
            this._showMore.setData(null);
        }
    });

    function defineShowMore(max, fields) {
        var scope = this.getScope();
        var maxItems = this.getClassProp('maxShowMoreItems');
        this._maxShowMoreItems = maxItems || MAX_ITEMS;
        var maxVals = max || this._maxShowMoreItems;

        this._showMore = ShowMoreClass({
            max: maxVals,
            fields: fields || ['id', 'name'],
            onAllShown: function (isAllShown) {
                scope.isAllShown = isAllShown;
            },
            scopeList: scope.items
        });
    }

})(window.app);
