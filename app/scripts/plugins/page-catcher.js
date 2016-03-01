/*
* module for catch pages like select date, camera, or something else to correct working
* */

/*jshint -W082*/
(function(){
    var app = window.app;
    var navi = app('navigation');
    var broadcast = app('broadcast');
    var naviEvs = broadcast.events('navigation');
    var helper = app('helper');

    var pageCatcher = app('page-catcher', {});

    var CONST_MAX_PAGES_HISTORY = 10;
    var pageHistory = [];

    pageCatcher.getLastPage = function(){
        return pageHistory[pageHistory.length - 1];
    };

    pageCatcher.switchPageBack = function(id, callback){
        var currPage = navi.getCurrentPage();
        var currPageId = currPage ? currPage.id : null;
        if (currPageId){

            // step and currStep must be equal, in other case will be unbind call
            var step = 0;
            var currStep = 0;
            var done = false;
            function onChanged(params){
                currStep++;
                if (params) {
                    if (step == 0 && params.nextId == id){
                        step++;
                    } else if (step == 1 && params.nextId == currPageId){
                        // callback
                        done = true;
                    }
                }
                if (currStep != step){
                    // unbind
                    broadcast.off(naviEvs.onChanged, onChanged);
                    callback && callback(done);
                    callback = null;
                    currStep = null;
                    step = null;
                }
            }
            broadcast.on(naviEvs.onChanged, onChanged);
            navi.switchPage(id);
        }
        currPage = null;
    };

    helper.onStart(function(){
        var page = navi.getCurrentPage();
        var currPageId = page ? page.id : null;
        broadcast.on(naviEvs.onBeforePageShow, function(page){
            pageHistory.push(currPageId);
            currPageId = page.id;
            if (pageHistory.length > CONST_MAX_PAGES_HISTORY){
                pageHistory.shift();
            }
        });
    });

})();