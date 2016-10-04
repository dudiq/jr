/*
 * this is the most file in core... doh...
 *
 *
 * Navigation module for pages
 *
 * */
(function(){
    var app = window.app;
    var broadcast = app('broadcast');
    var helper = app('helper');
    var config = app('config');
    var logger = app('logger')('navi');
    var translateEvs = broadcast.events('translate');
    var routeEvs = broadcast.events('route');
    var naviEvs = broadcast.events('navigation', {
        onDefaultPage: 'onDefPage',
        onBeforePageShow: 'onBeforePageShow',
        onBeforePageHide: 'onBeforePageHide',
        onPageShow: 'onPageShow',
        onPageHide: 'onPageHide',
        onBeforeChange: 'onBeforeChange',
        onChanged: 'changed',
        onSlideStop: 'navi-slide-stop',
        onSlideStart: 'navi-slide-start'
    });
    
    var route;
    var pageAuth;

    var navi = app('navigation', {});

    var animationSupport = helper.support.animation;

    var pages;

    // main container, where pages will be drawn
    var container;

    var currentPage;

    var sliding = {
        working: false,
        inPage: null,
        outPage: null
    };

    var redrawFragment = $("<div/>");

    // variables for skipped pages (pages, which will NOT shown by changed history in address bar)
    var DROP_PAGE_NAVI = "_jr_page1";

    // default animation events names
    var CONST_ANIMATIONS = "webkitAnimationEnd animationend oanimationend msAnimationEnd";

    function detachPrev(page){
        if (page){
            var canTrig = page.shown;
            canTrig && onBeforeHidePage(page);
            page._hide()._detach();
            canTrig && onHidePage(page);
        }

    }

    function appendNext(page){
        if (!page.shown){
            broadcast.trig(naviEvs.onBeforePageShow, page);
            page.onBeforeShow();
            page.content.show();
            container.append(page.content);
            page.shown = true;
            page.onShow();
            broadcast.trig(naviEvs.onPageShow, page);
        }
    }

    function onSlideEnd(page, nextPage){
        nextPage && (nextPage.sliding = false);
        nextPage && nextPage.content.off(CONST_ANIMATIONS);

        page && (page.sliding = false);
        page && page.content.off(CONST_ANIMATIONS);

        page && detachPrev(page);
        page && page.content.removeClass('jr-out');
        nextPage && nextPage.content.removeClass('jr-in');
        container.removeClass('jr-slide jr-reverse jr-animate');
        sliding.inPage = null;
        sliding.outPage = null;
        sliding.working = false;
        page && page.onSwitchEnd(false);
        nextPage && nextPage.onSwitchEnd(true);
        broadcast.trig(naviEvs.onSlideStop);
    }

    function processScrollCurrPage(page){
        if (config.scrollToTopPage && page){
            // save top position of page
            page._storeTopPos();
            // !page._isInternalScrolled() && page._toTop();
        }
    }

    function setScrollNextPage(nextPage){
        if (config.scrollToTopPage && nextPage) {
            // restore top position of page
            nextPage._restoreTopPos();
        }
    }

    function setScrollNextInside(nextPage) {
        if (config.scrollToTopPage && nextPage && nextPage._isInternalScrolled()) {
            // restore top position of page
            nextPage._restoreTopPos();
        }
    }

    // processing slide pages
    function slidePages(page, nextPage, isBack, onDone){
        !sliding.working && broadcast.trig(naviEvs.onSlideStart);
        container.removeClass('jr-slide jr-reverse jr-animate');

        processScrollCurrPage(page);

        if (sliding.outPage){
            //if sliding run before last page not finished, need clean up context
            detachPrev(sliding.outPage);
            sliding.outPage.content
                .off(CONST_ANIMATIONS)
                .removeClass('jr-in jr-out');
            sliding.outPage.onSwitchEnd(false);
        }

        if (sliding.inPage) {
            sliding.inPage.content
                .off(CONST_ANIMATIONS)
                .removeClass('jr-in jr-out');
            sliding.inPage.onSwitchEnd(true);
        }
        sliding.working = true;

        var slideCss = 'jr-slide' + (isBack ? ' jr-reverse' : '');
        container.addClass(slideCss);

        // for correct animate we need one page for detect animation end
        // by default this is next page

        function onAnimationEnd() {
            onSlideEnd(page, nextPage);
            onDone && onDone();
            setScrollNextPage(nextPage);
        }

        if (nextPage){
            nextPage.content.on(CONST_ANIMATIONS, onAnimationEnd);
        } else {
            page.content.on(CONST_ANIMATIONS, onAnimationEnd);
        }

        if (page){
            page.sliding = true;
            page.content.addClass('jr-out');
        }

        if (nextPage){
            nextPage.sliding = true;
            nextPage.content.addClass('jr-in');
            appendNext(nextPage);
            setScrollNextInside(nextPage);
            nextPage.content.height();
        }

        container.addClass('jr-animate');

        nextPage && nextPage.content.height();

        sliding.inPage = nextPage;
        sliding.outPage = page;
    }

    function beforeChange(prevPage, page, params){
        page && page._draw();
        if (prevPage){
            params && page && (params.back = (page.weight < currentPage.weight));
            prevPage.onBeforeChange(false);
        }
        page && page.onBeforeChange(true);
    }

    function changePages(page, params){

        var evParams = {
            prevId: currentPage ? currentPage.id : null,
            nextId: page ? page.id : null
        };
        beforeChange(currentPage, page, params);
        broadcast.trig(naviEvs.onBeforeChange, evParams);

        if (animationSupport && config.pageTransition && currentPage){
            var prevPage = currentPage;
            currentPage = page;
            //just slide
            slidePages(prevPage, page, params.back);
        } else {
            processScrollCurrPage(currentPage);
            detachPrev(currentPage);
            currentPage && currentPage.onSwitchEnd(false);
            currentPage = page;
            appendNext(page);
            setScrollNextInside(page);
            page.onSwitchEnd(true);
            setScrollNextPage(page);
        }
        broadcast.trig(naviEvs.onChanged, evParams);
    }

    //this is for more readable
    function checkAccess(id){
        return pageAuth(id);
    }

    function onBeforeHidePage(page){
        broadcast.trig(naviEvs.onBeforePageHide, page);
    }

    function onHidePage(page){
        broadcast.trig(naviEvs.onPageHide, page);
    }

    navi._slidePages = function(currPage, nextPage, isBack, onDone){
        if (!currPage && !nextPage){
            logger.warn('cannot slide page, because they are not defined');
        } else {
            beforeChange(currPage, nextPage);
            slidePages(currPage, nextPage, isBack, onDone);
        }
    };

    //return active page
    navi.getCurrentPage = function(){
        return currentPage;
    };

    // change page without pushing into history state
    navi.changePage = function(id, params){
        var res = false;
        if (checkAccess(id) === false){
            return res;
        }

        var page = pages(id);
        params = params || {};
        if (page){

            if (page != currentPage){
                changePages(page, params);
            }

            res = true;
        }
        return res;
    };

    // just append and show page in dom
    navi.show = function(id){
        if (checkAccess(id) === false){
            return this;
        }
        var page = pages(id);
        if (page && page != currentPage){
            page._draw();
            appendNext(page);
        }
        return this;
    };

    navi.close = function(id){
        // :todo we really need check access to close action???
//        if (checkAccess(id) === false){
//            return this;
//        }
        var page = pages(id);
        if (page){
            detachPrev(page);
        }
        return this;
    };

    // switch current page to new page by id using history
    navi.switchPage = function(id, args){
        if (sliding.working || checkAccess(id) === false){
            logger.warn('no access for "' + id + '"');
            return this;
        }
        var page = pages(id);
        if (page){
            var alias = pages(id).alias;
            var useAlias = (alias !== undefined);
            var path = '';
            if (args){
                for (var key in args){
                    path += '/' + key + '=' + args[key];
                }
            }
            if (useAlias){
                route.pushByField(0, alias, path);
            } else {
                route.pushByField(0, DROP_PAGE_NAVI, path);
                navi.changePage(id);
            }
        } else {
            logger.warn('not found "' + id + '" page');
        }
        return this;
    };

    // just redraw current page
    navi.redraw = function(){
        if (currentPage) {
            pages.map(function(key, page){
                var isShown = page.shown;

                if (isShown){
                    onBeforeHidePage(page);
                    redrawFragment.append(page.content);
                    page._hide();
                    onHidePage(page);
                }
                if (page.drawn) {
                    page.drawn = false;
                    //page.shown = false;
                    page._draw();
                }
                if (isShown){
                    appendNext(page);
                    setScrollNextInside(page);
                    page.onSwitchEnd(true);
                }
            });
        }
        return this;
    };

    // return main container of app
    navi.getContainer = function(){
        return container;
    };

    navi.onDefaultPage = function (cb) {
        cb && broadcast.on(naviEvs.onDefaultPage, cb);
    };
    
    app('mod-require')('pages', 'route', 'page-auth', function (mod, mod2, mod3) {
        pages = mod;
        route = mod2;
        pageAuth = mod3;

        mod = null;
        mod2 = null;
        mod3 = null;
    });

    helper.onStart(function(){
        container = $(app('config').container).first();
        broadcast.on(translateEvs.onLangSet, function(){
            navi.redraw();
        });
        broadcast.on(routeEvs.started, function(){
            // if app runned without any page, just goto dash
            if (!navi.getCurrentPage()){
                logger.warn('app is not processed first page! trying to run default page');
                broadcast.trig(naviEvs.onDefaultPage);
            }
        });

    });

})();
