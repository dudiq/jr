(function (app) {

    var comp = app('bb-co');
    var roots = app('basic-roots');

    app('bb-page', function (opt) {
        var pageClass = comp(opt.id, 'page', opt);
        roots(opt.id, pageClass);
        return pageClass;
    });


})(window.app);
