/*
* base class for page instance
* */
(function(){
    var app = window.app;

    var templater = app('templater');
    var logger = app('logger')('PageBaseClass');

    var weightMap = {};

    // parent page class
    function PageBaseClass(params, pageClass){
        this._init(params, pageClass);
    }

    var p = PageBaseClass.prototype;

    p._init = function(params, pageClass){
        this.id = params.id; //page id for identify
        if (!this.id){
            logger.error('page id is not defined!');
        }

        if (params.templateId){
            app('deprecate')('page.templateId', 'please use viewId');
        }
        this.viewId = params.templateId || params.viewId || this.id;

        this.alias = params.alias; // for route module [optional]
        if (params.useHistory !== false){
            this.alias = params.id;
        }

        this.drawn = false;
        this.shown = false;
        this.content = null;
        this.sliding = false;
        this.topPos = 0;
        this.restorePos = true;
        this._pageClass = pageClass;
        this.weight = params.weight; // for history.back action
        if (params.hasOwnProperty('weight')){
            var w = params.weight;
            if (weightMap[w]){
                logger.warn('page "' + this.id + '" trying define weight, that already exists in "'+ weightMap[w] +'", is it ok?');
            } else {
                weightMap[w] = this.id;
            }
        }
    };

    // processing draw for page
    // replace template by langs, draw if not drawn
    p._draw = function(){
        if (!this.drawn){
            var rawTpl = templater.get(this.viewId);
            var tpl = templater.translate(rawTpl);

            var newDom = $(tpl);

            var oldContent = this.content;
            if (oldContent){
                oldContent.detach();
            }
            var pageClassName = 'page-' + this.id;
            newDom.addClass('jr-page ' + pageClassName);
            var content = this.prepareDomContent(newDom);
            if (!content){
                content = newDom;
            }
            this.content = content;

            if (oldContent){
                oldContent.remove().empty();
                oldContent = null;
            }

            newDom = null;
            content = null;
            this.drawn = true;
        }
    };

    p._hide = function(){
        if (this.shown){
            this.shown = false;
            this.content && this.content.hide();
            this.onHide();
        }
        return this;
    };

    p._detach = function(){
        this.shown = false;
        this.content && this.content.detach();
        return this;
    };

    p._storeTopPos = function(){
        this.topPos = window.scrollY;
    };

    p._restoreTopPos = function(){
        var canRestore = this.canRestorePos();
        this.restorePos && canRestore && window.scrollTo(0, this.topPos);
    };

    p._toTop = function(){
        window.scrollTo(0, 0);
    };

    p.getPageClass = function(){
        return this._pageClass;
    };

    // called once, when page created
    p.init = function(){
        // can be redefined
    };

    // initialize dom content before insert to document
    //
    // called once before show page, but if language changed, it was called again
    p.prepareDomContent = function(newDom){
        // can be redefined
        // but dom must be returned
        return newDom;
    };

    // checking restoring position after return to page
    p.canRestorePos = function(){
        return true;
    };

    // is page sliding right now or not
    p.isSliding = function(){
        return this.sliding;
    };

    // called before showing page in DOM
    p.onBeforeShow = function(){
        // can be redefined
    };

    // called after showing page in DOM
    p.onShow = function(){
        // can be redefined
    };

    // called after hiding page from DOM
    p.onHide = function(){
        // can be redefined
    };

    // called after animation ended, when page showing
    p.onSwitchEnd = function(attached){
        // can be redefined
    };

    // called only shown page and some of key in address bar was changed
    // does not calling when page shown
    p.onRouteChanged = function(routeParams){
        // can be redefined
    };

    // called for showing page after showing in dom with isShowing == true
    // called for hiding page with isShowing == false
    p.onBeforeChange = function(isShowing){
        // when page will be changed
        // can be redefined
    };

    // define hasAccess to page instance if you need to check access from page, not from global rules
    p.hasAccess = function(){
//        // can be redefined
    };

    // define in pages
    var pages = app('pages');
    pages.setBase(PageBaseClass);

})();