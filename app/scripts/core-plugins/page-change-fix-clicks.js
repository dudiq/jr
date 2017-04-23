/*
 * prevent clicks after page switching
 * */
(function(){
    var app = window.app;
    var helper = app('helper');
    var broadcast = app('broadcast');
    var naviEvs = broadcast.events('navigation');

    var fixClicks = app('fix-clicks', {});

    var jrclick = $.event.special.jrclick;

    var timerIdContainer;

    var preventContainer;
    var $body;

    var CONST_TIMEOUT = helper.isNative ? 400 : 10;

    function doPrevent(){
        jrclick.imPrevent(CONST_TIMEOUT);
    }

    function isPrevent(){
        return jrclick.isPrevent();
    }

    fixClicks.prevent = function(){
        doPrevent();
    };

    // method for showing special div for prevent clicks by timeout
    fixClicks.preventByContainer = function(){
        preventContainer.show();
        clearTimeout(timerIdContainer);
        timerIdContainer = setTimeout(function(){
            preventContainer.hide();
        }, CONST_TIMEOUT);
    };

    helper.onStart(function(){
        var topDomEls = app('top-dom-elements');
        
        $body = topDomEls.getBody();

        preventContainer = $("<div class='jr-fix-click-container'/>");

        $body.append(preventContainer);
        
        topDomEls.getDocument().on("click", "a, button, input, textarea", function(ev){
            if (isPrevent()){
                doPrevent();
                ev.stopPropagation();
                ev.preventDefault();
                return false;
            }
        });

        broadcast.on([naviEvs.onBeforePageHide, naviEvs.onBeforePageShow], function(){
            fixClicks.preventByContainer();
            doPrevent();
        });
    });

})();