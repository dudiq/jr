(function(){
    var hasTouch = ("ontouchend" in document);

    var mouseUp = hasTouch ? "touchend" : "mouseup";
    var mouseMove = hasTouch ? "touchmove" : "mousemove";
    var mouseDown = hasTouch ? "touchstart" : "mousedown";
    var mouseLeave = hasTouch ? "touchcancel" : "mouseleave";

    var browserPrefix = (function () {
        var styles = window.getComputedStyle(document.documentElement, ''); // CSSStyleDeclaration
        var browserMatch = (Array.prototype.slice
            .call(styles)
            .join('')
            .match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
            )[1];

        return browserMatch;
    })();

    var CSS3_TRANSFORM = '-' + browserPrefix + '-transform';


    function getId(){
        var d = ((new Date()).getTime() + "_") + (Math.random() * 0x10000);
        return d;
    }

    var $body;

    var getX = !hasTouch ?
        function(e){
            return e.clientX;
        }:
        function(e){
            var touches = e.originalEvent.touches;
            var dx = 0;
            if (touches){
                dx = touches ? touches[0].pageX : 0;
            } else {
                dx = e.clientX;
            }
            var x = (e.posEx !== undefined) ? e.posEx : dx;
            return x;
        };

    var getY = !hasTouch ?
        function(e){
            return e.clientY;
        }:
        function(e){
            var touches = e.originalEvent.touches;
            var dy = 0;
            if (touches){
                dy = touches ? touches[0].pageY : 0;
            } else {
                dy = e.clientY;
            }
            var y = (e.posEy !== undefined) ? e.posEy : dy;
            return y;
        };


    function setTranslate(el, x, y){
        var transVal = "translateX(" + x + ") translateY(" + y + ")";

        el.style[CSS3_TRANSFORM] = transVal;
        el.style['transform'] = transVal;
    }

    function defineDnd(el, options, nameSpace){
        this.namespace = nameSpace;
        this.options = options;
        var work = false;
        var posx = 0, posy = 0;
        var $el = this.$el = $(el);
        var $parent = $el.parent();

        var elx = 0, ely = 0;

        var dragObj = this.dragObj = {
            parentw: 0,
            parenth: 0,
            px: 0,
            py: 0,
            x: 0,
            y: 0,
            dx: 0,
            dy: 0
        };

        var minx = options.hasOwnProperty('minx') ? options.minx : -Infinity;
        var miny = options.hasOwnProperty('miny') ? options.miny : -Infinity;
        var maxx = options.hasOwnProperty('maxx') ? options.maxx : Infinity;
        var maxy = options.hasOwnProperty('maxy') ? options.maxy : Infinity;

        function onDragStop(ev, x, y, w, h){

            var text = "px";
            if (options.percent){
                x = w ? (x * 100 / w) : 0;
                y = h ? (y * 100 / h) : 0;
                text = "%";
            }

            dragObj.px = x;
            dragObj.py = y;

            (options.xAxis !== false) && (el.style.left = x + text);
            (options.yAxis !== false) && (el.style.top = y + text);

            el.clientWidth;


            options.onDragStop(ev, dragObj);
        }

        this.onDragStop = onDragStop;

        function onDragStopProcess(ev){
            if (work){
                work = false;

                setTranslate(el, 0, 0);

                el.clientWidth;


                var x = (elx + dragObj.x);
                var y = (ely + dragObj.y);


                onDragStop(ev, x, y, dragObj.parentw, dragObj.parenth);

                ev.preventDefault();
            }
        }

        $body.on(mouseDown + '.' + nameSpace, function(ev){
            if (ev.target == el && !work){
                work = true;
                posx = getX(ev);
                posy = getY(ev);
                var pRect = $parent[0].getBoundingClientRect();
                var cRect = el.getBoundingClientRect();

                dragObj.parentw = pRect.width;
                dragObj.parenth = pRect.height;

                elx = cRect.left - pRect.left;
                ely = cRect.top - pRect.top;

                (options.xAxis === false) && (elx = 0);
                (options.yAxis === false) && (ely = 0);

                dragObj.dx = 0;
                dragObj.dy = 0;

                dragObj.x = 0;
                dragObj.y = 0;


                dragObj.maxx = $parent.innerWidth();// - $el.innerWidth();
                dragObj.maxy = $parent.innerHeight();// - $el.innerHeight();

                if (!options.maxx){
                    maxx = dragObj.maxx;
                }
                if (!options.maxx){
                    maxy = dragObj.maxy;
                }
                options.onDragStart(ev, dragObj);
                ev.preventDefault();
            }
        });

        $body.on(mouseLeave + '.' + nameSpace, function(ev){
            onDragStopProcess(ev);
        });

        $body.on(mouseMove + '.' + nameSpace, function(ev){
            if (work){
                ev.preventDefault();
                var dx = (getX(ev) - posx);
                var dy = (getY(ev) - posy);

                var currx = elx + dx;
                var curry = ely + dy;

                // checking range
                    (currx > maxx) && (dx = maxx - elx);
//                    options.maxy && ((ely + dy) > options.maxy) && (dy = options.maxy - ely);

                    (currx < minx) && (dx = minx - elx);
//                    ((ely + dy) < options.miny) && (dy = options.miny - ely);

                currx = elx + dx;
                curry = ely + dy;

                // checking axes

                dragObj.dx = dx;
                dragObj.dy = dy;


                dragObj.px = currx;
                dragObj.py = curry;
                if (options.percent){
                    dragObj.px = currx * 100 / dragObj.parentw;
                    dragObj.py = curry * 100 / dragObj.parenth;
                }


                dragObj.x = dragObj.dx;
                dragObj.y = dragObj.dy;

                (options.xAxis === false) && (dragObj.x = 0);
                (options.yAxis === false) && (dragObj.y = 0);

                var x = dragObj.x;
                var y = dragObj.y;

                x = x + "px";
                y = y + "px";

                setTranslate(el, x, y);

                options.onDrag(ev, dragObj);
            }
        });

        $body.on(mouseUp + '.' + nameSpace, function(ev){
            onDragStopProcess(ev);
        });
    }

    var p = defineDnd.prototype;

    p.setPos = function(ev){
        var x = 0;
        var y = 0;
        var w = 0;
        var h = 0;
        if (ev){
            if (ev.target){
                var target = $(ev.target);
                var sRect = ev.target.getBoundingClientRect();

                x = getX(ev) - sRect.left;// - ($el.innerWidth() / 2);
                y = getY(ev) - sRect.top;// - ($el.innerHeight() / 2);
                w = target.innerWidth();
                h = target.innerHeight();
            } else {
                x = ev.x;
                y = ev.y;
                w = ev.w;
                h = ev.h;
            }
        }
        this.onDragStop(ev, x, y, w, h);

    };

    p.destroy = function(){
        $body.off('.' + this.namespace);
        this.namespace = null;
        this.options = null;
        this.dragObj = null;
        this.$el = null;
    };


    $.fn.jrdnd = function(options, val){

        !$body && ($body = $(document.body));

        options = options || {};

        options.onDragStart = options.onDragStart || function(){};
        options.onDragStop = options.onDragStop || function(){};
        options.onDrag = options.onDrag || function(){};

        return this.each(function(){
            var $this = $(this);

            var obj = $this.data('jrdnd');
            var nameSpace = obj ? obj.namespace : null;

            if (options == "destroy"){
                obj.destroy();
                $this.data('jrdnd', null);
            } else if (options == "setPos"){
                obj.setPos(val);
            } else if (!obj){
                nameSpace = getId();
                var inst = new defineDnd(this, options, nameSpace);
                $this.data('jrdnd', inst);
            }


        });
    };

})();
