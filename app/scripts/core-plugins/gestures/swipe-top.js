(function(){
    var app = window.app;
    var helper = app('helper');
    var gestures = app('gestures');

    var base = gestures('swipe-base');

    var directions = gestures('directions');


    function swipeTopClass(el, params){
        params = params || {};
        params.direction = directions.north;

        if (!params.onSysMove) {
            params.onSysMove = function (data, ev) {
                var dx = data.dy;
                if (dx > 0) {
                    dx = 0;
                }
                var startPoint = params.startPointY || 0;
                dx = startPoint + dx;

                el.css('transform', 'translateY(' + dx + 'px)');
            };
        }

        swipeTopClass._parent.constructor.call(this, el, params);
    }

    helper.inherit(swipeTopClass, base);

    gestures('swipe-top', swipeTopClass);

})();