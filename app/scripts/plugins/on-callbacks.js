(function (app) {
    var logger = app('logger')('on-cbs');

    function CallbacksClass() {
        this.cbs = [];
    }
    
    var p = CallbacksClass.prototype;
    
    p.push = function (cb) {
        var cbs = this.cbs;
        var pos = cbs.indexOf(cb);
        if (pos != -1){
            logger.error('callback already defined, trying to define them again!');
        }
        this.cbs.push(cb);
    };
    
    p.callCbs = function () {
        var cbs = this.cbs;
        for (var i = 0, l = cbs.length; i < l; i++){
            cbs[i].apply(this, arguments);
        }
    };

    p.dropCb = function (cb) {
        if (cb){
            var cbs = this.cbs;
            var pos = cbs.indexOf(cb);
            if (pos != -1){
                cbs.splice(pos, 1);
            }
        }
    };
    
    app('on-callbacks', function () {
        return new CallbacksClass();
    })
})(window.app);