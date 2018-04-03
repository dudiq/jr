(function (app) {
    var timeLogger = app('time-logger')('ui-bar-grid');
    var collExpense = app('coll-expense');
    var collCategory = app('coll-category');
    var logger = app('logger')('ui-bar-grid');
    var helper = app('helper');
    var promise = app('promise');
    var translate = app('translate');

    var broadcast = app('broadcast');
    var pouchProcEvs = broadcast.events('pouch-processor');

    function getData(dates) {
        var dateBegin = dates.begin;
        var dateEnd = dates.end;
        timeLogger.startTimer();
        var self = this;
        var holder = promise();
        var res = {
            category: [],
            expense: []
        };

        holder
            .then(function () {
                return collCategory.getCategoriesWithRemoved();
            })
            .then(function (catList) {
                res.category = catList;
                return collExpense.getExpenses({
                    limit: 0,
                    timeFrom: dateBegin,
                    timeEnd: dateEnd
                });
            })
            .then(function (expenseList) {
                res.expense = expenseList;

                timeLogger.stopTimer();
                var timerInfo = timeLogger.getTimeTotal();
                logger.info(self.getName(), 'get cats and expense matrix in', timerInfo);
                logger.log('total: ', expenseList.length);
                return res;
            });

        holder.startThens();
        return holder;
    }

    function createNode(cat) {
        var ret = {
            id: cat.id,
            catId: cat.catId,
            title: cat.title,
            cost: 0
        };
        if (!cat.catId) {
            ret.nodes = {};
        }
        return ret;
    }

    function objectToArrays(roots) {
        var ret = [];
        for (var key in roots) {
            var node = roots[key];
            if (!node) {
                continue;
            }
            var item = {
                id: node.id,
                title: node.title,
                cost: node.cost,
                nodes: []
            };
            var putNodes = item.nodes;

            var subNodes = node.nodes;
            for (var subKey in subNodes) {
                var subNode = subNodes[subKey];
                putNodes.push({
                    id: subNode.id,
                    title: subNode.title,
                    cost: subNode.cost
                });
            }

            ret.push(item);
        }
        return ret;
    }

    function getSummaryGrid(data) {
        var category = data.category;
        var expense = data.expense;

        var total = 0;
        var viewMap = {};
        var catMap = {};
        var roots = {};

        helper.arrayWalk(category, function (item) {
            catMap[item.id] = item;
        });

        helper.arrayWalk(expense, function (item) {
            var catId = item.catId;
            var cat = catMap[catId];
            if (!cat) {
                return;
            }
            var parentId = cat.catId;
            var summNode = viewMap[catId] = viewMap[catId] || createNode(cat);
            var rootNode;
            if (parentId) {
                // create parent node
                (!viewMap[parentId]) && catMap[parentId] &&
                (viewMap[parentId] = createNode(catMap[parentId]));
                rootNode = roots[parentId] = viewMap[parentId];
            } else {
                rootNode = roots[catId] = viewMap[catId];
            }
            var val = item.cost - 0;
            summNode.cost += val;
            if (rootNode) {
                (rootNode != summNode) && (rootNode.cost += val);
                total += val;
                if (summNode !== rootNode) {
                    rootNode.nodes[summNode.id] = summNode;
                }
            }
        });

        var ret = objectToArrays(roots);
        ret.splice(0, 0, {
            id: null,
            title: translate('analytic.total'),
            nodes: [],
            cost: total
        });
        roots = null;
        viewMap = null;
        catMap = null;
        return ret;
    }

    var UiBarGridClass = app('bb-co')('ui-bar-grid', {
        tpl: 'scripts/ui-controllers/components-custom/ui-controls/lists/bar-grid/ui-bar-grid',
        init: function () {
            var self = this;
            this.defineScope({
                items: [],
                isEmpty: false
            });
            this._dates = {
                begin: null,
                end: null
            };
            broadcast.on(pouchProcEvs.onChanged, this._onPouch = function () {
                self.setPeriod(self._dates.begin, self._dates.end);
            });
        },
        setPeriod: function (dateBegin, dateEnd) {
            var self = this;
            var dates = this._dates;
            dates.begin = dateBegin;
            dates.end = dateEnd;
            getData.call(this, dates)
                .catch(function (code, data) {
                    logger.error('setPeriod', code, data);
                })
                .then(function (data) {
                    // create table map
                    var table = getSummaryGrid(data);
                    logger.log(table);
                    var items = self.getScope().items;
                    items.clear();
                    if (items.pushList) {
                        items.pushList(table);
                    } else {
                        helper.arrayWalk(table, function (item) {
                            items.push(item);
                        });
                    }
                    self.checkEmpty();
                });
        },
        processContent: function (content) {
            var self = this;
            content.on('jrclick', function (ev) {
                self.contentCallClick(ev, self);
            });
        },
        callItemClick: function () {
            logger.log('callItemClick', arguments);
        },
        checkEmpty: function () {
            var scope = this.getScope();
            scope.isEmpty = (scope.items.length != 0) ? 'helper-hide' : '';
        },
        destroy: function () {
            broadcast.off(pouchProcEvs.onChanged, this._onPouch);
        }
    });
})(window.app);
