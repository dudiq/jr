(function(){
    var app = window.app;

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

    function drawList(data){
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
            for (var i = oldDataLength; i < total; i++){
                var newItem = data[i];
                view.push(newItem);
            }
        }

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
    };

    p.init = function(params){
        this._params = params;

        this._dataList = [];
        this._max = params.max || MAX_ITEMS;
        this._viewList = params.scopeList;
        this._createItem = params.createItem;
        this._isItemsEqual = params.isItemsEqual;
        this._updateItem = params.updateItem;
    };

    p.getData = function(){
        return this._dataList;
    };

    p.setData = function(newData){
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

        // fill new list
        if (newDataLength >= oldDataLength){
            for (var i = oldDataLength; i < newDataLength; i++){
                var newItem = createItem(newData[i]);
                oldData.push(newItem);
                changed = true;
            }
        }

        drawList.call(this, oldData);

        return changed;
    };

    app('show-more-class', function(params){
        return new ShowMoreClass(params);
    });

})();