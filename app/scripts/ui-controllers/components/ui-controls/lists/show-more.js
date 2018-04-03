(function(){
    var app = window.app;
    var helper = app('helper');
    var pushToWatchedArray = helper('pushToWatchedArray');

    var MAX_ITEMS = 100;
    var UPDATE_FIELD = '__needUpdate';

    function ShowMoreClass(){
        this.init.apply(this, arguments);
    }

    var p = ShowMoreClass.prototype;


    function updateFields(old, newI){
        for (var key in newI){
            old[key] = newI[key];
        }
    }

    function onAllShown(){
        var isAllShown = (this._viewList.length == this._dataList.length);
        this._params.onAllShown && this._params.onAllShown(isAllShown);
    }

    function drawList(){
        var data = this._dataList;
        var view = this._viewList;
        var max = this._max;
        var newDataLength = data.length;
        var oldDataLength = view.length;
        if (newDataLength < oldDataLength){
            view.splice(newDataLength, oldDataLength - newDataLength);
            oldDataLength = newDataLength;
        }

        // update items, noo need to create in dom
        for (var i = 0; i < oldDataLength; i++){
            var item = data[i];
            if (item[UPDATE_FIELD]){
                var viewItem = view[i];
                updateFields(viewItem, item);
                item[UPDATE_FIELD] = false;
            }
        }

        if (newDataLength >= oldDataLength){
            var total = Math.min(max, newDataLength);
            var toPush = [];
            for (var j = oldDataLength; j < total; j++){
                var newItem = data[j];
                toPush.push(newItem);
            }
            pushToWatchedArray(view, toPush);

            toPush.length = 0;
            toPush = null;
        }
        onAllShown.call(this);
    }

    p.showMore = function(){
        var view = this._viewList;
        var max = this._max;
        var oldData = this._dataList;
        var currPos = view.length;
        var endPos = Math.min(currPos + max, oldData.length);
        for (var i = currPos; i < endPos; i++){
            var newItem = oldData[i];
            view.push(newItem);
        }
        onAllShown.call(this);
    };

    p.init = function(params){
        this._params = params;

        this._dataList = [];
        this._max = params.max || MAX_ITEMS;
        this._viewList = params.scopeList;
        this._fields = params.fields || [];
        this._createItem = params.createItem || defCreateScopeItem;
        this._isItemsEqual = params.isItemsEqual || defIsItemsEqual;
        this._updateItem = params.updateItem || defUpdateScopeItem;
    };

    p.destroy = function () {
        this._params = null;
        this._viewList = null;

        this._dataList && this._dataList.clear();
        this._dataList = null;

        this._max = null;
        this._fields = null;
        this._createItem = null;
        this._isItemsEqual = null;
        this._updateItem = null;
    };

    p.getData = function(){
        return this._dataList;
    };

    p.pushItem = function (item, pos) {
        var newItem = this._createItem.call(this, item);
        var dataList = this._dataList;
        if (pos !== undefined) {
            dataList.splice(pos, 0, newItem);
            helper.arrayWalk(dataList, function (node) {
                node[UPDATE_FIELD] = true;
            });
        } else {
            dataList.push(newItem);
        }
        drawList.call(this);
    };

    p.setData = function(newData){
        if (!newData){
            // drop data
            this._dataList.clear();
            this._viewList.clear();
            onAllShown.call(this);
            return true;
        }

        var createItem = this._createItem;
        var isItemsEqual = this._isItemsEqual;
        var updateItem = this._updateItem;

        var changed = false;
        var oldData = this._dataList;
        var newDataLength = newData.length;
        var oldDataLength = oldData.length;

        // make all arrays correctly
        if (newDataLength < oldDataLength){
            oldData.splice(newDataLength, oldDataLength - newDataLength);
            oldDataLength = newDataLength;
            changed = true;
        }

        if (newDataLength){
            for (var i = 0; i < oldDataLength; i++){
                // update current items
                var item = newData[i];
                var oldItem = oldData[i];
                var isThisItem = (item.id == oldItem.id);
                if (isThisItem){
                    if (!isItemsEqual.call(this, oldItem, item)){
                        updateItem.call(this, oldItem, item);
                        oldItem[UPDATE_FIELD] = true;
                        changed = true;
                    }
                } else {
                    updateItem.call(this, oldItem, item);
                    oldItem[UPDATE_FIELD] = true;
                    changed = true;
                }
            }
        }

        // fill new list
        if (newDataLength >= oldDataLength){
            for (var j = oldDataLength; j < newDataLength; j++){
                var newItem = createItem.call(this, newData[j]);
                oldData.push(newItem);
                changed = true;
            }
        }

        drawList.call(this);

        return changed;
    };

    function defCreateScopeItem(el){
        var ret = {};
        var fields = this._fields;
        for (var i = 0, l = fields.length; i < l; i++){
            var name = fields[i];
            var newVal = processFieldInObjectArray(el, name);
            createField(ret, name, newVal);
        }
        return ret;
    }

    function defIsItemsEqual(oldItem, newItem){
        var ret = true;
        var fields = this._fields;
        for (var i = 0, l = fields.length; i < l; i++){
            var name = fields[i];
            if (ret){
                var oldVal = processFieldInObjectArray(oldItem, name);
                var newVal = processFieldInObjectArray(newItem, name);
                ret = ret && (newVal == oldVal);
            } else {
                break;
            }
        }

        return ret;
    }

    function defUpdateScopeItem(oldItem, newItem){
        var fields = this._fields;
        for (var i = 0, l = fields.length; i < l; i++){
            var name = fields[i];
            var newVal = processFieldInObjectArray(newItem, name);
            createField(oldItem, name, newVal);
        }
    }

    function createField(obj, path, val) {
        var toSet = obj;
        var key = path;
        if (path.indexOf('.') != -1){
            var paths = path.split('.');
            var l = paths.length;
            var lm = l-1;
            for (var i = 0; i < l; i++){
                key = paths[i];
                if (i != lm){
                    toSet = toSet[key] = toSet[key] || {};
                }
            }
            paths = null;
            path = null;
        }
        toSet[key] = val;
    }

    function processFieldInObjectArray(obj, path) {
        var ret = obj;
        if (path.indexOf('.') != -1){
            var paths = path.split('.');
            for (var i = 0, l = paths.length; i < l; i++){
                var key = paths[i];
                if (ret && ret.hasOwnProperty(key)){
                    ret = ret[key];
                } else {
                    break;
                }
            }
            paths = null;
            path = null;
            key = null;
        } else {
            ret = obj[path];
        }
        return ret;
    }

    app('show-more-class', function(params){
        return new ShowMoreClass(params);
    });

})();
