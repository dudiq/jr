(function(){
    var app = window.app;
    var helper = app('helper');
    var config = app('config');
    var broadcast = app('broadcast');
    var keyPopupEvs = broadcast.events('keyboard-popup', {
        onShow: 's',
        onHide: 'h'
    });

    function initKeyboardFix(){
        var selectors = "input[type=text], input[type=email], input[type=password], input[type=number], input[type=search], textarea";

        var isNative = helper.isNative;
        var timeoutValue = isNative ? 800 : 0;

        var removeTimer;
        var topDomElements = app('top-dom-elements');
        var $body = topDomElements.getBody();
        var $win = topDomElements.getWindow();
        var mainContainer = $(config.container);
        var helperDiv = $(".jr-keyboard-popup-helper");
        if (!helperDiv.length){
            helperDiv = $("<div class='jr-keyboard-popup-helper'></div>");
            $body.append(helperDiv);
        }

        topDomElements.getDocument().on('focus', selectors, function(ev) {
            broadcast.trig(keyPopupEvs.onShow);

            var dx = 0;
            var el = $(ev.target);

            var containerScroll = el.closest('.jr-page-inside-container-scroll, .jr-page-internal-scrolling');
            if (containerScroll.length){
                if (!el.hasClass('jr-page-internal-scrolling-disabled')) {
                    el[0] && el[0].scrollIntoView(true);
                    helperDiv.height(0 + 'px');
                }
            } else {
                // default behaviour
                var val = el.data('keyboardPopup');
                if (val != false) {
                    var wh = $win.height();
                    var mh = mainContainer.height();
                    dx = Math.max(0, (wh - mh)) * 2;
                }
                helperDiv.height(dx + 'px');
            }

            clearTimeout(removeTimer);
            $body.addClass('jr-keyboard-popup');
            broadcast.trig(keyPopupEvs.onShow, el, containerScroll);

        }).on('blur', selectors, function() {
            clearTimeout(removeTimer);
            removeTimer = setTimeout(function(){
                $body.removeClass('jr-keyboard-popup');
                broadcast.trig(keyPopupEvs.onHide);
            }, timeoutValue);
        });
    }

    if (helper.isNative || helper.isMobile){
        helper.onStart(initKeyboardFix);
    }

})();
