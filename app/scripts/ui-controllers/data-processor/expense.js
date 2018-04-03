(function (app) {
    var dataProcessor = app('data-processor');
    var logger = app('logger')('data-processor.expense');
    var parser = app('input-money-parser');
    var collExpense = app('coll-expense');
    var helper = app('helper');
    var promise = app('promise');
    var portal = app('portal');

    var expensePopup = {
        id: 'expense-popup',
        tpl: 'scripts/ui-controllers/pages/expense/expense-popup'
    };

    function hidePopup() {
        var parent = portal(expensePopup);
        parent.hidePortal();
        var popup = parent.find('expense-popup');
        popup.hidePopup();
    }

    function parseNewCosts(cb) {
        var parent = portal(expensePopup);
        var catSelect = parent.find('cat-select');
        var data = catSelect.getValue();
        var descCmp = parent.find('desc');

        var desc = descCmp.getValue();
        var costs = data.costs;
        var catId = data.catId;
        var haveErrors = false;
        var list = [];
        helper.arrayWalk(costs, function (item) {
            if (item) {
                var obj = parser.asString(item);
                obj.data.catId = catId; //:todo changed set catId
                obj.data.desc = desc;
                list.push(obj);
                if (obj.error) {
                    haveErrors = true;
                }
            }
        });

        if (!haveErrors && catId) {
            logger.log(costs, list);
            var holder = promise();
            holder
                .catch(function () {
                    // end animate
                });

            helper.arrayWalk(list, function (item) {
                holder.then(function () {
                    return cb(item);
                    collExpense.pushExpense(item.data);
                });
            });

            holder
                .then(function () {
                    // end animate
                    descCmp.setValue('');
                    hidePopup.call(self);
                });

            holder.startThens();

        } else {
            logger.error(obj);
        }
    }

    dataProcessor({
        'expense.showEdit': function () {
            var parent = this.getParent();
            var listComp = parent.find('list-expenses');
            var item = listComp.getValue();
            logger.log('item', item);
            if (item){
                var port = portal(expensePopup);
                port.draw();
                var catSelect = port.find('cat-select');
                catSelect.useAsEdit(item);
                var descCmp = port.find('desc');
                descCmp.setValue(item.desc);
                var popup = port.find('expense-popup');

                port.showPortal();
                popup.showPopup();
            } else {
                logger.error('something wrong with getting item for editing', item);
            }
        },
        'expense.editFromCat': function () {
            var port = portal(expensePopup);
            var catSelect = port.find('cat-select');
            var data = catSelect.getValue();
            parseNewCosts.call(this, function (item) {
                var setData = item.data;
                return collExpense.updateExpense(data.id, {
                    cost: setData.cost,
                    desc: setData.desc,
                    catId: setData.catId
                });
            });
        },
        'expense.addFromCat': function () {
            parseNewCosts.call(this, function (item) {
                return collExpense.pushExpense(item.data);
            });
        },
        'expense.showPopup': function () {
            var port = portal(expensePopup);
            var popup = port.find('expense-popup');
            popup.showPopup();
            var catSelect = port.find('cat-select');

            catSelect.useAsAdd();
            var descCmp = port.find('desc');
            descCmp.setValue('');

            port.showPortal();
        }
    });

})(window.app);
