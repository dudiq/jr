(function () {
    var app = window.app;
    var helper = app('helper');
    var translate = app('translate');
    var templater = app('templater');
    var watchScope = app('watch-scope');

    var pagePopup = app('page-popup-modal');

    pagePopup.create({
        id: 'popup-me',
        weight: 100,
        viewId: 'pages/popup',
        prepareDomContent: function (content) {
            this.scopeWatcher && this.scopeWatcher.destroy();
            var arr = [];

            function fillArray() {

                var l = 100;
                for (var i = 0; i < l; i++) {
                    arr.push({
                        label: 'this is ' + i + ' element'
                    });
                }

            }

            fillArray();

            var scope = {
                arr: arr
            };

            this.scopeWatcher = watchScope.watch(content, scope);

            return content;
        }
    });

})();