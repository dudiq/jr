(function(){
    var app = window.app;
    var helper = app('helper');
    var gestures = app('gestures');

    var base = gestures('swipe-base');

    var directions = gestures('directions');


    function swipeRightClass(el, params){
        params = params || {};
        params.direction = directions.east;

        if (!params.onSysMove) {
            params.onSysMove = function (data, ev) {
                var dx = data.dx;
                if (dx < 0) {
                    dx = 0;
                }
                var startPoint = params.startPointX || 0;
                dx = startPoint + dx;
                el.css('transform', 'translateX(' + dx + 'px)');
            };
        }

        swipeRightClass._parent.constructor.call(this, el, params);
    }

    helper.inherit(swipeRightClass, base);

    gestures('swipe-right', swipeRightClass);

})();