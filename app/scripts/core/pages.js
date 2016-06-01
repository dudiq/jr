/*
* store, create and navigate page instances
*
* */
(function(){
    var app = window.app;
    var helper = app('helper');
    var logger = app('logger')('pages');
    var inherit = helper.inherit;

    // storage for all page instances
    var collection = {};

    var BaseClass;


    var pages = app('pages', function(id){
        return collection[id];
    });

    // create new instance of page by params
    // params - page id or hash array of params
    function createPage(params){
        params = (typeof params == "string") ? {id: params} : params;
        var id = params.id;
        var newPage;

        if (!collection[id]){
            newPage = collection[id] = new this(params, this);
            newPage.init();

            var templater = app('templater');
            templater.get(newPage.viewId);

            if (newPage.alias !== undefined){
                var changePage = app('navigation').changePage;

                // :todo need refactor this routeRule for correct define and detect alias of page
                if (newPage.alias.indexOf('/') == 0){
                    logger.error('alias of page "' + id + '" is not correct, must be without "/" character');
                } else {
                    var routeRule = "/" + newPage.alias;
                    app('route').register(routeRule, function(routeParams){
                        // this is for NORMAL pages (NOT 'drop' pages)
                        if (routeParams.pageChanged || !newPage.drawn){
                            if (!changePage(id)){
                                // no access to page
                                logger.error('no access to page: ' + id);
                            }
                        } else {
                            // onRouteChanged can't be run for 'drop' pages
                            newPage.onRouteChanged(routeParams);
                        }
                    });
                }
            }

        } else {
            logger.warn('trying to create defined page - "' + id +'"');
        }
        return newPage;
    }

    // just return all instances
    pages.map = function(callback){
        for (var key in collection) {
            var page = collection[key];
            callback(key, page);
        }
    };

    pages.setBase = function(val){
        BaseClass = val;
    };

    pages.getBase = function(){
        return BaseClass;
    };

    // create new class page
    pages.createClass = function(){
        function PageClass(){
            PageClass._parent.constructor.apply(this, arguments);
        }

        inherit(PageClass, BaseClass);

        PageClass.createPage = createPage;
        return PageClass;
    };


    pages.create = function(data){
        return create(null, data);
    };

    pages.createByParent = function(parent, data){
        return create(parent, data);
    };

    function create(parent, data){
        if (!parent){
            parent = pages;
        }
        var PageClass = parent.createClass();
        var opt = {};
        var p = PageClass.prototype;
        for (var key in data){
            var val = data[key];
            if (typeof val == "function"){
                p[key] = val;
            } else {
                opt[key] = val;
            }
        }

        var inst = createPage.call(PageClass, opt);
        return inst;
    }

})();