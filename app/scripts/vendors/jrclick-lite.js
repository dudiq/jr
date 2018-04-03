(function () {
    var CONST_DEFAULT_TIMEOUT = 400;

    var lastTimeEv = 0;
    var preventStart = false;
    var timerId;

    var glob = (typeof window !== 'undefined') ? window : {};

    var deferredTimerId;

    var $body = $(document.body);

    var THRESHOLD = 3;

    var isTouch = false;

    var haveTouch = (('ontouchend' in document) || ('ontouchstart' in glob));
    // var haveClick = (function () {
    //     var element = document.createElement('div');
    //     var eventName = 'onclick';
    //     var isSupported = (eventName in element);
    //     if (!isSupported) {
    //         element.setAttribute(eventName, 'return;');
    //         isSupported = typeof element[eventName] == 'function';
    //     }
    //     element = null;
    //     return isSupported;
    // })();

    var helpers = {
        inThreshold: function (pos1, pos2) {
            return (Math.abs(pos1.x - pos2.x) < THRESHOLD) &&
                (Math.abs(pos1.y - pos2.y) < THRESHOLD);
        },


        triggerJrAfterClick: function (ev) {
            $body.trigger('jrafterclick', ev);
        },

        triggerJrDefferedEvent: function () {
            clearTimeout(deferredTimerId);
            deferredTimerId = setTimeout(function () {
                $body.trigger('jrdeffered');
                isTouch = false;
            }, 1000);
        },

        setPos: function (pos, e) {
            var touches = e.touches ? e.touches[0] : null;
            if (!touches) {
                touches = e.changedTouches ? e.changedTouches[0] : null;
            }
            pos.x = touches ? touches.pageX :
                e.clientX ? e.clientX : -99;
            pos.y = touches ? touches.pageY :
                e.clientY ? e.clientY : -99;
        },

        on: function (node, event, listener) {
            if (node.addEventListener) {
                node.addEventListener(event, listener, false);
            } else {
                node.attachEvent('on' + event, listener);
            }
        },

        off: function (node, event, listener) {
            if (node.removeEventListener) {
                node.removeEventListener(event, listener, false, false);
            } else {
                node.detachEvent('on' + event, listener);
            }
        }

    };

    function doPrevent(timeout) {
        !timeout && (timeout = CONST_DEFAULT_TIMEOUT);
        clearTimeout(timerId);
        preventStart = true;
        timerId = setTimeout(function () {
            preventStart = false;
        }, timeout);
    }

    function handlerCall(handleObj, jqEv, data, params) {
        if (!preventStart) {
            // (typeof console != "undefined") && console.log('handlerCall', jqEv.timeStamp, jqEv.originalEvent.type);
            var ret = handleObj.handler.call(this, jqEv, data, params);
            helpers.triggerJrAfterClick(jqEv);
            helpers.triggerJrDefferedEvent();
            return ret;
        }
    }

    function onUp(handleObj, ev) {
        var type = ev.type;
        var canCall = false;
        if (type == 'touchend') {
            isTouch = true;
            helpers.setPos(handleObj._posEnd, ev);
            if (helpers.inThreshold(handleObj._posEnd, handleObj._posStart)) {
                canCall = true;
            }
        }
        if (type == 'click' && !isTouch){
            canCall = true;
        }
        if (!ev.timeStamp) {
            ev.timeStamp = (new Date).getTime();
        }
        if (lastTimeEv != ev.timeStamp) {
            lastTimeEv = ev.timeStamp;
        } else {
            canCall = false;
        }
        if (canCall) {
            var jqEv = $.Event(ev);
            jqEv.type = 'jrclick';
            handlerCall.call(this, handleObj, jqEv);
        }
    }

    var objClick = {
        handle: function (jqEv, data, params) {
            var handleObj = jqEv.handleObj;
            return handlerCall.call(this, handleObj, jqEv, data, params);
        },
        preventJrclick: function (timeout) {
            doPrevent(timeout || CONST_DEFAULT_TIMEOUT);
        },
        isPrevent: function () {
            return preventStart;
        }
    };

    if (haveTouch) {
        objClick.add = function (handleObj) {
            handleObj._posStart = {x:0, y:0};
            handleObj._posEnd = {x:0, y:0};
            handleObj._onDown = function (e) {
                // console.log('_onDown');
                isTouch = true;
                helpers.setPos(handleObj._posStart, e);
            };
            handleObj._onUp = function (ev) {
                onUp(handleObj, ev);
            };

            helpers.on(this, 'touchstart', handleObj._onDown);
            helpers.on(this, 'touchend', handleObj._onUp);
            helpers.on(this, 'click', handleObj._onUp);
        };
        objClick.remove = function (handleObj) {
            helpers.off(this, 'touchstart', handleObj._onDown);
            helpers.off(this, 'touchend', handleObj._onUp);
            helpers.off(this, 'click', handleObj._onUp);

            delete handleObj._posStart;
            delete handleObj._posEnd;
            delete handleObj._onDown;
            delete handleObj._onUp;
        };
    } else {
        objClick.bindType = 'click';
        objClick.delegateType = 'click';
    }

    // jQuery.event.special.jrclicklite = objClick;
    jQuery.event.special.jrclick = objClick;

})();
