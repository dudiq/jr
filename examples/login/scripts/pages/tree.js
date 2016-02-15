(function(){
    var app = window.app;
    var pages = app('pages');
    var helper = app('helper');

    var page = pages.createClass();

    var p = page.prototype;


    p.prepareDomContent = function(content){

        return content;
    };

    page.createPage({
        id: 'tree',
        alias: 'tree',
        weight: 4
    });

})();