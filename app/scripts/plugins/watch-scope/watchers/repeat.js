/*
* - item of array can't be simple type, only object!
* - you CANNOT add new element to object
* - you CAN add new element to array and do other manipulations
*
* */
(function(){
    var app = window.app;
    var watchScope = app('watch-scope');
    var base = watchScope('base');
    var inherit = app('helper').inherit;
    var logger = app('errors').getLogger('watch-scope.repeat');

    var watchBro = watchScope.broadcast();
    var watchKeyChanges = watchScope._watchKeyChanges;
    var unwatchKeyChanges = watchScope._unwatchKeyChanges;
    //var unwrapMethods = ['push', 'pop', 'shift', 'unshift', 'splice', 'clear'];
    var unwrapMethods = {
        push: true,
        pop: true,
        shift: true,
        unshift: true,
        splice: true,
        clear: true
    };


    function watchKeyForSub(arr, pos, pId){
        var self = this;
        watchKeyChanges(arr, pos, function(params){
            var pos = arr.indexOf(params.val);
            onItemRewrite.call(self, pId, pos, true);
        });
    }

    function getSubWatcherByPos(pos){
        var subWatchers = this._repeatWatchers;
        var ret;
        var obj = getArr.call(this);
        var scope = obj[pos];
        var item;
        for (var key in subWatchers){
            item = subWatchers[key];
            if (item.scope == scope){
                ret = item;
                break;
            }
        }
        item = null;
        subWatchers = null;
        obj = null;
        scope = null;
        key = null;
        return ret;
    }

    function processingWatchKeys(startPos, endPos, callback){
        var subWatchers = this._repeatWatchers;
        var arr = getArr.call(this);

        (!startPos) && (startPos = 0);
        (!endPos) && (endPos = arr.length);

        var item;

        for (var key in subWatchers){
            item = subWatchers[key];
            var pId = item.getId();
            var pos = arr.indexOf(item.scope);
            if (startPos <= pos && pos < endPos){
                callback(pos, pId);
            }
        }
        item = null;
    }

    function removeKeysSubwatchers(startPos, endPos){
        var arr = getArr.call(this);
        processingWatchKeys.call(this, startPos, endPos, function(pos){
            unwatchKeyChanges(arr, pos);
        });
    }

    function updateSubwatchers(startPos, endPos){
        var arr = getArr.call(this);
        var self = this;
        processingWatchKeys.call(this, startPos, endPos, function(pos, pId){
            watchKeyForSub.call(self, arr, pos, pId);
        });
    }

    function initSubWatcher(arr, pos){
        var self = this;
        var arrEl = arr[pos];
        var el = this._template.clone();
        var subWatcher = watchScope.watch(el, arrEl);
        var pId = subWatcher.getId();
        this._repeatWatchers[pId] = subWatcher;

        subWatcher.on('change', function(params){
            params.pos = pos;
            triggerChanges.call(self, params);
        });

        watchKeyForSub.call(this, arr, pos, pId);
        return subWatcher;
    }

    function createElements(arr, startPos, endPos){
        var fragment = $("<div/>");
        (startPos === undefined) && (startPos = 0);
        (endPos === undefined) && (endPos = arr.length);
        for (var i = startPos; i < endPos; i++){
            var subWatcher = initSubWatcher.call(this, arr, i);
            var el = subWatcher.getElement();
            fragment.append(el);
            subWatcher = null;
        }
        return fragment.children();
    }

    // processing rewrite item
    function onItemRewrite(watcherId, pos, rewrite){
        dropSubwatcher.call(this, watcherId, pos);

        //sync DOM with array
        var containerChildren = this.el.children();
        var oldEl = containerChildren.eq(pos);

        if (rewrite){
            //create new watcher for new value
            var obj = getArr.call(this);
            var subWatcher = initSubWatcher.call(this, obj, pos);
            var newEl = subWatcher.getElement();
            subWatcher = null;
            oldEl.before(newEl);
        }
        oldEl.remove();
    }

    function removeElement(startPos, endPos){
        for (var i = endPos; i >= startPos; i--){
            var subWatcher = getSubWatcherByPos.call(this, i);
            if (subWatcher){
                onItemRewrite.call(this, subWatcher.getId(), i, false);
                subWatcher = null;
            } else {
                logger.warn('something wrong with browser again...');
            }
        }
    }

    function getArr(){
        return this.scope[this.path];
    }

    function wrapArray(arr){
        var self = this;
        var len = arr.length;

        var push = arr.push;
        arr.push = function(){
            var pos = arr.length;
            var ret = push.apply(arr, arguments);
            addNewElements.call(self, arr, pos);
            len = arr.length;
            triggerChanges.call(self);
            return ret;
        };
        arr._push = push;

        var pop = arr.pop;
        arr.pop = function(){
            var lenWas = len;
            var pos = arr.length - 1;
            var ret;
            if (pos >= 0){
                removeElement.call(self, pos, pos);
                ret = pop.apply(arr, arguments);
            }
            len = arr.length;
            (lenWas != len) && triggerChanges.call(self);
            return ret;
        };
        arr._pop = pop;

        var shift = arr.shift;
        arr.shift = function(){
            var lenWas = len;
            removeElement.call(self, 0, 0);
            var ret = shift.apply(arr, arguments);
            updateSubwatchers.call(self);
            len = arr.length;
            (lenWas != len) && triggerChanges.call(self);
            return ret;
        };
        arr._shift = shift;

        var unshift = arr.unshift;
        arr.unshift = function(){
            var lenWas = len;
            var ret = unshift.apply(arr, arguments);
            addNewElements.call(self, arr, 0, 1);
            updateSubwatchers.call(self, 1);
            len = arr.length;
            (lenWas != len) && triggerChanges.call(self);
            return ret;
        };
        arr._unshift = unshift;

        var splice = arr.splice;
        arr.splice = function(start, delCount, newEls){
            // delete
            var wasChanged = false;
            var pos = arr.length - 1;
            if (pos != -1){
                if (delCount){
                    wasChanged = true;
                    removeElement.call(self, start, (start + delCount - 1));
                }
            }
            removeKeysSubwatchers.call(self);
            var ret = splice.apply(arr, arguments);

            //add
            var newElLen = arguments.length - 2;
            if (newElLen) {
                wasChanged = true;
                var endPos = start + newElLen;
                endPos && addNewElements.call(self, arr, start, endPos);
                removeKeysSubwatchers.call(self, start, endPos);
            }
            wasChanged && updateSubwatchers.call(self);
            len = arr.length;
            wasChanged && triggerChanges.call(self);
            return ret;
        };
        arr._splice = splice;


        var clear = arr.clear;

        arr.clear = function(){
            var wasChanged = false;
            var newLen = 0;
            if (len != newLen){
                // removed
                removeElement.call(self, newLen, len - 1);
                wasChanged = true;
            }
            len = newLen;
            while(arr.length > 1) {
                pop.apply(arr);
            }

            // hack for CHROME v 37.0.2062.94 m
            // sometimes data saved after clean, WTF???
            for (var key in arr){
                if (!isNaN(key - 0)){
                    arr[key] = {};
                }
            }

            arr.length && pop.apply(arr);

            arr.length = 0;

            wasChanged && triggerChanges.call(self);
        };
        arr._clear = clear;
    }

    function unwrapArray(arr){

        arr['setLen'] = null;
        delete arr['setLen'];

        for (var key in unwrapMethods){
            var old = '_' + key;
            arr[key] = null;
            arr[key] = arr[old];
            arr[old] = null;
            delete arr[old];
        }
    }

    function dropSubwatcher(watcherId, pos){
        var obj = getArr.call(this);

        // unbind listen changes
        unwatchKeyChanges(obj, pos);

        //destroy all prev watchers
        var oldWatcher = this._repeatWatchers[watcherId];
        this._repeatWatchers[watcherId] = null;
        delete this._repeatWatchers[watcherId];
        oldWatcher.destroy();
        oldWatcher = null;
    }

    function addNewElements(elements, startPos, endPos){
        var children = createElements.call(this, elements, startPos, endPos);
        var el = this.el;
        if (!startPos){
            el.prepend(children);
        } else {
            var elChild = el.children();
            if (startPos >= elChild.length){
                el.append(children);
            } else {
                elChild.eq(startPos).before(children);
            }
        }
    }

    function triggerChanges(params){
        params = params || {};
        var obj = getArr.call(this);

        params.path = this.path + ((params.hasOwnProperty('path'))? "#" + params.path : "");
        params.val = (params.hasOwnProperty('val')) ? params.val : obj;

        watchBro.trig(this.message, params);
        this.parent.trigChanges(params);
    }

    // constructor
    function repeat(){
        this._repeatWatchers = {};
        this._template = "";
        repeat._parent.constructor.apply(this, arguments);
    }

    inherit(repeat, base);

    var p = repeat.prototype;

    // initialize
    p.init = function(){
        var el = this.el;
        this._template = $(el.html());
        el.children().remove();
        var value = this.getPropValue();

        //define initial value (first)
        addNewElements.call(this, value);

        wrapArray.call(this, value);
    };

    p.destroy = function(){

        // drop listen array item changes
        var arr = getArr.call(this);
        for (var i = 0, l = arr.length; i < l; i++){
            unwatchKeyChanges(arr, i);
        }

        unwrapArray(arr);

        repeat._parent.destroy.call(this);

        var repeats = this._repeatWatchers;
        for (var key in repeats){
            repeats[key].destroy();
            repeats[key] = null;
            delete repeats[key];
        }
        this._repeatWatchers = repeats = null;
    };

    watchScope('repeat', repeat);

})();