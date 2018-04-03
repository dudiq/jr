(function (app) {

    var helper = app('helper');
    var logger = app('logger')('page-class');
    var templater = app('templater');
    var translate = app('translate');

    var weightMap = {};

    function PageClass(params) {
        onConstruct.call(this, params);
        this.init();
    }

    helper.extendClass(PageClass, {
        _draw: function () {
            if (!this.drawn){
                var rawTpl = templater.get(this._tplPath);
                var tpl = translate.text(rawTpl);
                if (!tpl){
                    logger.error('not defined rawTpl for "%s" page', this.id);
                }
                var newDom = $(tpl);

                var oldContent = this.content;
                if (oldContent){
                    oldContent.detach();
                }
                var pageClassName = 'page-' + this.id;
                newDom.addClass('jr-page ' + pageClassName);
                this.content = newDom;
                var content = this.prepareDomContent(newDom);
                content && (this.content = content);

                var internalScroll = this._internalScroll;
                if (internalScroll){
                    newDom.addClass('jr-page-internal-scrolling');
                    var el = this.content;

                    if (typeof internalScroll == "string"){
                        var subEl = newDom.find(internalScroll);
                        if (subEl.length){
                            el = subEl;
                            subEl.addClass('jr-page-inside-container-scroll');
                        }
                    }
                    this._internalScrollEl = el;
                }


                if (oldContent){
                    oldContent.remove().empty();
                    oldContent = null;
                }

                newDom = null;
                content = null;
                this.drawn = true;
            }
        },
        _hide: function () {
            if (this.shown){
                this.shown = false;
                this.content && this.content.hide();
                this.onHide();
            }
            return this;
        },
        _detach: function () {
            this.shown = false;
            this.content && this.content.detach();
            return this;
        },

        _storeTopPos: function () {
            var pos = 0;
            if (this._internalScroll) {
                pos = this._internalScrollEl.scrollTop();
            } else {
                pos = window.scrollY;
            }
            this.topPos = pos;
        },

        _isInternalScrolled: function () {
            return !!this._internalScroll;
        },

        _restoreTopPos: function () {
            var canRestore = this.canRestorePos();
            if (this.restorePos && canRestore) {
                var pos = this.topPos;
                if (this._internalScroll) {
                    this._internalScrollEl.scrollTop(pos);
                } else {
                    window.scrollTo(0, pos);
                }
            }

        },

        _toTop: function () {
            if (this._internalScroll) {
                this._internalScrollEl.scrollTop(0);
            } else {
                window.scrollTo(0, 0);
            }
        },

        dropScroll: function () {
            this.topPos = 0;
            this._toTop();
        },

        getProp: function (key) {
            var ret;
            var val = this._props[key];
            if (typeof val == "function"){
                logger.warn('trying to get not defined initial property of page:', key);
            } else {
                ret = val;
            }
            return ret;
        },

        // called once, when page created
        init: function () {
            // can be redefined
        },

        // _initialize dom content before insert to document
        //
        // called once before show page, but if language changed, it was called again
        prepareDomContent: function (newDom) {
            // can be redefined
            // but dom must be returned
            return newDom;
        },

        // checking restoring position after return to page
        canRestorePos: function () {
            return true;
        },

        // is page sliding right now or not
        isSliding: function () {
            return this.sliding;
        },

        // called before showing page in DOM
        onBeforeShow: function () {
            // can be redefined
        },

        // called after showing page in DOM
        onShow: function () {
            // can be redefined
        },

        // called after hiding page from DOM
        onHide: function () {
            // can be redefined
        },

        // called after animation ended, when page showing
        onSwitchEnd: function (attached) {
            // can be redefined
        },

        // called only shown page and some of key in address bar was changed
        // does not calling when page shown
        onRouteChanged: function (routeParams) {
            // can be redefined
        },

        // called for showing page after showing in dom with isShowing == true
        // called for hiding page with isShowing == false
        onBeforeChange: function (isShowing) {
            // when page will be changed
            // can be redefined
        },

        // define hasAccess to page instance if you need to check access from page, not from global rules
        hasAccess: function () {
//        // can be redefined
        }
    });

    function onConstruct(params) {
        var id = this.id = params.id; //page id for identify
        if (!id){
            logger.error('page id is not defined!');
        }

        this._props = params;

        this._tplPath = params.tplPath;

        // for get this template only for dev
        var templater = app('templater');
        templater.get(this._tplPath);

        var alias = params.alias; // for route module [optional]
        if (params.useHistory !== false){
            alias = id;
        }

        if (alias && alias.indexOf('/') == 0){
            logger.error('alias of page "' + id + '" is not correct, must be without "/" character');
        }

        this.alias = alias;

        this.drawn = false;
        this.shown = false;
        this.content = null;
        this.sliding = false;

        this._internalScroll = params.internalScroll;
        this._internalScrollEl = this.content;

        this.topPos = 0;
        this.restorePos = true;
        this.weight = params.weight; // for history.back action
        if (params.hasOwnProperty('weight')){
            var w = params.weight;
            if (weightMap[w]){
                logger.warn('page "' + id + '" trying define weight, that already exists in "'+ weightMap[w] +'", is it ok?');
            } else {
                weightMap[w] = id;
            }
        }
    }

    app('pages').createClass(null, 'base', PageClass);

})(window.app);
