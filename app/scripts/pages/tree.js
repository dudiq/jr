(function () {
    var app = window.app;
    var pages = app('pages');
    var helper = app('helper');
    var translate = app('translate');
    var templater = app('templater');
    var route = app('route');

    var itemTemplate;

    app('pages').create({
        id: 'tree',
        viewId: 'pages/tree',
        useHistory: false,
        weight: 3,
        isInternalScroll: true,
        init: function () {
            this.listUpdated = false;
            itemTemplate = templater.get('pages/tree/tree-item');
        },
        prepareDomContent: function (content) {
            content.find(".btn-second").on("jrclick", function () {
                route.back();
            });
            this.listUpdated = false;
        },
        onSwitchEnd: function () {
            if (!this.listUpdated) {
                var content = this.content;
                var buff = $("<div></div>");

                for (var i = 0; i < 100; i++) {
                    var newItem = $(itemTemplate);
                    buff.append(newItem);
                }
                content.find('.ist').append(buff.children());
                this.listUpdated = true;
            }
        },
        hasAccess: function(){

        }
    });
})();