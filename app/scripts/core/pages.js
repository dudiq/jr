(function (app) {
    var helper = app('helper');
    var logger = app('logger')('pages');

    var pageInstances = {};
    var pageClasses = {};

    var pages = app('pages', function (pageId) {
        return pageInstances[pageId];
    });

    helper.extendObject(pages, {
        create: function (data) {
            var pageId = data.id;
            var inst;

            if (!pageInstances[pageId]){
                var params = {};
                var methods = {};
                for (var key in data){
                    var val = data[key];
                    if (typeof val == "function"){
                        methods[key] = val;
                    } else {
                        params[key] = val;
                    }
                }
                var baseClassName = params.baseClass || 'base';
                var PageClass = this.createClass(baseClassName, pageId, methods);
                inst = pageInstances[pageId] = new PageClass(params);
            } else {
                logger.warn('trying to create defined page', pageId);
            }

            return inst;
        },
        createClass: function (parentClassName, pageId, methods) {
            var PageClass;
            if (pageClasses[pageId]){
                logger.error('trying to defined already defined class of page', pageId);
            } else {
                var parentClass = pageClasses[parentClassName];
                if (parentClass){
                    PageClass = helper.createClass(parentClass, methods);
                } else {
                    if (typeof methods == "function"){
                        // already defined class
                        PageClass = methods;
                    } else {
                        logger.error('trying to define page without parent!');
                    }
                }
                pageClasses[pageId] = PageClass;
            }
            return PageClass;
        },
        map: function (cb) {
            for (var key in pageInstances) {
                var page = pageInstances[key];
                cb(key, page);
            }
        },
        wrapClassMethods: function (opt, redefined) {
            for (var methodName in redefined){
                var method = redefined[methodName];
                wrapMethod(opt, method, methodName);
            }
        }
    });

    function wrapMethod(opt, method, methodName) {
        var isFirst = false;
        if (typeof method == "object"){
            isFirst = method.isFirst;
            method = method.method;
        }
        if (opt[methodName]){
            var oldMethod = opt[methodName];
            opt[methodName] = function () {
                var ret;
                isFirst && (ret = method.apply(this, arguments));

                // call old method
                (ret === undefined)
                    ? ret = oldMethod.apply(this, arguments)
                    : ret = ret && oldMethod.apply(this, arguments);

                if (!isFirst) {
                    (ret === undefined)
                        ? ret = method.apply(this, arguments)
                        : ret = ret && method.apply(this, arguments);
                }

                return ret;
            };
        } else {
            opt[methodName] = function () {
                return method.apply(this, arguments);
            };
        }
    }

})(window.app);
