(function(){
    var app = window.app;
    var pages = app('pages');
    var helper = app('helper');
    var translate = app('translate');
    var templater = app('templater');
    var navi = app('navigation');

    var page = pages.createClass();

    var p = page.prototype;

    var itemTemplate = templater.get('tree/tree-item');

    p.init = function(){
        this.listUpdated = false;
    };

    p.prepareDomContent = function(content){

        content.find(".btn-second").on("jrclick", function(){
            navi.back();
        });
        this.listUpdated = false;

        return content;
    };

    p.onSwitchEnd = function(){
        if (!this.listUpdated){
            var content = this.content;
            var buff = $("<div></div>");

            for (var i = 0; i < 100; i++){
                var newItem = $(itemTemplate);
                buff.append(newItem);
            }
            content.find('.ist').append(buff.children());
            this.listUpdated = true;
        }
    };

    p.hasAccess = function(){
        //return false;
    };

    page.createPage({
        id: 'tree',
        //alias: '/tree',
        weight: 3
    });

})();