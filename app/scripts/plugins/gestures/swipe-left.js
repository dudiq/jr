(function(){
    var app = window.app;
    var helper = app('helper');
    var gestures = app('gestures');

    var base = gestures('swipe-base');

    var directions = gestures('directions');


    function swipeLeftClass(el, params){
        params = params || {};
        params.direction = directions.west;


        if (!params.onSysMove){
            params.onSysMove = function(data, ev){
                var dx = data.dx;
                if (dx > 0){
                    dx = 0;
                }
                var startPoint = params.startPointX || 0;
                dx = startPoint + dx;
                el.css('transform', 'translateX('+ dx +'px)');
            };
        }

        swipeLeftClass._parent.constructor.call(this, el, params);
    }

    helper.inherit(swipeLeftClass, base);

    gestures('swipe-left', swipeLeftClass);

})();