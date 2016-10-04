(function () {
    var app = window.app;
    var navi = app('navigation');
    var userMod = app('user');

    function checkLoginPwd(pwdField) {
        var pwd = pwdField.val();
        if (pwd == 'test') {
            userMod.setUser({
                token: '123',
                user: 'user'
            });
            navi.switchPage('main');
        }
    }

    app('pages').create({
        id: 'login',
        weight: 1,
        viewId: 'pages/login',
        prepareDomContent: function (content) {
            var pwdField = content.find('.pwd-field');
            content.find(".btn-login").on("jrclick", function () {
                checkLoginPwd(pwdField);
            });
        }
    });

})();