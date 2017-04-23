(function(){
    var app = window.app;
    var helper = app('helper');
    var deviceOs = app('device-os');


    // only for native android app
    var canBind = (helper.isNative && deviceOs.os() == deviceOs.TYPE_ANDROID);

    if (canBind){
        helper.onStart(function(){
            app('top-dom-elements').getDocument().on("click", "a", function(ev){
                var target = $(this);
                var href = target.prop('href');
                if (href && href.indexOf('#') == -1){
                    window.open(href, '_system');
                    ev.preventDefault();
                    return false;
                }
            });

        });
    }
})();