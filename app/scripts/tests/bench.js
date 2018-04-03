(function (app) {

    var helper = app('helper');
    var logger = app('logger')('bench');

    var max = 100000;
    var currMax = max;

    app('bench', {
        setEnv: function (opt) {
            opt.max && (currMax = opt.max);
        },
        benchFunction: function (cb, title) {
            var st = new Date();
            for (var i = 0; i < currMax; i++){
                (function (i) {
                    cb(i);
                })(i);
            }
            var ed = new Date();
            var totalTime = helper.getTimeInterval(st.getTime(), ed.getTime());
            logger.info(title, 'processed time:', totalTime);
        },
        runBlock: function () {

        }
    });
})(window.app);
