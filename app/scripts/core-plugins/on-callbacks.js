(function (app) {
    var logger = app('logger')('on-cbs');

    function CallbacksClass(name) {
        this._name = name;
        this._cbs = [];
    }

    var p = CallbacksClass.prototype;

    p.pushOne = function (cb) {
        pushToList.call(this, cb, true);
    };

    p.push = function (cb) {
        pushToList.call(this, cb);
    };

    p.callCbs = function () {
        var cbs = this._cbs;
        var length = cbs.length;
        if (length){
            for (var i = 0; i < length; i++){
                var cb = cbs[i];
                if (cb.__isOneCall){
                    cbs.splice(i, 1);
                    i--;
                    length--;
                }
                cb.apply(this, arguments);
            }
        }
    };

    p.dropCb = function (cb) {
        if (cb){
            var cbs = this._cbs;
            var pos = cbs.indexOf(cb);
            if (pos != -1){
                cb.__isOneCall && (delete cb.__isOneCall);
                cbs.splice(pos, 1);
            }
        }
    };

    function pushToList(cb, isOneCall) {
        var cbs = this._cbs;
        var pos = cbs.indexOf(cb);
        if (pos != -1){
            logger.error('callback already defined, trying to define them again!');
        }
        cb.__isOneCall = isOneCall;
        this._cbs.push(cb);

    }

    app('on-callbacks', function (name) {
        return new CallbacksClass(name);
    });

})(window.app);
