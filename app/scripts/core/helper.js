/*
 * Helpers module
 *
 * consists of methods used by different parts of the core
 * */

(function(){
    var app = window.app;

    var broadcast = app('broadcast');
    var systemEvs = broadcast.events('system');

    var helper = app('helper', {});

    // mobile checking
    helper.isMobile = new RegExp("mobile", "i").test(navigator.userAgent);

    // mobile build checking
    // cordova.js must be defined before helper.js
    helper.isNative = !!window.cordova;

    helper.support = {
        touch: ("ontouchend" in document),
        animation: (function(){
            var s = document.createElement('p').style;
            return 'transition' in s ||
                'WebkitTransition' in s ||
                'MozTransition' in s ||
                'msTransition' in s ||
                'OTransition' in s;
        })()
    };

    // helper for inherit child from parent
    helper.inherit = function(child, parent){
        function F() {}
        F.prototype = parent && parent.prototype;

        child.prototype = new F();
        child._parent = parent.prototype;
        child._parent.constructor = parent;
    };

    helper.createClass = function(ParentClass, params){
        var ChildClass;
        if (ParentClass){
            var onConstruct = params.classConstructor;
            ChildClass = function (){
                ChildClass._parent.constructor.apply(this, arguments);
                onConstruct && onConstruct.apply(this, arguments);
            };

            this.inherit(ChildClass, ParentClass);
            var p = ChildClass.prototype;

            delete params.classConstructor;

            if (!params.getClass && !p.getClass){
                p.getClass = function(){
                    return ChildClass;
                };
            }

            helper.extendClass(ChildClass, params);

        } else {
            logger.error('not defined parent class!');
        }
        params = null;
        return ChildClass;
    };

    helper.extendClass = function(classy, params){
        var p = classy.prototype;
        for (var key in params){
            if (!p.hasOwnProperty(key)){
                p[key] = params[key];
            } else {
                logger && logger.error('trying to define already defined method in prototype!');
            }
        }
        params = null;
    };

    helper.extendObject = function (protoObject, mixins) {
        for (var key in mixins){
            if (!protoObject.hasOwnProperty(key)){
                protoObject[key] = mixins[key];
            } else {
                logger && logger.error(key + ' is already defined');
            }
        }
        mixins = null;
    };

    helper.mixinClass = helper.extendObject;

    // deep clone object
    helper.clone = function(data){
        var ret;
        if (data !== null && typeof data == "object"){
            var obj = {
                val: data
            };
            var cloned = JSON.parse(JSON.stringify(obj));
            ret = cloned.val;
            cloned = null;
        } else {
            ret = data;
        }
        data = null;
        return ret;
    };

    // generate guid for some reasons
    helper.guid = function (num, delim) {
        delim = (delim === undefined) ? '-' : delim;
        var today = (new Date()).getTime().toString(16);
        function fourChars() {
            return Math.floor(
                Math.random() * 0x10000 /* 65536 */
            ).toString(16);
        }

        if (num !== undefined) {
            var ret = fourChars();
            for (var i = 0; i < (num); i++) {
                ret += delim + fourChars();
            }
            return (ret + today);
        } else {
            // return as "8x-8x-7x" (x - max chars)
            return (
                fourChars() + fourChars() + fourChars() + delim +
                fourChars() + fourChars() + fourChars() + delim +
                today
            );
        }
    };

    // prefix for current browser, needed for some css style set of unsupported css3
    helper.browserPrefix = (function () {
        var styles = window.getComputedStyle(document.documentElement, ''); // CSSStyleDeclaration
        var browserMatch = (Array.prototype.slice
                .call(styles)
                .join('')
                .match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
        )[1];

        return '-' + browserMatch + '-';
    })();

    // helper for safeTextBuff
    var safeElBuff = document.createElement("div");

    // return HTML safe text
    helper.getEscapedText = function(text){
        text = text || "";
        var ret = '';
        if (text){
            safeElBuff.innerText = safeElBuff.textContent = text;
            ret = safeElBuff.innerHTML;
        }
        return ret;
    };

    // return arguments of parent function
    helper.getArgs = function(){
        return Array.prototype.slice.apply(arguments[0]);
    };

    // this is special hack for force calculate dimensions of current DOM object
    // sometimes browser have a lag of not correcting calculate of dirty DOM objects
    helper.recalcDom = function(el){
        //this hack is call immediately recalculate DOM of element
        el.addClass("jr-recalc-dom");
        var fakeWidth = el.width();
        el.removeClass("jr-recalc-dom");
    };

    // concat two arrays
    helper.push = function(dest, src){
        for (var i = 0, l = src.length; i < l; i++){
            dest.push(src[i]);
        }
    };

    // just clean object fields in top level
    helper.clearObject = function(obj){
        if (obj){
            for (var key in obj){
                obj[key] = undefined;
                delete obj[key];
            }
        }
    };

    function processKey(obj, hash, separator, cb){
        if (typeof obj == "object"){
            for (var key in obj){
                var newHash = (hash) ? hash + separator + key : key;
                var val = obj[key];
                if (typeof val == "object"){
                    processKey(val, newHash, separator, cb);
                } else {
                    cb(newHash, val);
                }
            }
        } else {
            cb(hash, obj);
        }
    }

    //create one level hash array from tree structure of langs
    helper.treeObjectToList = function(obj, separator, cb){
        if (typeof separator == 'function'){
            cb = separator;
            separator = '.'; // be default
        }
        processKey(obj, '', separator, cb);
    };

    helper.replaceInText = function (text, data, value) {
        var ret = '';
        if (text !== undefined && text !== null){
            ret = text;
            if (data){
                if (value === undefined){
                    for (var key in data){
                        ret = ret.replaceAll(key, data[key]);
                    }
                } else {
                    ret = ret.replaceAll(data, value);
                }
            }
        } else {
            logger.error('replaceInText: trying to replace of undefined text');
        }
        return ret;
    };

    // checking empty object
    // checking all types of vars
    helper.isEmpty = function(obj){
        var ret = true;
        if (obj === undefined || obj === null || obj === "") {
            ret = true;
        } else {
            var type = (typeof obj);
            if (type == "object"){
                if (this.isArray(obj)) {
                    ret = (obj.length == 0);
                } else {
                    for (var key in obj){
                        ret = false;
                        break;
                    }
                }
            } else if (type == "boolean" || (obj === 0)){
                ret = false;
            } else if (type == "string" && obj != ""){
                ret = false;
            } else {
                ret = !!obj;
            }
        }

        return ret;
    };

    // walk in array
    helper.arrayWalk = function(arr, callback){
        for (var i = 0, l = arr.length; i < l; i++){
            var item = arr[i];
            var newVal = callback(item, i);
            if (newVal !== undefined){
                arr[i] = newVal;
            }
        }
    };

    // checking array of variable
    helper.isArray = (function () {
        // Use compiler's own isArray when available
        if (Array.isArray) {
            return Array.isArray;
        }

        // Retain references to variables for performance
        // optimization
        var objectToStringFn = Object.prototype.toString,
            arrayToStringResult = objectToStringFn.call([]);

        return function (subject) {
            return objectToStringFn.call(subject) === arrayToStringResult;
        };
    }());

    var MS_SEC = 1000;
    var MS_MIN = MS_SEC * 60;
    var MS_HOUR = MS_MIN * 60;

    helper.getTimeInterval = function(start, end){
        var dx = end - start;
        var time = dx;
        if (dx < MS_SEC) {
            time = dx + " ms";
        } else if (dx < MS_MIN) {
            time = Math.floor((dx / MS_SEC) * 100) / 100 + 's';
        } else if (dx < MS_HOUR) {
            time = Math.floor((dx / MS_MIN) * 100) / 100 + 'm';
        } else {
            time = Math.floor((dx / MS_HOUR) * 100) / 100 + 'h';
        }
        return time;
    };

    // freeze object and all children
    helper.deepFreeze = function(o){
        if (Object.freeze && Object.isFrozen){
            var prop, propKey;
            Object.freeze(o);
            for (propKey in o) {
                prop = o[propKey];
                if (!o.hasOwnProperty(propKey) || (typeof prop !== 'object') || Object.isFrozen(prop)) {
                    continue;
                }

                helper.deepFreeze(prop);
            }
        }
    };

    // proxy for bind methods by context
    helper.proxy = function(context, method){
        var handler = method;
        if (typeof method == 'string'){
            handler = context[method];
        }
        return function(){
            handler.apply(context, arguments);
        };
    };

    //var totalOnStart = 0;
    /// processing start event of system
    helper.onStart = processDelayCallbacks({field: 'started', evName: systemEvs.onStartBegin});
    helper.onStartEnd = processDelayCallbacks({field: 'startEnd', evName: systemEvs.onStartEnd});
    helper.onDomReady = processDelayCallbacks({field: 'domReady', evName: systemEvs.onDomReady});

    function processDelayCallbacks(params){
        var field = params.field;
        var evName = params.evName;
        var func = function(method){
            if (method){
                if (app[field]){
                    method();
                    method = null;
                } else {
                    broadcast.one(evName, function(){
                        method();
                        method = null;
                    });
                }
            }
        };
        return func;
    }

    /*this is for develop only*/
    var logger = app('logger')('helper');

    logger.info('isMobile = ' +  helper.isMobile);
    logger.info('isNative = ' +  helper.isNative);
    logger.info('browserPrefix = ' +  helper.browserPrefix);

})();
