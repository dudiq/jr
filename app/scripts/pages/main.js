(function () {
    var app = window.app;
    var translate = app('translate');
    var navi = app('navigation');
    var myApp = app('my-app');

    var lang = "en";

    app('pages').create({
        id: 'main',
        weight: 2,
        prepareDomContent: function (content) {

            content.find(".btn-second").on("jrclick", function () {
                navi.switchPage('second');
            });

            content.find(".btn-tree").on("jrclick", function () {
                navi.switchPage('tree');
            });


            content.find(".btn-transl").on("jrclick", function () {
                translate.setLang(lang);
                lang = (lang == "en") ? "ru" : "en";
            });

            content.find('.btn-gestures').on('jrclick', function () {
                navi.switchPage('gestures');
            });

            content.find('.btn-logout').on('jrclick', function () {
                myApp.logout();
            });
        }
    });
})();