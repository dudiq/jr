(function(){
    var app = window.app;
    var helper = app('helper');
    helper('debounce', function(callback, timeout, hopTimeout){
        var timerId;
        var hopTimerId;
        var args;
        timeout = timeout || 200;
        var self;
        var called = false;
        function ret(){
            called = false;
            self = this;
            clearTimeout(timerId);
            args = arguments;
            if (ret.immediately){
                ret.immediately = false;
                onApply();
            }
            timerId = setTimeout(function(){
                onApply();
            }, timeout);
            hopTimeoutCb();
        }

        function hopTimeoutCb(){
            if (!hopTimerId && hopTimeout && (hopTimeout > timeout) && !called){
                hopTimerId = setTimeout(function(){
                    onApply();
                }, hopTimeout);
            }
        }

        function onApply(){
            if (!called){
                called = true;
                clearTimeout(hopTimerId);
                clearTimeout(timerId);
                callback.apply(self, args);
                args = null;
            }
        }

        ret.stop = function(){
            called = true;
            clearTimeout(hopTimerId);
            clearTimeout(timerId);
            args = null;
        };

        ret.immediately = false;

        return ret;
    });
})();
