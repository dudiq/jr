(function(){
    var app = window.app;
    var helper = app('helper');
    var gestures = app('gestures');

    var evStart = "mousedown";
    var evStop = "mouseup";
    var evLeave = "mouseleave";
    var evMove = "mousemove";

    var touchSupport = helper.support.touch;

    if (touchSupport){
        evStart = "touchstart";
        evStop = "touchend";
        evLeave = "touchleave";
        evMove = "touchmove";
    }

    var CONST_D_NONE = 'd-none';
    var CONST_D_N = 'd-n';
    var CONST_D_W = 'd-w';
    var CONST_D_E = 'd-e';
    var CONST_D_S = 'd-s';

    var CONST_TRESHOLD = 2;

    gestures('directions',{
        north: CONST_D_N,
        west: CONST_D_W,
        east: CONST_D_E,
        south: CONST_D_S,
        none: CONST_D_NONE
    });

    var body;
    var $body;

    var PI180 = 180 / Math.PI;

    var getXpos, getYpos;

    if (touchSupport){
        // for touch devices we need get position from touches[] array
        getXpos = function(ev){
            return ev.touches[0].pageX;
        };
        getYpos = function(ev){
            return ev.touches[0].pageY;
        };
    } else {
        // for desktop we just getting from clientX key
        getXpos = function(ev){
            return ev.clientX;
        };
        getYpos = function(ev){
            return ev.clientY;
        };
    }

    // cross browser prevent event
    function preventEvent(e){
        if (e){
            e.preventManipulation && e.preventManipulation();// ie10
            e.preventDefault && e.preventDefault(); // others browsers
        }
    }

    // proxy for bind methods by context
    function proxy(context, method){
        return function(){
            context[method].apply(context, arguments);
        };
    }

    function onStop(ev){
        var mouse = this._mouse;
        if (mouse.active){
            $body.removeClass('jr-gesture-no-select');
            mouse.active = false;
            this._onSysEnd(mouse, ev);
            this._onEnd(mouse, ev);
        }
    }

    function getDistance(x1, x2, y1, y2){
        return Math.sqrt((x2 - x1)*(x2 - x1) + (y2 - y1)*(y2 - y1));
    }

    // check threshold value
    function inThreshold(mouse){
        return (Math.abs(mouse.x - (mouse.sx)) > CONST_TRESHOLD) ||
        (Math.abs(mouse.y - (mouse.sy)) > CONST_TRESHOLD);
    }


    var gesture = function(el, params){
        this._el = el;
        var instParams = this._params = {
            threshold: false,
            firstMove: false,
            maxLen: params.maxLen || Infinity,
            // angle of horizontal dx
            angleDx: params.angleDx,// || 20,
            // length of path for angle detecting and do swiping after
            lengthDx: params.lengthDx || 10,
            // direction of gesture
            direction: params.direction || CONST_D_NONE
        };

        if (!helper.isArray(instParams.direction)){
            instParams.direction = [instParams.direction];
        }

        el.addClass('jr-gesture');

        this._onStart = params.onStart || function(){};
        this._onMove = params.onMove || function(){};
        this._onEnd = params.onEnd || function(){};

        this._onSysStart = params.onSysStart || function(){};
        this._onSysMove = params.onSysMove || function(){};
        this._onSysEnd = params.onSysEnd || function(){};
        var self = this;
        init.call(self, el);
    };

    var p = gesture.prototype;

    p.destroy = function(){

        this._el = null;
        this._params = null;

        if (this._eStart){
            body.removeEventListener(evStart, this._eStart);

            body.removeEventListener(evLeave, this._eLeave);
            body.removeEventListener(evStop, this._eEnd);
            body.removeEventListener(evMove, this._eMove);
            this._eEnd = this._eLeave = this._eStart = this._eMove = null;
        }
    };

    p.hStart = function(ev){
        var mouse = this._mouse;
        if (ev.target == this._el[0] || ($(ev.target).closest(this._el).length != 0)){
            if (!mouse.active){
                mouse.active = true;
                mouse.x = mouse.sx = mouse.ex = getXpos(ev);
                mouse.y = mouse.sy = mouse.ey = getYpos(ev);
                mouse.dx = mouse.dy = mouse.length = 0;
                mouse.currTime = (new Date()).getTime();
                var params = this._params;

                params.firstMove = false;
                params.threshold = false;
            }
        }
    };

    p.hStop = function(ev){
        onStop.call(this, ev);
    };

    p.hLeave = function(ev){
        onStop.call(this, ev);
    };

    p.hMove = function(ev){
        var mouse = this._mouse;
        if (mouse.active) {

            var x = mouse.x = getXpos(ev);
            var y = mouse.y = getYpos(ev);

            var params = this._params;
            var nextTime = (new Date()).getTime();
            var prevX = mouse.ex;
            var prevY = mouse.ey;

            var angle = mouse.angle = Math.atan2(y - mouse.sy, x - mouse.sx) * PI180;

            var direction;
            if ((angle <= (-90 + 45)) && (angle >= -90 - 45)) {
                direction = CONST_D_N;
            } else if ((angle <= (-180 + 45)) || (angle >= 180 - 45)) {
                direction = CONST_D_W;
            }  else if ((angle <= (90 + 45)) && (angle >= 90 - 45)) {
                direction = CONST_D_S;
            } else if ((angle <= (45)) && (angle >= - 45)) {
                direction = CONST_D_E;
            }

            mouse.direction = direction;

            var lenPath = getDistance(x, prevX, y, prevY);
            var dxTime = (nextTime - mouse.currTime) / 1000;
            mouse.speed = Math.floor(lenPath / dxTime);

            var minLen = mouse.length = getDistance(x, mouse.sx, y, mouse.sy);


            mouse.dx = x - mouse.sx;
            mouse.dy = y - mouse.sy;
            mouse.ex = x;
            mouse.ey = y;


            if (!params.threshold){
                params.threshold = inThreshold(mouse);
            }

            if (params.threshold){
                if (!params.firstMove){
                    params.firstMove = true;
                    // detect direction and do or not prevent moving
                    var canGesture = false;

                    if ((params.direction.indexOf(direction) != -1) &&
                        ((params.lengthDx && (params.lengthDx <= minLen)) || true)
                    ) {
                        //console.log(direction, params.direction, params.lengthDx, minLen);
                        canGesture = true;
                    }

                    if (!canGesture){
                        mouse.active = false;
                    }

                    if (mouse.active){
                        preventEvent(ev);
                        this._onSysStart(mouse, ev);
                        this._onStart(mouse, ev);
                        $body.addClass('jr-gesture-no-select');
                    }
                } else {
                    preventEvent(ev);
                    if (minLen <= params.maxLen){
                        this._onSysMove(mouse, ev);
                        this._onMove(mouse, ev);
                    }
                }
            }
        }
    };

    function init(){

        !body && (body = document.body) && ($body = app('top-dom-elements').getBody());
        
        this._mouse = {
            // start position
            sx: 0,
            sy: 0,
            // end position
            ex: 0,
            ey: 0,
            // delta of end and start
            dx: 0,
            dy: 0,
            // current position
            x: 0,
            y: 0,
            direction: CONST_D_NONE,
            // time for detect speed
            currTime: 0,
            // length between start and end points
            length: 0,
            // last detected angle of
            angle: 0,

            // speed of drawing path, pixels per second
            speed: 0,

            active: false
        };

        body.addEventListener(evStart, this._eStart = proxy(this, 'hStart'), false);
        body.addEventListener(evLeave, this._eLeave = proxy(this, 'hLeave'), false);
        body.addEventListener(evStop, this._eEnd = proxy(this, 'hStop'), false);
        body.addEventListener(evMove, this._eMove = proxy(this, 'hMove'), false);

    }

    //helper.onStart(onStarted);

    gestures('base', gesture);

})();
