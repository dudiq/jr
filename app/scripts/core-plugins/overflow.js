/*
 * overflow plugin for jr
 *
 * create new instance of overflow and getting interface for disable/enable place
 *
 * place must be in relative layout (position: relative)
 *
 *
 *
 * WARNING!!! don't forgot
 *   jquery.tabbable.js
 *   jr-overflow.scss
 *   overflow.html
 *
 *
 *
 * */

(function(){
    var app = window.app;
    var helper = app('helper');
    var templater = app('templater');
    var translate = app('translate');
    var broadcast = app('broadcast');
    var keyboardPopupEvs = broadcast.events('keyboard-popup');

    var tpl = templater.get('overflow');

    var FIXED = 'f';
    var ABSOLUTE = 'a';

    var bodyInst;
    var $win = $(window);
    var $body;

    function createNewModal(place, params){
        return new OverflowModalClass(place, params);
    }

    var overflow = helper('overflow', createNewModal);


    // deprecated, supported for old create methods for plugins
    overflow.get = createNewModal;

    function defineBody(){
        !$body && ($body = $(document.body));
    }

    function OverflowModalClass(parent, params){
        defineBody();
        var self = this;
        this.params = params = params || {};
        this.parent = parent || $body;
        var el = this.place = $(tpl);
        this.messageArea = el.find('.msg');
        this.type = FIXED;
        this.shown = false;

        // must be "click" event, because mobile devices have 300ms delay.
        // for correct working we can't bind to "touchstart/touchend" events, because we have problems,
        // when overlay will be removed after click action
        var clickEv = 'jrclick'; //params.clickEvName || "click";

        el.on(clickEv, {longClick: true}, function(){
            params.onClick && params.onClick();
        });
        params.animate = (params.animate === undefined) ? true : params.animate;
        (params.zindex !== undefined) && el.css('z-index', params.zindex);
        (params.className) && (el.addClass(params.className));
        el.tabbing();

        broadcast.on(keyboardPopupEvs.onShow, function(){
            self.type = ABSOLUTE;
            self.recalcFixedHeight();
        });

        broadcast.on(keyboardPopupEvs.onHide, function(){
            self.type = FIXED;
            self.place.css('height', '');
        });

        return this;
    }

    var p = OverflowModalClass.prototype;

    p.recalcFixedHeight = function(){
        if (this.shown){
            if (this.type == ABSOLUTE){
                this.place.height(0);
                var bodyHeight = $body.height();
                if (bodyHeight > $win.height()) {
                    this.place.height(bodyHeight);
                } else {
                    this.place.css('height', '');
                }
            }
        }
    };

    p.disable = function(){
        this.place.detach();
        this.shown = false;
        return this;
    };

    p.enable = function(parent, msg){
        parent && (this.parent = parent);
        if (this.parent){
            var el = this.place;
            el.removeClass('animate');
            el.removeClass('show');
            var params = this.params;
            params.prepend ? this.parent.prepend(el) : this.parent.append(el);
            var msgTr = msg ? translate.getTranslate(msg) : '';
            this.messageArea.text(msgTr);
            (params.focus !== false) && el.focus(); // true by default
            params.animate ? el.addClass('animate') : el.addClass('show');
            this.shown = true;
        }
        return this;
    };

    p.destroy = function(){
        this.parent = null;
        this.place.tabbingAllow().remove();
    };

    overflow.disableScreen = function(msg){
        defineBody();
        if (!bodyInst){
            bodyInst = this.get($body);
        }

        bodyInst.enable(null, msg);
    };

    overflow.enableScreen = function(){
        bodyInst && bodyInst.disable();
    };


    helper.onDomReady(function(){
        defineBody();
    });


    $.fn.tabbing = function (){
        return this.each(function(){
            var el = $(this);
            //save state
            el.data('tabbingPrevent', {tabIndex: el.attr('tabIndex'), outline: el.css('outline')});

            el.attr('tabIndex', '-1').css('outline', 'none');
            el.on('keydown.tabbingPrevent', function (ev) {
                if (ev.keyCode !== 9) {
                    //tab key
                    return;
                }

                var tabbables = el.find(':tabbable'),
                    first = tabbables.filter(':first'),
                    last = tabbables.filter(':last');

                if (ev.target === last[0] && !ev.shiftKey) {
                    first.focus(1);
                    return false;
                } else if (ev.target === first[0] && ev.shiftKey) {
                    last.focus(1);
                    return false;
                }
            });

            return this;
        });
    };

    $.fn.tabbingAllow = function(){
        return this.each(function(){
            var el = $(this);
            var obj = el.data('tabbingPrevent');
            if (obj) {
                el.attr('tabIndex', obj.tabIndex).css('outline', obj.outline);
            }
            el.off('.tabbingPrevent');

            return this;
        });
    };


})();