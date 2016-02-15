(function(){
    var app = window.app;
    var pages = app('pages');
    var helper = app('helper');
    var translate = app('translate');
    var navi = app('navigation');
    var userMod = app('user');

    var page = pages.createClass();

    var p = page.prototype;

    function checkLoginPwd(pwdField){
        var pwd = pwdField.val();
        if (pwd == 'test') {
            userMod.setUser({
                token: '123',
                user: 'user'
            });
            navi.switchPage('main');
        }
    }

    p.prepareDomContent = function(content){

        var pwdField = content.find('.pwd-field');

        content.find(".btn-login").on("jrclick", function(){
            checkLoginPwd(pwdField);
        });

        return content;
    };

    page.createPage({
        id: 'login',
        alias: 'login',
        weight: 1
    });
})();