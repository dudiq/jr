(function(){
    var app = window.app;
    var pages = app('pages');
    var helper = app('helper');
    var translate = app('translate');
    var navi = app('navigation');
    var myApp = app('my-app');

    var page = pages.createClass();

    var p = page.prototype;

    var lang = "en";

    p.prepareDomContent = function(content){

        content.find(".go-second").on("jrclick", function(){
            navi.switchPage('second');
        });

        content.find(".go-tree").on("jrclick", function(){
            navi.switchPage('tree');
        });


        content.find(".go-logout").on("jrclick", function(){
            myApp.logout();
        });

        return content;
    };

    page.createPage({
        id: 'main',
        alias: 'main',
        weight: 2
    });
})();