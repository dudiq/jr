/*
* store, create and navigate page instances
*
* */
(function(){
    var app = window.app;
    var helper = app('helper');
    var logger = app('errors').getLogger('pages');
    var inherit = helper.inherit;

    // storage for all page instances
    var collection = {};


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


            newPage = collection[id] = new this(params);
            var templater = app('templater');
            templater.get(newPage.templateId);

            if (newPage.alias !== undefined){
                var changePage = app('navigation').changePage;

                // :todo need refactor this reouteRule for correct define and detect alias of page
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

    // create new class page
    pages.createClass = function(){
        var basePageClass = pages.base;
        function pageClass(){
            pageClass._parent.constructor.apply(this, arguments);
        }

        inherit(pageClass, basePageClass);

        pageClass.createPage = createPage;
        return pageClass;
    };

})();