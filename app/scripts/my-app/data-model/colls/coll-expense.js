(function (app) {
    var logger = app('logger')('coll-expense');
    var dataProc = app('data-processor');

    var blockActions = {
        PUSH: 'push',
        UPDATE: 'update',
        REMOVE: 'remove'
    };

    var TABLE_NAME = 'expenses';
    var notDeleted = '(dateEnd is null or dateEnd == "undefined")';

    function pushToWhere(where, str) {
        where ? where.push(str) : where = [str];
        return where;
    }

    function getRecords(whatSelect, ops) {
        var limit = (ops.hasOwnProperty('limit')) ? ops.limit : 100;
        var timeFrom = ops.timeFrom;
        var timeEnd = ops.timeEnd;
        var withRemoved = ops.withRemoved;
        var offset = ops.offset;
        var whereVals;

        var whereExpr;
        if (timeFrom) {
            whereExpr = ['time >= ' + timeFrom];
        }

        var currPouch = dataProc('pouches.getCurrent')();
        if (currPouch) {
            var currPouchStr = 'pouchId = ?';
            whereExpr = pushToWhere(whereExpr, currPouchStr);
            whereVals = pushToWhere(whereVals, currPouch);
        } else {
            whereExpr = pushToWhere(whereExpr, '(pouchId == "" or pouchId is NULL)');
        }

        if (timeEnd) {
            whereExpr = pushToWhere(whereExpr, 'time <= ' + timeEnd);
        }

        if (!withRemoved) {
            whereExpr = pushToWhere(whereExpr, notDeleted);
        }

        return this.getStorage().getRecords({
            fromPos: offset || 0,
            tableName: TABLE_NAME,
            whatSelect: whatSelect,
            orderBy: 'order by time desc',
            useLimits: !!limit,
            whereVals: whereVals,
            whereExpr: whereExpr ? whereExpr.join(' AND ') : null,
            limit: limit
        });
    }

    app('collection-maker')('coll-expense', {
        fillExpense: function (setList) {
            return this.fillCollection(TABLE_NAME, setList);
        },
        pushExpense: function (data) {
            var currPouch = dataProc('pouches.getCurrent')();
            if (currPouch) {
                data.pouchId = currPouch;
            }
            return this.pushToColl(TABLE_NAME, data);
        },
        getCountByPeriod: function (from, to) {
            return getRecords.call(this, 'sum(cost) as summary', {
                limit: 0,
                timeFrom: from,
                timeEnd: to
            });
        },
        getExpenses: function (ops) {
            return getRecords.call(this, '*', ops);
        },
        updateExpense: function (id, toUpdate) {
            return this.updateColl(TABLE_NAME, id, toUpdate);
        },
        removeExpense: function (id) {
            return this.removeFromColl(TABLE_NAME, id);
        }
    }, {
        blockActions: blockActions
    });

})(window.app);
