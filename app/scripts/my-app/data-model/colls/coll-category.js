(function (app) {
    var helper = app('helper');
    var logger = app('logger')('coll-expense');

    var blockActions = {
        PUSH: 'push',
        REMOVE: 'remove',
        UPDATE: 'update'
    };

    var TABLE_NAME = 'categories';

    app('collection-maker')('coll-category', {
        fillCategory: function (setList) {
            return this.fillCollection(TABLE_NAME, setList);
        },
        pushCategory: function (data) {
            return this.pushToColl(TABLE_NAME, data);
        },
        getCategoriesWithRemoved: function (parentId) {
            var whereExpr = parentId && 'catId = ?';
            var whereVals = parentId && [parentId];
            return this.getStorage().getRecords({
                tableName: TABLE_NAME,
                whereExpr: whereExpr,
                whereVals: whereVals,
                whatSelect: '*'
            });
        },
        getCategories: function (parentId) {
            var whereExpr = 'dateEnd is null ';
            var whereVals = [];
            if (parentId) {
                whereExpr += ' and catId = ?';
                whereVals.push(parentId);
            }
            return this.getStorage().getRecords({
                tableName: TABLE_NAME,
                whereExpr: whereExpr,
                whereVals: whereVals,
                whatSelect: '*'
            });
        },
        updateCategory: function (id, toUpdate) {
            return this.updateColl(TABLE_NAME, id, toUpdate);
        },
        removeCategory: function (id) {
            return this.removeFromColl(TABLE_NAME, id);
        }
    }, {
        blockActions: blockActions,
        makeTreeFromList: function (list) {
            var ret = [];
            var parentMap = {};
            var clone = helper.clone(list);
            helper.arrayWalk(clone, function (item) {
                var id = item.id;
                if (!item.catId){
                    parentMap[id] = item;
                    item.nodes = [];
                } else {
                    var parent = parentMap[item.catId];
                    parent && parent.nodes.push(item);
                }
            });
            for (var key in parentMap){
                ret.push(parentMap[key]);
            }
            return ret;
        },
        getItemById: function (id, items) {
            var ret = null;
            if (id) {
                helper.arrayWalk(items, function (item) {
                    if (ret){
                        return false;
                    }
                    if (item.id == id) {
                        ret = item;
                        return false;
                    } else if (item.nodes){
                        helper.arrayWalk(item.nodes, function (node) {
                            if (node.id == id){
                                ret = node;
                                return false;
                            }
                        });
                    }
                });
            }
            return ret;
        }
    });

})(window.app);
