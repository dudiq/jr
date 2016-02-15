(function(){
    var app = window.app;
    var helper = app('helper');
    helper('debounce', function(callback, timeout){
        var timerId;
        timeout = timeout || 200;
        function ret(){
            var self = this;
            clearTimeout(timerId);
            var args = arguments;
            timerId = setTimeout(function(){
                callback.apply(self, args);
                args = null;
            }, timeout);
        }
        return ret;
    });
})();