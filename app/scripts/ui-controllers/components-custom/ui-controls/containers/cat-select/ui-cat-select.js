(function (app) {
    var timeLogger = app('time-logger')('ui-categories');
    var collCategory = app('coll-category');
    var logger = app('logger')('ui-cat-select');
    var helper = app('helper');
    var dataProcessor = app('data-processor');
    var translate = app('translate');
    var dom = app('dom');


    var MODE_ADD = 'add';
    var MODE_EDIT = 'edit';

    var actions = {
        edit: function (scope, setCost) {
            scope.setList.clear();
            scope.setList.push(setCost);
            dataProcessor('expense.editFromCat').call(this);
            return '';
        },
        add: function (scope, setCost) {
            scope.setList.push(setCost);
            dataProcessor('expense.addFromCat').call(this);
            return '';
        },
        clear: function (scope) {
            scope.setList.clear();
            return '';
        },
        plus: function (scope, setCost) {
            var ret = '';
            if (this._mode == MODE_ADD) {
                scope.setList.push(setCost);
            } else {
                ret = setCost;
            }
            return ret;
        },
        minus: function (scope, setCost) {
            var ret = '';
            if (setCost) {
                ret = setCost.substring(0, setCost.length - 1);
            } else {
                ret = scope.setList.pop();
            }
            !ret && (ret = '');
            return ret;
        },
        def: function (scope, setCost, value) {
            var floatPos = setCost.indexOf('.');
            var haveFloat = (floatPos != -1);
            var ret = setCost;
            if (value == '.') {
                (!haveFloat) && (ret += (value));
            } else {
                if (haveFloat) {
                    (floatPos >= setCost.length - 2) && (ret += value);
                } else {
                    ret += value;
                }
            }
            return ret;
        }
    };

    var UiListClass = app('bb-co')('ui-cat-select', {
        tpl: 'scripts/ui-controllers/components-custom/ui-controls/containers/cat-select/ui-cat-select',
        init: function () {
            this.defineScope({
                items: [],
                setCatId: '',
                setCost: '',
                setList: [],
                costTotal: '',
                costCurrent: '0',
                costSums: ''
            });
            this._mode = MODE_ADD;
            this._editItem = null;
            this._catMap = {};
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
            timeLogger.stopTimer();
            var timerInfo = timeLogger.getTimeTotal();
            logger.info(this.getName(), '->setItems() len=', data ? data.length : 'null', timerInfo);
        },
        setValue: function () {

        },
        getValue: function () {
            var scope = this.getScope();
            return {
                catId: scope.setCatId,
                costs: scope.setList,
                id: this._editItem ? this._editItem.id : null
            };
        },
        processContent: function (content) {
            var self = this;
            content.find('.items').on('jrclick', function (ev) {
                self.contentCallClick(ev, self);
            });
            var keypad = content.find('.ui-keypad');
            keypad.on('jrclick', {immediately: true}, function (ev) {
                self.callKeypad(keypad, ev);
            });
            UiListClass._parent.processContent.apply(this, arguments);
        },
        callSubItemClick: function (t) {
            // called from DOM
            var id = t.getAttribute('data-id');
            logger.log(id);
            this.doShowKeypad(id);
            var content = this.getContent();
            dataProcessor('list.editing').call(this, t, 'main-cat-selected', function (id, state) {
                if (!state) {
                    dom.removeClass(content, 'show-keypad');
                }
            });
        },
        doShowKeypad: function (id) {
            this.getScope().setCatId = id;
            var content = this.getContent();
            dom.addClass(content, 'show-keypad');
        },
        callItemClick: function (t) {
            var self = this;
            dataProcessor('list.editing').call(this, t, 'cat-selected', function (id, isEditing) {
                var content = self.getContent();

                if (isEditing) {
                    var parentItem = getItemById.call(self, id);
                    dom.addClass(content, 'item-selected');
                    if (parentItem && !parentItem.nodes.length) {
                        self.doShowKeypad(id);
                    }
                } else {
                    self._onState();
                    if (self._mode == MODE_ADD) {
                        // self._clearCosts();
                    }
                }
            });
        },
        _onState: function () {
            var content = this.getContent();
            var scope = this.getScope();
            dom.removeClass(content, 'item-selected');
            dom.removeClass(content, 'show-keypad');
            dom.removeClass(dom.find(content, '.main-cat-selected'), 'main-cat-selected');
            dom.removeClass(dom.find(content, '.cat-selected'), 'cat-selected');
            scope.catId = '';
        },
        _clearCosts: function () {
            var scope = this.getScope();
            scope.setCost = '';
            scope.costCurrent = '0';
            scope.costSums = '';
            scope.setList.clear();
            scope.costTotal = '';
        },
        onDefaultState: function () {
            var content = this.getContent();
            if (this._mode == MODE_EDIT) {
                dom.addClass(content, 'is-editing');
            } else {
                dom.removeClass(content, 'is-editing');
            }
            var self = this;
            logger.log('onDefaultState');
            this._onState();
            this._clearCosts();
            fillCats.call(this)
                .then(function () {
                    self.processByModes();
                });
        },
        processByModes: function () {
            if (this._mode == MODE_EDIT && this._editItem) {
                var item = this._editItem;
                var items = this.getScope().items;
                var catMap = this._catMap;
                var newVal = ((item.cost / 100) + '').replace(',', '.');
                updateScopeCosts.call(this, newVal);
                // find parent
                var node = this._catMap[item.catId];
                var parentNode = (node && node.catId) ? catMap[node.catId] : node;
                if (parentNode) {
                    var pos = findById(items, parentNode.id);
                    if (pos >= 0) {
                        var content = this.getContent();
                        var parentEl = dom.find(content, '.items')[0].childNodes[pos];
                        // var parentEl = dom.find(content, '.items').children().eq(pos);
                        this.callItemClick(parentEl);
                        if (parentNode != node) {
                            var childPos = findById(items[pos].nodes, node.id);
                            if (childPos >= 0) {
                                var childEl = dom.find(parentEl, '.ui-cat_node')[0].childNodes[childPos];
                                // var childEl = parentEl.find('.ui-cat_node').children().eq(childPos);
                                this.callSubItemClick(childEl);
                                //omhg!! too much logic =(
                            }
                        }
                    }
                } else {
                    // oops
                    logger.error('something goes wrong');
                }
            }
        },
        callKeypad: function (t, ev) {
            var value = ev.target.getAttribute('data-value');
            var scope = this.getScope();
            if (value) {
                // collect values
                var setCost = scope.setCost + '';
                var method = actions[value];
                if (!method) {
                    method = actions.def;
                }
                var newVal = method.call(this, scope, setCost, value);

                updateScopeCosts.call(this, newVal);
            }
            logger.log(value);
        },
        useAsEdit: function (item) {
            this._editItem = item;
            this._mode = MODE_EDIT;
        },
        useAsAdd: function () {
            this._editItem = null;
            this._mode = MODE_ADD;
        }
    });

    function findById(items, id) {
        var ret = -1;
        helper.arrayWalk(items, function (cat, index) {
            if (cat.id == id) {
                ret = index;
                return false;
            }
        });
        return ret;
    }

    function updateScopeCosts(newVal) {
        var scope = this.getScope();
        if (scope.setCost == newVal) {
            return;
        }

        scope.setCost = newVal;

        var sub = '';
        if (newVal && newVal[newVal.length - 1] == '.') {
            sub = translate.num('1,1')[1];
        }
        scope.costCurrent = newVal ? translate.num(newVal) + sub : '0';
        scope.costTotal = getCostTotal(scope.setList, newVal);
        scope.costSums = getCostSums(scope.setList);
    }

    function fillCats() {
        var self = this;
        return collCategory.getCategories()
            .catch(function (e) {

            })
            .then(function (data) {
                var map = self._catMap;
                helper.clearObject(map);
                helper.arrayWalk(data, function (item) {
                    map[item.id] = item;
                });

                var tree = collCategory.getParams().makeTreeFromList(data);
                self.setItems(tree);
            });
    }

    function getCostTotal(arr, last) {
        var sum = last ? last - 0 : 0;
        helper.arrayWalk(arr, function (item) {
            if (item) {
                sum += (item - 0);
            }
        });
        var ret = sum ? '= ' + translate.num(sum) : '';
        return ret;
    }

    function getCostSums(arr) {
        var line = '';
        helper.arrayWalk(arr, function (item) {
            if (item) {
                line += ' ' + translate.num(item) + ' +';
            }
        });
        return line;
    }

    function getItemById(id) {
        var items = this.getScope().items;
        var rec = collCategory.getParams().getItemById(id, items);
        return rec;
    }

})(window.app);
