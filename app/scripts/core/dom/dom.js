(function (app) {
    var logger = app('logger')('dom');

    var dom = app('dom', {
        extend: function (mixins) {
            for (var key in mixins) {
                if (!dom.hasOwnProperty(key)) {
                    dom[key] = mixins[key];
                } else {
                    logger && logger.error(key + ' is already defined');
                }
            }
            mixins = null;
        }
    });
})(app);
