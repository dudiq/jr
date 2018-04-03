(function(){
    var app = window.app;
    var helper = app('helper');
    var gestures = app('gestures');

    var base = gestures('base');

    var directions = gestures('directions');


    function swipeBaseClass(el, params){
        params = params || {};
        (!params.direction) && (params.direction = directions.none);
        (!params.lengthDx) && (params.lengthDx = 2);


        if (!params.onSysStart){
            params.onSysStart = function(data, ev){
                el.removeClass('jr-swipe');
            };
        }

        if (!params.onSysEnd){
            params.onSysEnd = function(){
                el.css('transform', '');
                el.addClass('jr-swipe');
            };
        }

        swipeBaseClass._parent.constructor.call(this, el, params);
    }

    helper.inherit(swipeBaseClass, base);

    gestures('swipe-base', swipeBaseClass);

})();