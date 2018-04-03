(function (app) {
    var helper = app('helper');
    var sysLS = app('system-local-storage');
    var route = app('route');

    var mapExist = {
        lc: {},
        kl: {},
        cp: {}
    };

    function CurrentNSClass(params) {
        var self = this;
        var name = this._name = params.name;
        var logger = this.logger = app('logger')('currNSClass.' + name);

        var checkRes = checkExistKey.call(params);
        if (checkRes){
            logger.error(checkRes);
        }

        this.STORE_LAST_CURRENT = params.STORE_LAST_CURRENT;
        this.STORE_KEY_LIST = params.STORE_KEY_LIST;
        this._prefix = params.prefix;


        var E_ITEM = this.EMPTY_ITEM = params.EMPTY_ITEM || 'e';

        this._max = params.max;
        this._routeIndex = params.routeIndex;
        var items = this._items = {};

        // !!! this variable does not change when system working
        // set only when system started !!!
        this._currIndex = 0;
        this._onSetPrefix = params.onSetPrefix;

        bindStorageChanges.call(this, params);
        initData.call(this);
        saveData.call(this);

        if ('onbeforeunload' in window){
            var oldBeforeOnload = window.onbeforeunload;
            window.onbeforeunload = function () {
                helper.clearObject(items);
                readItemsFromLS.call(self);
                var updated = false;
                if (items[self._currIndex] == E_ITEM){
                    updated = true;
                    delete items[self._currIndex];
                }
                updated && saveItemsToLS.call(self);
                oldBeforeOnload && oldBeforeOnload.apply(window, arguments);
            };
        } else {
            this.logger.error('onbeforeunload not supported!!!');
        }

        var iName = this.getIndexName();
        params.onInit && params.onInit.call(this, iName);
    }

    helper.extendClass(CurrentNSClass, {
        getIndexName: function () {
            var ret = this._prefix + this._currIndex;
            return ret;
        },
        getCurrIndex: function () {
            return this._currIndex;
        },
        putItem: function (item, definedFieldKey) {
            var retNS;
            var definedKey = '';
            var totalDefined = 0;
            var items = this._items;
            var checkId = item[definedFieldKey];
            for (var key in items){
                // detect already defined item in list
                var node = items[key];
                if (node && node[definedFieldKey]){
                    totalDefined++;
                    if (node[definedFieldKey] == checkId){
                        definedKey = key;
                    }
                }
            }

            if (totalDefined >= this._max && definedKey === ''){
                retNS = '';
            } else {
                if (definedKey === ''){
                    this.STORE_LAST_CURRENT && sysLS(this.STORE_LAST_CURRENT, this._currIndex);
                    helper.clearObject(items);
                    readItemsFromLS.call(this);
                    items[this._currIndex] = item;
                    saveItemsToLS.call(this);
                } else {
                    this._currIndex = (definedKey - 0);
                    this.STORE_LAST_CURRENT && sysLS(this.STORE_LAST_CURRENT, this._currIndex);
                    // switch to new ns
                    var iName = this.getIndexName();
                    this._onSetPrefix && this._onSetPrefix.call(this, iName);
                }
                retNS = this.getIndexName();
            }
            return retNS;
        },
        setNextItemId: function (id) {
            if (this.STORE_LAST_CURRENT){
                if (!id){
                    sysLS.remove(this.STORE_LAST_CURRENT);
                } else {
                    sysLS(this.STORE_LAST_CURRENT, id);
                }
            }
        },
        updateItem: function (data, updateFieldId) {
            readItemsFromLS.call(this);
            var items = this._items;
            var checkVal = data[updateFieldId];

            for (var key in items){
                var item = items[key];
                if (item[updateFieldId] == checkVal){
                    items[key] = data;
                }
            }

            saveItemsToLS.call(this);
        },
        getCurrItem: function () {
            var ret = this._items[this._currIndex];
            return ret;
        },
        getItems: function () {
            readItemsFromLS.call(this);
            var ret = {};
            var items = this._items;
            var _E = this.EMPTY_ITEM;
            for (var key in items){
                var item = items[key];
                if (item != _E){
                    ret[key] = item;
                }
            }
            return ret;
        },
        dropItems: function (ids) {
            helper.clearObject(this._items);
            readItemsFromLS.call(this);
            for (var i = 0, l = ids.length; i < l; i++){
                var index = ids[i];
                delete this._items[index];
            }
            saveItemsToLS.call(this);
        },
        dropCurrentItem: function () {
            helper.clearObject(this._items);
            readItemsFromLS.call(this);
            this._items[this._currIndex] = this.EMPTY_ITEM;
            saveItemsToLS.call(this);
        }
    });

    function initData() {
        var items = this._items;
        helper.clearObject(items);
        readItemsFromLS.call(this);

        var index;

        // if (helper.isNative){
        if (this.STORE_LAST_CURRENT){
            var currIndex = sysLS(this.STORE_LAST_CURRENT);
            if (currIndex !== null && !isNaN(currIndex) && currIndex >= 0){
                index = currIndex;
            } else {
                index = getUnusedIndex(items);
            }
        } else {
            index = getUnusedIndex(items);
        }
        if (this._routeIndex !== undefined){
            var storedId = route.getFieldValueByIndex(this._routeIndex);
            if (storedId){
                var data = storedId.split(this._prefix);
                var num = (data[1] - 0);
                if (!isNaN(num)){
                    index = num;
                }
            }
        }

        this._currIndex = index;

        if (!items[index]){
            items[index] = this.EMPTY_ITEM;
        }

        this.logger.log('unusedIndex:', index);
    }

    function getUnusedIndex(list) {
        var index = 0;
        var minIndex = 0;
        var founded = false;
        for (var key in list){
            index++;
            if (key != index && !list.hasOwnProperty(index)){
                founded = true;
                break;
            }
            if (minIndex > key){
                minIndex = key;
            }
        }
        if (!founded){
            index = minIndex;
        }
        return index;
    }

    function saveData() {
        saveItemsToLS.call(this);
    }

    function saveItemsToLS() {
        sysLS(this.STORE_KEY_LIST, {
            items: this._items
        });
    }

    function readItemsFromLS() {
        // read logged items
        var val = sysLS(this.STORE_KEY_LIST);
        if (val){
            var list = this._items;
            var storedItems = val.items || {};
            for (var key in storedItems){
                list[key] = storedItems[key];
            }
        }
    }

    function checkExistKey() {
        var ret = '';
        var mapLc = mapExist.lc;
        var mapKl = mapExist.kl;
        var mapCp = mapExist.cp;

        if (this.STORE_LAST_CURRENT && mapLc[this.STORE_LAST_CURRENT]) {
            ret = 'STORE_LAST_CURRENT already used: ' + this.STORE_LAST_CURRENT;
        }

        if (mapKl[this.STORE_KEY_LIST]) {
            ret = 'STORE_KEY_LIST already used: ' + this.STORE_KEY_LIST;
        }

        if (mapCp[this._prefix]) {
            ret = 'prefix already used: ' + this._prefix;
        }

        return ret;
    }

    function bindStorageChanges(params) {
        var self = this;
        if (params.onCurrentDrop){
            sysLS.on(function (ev) {
                if ((ev.type == sysLS.EVENT_STORAGE) && (ev.key == self.STORE_KEY_LIST)){
                    var val = ev.newValue;
                    var items = val && val.items;
                    if (items){
                        if (!items[self._currIndex] || items[self._currIndex] == self.EMPTY_ITEM){
                            params.onCurrentDrop();
                        }
                    }
                }
            });
        }
    }

    app('current-ns-class', CurrentNSClass);

})(window.app);
