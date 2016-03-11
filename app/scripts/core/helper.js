/*
 * Helpers module
 *
 * consist of method for used by different parts of core
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

    helper.createClass = function(parent, params){
        function ChildClass(){
            ChildClass._parent.constructor.apply(this, arguments);
        }

        this.inherit(ChildClass, parent);

        var p = ChildClass.prototype;

        if (!params.getClass){
            p.getClass = function(){
                return ChildClass;
            };
        }

        for (var key in params){
            p[key] = params[key];
        }
        return ChildClass;
    };

    // deep clone object
    helper.clone = function(data){
        var obj = {
            val: data
        };
        var cloned = JSON.parse(JSON.stringify(obj));

        return cloned.val;
    };

    // generate guid for some reasons
    helper.guid = function (num) {
        var today = (new Date()).getTime().toString(16);
        function fourChars() {
            return Math.floor(
                Math.random() * 0x10000 /* 65536 */
            ).toString(16);
        }

        if (num) {
            var ret = fourChars();
            for (var i = 0; i < (num); i++) {
                ret += '-' + fourChars();
            }
            return (ret + '');
        } else {
            // return as "8x-8x-7x" (x - max chars)
            return (
                fourChars() + fourChars() + fourChars() + '-' +
                fourChars() + fourChars() + fourChars() + '-' +
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
    var safeTextBuff = $("<div/>");

    // return HTML safe text
    helper.getEscapedText = function(text){
        text = text || "";
        return safeTextBuff.text(text).html();
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
    helper.push = function(arr1, arr2){
        for (var i = 0, l = arr2.length; i < l; i++){
            arr1.push(arr2[i]);
        }
    };

    // just clean object fields in top level
    helper.clearObject = function(obj){
        if (obj){
            for (var key in obj){
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

    // checking empty object
    // checking all types of vars
    helper.isEmpty = function(obj){
        var ret = true;
        if (obj === undefined || obj === null || obj === "") {
            ret = true;
        } else if (this.isArray(obj)){
            ret = (obj.length == 0);
        } else {
            var type = (typeof obj);
            if (type == "object"){
                for (var key in obj){
                    ret = false;
                    break;
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