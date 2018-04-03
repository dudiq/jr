(function (app) {
    var dataEvent = app('data-event');
    var collExpense = app('coll-expense');
    var collCategory = app('coll-category');
    var timeLogger = app('time-logger')('ui-list-expenses');
    var logger = app('logger')('ui-list-expenses');
    var helper = app('helper');
    var confirmPlugin = app('confirm');
    var translate = app('translate');
    var dataProcessor = app('data-processor');
    var promise = app('promise');
    var parser = app('input-money-parser');
    var broadcast = app('broadcast');
    var pouchProcEvs = broadcast.events('pouch-processor');

    var MAX_ITEMS = 50;

    function updateItem(item) {
        var map = this._catMap;
        var catId = item.catId;
        var cat = map[catId];
        var parentCat = cat ? map[cat.catId] : null;
        var catTitle = parentCat ? parentCat.title : '';
        item.catSubTitle = cat ? cat.title: '';
        if (parentCat && cat) {
            catTitle += ' / ';
        }
        item.catTitle = catTitle;
    }

    function getData() {
        var self = this;
        var holder = promise();

        holder
            .then(function () {
                return collCategory.getCategoriesWithRemoved();
            })
            .then(function (catList) {
                var map = self._catMap;
                helper.arrayWalk(catList, function (item) {
                    item && item.id && (map[item.id] = item);
                });
                return collExpense.getExpenses({limit: MAX_ITEMS});
            })
            .then(function (expenseList) {
                helper.arrayWalk(expenseList, function (item) {
                    updateItem.call(self, item);
                });

                self.setItems(expenseList);
                bindExpenseChanges.call(self);
                self.checkHaveMore(expenseList.length);
            });

        holder.startThens();
    }

    var UiListClass = app('bb-co')('ui-list-expenses', {
        tpl: 'scripts/ui-controllers/components-custom/ui-controls/lists/expense-list/ui-list-expenses',
        init: function () {
            var self = this;
            UiListClass._parent.init.apply(this, arguments);
            this._catMap = {};

            this.defineScope({
                isEmpty: '',
                haveMore: false,
                items: []
            });

            getData.call(this);

            this._currId = null;
            broadcast.on(pouchProcEvs.onChanged, this._onPouch = function () {
                getData.call(self);
            });

        },
        setItems: function (data) {
            data = helper.clone(data);
            timeLogger.startTimer();
            var items = this.getScope().items;
            items.clear();
            if (items.pushList) {
                items.pushList(data);
            } else {
                helper.arrayWalk(data, function (item) {
                    items.push(item);
                });
            }
            this.checkEmpty();
            timeLogger.stopTimer();
            var timerInfo = timeLogger.getTimeTotal();
            logger.info(this.getName(), '->setItems() len=', data ? data.length : 'null', timerInfo);
        },
        checkHaveMore: function (loadedLen) {
            var scope = this.getScope();
            scope.haveMore = (loadedLen < MAX_ITEMS) ? 'helper-hide' : '';
        },
        checkEmpty: function () {
            var scope = this.getScope();
            scope.isEmpty = (scope.items.length != 0) ? 'helper-hide' : '';
        },
        pushItem: function (item) {
            this.getScope().items.splice(0, 0, item);
            this.checkEmpty();
        },
        processContent: function (content) {
            var self = this;
            content.on('jrclick', function (ev) {
                self.contentCallClick(ev, self);
            });
            UiListClass._parent.processContent.apply(this, arguments);
        },
        callEdit: function (ev) {
            logger.log('edit', this._currId);
            dataProcessor('expense.showEdit').call(this, ev);
        },
        getValue: function () {
            var item = getItemById.call(this, this._currId);
            logger.log(item);
            return {
                id: item && item.id,
                catId: item && item.catId,
                desc: item && item.desc,
                cost: item && item.cost
            };
        },
        callShowMore: function () {
            logger.log('callShowMore');
            var items = this.getScope().items;
            var self = this;
            collExpense.getExpenses({limit: MAX_ITEMS, offset: items.length})
                .then(function (expenseList) {
                    helper.arrayWalk(expenseList, function (item) {
                        updateItem.call(self, item);
                        items.push(item);
                    });
                    self.checkEmpty();
                    self.checkHaveMore(expenseList.length);
                });
        },
        callShowPopup: function () {
            dataProcessor('expense.showPopup').call(this);
        },
        callRemove: function () {
            logger.log('remove', this._currId);
            var item = getItemById.call(this, this._currId);
            doRemove(item);
        },
        callItemClick: function (t) {
            this._currId = dataProcessor('list.editing').call(this, t);
        },
        destroy: function () {
            UiListClass._parent.destroy.apply(this, arguments);
            var blockActions = collExpense.getBlockActions();
            dataEvent.offBlock(blockActions.PUSH, this._dbExpensePush);
            dataEvent.offBlock(blockActions.REMOVE, this._dbExpenseDrop);
            dataEvent.offBlock(blockActions.UPDATE, this._dbExpenseUpdate);
            broadcast.off(pouchProcEvs.onChanged, this._onPouch);
        }

    });

    function getItemById(id) {
        var ret = null;
        if (id) {
            var items = this.getScope().items;
            helper.arrayWalk(items, function (item) {
                if (item.id == id) {
                    ret = item;
                    return false;
                }
            });
        }
        return ret;
    }

    function doRemove(item) {
        if (item) {
            var money = getItemTitle(item);
            var msg = translate('expense.remove', money);
            confirmPlugin.confirm(msg, function () {
                collExpense.removeExpense(item.id);
            });
        }
    }

    function getItemTitle(item) {
        var money = parser.numToMoney(item.cost);
        var ret = item.catTitle + item.catSubTitle + ': ' + money;
        return ret;
    }

    function bindExpenseChanges() {
        // :todo change this
        var self = this;
        var blockActions = collExpense.getBlockActions();
        dataEvent.onBlock(blockActions.REMOVE, this._dbExpenseDrop = function (removedId) {
            logger.log('dataEvent.onBlock(REMOVE)', removedId);
            var items = self.getScope().items;
            for (var i = 0, l = items.length; i < l; i++) {
                var node = items[i];
                if (node.id == removedId) {
                    items.splice(i, 1);
                    l--;
                    i--;
                }
            }
            self.checkEmpty();
        });
        dataEvent.onBlock(blockActions.PUSH, this._dbExpensePush = function (item) {
            item = helper.clone(item);
            logger.log('dataEvent.onBlock(PUSH)', item);
            updateItem.call(self, item);
            self.pushItem(item);
        });
        dataEvent.onBlock(blockActions.UPDATE, this._dbExpenseUpdate = function (data) {
            logger.log('dataEvent.onBlock(UPDATE)', data);
            var item = getItemById.call(self, data.id);
            if (item){
                var newFields = data.newFields;
                for (var key in newFields) {
                    item[key] = newFields[key];
                }
                if (newFields.catId) {
                    updateItem.call(self, item);
                }
            }
        });

    }

})(window.app);
