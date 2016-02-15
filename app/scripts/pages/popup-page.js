(function(){
    var app = window.app;
    var pages = app('pages');
    var helper = app('helper');
    var translate = app('translate');
    var templater = app('templater');
    var watchScope = app('watch-scope');

    var pagePopup = app('page-popup');

    var page = pagePopup.createClass();

    var p = page.prototype;

    p.prepareDomContent = function(content){
        this.scopeWatcher && this.scopeWatcher.destroy();
                           var arr = [];

        function fillArray(){

            var l = 100;
            for (var i = 0; i < l; i++){
                arr.push({
                    label: 'this is ' + i + ' element'
                });
            }

        }

        fillArray();

        var scope = {
            arr: arr
        };

        window.$scope2 = scope;

        this.scopeWatcher = watchScope.watch(content, scope);

        return content;
    };

    page.createPopupPage({
        parentPageId: 'second',
        // key: defined in popup-page plugin as "modal-page"
        // overflow: defined as true in popup-page plugin, if key is defined as "modal-page"
        id: 'popup',
        weight: 100
    });

})();