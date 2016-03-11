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
    var route = app('route');
    var navi = app('navigation', {});
    var pageAuth = app('page-auth');
    var warning = app('errors').warning;
    var translateEvs = broadcast.events('translate');
    var naviEvs = broadcast.events('navigation', {
        onBeforePageShow: 'onBeforePageShow',
        onBeforePageHide: 'onBeforePageHide',
        onPageShow: 'onPageShow',
        onPageHide: 'onPageHide',
        onBeforeChange: 'onBeforeChange',
        onChanged: 'changed',
        onSlideStop: 'navi-slide-stop',
        onSlideStart: 'navi-slide-start'
    });

    var animationSupport = helper.support.animation;

    var pages = app('pages');

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
    var DROP_PAGE_NAVI = "/_jr_page1";

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

    function scrollFirstPage(page){
        if (config.scrollToTopPage && page){
            // save top position of page
            page._storeTopPos();
            page._toTop();
        }
    }

    function scrollSecondPage(nextPage){
        if (config.scrollToTopPage && nextPage) {
            // restore top position of page
            nextPage._restoreTopPos();
        }
    }

    // processing slide pages
    function slidePages(page, nextPage, isBack, onDone){
        !sliding.working && broadcast.trig(naviEvs.onSlideStart);
        container.removeClass('jr-slide jr-reverse jr-animate');

        scrollFirstPage(page);

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
            scrollSecondPage(nextPage);
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
            scrollFirstPage(currentPage);
            detachPrev(currentPage);
            currentPage && currentPage.onSwitchEnd(false);
            currentPage = page;
            appendNext(page);
            page.onSwitchEnd(true);
            scrollSecondPage(page);
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
            warning('navi', 'cannot slide page, because they are not defined');
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
            warning('navi', 'no access for "' + id + '"');
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
                route.pushState("/" + alias + path);
            } else {
                route.pushState(DROP_PAGE_NAVI + path);
                navi.changePage(id);
            }
        } else {
            warning('navi', 'not found "' + id + '" page');
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
                    page.onSwitchEnd(true);
                }
            });
        }
        return this;
    };

    navi.back = function(){
        app('deprecate')('navigation.back()', 'use route.back(); instead');
        route.back();
    };

    // return main container of app
    navi.getContainer = function(){
        return container;
    };

    route.registerDrop(DROP_PAGE_NAVI);

    helper.onStart(function(){
        container = $(app('config').container).first();
        broadcast.on(translateEvs.onLangSet, function(){
            navi.redraw();
        });
    });

})();