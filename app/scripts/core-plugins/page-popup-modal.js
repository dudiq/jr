/*
 * plugin for create modal popup pages with history changes (back button support)
 * used route-commander for processing history
 *
 * WARNING!!! don't forgot
 *   jr-page-popup.scss
 *
 *
 * how to use:
 *
 * page is extended with methods:
 *
 * .showPopup() - show popup, if needed
 * .closePopup() - close popup, if needed
 *
 * or change params in address bar
 *
 * */
(function(){
    var app = window.app;

    var broadcast = app('broadcast');
    var rCmdEvs = broadcast.events('route-commander');

    var pages = app('pages');
    var navi = app('navigation');
    var helper = app('helper');
    var overflow = helper('overflow');
    var pageAuth = app('page-auth');
    var route = app('route');
    var logger = app('logger')('page-popup');

    var rCmd = app('route-commander');
    var pagePopup = app('page-popup-modal', {});

    var currentPopupPageHelper = null;
    var allPopusIds = {};


    // css class for conitainer, where pages are drawn
    var CONST_CONTAINER_CSS_CLASS = 'jr-container-page-popup';
    var CONST_FIX_PARENT = 'jr-fix-parent';
    var CONST_FIX_CHILD = 'jr-fix-child';

    // default key for modal pages
    var CONST_MODAL_KEY = 'modal-page';

    var isPopupSlide = false;


    // for each page we need create overflow, if params is defined
    function createOverflow(popupInstance) {
        var newPage = popupInstance._page;
        var parentContainer = popupInstance._parentContainer;
        var closeByClick = (popupInstance._closeByClick === undefined) ? true : popupInstance._closeByClick;
        var overflowInst = overflow(parentContainer, {
            className: 'jr-overflow-page-popup',
            onClick: function () {
                if (closeByClick && !newPage.isSliding()) {
                    newPage.onOveflowClick && newPage.onOveflowClick();
                    newPage.closePopup();
                }
            },
            animate: false
        });
        return overflowInst;
    }

    // when route params inited or changed, this method calls for detect what popup we need to show
    function onRouteInit(pageId){
        if (currentPopupPageHelper){
            // close page immediately
            if (currentPopupPageHelper){
                currentPopupPageHelper.closePagePopup();
            }
            currentPopupPageHelper = null;
        } else if (pageId) {
            // open page popup
            var inst = allPopusIds[pageId];
            if (inst){
                currentPopupPageHelper = inst;
                currentPopupPageHelper.showPagePopup();
            }
        }
    }

    // when route params removed, just need close all popups
    function onRouteRemoved(){
        if (currentPopupPageHelper){
            currentPopupPageHelper.closePagePopup(true);
            currentPopupPageHelper = null;
        }
    }

    function defineShowClosePopup(){
        var newPage = this._page;
        var self = this;
        //add new methods to show/hide popups from user code
        newPage.showPopup = function () {
            if (!this.shown) {
                this._showPopupCalled = true;
            }
            var key = self._key;
            var id = self._id;
            if (rCmd.getKey(key) == id) {
                // if url already have this key, just show popup
                self.showPagePopup();
            } else {
                // or just set popup key
                rCmd.setKey(key, id);
            }
        };

        newPage.closePopup = function () {
            var key = self._key;
            var id = self._id;
            if (rCmd.getKey(key) == id) {
                // if url already have this key, just close popup
                route.back();
            } else {
                // or just remove popup key
                self.closePagePopup();
            }
        };
    }

    // base constructor
    function PopupHelperClass(newPage, params){
        // define all params
        var self = this;
        var id = this._id = params.id;
        this._key = CONST_MODAL_KEY;
        this._useOverflow = (this._key == CONST_MODAL_KEY) ? true : params.overflow;
        this._closeByClick = (params.closeByClick === undefined) ? true : params.closeByClick;
        this._fixState = (params.fixAsChild === true) ? CONST_FIX_CHILD : CONST_FIX_PARENT;

        this._overflowInst = null;
        this._parentContainer = null;

        this._page = newPage;

        this._working = false;

        this.init();

        newPage.getPopupInstance = function(){
            return self;
        };

        allPopusIds[id] = this;
    }

    helper.extendClass(PopupHelperClass, {
        overflow: function () {
            return this._overflowInst;
        },
        init: function () {
            defineShowClosePopup.call(this);
        },
        // processing close
        onClose: function () {
            if (this._working && this._useOverflow) {
                this._overflowInst.disable();
            }

            // when next page is popup too, don't remove parent class, because it will flicker content
            var pContainer = this._parentContainer;
            if (!isPopupSlide && pContainer) {
                pContainer.removeClass(CONST_CONTAINER_CSS_CLASS);
            }

            pContainer.removeClass("jr-fix-child jr-fix-parent");

            this._working = false;
            this._page._showPopupCalled = false;
        },
        // processing show
        onShow: function () {
            if (this._page.shown) {
                if (!this._working) {
                    var parentContainer = this._parentContainer = navi.getContainer();
                    if (this._useOverflow) {
                        if (!this._overflowInst) {
                            this._overflowInst = createOverflow(this);
                        }
                        this._overflowInst.enable();
                    }
                    parentContainer.addClass(CONST_CONTAINER_CSS_CLASS);

                    parentContainer.addClass(this._fixState);

                    //helper.recalcDom(parentContainer);
                }
                this._working = true;
            }
        },
        // checking show action, can page showing or not
        canShow: function () {
            var ret = false;
            var id = this._id;
            var hasAccess = pageAuth(id);
            if (hasAccess) {
                if (!this._working) {
                    ret = true;
                }
            }
            return ret;
        },
        // show page popup
        showPagePopup: function () {
            var id = this._id;
            if (this.canShow()) {
                // processing showing
                navi.show(id);

                this.onShow();
            } else {
                // processing errors
                var hasAccess = pageAuth(id);
                if (hasAccess) {
                    if (this._working) {
                        logger.warning('popup "' + id + '" already working...');
                    }
                } else {
                    logger.warning('no access for "' + id + '"');
                }
            }
        },
        // close page popup
        //
        // force - flag for immediately close page
        closePagePopup: function () {
            var id = this._id;
            if (this._working) {
                navi.close(id);
                this.onClose();
            }
        },
        destroy: function () {
            var page = this._page;
            page.closePopup = null;
            page.showPopup = null;
            page.getPopupInstance = null;
            this._page = null;

            this._id = null;
            this._key = null;
            this._useOverflow = null;
            this._closeByClick = null;

            this._overflowInst = null;
            this._parentContainer = null;

            this._working = null;
        }
    });

    var PopupPageClass = pages.createClass('base', 'popup-page', {
        classConstructor: function (params) {
            this._showPopupCalled = false;
            new PopupHelperClass(this, params);
        },
        _draw: function () {
            var drawn = this.drawn;
            PopupPageClass._parent._draw.apply(this, arguments);
            !drawn && this.drawn && this.content.addClass('jr-page-popup');
            return this.content;
        },
        _storeTopPos: function () {},
        _restoreTopPos: function () {},
        _toTop: function () {},
        onOveflowClick: function () {
            // cap
        },
        isShowPopupCalled: function () {
            return this._showPopupCalled;
        }
    });

    
    // create class for popup page
    pagePopup.createClass = function () {
        return PopupPageClass;
    };

    pagePopup.create = function(opt){
        opt.baseClass = 'popup-page';

        pages.wrapClassMethods(opt, {
            onSwitchEnd: function (isShow) {
                if (!isShow){
                    this.onClose();
                }
            },
            hasAccess: function(){
                var isShowPopupCalled = this.isShowPopupCalled();
                return isShowPopupCalled;
            }
        });

        return pages.create(opt);
    };

    pagePopup.defaultKey = function () {
        return CONST_MODAL_KEY;
    };

    function initPagePopupPlugin(){
        broadcast.on([rCmdEvs.onSets, rCmdEvs.onChanged], function(ev){
            var evKeys = ev.keys;
            var val = evKeys[CONST_MODAL_KEY];
            if (val){
                onRouteInit(val);
            } else if (currentPopupPageHelper){
                logger.error('trying to set route keys, please do not do this for popup pages, routing will not working correct');
                onRouteInit();
            }
        });
        broadcast.on(rCmdEvs.onRemoved, function(ev){
            var evKeys = ev.keys;
            if (evKeys[CONST_MODAL_KEY] && currentPopupPageHelper){
                onRouteRemoved();
            }
        });
    }

    helper.onStart(initPagePopupPlugin);

})();
