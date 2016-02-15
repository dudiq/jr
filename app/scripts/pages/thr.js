(function(){
    var app = window.app;
    var pages = app('pages');
    var helper = app('helper');
    var translate = app('translate');
    var templater = app('templater');
    var navi = app('navigation');

    var page = pages.createClass();

    var p = page.prototype;


    p.init = function(){
        this.listUpdated = false;
    };

    p.prepareDomContent = function(content){

        content.find(".btn-second").on("jrclick", function(){
//            navi.back();
            navi.switchPage('main');
        });
        this.listUpdated = false;

        return content;
    };


    page.createPage({
        id: 'thr',
        alias: 'thr',
        weight: 6
    });

})();