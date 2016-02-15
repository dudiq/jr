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

        content.find(".btn-second").on("jrclick", function(){
            navi.switchPage('second');
        });

        content.find(".btn-tree").on("jrclick", function(){
            navi.switchPage('tree');
        });


        content.find(".btn-transl").on("jrclick", function(){
            translate.setLang(lang);
            lang = (lang == "en") ? "ru" : "en";
        });

        content.find('.btn-gestures').on('jrclick', function(){
            navi.switchPage('gestures');
        });

        content.find('.btn-logout').on('jrclick', function(){
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