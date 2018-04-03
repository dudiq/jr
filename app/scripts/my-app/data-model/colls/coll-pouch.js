(function (app) {
    var logger = app('logger')('coll-expense');

    var blockActions = {
        PUSH: 'push',
        UPDATE: 'update',
        REMOVE: 'remove'
    };

    var TABLE_NAME = 'pouches';
    var notDeleted = '(dateEnd is null or dateEnd == "undefined")';

    function getRecords(whatSelect) {
        var whereExpr = notDeleted;

        return this.getStorage().getRecords({
            tableName: TABLE_NAME,
            whereExpr: whereExpr,
            whatSelect: '*'
        });
    }

    app('collection-maker')('coll-pouch', {
        fillPouch: function (setList) {
            return this.fillCollection(TABLE_NAME, setList);
        },
        pushPouch: function (data) {
            return this.pushToColl(TABLE_NAME, data);
        },
        getPouches: function (ops) {
            return getRecords.call(this, '*', ops);
        },
        removePouch: function (id) {
            return this.removeFromColl(TABLE_NAME, id);
        }
    }, {
        blockActions: blockActions
    });

})(window.app);
