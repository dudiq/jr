(function (app) {

    var data = {};

    var roots = app('basic-roots', function (id, val) {
        if (val !== undefined) {
            data[id] = val;
        }
        var ret = data[id];
        if (typeof ret == "function") {
            // need create instance
            data[id] = new ret();
        }
        return data[id];
    });

    roots.map = function (cb) {
        for (var key in data) {
            cb(data[key], key);
        }
    };

})(window.app);
