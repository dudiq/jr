(function(){
    var app = window.app;
    var pages = app('pages');

    var helper = app('helper');
    var notify = app('notify');

    var page = pages.createClass();

    var p = page.prototype;

    p.prepareDomContent = function(content){

        return content;
    };

    page.createPage({
        id: 'second',
        alias: 'second',
        weight: 3
    });

})();