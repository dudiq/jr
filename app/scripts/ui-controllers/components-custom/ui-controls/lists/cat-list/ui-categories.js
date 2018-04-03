(function (app) {
    var timeLogger = app('time-logger')('ui-categories');
    var dataEvent = app('data-event');
    var collCategory = app('coll-category');
    var logger = app('logger')('ui-categories');
    var helper = app('helper');
    var dataProcessor = app('data-processor');
    var translate = app('translate');
    var confirmPlugin = app('confirm');
    var watchScope = app('watch-scope');

    var UiListClass = app('bb-co')('ui-categories', {
        tpl: 'scripts/ui-controllers/components-custom/ui-controls/lists/cat-list/ui-categories',
        init: function () {
            var self = this;
            this.defineScope({
                items: [],
                isEmpty: false
            });

            bindDataChanges.call(this);
            collCategory.getCategories()
                .catch(function (e) {

                })
                .then(function (data) {
                    var tree = collCategory.getParams().makeTreeFromList(data);
                    self.setItems(tree);
                });

            this._currId = null;
        },
        setItems: function (data) {
            data = helper.clone(data);
            timeLogger.startTimer();
            var items = this.getScope().items;
            items.clear();
            if (items.pushList){
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
        processContent: function (content) {
            var self = this;
            content.on('jrclick', function (ev) {
                self.contentCallClick(ev, self);
            });
        },
        callItemClick: function (t) {
            this._currId = dataProcessor('list.editing').call(this, t);
        },
        getCurrentId: function () {
            return this._currId;
        },
        checkEmpty: function () {
            var scope = this.getScope();
            scope.isEmpty = (scope.items.length != 0) ? 'helper-hide' : '';
        },
        callAddSub: function () {
            dataProcessor('category.addSub').call(this);
        },
        callEdit: function () {
            logger.log('edit', this._currId);
            var item = getItemById.call(this, this._currId);
            doUpdateCat(item);
        },
        callRemove: function () {
            logger.log('remove', this._currId);
            var item = getItemById.call(this, this._currId);
            doRemove(item);
        },
        destroy: function () {
            UiListClass._parent.destroy.apply(this, arguments);
            var blockActions = collCategory.getBlockActions();
            dataEvent.offBlock(blockActions.PUSH, this._dbExpense);
            dataEvent.offBlock(blockActions.REMOVE, this._dbExpenseDrop);
            dataEvent.offBlock(blockActions.UPDATE, this._dbExpenseUpdate);
        }
    });

    function getItemById(id) {
        var items = this.getScope().items;
        var rec = collCategory.getParams().getItemById(id, items);
        return rec;
    }

    function doRemove(item) {
        if (item){
            var msg = translate('categories.remove', item.title);
            confirmPlugin.confirm(msg, function () {
                collCategory.removeCategory(item.id);
            });
        }
    }

    function doUpdateCat(item) {
        if (item) {
            var msg = translate('categories.updateTitle', item.title);
            confirmPlugin.prompt(msg, item.title, function (val) {
                collCategory.updateCategory(item.id, {title: val}, {title: item.title});
            });
        }
    }

    function bindDataChanges() {
        // :todo change this
        var self = this;
        var blockActions = collCategory.getBlockActions();
        dataEvent.onBlock(blockActions.REMOVE, this._dbExpenseDrop = function (removedId) {
            logger.log('blockActions.onBlock(REMOVE)', removedId);
            var nodeForRemove = getItemById.call(self, removedId);

            var items = nodeForRemove.catId
                ? getItemById.call(self, nodeForRemove.catId).nodes
                : self.getScope().items;

            // remove item
            for (var i = 0, l = items.length; i < l; i++){
                var node = items[i];
                if (node.id == removedId){
                    items.splice(i, 1);
                    l--;
                    i--;
                }
            }
            self.checkEmpty();

        });
        dataEvent.onBlock(blockActions.PUSH, this._dbExpense = function (item) {
            item = helper.clone(item);
            var items = self.getScope().items;
            logger.log('blockActions.onBlock(PUSH)', item);
            var isRoot = !item.catId;
            var els = items;
            if (isRoot){
                item.nodes = [];
            } else {
                var parent = getItemById.call(self, item.catId);
                els = parent.nodes;
            }
            els.push(item);
            self.checkEmpty();
            scrollToScopeEl(els[els.length - 1]);

        });
        dataEvent.onBlock(blockActions.UPDATE, this._dbExpenseUpdate = function (data) {
            logger.log('dataEvent.onBlock(UPDATE)', data);
            var item = getItemById.call(self, data.id);
            var newFields = data.newFields;
            for (var key in newFields) {
                item[key] = newFields[key];
            }
        });
    }

    function scrollToScopeEl(el) {
        var els = watchScope.getElements(el);
        if (els) {
            els[0][0].scrollIntoView(false);
        }
    }

})(window.app);
