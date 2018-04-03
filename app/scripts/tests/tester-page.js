(function(){
    var app = window.app;
    var checkAuth = app('page-auth');

    app('pages').create({
        id: 'tester-page',
        tplPath: 'scripts/tests/tester-page',
        weight: 99999,
        hasAccess: function(){
            return true;
        }
    });

    checkAuth.addRule({
        'tester-page': true
    });

})();
