/*
* fix dropdown menus for jr lib
* bootstrap did not work correctly with touch events
*
* */

(function(){
    var current;
    var app = window.app;
    var broadcast = app('broadcast');
    $(document.body).on('jrclick', function(ev){
        var t = $(ev.target);
        var el = t.closest('.btn-group');
        if (el.length != 0){
            var isMenuBtn = (t.closest('.dropdown-toggle, a[data-toggle]').length != 0);

            if (isMenuBtn){
                current && (current[0] != el[0]) && (current.removeClass('open'));
                current = el;
                el.toggleClass('open');
            } else {
                var clickedItem = t.closest('a');
                if (clickedItem.length != 0){
                    //trigger action to jr
                    var action = clickedItem.data('action');
                    var params = clickedItem.data('params');
                    action && broadcast.trig('pl-menu-' + action, params);
                    el.removeClass('open');
                }
            }

        } else {
            current && current.removeClass('open');
        }


    });
})();