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

    var config = app('config');
    var pagePopup = app('page-popup', {});
    var broadcast = app('broadcast');
    var routeEvs = broadcast.events('route');
    var rCmdEvs = broadcast.events('route-commander');

    var pages = app('pages');
    var navi = app('navigation');
    var helper = app('helper');
    var overflow = helper('overflow');
    var pageAuth = app('page-auth');
    var logger = app('errors').getLogger('page-popup');

    var rCmd = app('route-commander');

    var currentPopupPageHelper = null;
    var parentMap = {};
    var collection = {};


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
        var key = popupInstance._key;
        var closeByClick = (popupInstance._closeByClick === undefined) ? true : popupInstance._closeByClick;
        var useRoute = (popupInstance._useRoute === undefined) ? true : popupInstance._useRoute;
        var overflowInst = overflow(parentContainer, {
            className: 'jr-overflow-page-popup',
            onClick: function () {
                if (closeByClick && !newPage.isSliding()) {
                    newPage.onOveflowClick && newPage.onOveflowClick();
                    useRoute ? rCmd.removeKey(key) : newPage.closePopup();
                }
            },
            animate: false
        });
        return overflowInst;
    }

    // when route params inited or changed, this method calls for detect what popup we need to show
    function onRouteInit(pageId){
        var inst = collection[pageId];
        if (inst._useRoute){
            var canSlide = config.pageTransition;
            var close, show;
            var inst1, inst2;

            if (currentPopupPageHelper){
                // close prev page
                if (currentPopupPageHelper){
                    inst1 = currentPopupPageHelper;
                    canSlide = canSlide && inst1._slide;
                    close = inst1.closePagePopup;
                }
                currentPopupPageHelper = null;
            }

            // open next

            if (inst != inst1){
                currentPopupPageHelper = inst;
                inst2 = inst;
                canSlide = canSlide && inst2._slide;
                show = inst2.showPagePopup;
            }

            if (canSlide && close && show && inst2 && inst2.canShow()){
                //slide pages
                var page1 = inst1._page;
                var page2 = inst2._page;
                var isBack = (page2.weight < page1.weight);
                isPopupSlide = true;
                navi._slidePages(page1, page2, isBack, function(){
                    inst1.onClose();
                    inst2.onShow();
                    isPopupSlide = false;
                });
            } else {
                // just force close prev and open next
                close && close.call(inst1, true);
                show && show.call(inst2);
            }
        }
    }

    function isParentPage(inst, pId){
        var parents = inst._parentPageId;
        var ret = (parents.length == 0);
        for (var i = 0, l = parents.length; i < l; i++){
            if (parents[i] == pId){
                ret = true;
                break;
            }
        }
        return ret;
    }

    // when route params removed, just need close all popups
    function onRouteFinalize(popupId){
        if (currentPopupPageHelper && currentPopupPageHelper._id == popupId){
            var currPage = navi.getCurrentPage();
            var checkId = currPage.id;
            if (currentPopupPageHelper._useRoute){
                if (isParentPage(currentPopupPageHelper, checkId)) {
                    currentPopupPageHelper.closePagePopup();
                } else {
                    currentPopupPageHelper.closePagePopup(true);
                }
            } else {
                // only for when parent page is wrong
                if (isParentPage(currentPopupPageHelper, checkId)) {
                    currentPopupPageHelper.closePagePopup(true);
                }
            }
            currentPopupPageHelper = null;
        }
    }

    function registerForRouteCmd(){
        var parentPageIds = this._parentPageId;
        var key = this._key;
        var id = this._id;

        for (var i = 0, l = parentPageIds.length; i < l; i++){
            var parentPageId = parentPageIds[i];
            var parent = parentMap[parentPageId] = parentMap[parentPageId] || {};
            if (parent[key]){
                // already defined!!!
                // error!!!
                logger.error('popup "' + key + '" already defined...');
            } else {
                parent[key] = id;
            }
        }
    }

    function defineShowClosePopup(){
        var newPage = this._page;
        var self = this;
        //add new methods to show/hide popups from user code
        newPage.showPopup = function () {
            var currPage = navi.getCurrentPage();
            var checkId = currPage.id;
            var isParentOk = isParentPage(self, checkId);
            if (!isParentOk){
                logger.error('trying to show popup with different parentPageId');
            } else {
                if (!this.shown) {
                    this._showPopupCalled = true;
                }
                if (self._useRoute) {
                    var key = self._key;
                    var id = self._id;
                    if (rCmd.getKey(key) == id) {
                        // if url already have this key, just show popup
                        self.showPagePopup();
                    } else {
                        // or just set popup key
                        rCmd.setKey(key, id);
                    }
                } else {
                    self.showPagePopup();
                }
            }
        };

        newPage.closePopup = function () {
            if (self._useRoute){
                var key = self._key;
                var id = self._id;
                if (rCmd.getKey(key) == id) {
                    // if url already have this key, just close popup
                    rCmd.removeKey(key);
                } else {
                    // or just remove popup key
                    self.closePagePopup();
                }
            } else {
                self.closePagePopup();
            }
        };
    }

    function defineSwitchEnd(){
        var self = this;
        var newPage = this._page;
        // and processing close action for slide param
        var oldOnSwitchEnd = newPage.onSwitchEnd;
        newPage.onSwitchEnd = function(isShow){
            if (!isShow){
                self.onClose();
            }
            oldOnSwitchEnd.apply(newPage, arguments);
        };

    }

    function bindRouteChanges(){
        var self = this;
        var newPage = this._page;
        // bind route changes
        if (!this._useRoute) {
            broadcast.on(routeEvs.beforeChange, function (params) {
                self.closePagePopup(true);
            });
        }  else {
            broadcast.on(routeEvs.changed, function(params){
                var key = self._key;
                var id = self._id;
                if (rCmd.getKey(key) == id && !params.pageChanged && newPage.shown){
                    newPage.onRouteChanged(params);
                }
            });
        }

    }

    // base constructor
    function PopupHelperClass(newPage, params){
        // define all params
        var self = this;
        var id = this._id = params.id;
        var parentPageId = params.parentPageId;
        if (!helper.isArray(parentPageId)){
            var parentPageIdArr = [];
            parentPageId && parentPageIdArr.push(parentPageId);
            parentPageId = parentPageIdArr;
        }
        this._parentPageId = parentPageId;
        this._useRoute = (params.useRoute === undefined) ? true : params.useRoute;
        this._key = params.key || CONST_MODAL_KEY;
        this._useOverflow = (this._key == CONST_MODAL_KEY) ? true : params.overflow;
        this._closeByClick = (params.closeByClick === undefined) ? true : params.closeByClick;
        this._slide = params.slide;
        this._fixState = (params.fixAsChild === true) ? CONST_FIX_CHILD : CONST_FIX_PARENT;

        this._overflowInst = null;
        this._parentContainer = null;

        this._page = newPage;

        this._working = false;

        this.init();

        newPage.getPopupInstance = function(){
            return self;
        };

        collection[id] = this;
    }

    var p = PopupHelperClass.prototype;

    p.overflow = function(){
        return this._overflowInst;
    };

    p.init = function(){
        defineShowClosePopup.call(this);
        defineSwitchEnd.call(this);
        bindRouteChanges.call(this);
        registerForRouteCmd.call(this);
    };

    // processing close
    p.onClose = function(){
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
    };

    // processing show
    p.onShow = function(){
        if (this._page.shown){
            if (!this._working) {
                var parentContainer = this._parentContainer = navi.getContainer();
                if (this._useOverflow){
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
    };

    // checking show action, can page showing or not
    p.canShow = function(){
        var ret = false;
        var id = this._id;
        var hasAccess = pageAuth(id);
        if (hasAccess) {
            if (!this._working){
                ret = true;
            }
        }
        return ret;
    };

    // show page popup
    p.showPagePopup = function(){
        var id = this._id;
        if (this.canShow()){
            // processing showing
            if (this._slide) {
                navi._slidePages(null, this._page);
            } else {
                navi.show(id);
            }

            this.onShow();
            var page = this._page;
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
    };

    // close page popup
    //
    // force - flag for immediately close page
    p.closePagePopup = function(force){
        var id = this._id;
        if (this._working) {
            if (force) {
                // default action
                navi.close(id);
                this.onClose();
            } else {
                if (this._slide) {
                    navi._slidePages(this._page, null, true);
                } else {
                    navi.close(id);
                    this.onClose();
                }
            }
        }
    };

    p.destroy = function(){
        var page = this._page;
        page.closePopup = null;
        page.showPopup = null;
        page.getPopupInstance = null;
        this._page = null;


        this._id = null;
        this._parentPageId.clear();
        this._parentPageId = null;
        this._useRoute = null;
        this._key = null;
        this._useOverflow = null;
        this._closeByClick = null;
        this._slide = null;

        this._overflowInst = null;
        this._parentContainer = null;


        this._working = null;
    };

    // create class for popup page
    pagePopup.createClass = function () {
        var newPageClass = pages.createClass();

        var p = newPageClass.prototype;
        // redefine _draw method for add class to page content
        p._draw = function () {
            var content = newPageClass._parent._draw.apply(this, arguments);
            content.addClass('jr-page-popup');
            return content;
        };

        p._storeTopPos = function(){};
        p._restoreTopPos = function(){};
        p._toTop = function(){};

        p.onOveflowClick = function(){
            // cap
        };

        // flag for detect from how popup was showing
        p.isShowPopupCalled = function(){
            return this._showPopupCalled;
        };

        // define method for create popup pages only
        newPageClass.createPopupPage = function (params) {
            var newPage = newPageClass.createPage(params);
            newPage._showPopupCalled = false;
            var popupInstance = new PopupHelperClass(newPage, params);
            return newPage;
        };

        return newPageClass;
    };

    pagePopup.defaultKey = function () {
        return CONST_MODAL_KEY;
    };

    function getPopupFromRCMDev(ev){
        var pageAlias = ev.alias;
        var keys = ev.keys;
        var popups = parentMap[pageAlias];
        var selectPopupId;
        if (popups) {
            for (var key in keys) {
                var val = keys[key];
                if (popups[key] == val) {
                    if (selectPopupId) {
                        logger.error('trying to use more than one popup!');
                        break;
                    } else {
                        selectPopupId = popups[key];
                    }
                }
            }
        }
        return selectPopupId;
    }

    function initPagePopupPlugin(){
        broadcast.on([rCmdEvs.onSets, rCmdEvs.onChanged], function(ev){
            var selectedPopupId = getPopupFromRCMDev(ev);
            if (selectedPopupId){
                onRouteInit(selectedPopupId);
            }
        });
        broadcast.on(rCmdEvs.onRemoved, function(ev){
            var pageAlias = ev.alias;
            var keys = ev.keys;
            var popups = parentMap[pageAlias];
            var removePopupId;
            if (popups){
                for (var key in keys){
                    if (popups[key]){
                        removePopupId = popups[key];
                        break;
                    }
                }
            }
            if (removePopupId){
                onRouteFinalize(removePopupId);
            }
        });
    }

    helper.onStart(initPagePopupPlugin);

})();