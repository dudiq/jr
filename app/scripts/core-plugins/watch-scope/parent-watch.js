(function(){

    // helper for find elements except parents in expression
    $.expr[':'].exparents = function(a,i,m){
        return $(a).parents(m[3]).length < 1;
    };

    var app = window.app;
    var watchScope = app('watch-scope');
    var helper = app('helper');
    var logger = app('logger')('parent-watch');

    var findObjectByPath = watchScope._findObjectByPath;
    var watchObject = watchScope._watchObject;
    var watchBro = watchScope.broadcast();

    // listen object changes and trigger broadcast
    function watchToPath(item, scope, path){
        var pathHandlers = item.pathHandlers;

        var msg = this.getMessageByType('path') + path;
        if (!pathHandlers[path]){

            // generate message string for current scope path for all watchers
            pathHandlers[path] = msg;

            var prop = findObjectByPath(scope, path);
            if (prop) {
                var self = this;
                watchObject(prop.obj, prop.key, function(params){
                    params.path = path;
                    // this trigger will trig for all child watchers who are listen
                    // noo need to store all child watchers callback, using broadcast way
                    watchBro.trig(msg, params);
                    self.trigChanges(params);
                });
            }
        }
        return msg;
    }

    function parseExp(exp){
        var ret = {
            path: null,
            name: null,
            data: null
        };
        // exp format
        // example name(path, data)
        var data = null;
        var haveData = true;
        var firstPos = exp.indexOf("(");
        var name = exp.substring(0, firstPos);
        var path = "";
        var secondPos = exp.indexOf(",");
        if (secondPos == -1){
            secondPos = exp.lastIndexOf(")");
            haveData = false;
        }
        if (secondPos != -1){
            path = exp.substring(firstPos + 1, secondPos);
        }
        if (haveData){
            var treePos = exp.lastIndexOf(")");
            data = exp.substring(secondPos + 1, treePos);
        }
        ret.path = path.trim();
        ret.name = name.trim();
        ret.data = (data && data.trim()) || data;

        return ret;
    }

    // collect all DOM elements with 'scope' and 'bind' attrs for processing watchers
    //
    // bindEls - jquery collection of DOM elements
    // scope - scope
    // item - scopeStorage item
    function watchToElements(bindsEls, scope, item){
        // bind watchers

        var self = this;

        bindsEls.each(function(index, el){
            var $el = $(el);
            var exp = el.getAttribute('jr-watch');

            // split all defined methods
            var methods = exp.split(';');

            for (var i = 0, l = methods.length; i < l; i++){
                var method = (methods[i] + '').trim();
                method && createChildWatcher.call(self, method, item, scope, $el);
            }
        });
    }

    // create watcher by defined expression in html attribute
    function createChildWatcher(exp, item, scope, $el){
        var childWatchers = this.watchers;

        var self = this;
        var obj = parseExp(exp);
        if (obj.path && obj.name){
            var path = obj.path;
            var name = obj.name;
            var subData = obj.data;
            if (path.indexOf(':') != -1){
                logger.error('trying to define variable name with undeclared syntax');
            }
            obj = null;

            var ChildWatcher = watchScope(name);
            if (ChildWatcher){
                var msg = watchToPath.call(self, item, scope, path);

                // create new DOM child watcher for path
                var prop = findObjectByPath(scope, path);
                if (ChildWatcher && prop && prop.obj.hasOwnProperty(prop.key)){
                    childWatchers.push(new ChildWatcher({
                        parent: self,
                        scope: scope,
                        subData: subData,
                        el: $el,
                        path: path,
                        message: msg
                    }));
                }

            } else {
                logger.error('not correct watcher name: "' + name + '"');
            }
        } else {
            logger.warn('not correct expression "' + exp + '"');
        }
    }

    // constructor
    function ParentWatchClass(el, item, callback){
        var scope = this.scope = item.scope;

        this.watchers = [];

        // defined event id for new watch, need for correct unbind watch, if scope already have other watcher instaces
        this.parentId = helper.guid();
        this.itemId = item.guid;
        this.el = el;

        // elements to bind
        if ($.type(el) == "string"){
            // watch to path only
            // el - is path

            if (callback){
                // define only when callback parameter use
                // in other cases it not needed
                this.singlePathCallback = callback;
                this.msg = watchToPath.call(this, item, scope, el);
                this.singlePathCallback && watchBro.on(this.msg, this.singlePathCallback);
            }
        } else {
            // will find inside El
            var bindsEls = el.find('[jr-watch]');

            // will added El
            var added = bindsEls.add(el.filter('[jr-watch]'));

            // remove repeat children
            var watchToEls = added.filter(':exparents([jr-watch^=repeat])');

            watchToElements.call(this, watchToEls, scope, item);
        }
    }

    var p = ParentWatchClass.prototype;

    p.getElement = function(){
        return this.el;
    };

    p.getId = function(){
        return this.parentId;
    };

    p.getMessageByType = function(type){
        var msg = this.itemId + "#" + type + '#';
        return msg;
    };

    p.trigChanges = function(params){
        var msg = this.getMessageByType('change');
        watchBro.trig(msg, params);
    };

    p.on = function(type, callback){
        var msg = this.getMessageByType(type);
        watchBro.on(msg, callback);
    };

    p.off = function(type, callback){
        var msg = this.getMessageByType(type);
        watchBro.off(msg, callback);
    };

    p.one = function(type, callback){
        var msg = this.getMessageByType(type);
        watchBro.one(msg, callback);
    };

    // remove all child watchers and parent instance
    p.destroy = function(){
        watchBro.off(this.getMessageByType('change'));
        
        var watchers = this.watchers;
        for (var i = 0, l = watchers.length; i < l; i++){
            watchers[i].destroy();
        }
        watchers.clear();
        this.watchers = watchers = null;

        watchScope._unwatchInst(this.scope, this);

        this.scope = null;
        this.el = null;
        this.singlePathCallback && watchBro.off(this.msg, this.singlePathCallback);
        this.msg = null;
        this.singlePathCallback = null;
        this.itemId = null;
        this.parentId = null;
    };

    watchScope('parent', ParentWatchClass);


})();