(function(){
    var app = window.app;
    var helper = app('helper');
    var gestures = app('gestures');

    var base = gestures('swipe-base');

    var directions = gestures('directions');


    function swipeLRClass(el, params){
        params = params || {};
        params.direction = [directions.east, directions.west];


        if (!params.onSysMove){
            params.onSysMove = function(data, ev){
                var startPoint = params.startPointX || 0;
                var dx = startPoint + data.dx;
                el.css('transform', 'translateX('+ dx +'px)');
            };
        }

        swipeLRClass._parent.constructor.call(this, el, params);
    }

    helper.inherit(swipeLRClass, base);

    gestures('swipe-left-right', swipeLRClass);

})();