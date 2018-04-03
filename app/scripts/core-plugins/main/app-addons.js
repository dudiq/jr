(function (app) {
    app.onStart(function () {
        var helper = app('helper');
        (!helper.isMobile && !helper.isNative) && $(document.body).addClass('jr-desktop');
    });

})(window.app);
