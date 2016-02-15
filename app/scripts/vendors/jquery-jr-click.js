(function(){

    var touchMap = {
        touchstart: true,
        touchend: true,
        touchmove: true,
        touchcancel: true,
        MSPointerDown: true,
        MSPointerMove: true,
        MSPointerUp: true
    };

    var mouseUp = "touchend.sys-jrclick mouseup.sys-jrclick";
    var mouseMove = "touchmove.sys-jrclick mousemove.sys-jrclick";
    var mouseDown = "touchstart.sys-jrclick mousedown.sys-jrclick";
    var mouseLeave = "touchcancel.sys-jrclick mouseleave.sys-jrclick";

    var CONST_TRESHOLD = 3;
    var CONST_DEFAULT_TIMEOUT = 400;
    var CONST_CLICKER_TIMEOUT = 500;
    var DEFAULT_LONG_TAP_DELAY = 700;
    var MOUSE_DOWN_TIMEOUT = 100;

    var clickerTimerId = 0;

    var clickId = 1;

    var process = false;

    var clickMap = {};

    var preventStart = false;
    var timerId;

    var deferredTimerId;

    var $body = $(document.body);

    function triggerJrDefferedEvent(){
        clearTimeout(deferredTimerId);
        deferredTimerId = setTimeout(function(){
            $body.trigger('jrdeffered');
        }, 1000);
    }

    function isTouch(e){
        return touchMap[e.type];
    }

    function getX(e){
        var ret;
        if (isTouch(e)){
            // touch event
            ret = e.originalEvent.touches[0].pageX;
        } else {
            ret = e.clientX;
        }
        return ret;
    }

    function getY(e){
        var ret;
        if (isTouch(e)){
            // touch event
            ret = e.originalEvent.touches[0].pageY;
        } else {
            ret = e.clientY;
        }
        return ret;
    }

    function doPrevent(timeout){
        clearTimeout(timerId);
        preventStart = true;
        timerId = setTimeout(function(){
            preventStart = false;
        }, timeout);
    }

    function dropWorks(){
        for (var key in clickMap){
            if (clickMap[key].work){
                clickMap[key].work = false;
            }
        }
    }

    function stopLongTap(){
        clearTimeout(this.longTapTimerId);
    }

    function longTapClicked(originalEv){
        stopLongTap.call(this);
        if (this.work && !preventStart){
            dropWorks();
            this.work = false;
            this.moved = false;
            var ev = {
                target: originalEv.target
            };
            callHandler.call(this, ev, 'jrlongtap', [ev]);
        }
    }

    function mouseDownClicked(originalEv){
        if (this.work && !preventStart){
            dropWorks();
            this.work = false;
            this.moved = false;
            var ev = {
                target: originalEv.target
            };
            doPrevent(MOUSE_DOWN_TIMEOUT);
            callHandler.call(this, ev, 'jrclick', [ev]);
        }
    }

    function bindMouseDown($this){
        var self = this;
        $this.on(mouseDown, function(ev){
            triggerJrDefferedEvent();
            if (!self.work && !preventStart){
                self.work = true;
                self.posx = self.posEx = getX(ev);
                self.posy = self.posEy = getY(ev);
                self.moved = false;
                if (self.handleWhenDown){
                    mouseDownClicked.call(self, ev);
                } else if (self.longTap){
                    stopLongTap.call(self);
                    self.longTapTimerId = setTimeout(function(){
                        longTapClicked.call(self, ev);
                    }, self.longTapDelay);
                }
            }
        });
    }

    function bindMouseLeave($this){
        var self = this;
        $this.on(mouseLeave, function(){
            self.work = false;
            self.moved = false;
        });
    }
    
    function bindMouseMove($this){
        var self = this;
        $this.on(mouseMove, function(ev){
            if (self.work){
                if (!self.moved){
                    self.posEx = getX(ev);
                    self.posEy = getY(ev);
                    var dx = Math.abs(self.posEx - self.posx);
                    var dy = Math.abs(self.posEy - self.posy);
                    if ((dx > CONST_TRESHOLD) ||
                        (dy > CONST_TRESHOLD)){
                        self.moved = true;
                    }
                }
            }
        });
    }

    function callHandler(ev, type, args){
        stopLongTap.call(this);
        process = true;
        ev.otype = ev.type;
        ev.type = type;
        ev.posEx = this.posEx;
        ev.posEy = this.posEy;
        this.handle && this.handle.apply(this, args);
    }

    function bindMouseUp($this){
        var self = this;
        $this.on(mouseUp, function(ev){
            stopLongTap.call(self);
            if (self.work && !preventStart){
                var testTime = (new Date()).getTime();

                if (testTime > (clickerTimerId + CONST_CLICKER_TIMEOUT)){
                    clickerTimerId = testTime;
                    process = false;
                }

                if (!process){
                    dropWorks();

                    if (!self.moved){
                        callHandler.call(self, ev, 'jrclick', arguments);
                    }
                    self.moved = true;
                    if (self.longClickTimeout){
                        doPrevent(self.longClickTimeout);
                    }
                }
            }
        });
    }
    
    function JrClickClass(params, namespace, handle){
        clickId ++;
        params = params || {};
        this.id = clickId;

        this.work = false;
        this.moved = false;

        this.posx = 0;
        this.posy = 0;
        this.posEx = 0;
        this.posEy = 0;

        this.handle = handle;

        clickMap[clickId] = this;

        this.longClickTimeout = params.longClick;
        this.longTap = params.longTap;
        this.longTapDelay = params.longTapDelay || DEFAULT_LONG_TAP_DELAY;
        this.longTapTimerId = null;

        this.handleWhenDown = params.handleWhenDown;
    }

    var p = JrClickClass.prototype;

    p.init = function(el){
        el.data('jrclick-id', this.id);

        bindMouseDown.call(this, el);
        bindMouseLeave.call(this, el);
        bindMouseMove.call(this, el);
        bindMouseUp.call(this, el);
    };

    p.destroy = function(){
        this.handle = null;
        this.work = false;
        stopLongTap.call(this);
    };

    function tearDownClick(domEl){
        var $this = $(domEl);
        var id = $this.data('jrclick-id');
        if (clickMap[id]){
            clickMap[id].destroy();
            delete clickMap[id];
        }
        $this.off(".sys-jrclick");
    }
    
    $.event.special.jrclick = {
        setup: function(data, namespaces, handle){
            var inst = new JrClickClass(data, namespaces, handle);
            inst.init($(this));
        },
        imPrevent: function(timeout){
            doPrevent(timeout || CONST_DEFAULT_TIMEOUT);
        },
        isPrevent: function(){
            return preventStart;
        },
        teardown: function(){
            tearDownClick(this);
        }
    };

    $.event.special.jrlongtap = {
        setup: function(data, namespaces, handle){
            data = data || {};
            data.longTap = true;
            var inst = new JrClickClass(data, namespaces, handle);
            inst.init($(this));
        },
        imPrevent: function(timeout){
            doPrevent(timeout || CONST_DEFAULT_TIMEOUT);
        },
        isPrevent: function(){
            return preventStart;
        },
        teardown: function(){
            tearDownClick(this);
        }
    };

})();