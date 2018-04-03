(function (app) {
    var navi = app('navi');
    var buildVer = app('build-version');
    var translate = app('translate');

    var defItems = [
        {
            icon: 'x-icon-fea',
            title: 'accountPopupMenu.input',
            page: 'expense'
        },
        {
            icon: 'x-icon-layers',
            title: 'accountPopupMenu.categories',
            page: 'categories'
        },
        {
            icon: 'x-icon-activity',
            title: 'accountPopupMenu.analytic',
            page: 'analytic'
        }
        // {
        //     icon: 'x-icon-download',
        //     title: 'accountPopupMenu.migrate',
        //     page: 'migrate'
        // }
    ];

    var UiPopupMenu = app('bb-co')('ui-top-menu', 'ui-popup-menu', {
        tpl: 'scripts/ui-controllers/components-custom/ui-controls/menus/top-menu/ui-top-menu',
        routeKey: 'top-menu',
        overflow: true,
        init: function () {
            UiPopupMenu._parent.init.call(this);
            this.setItems(defItems);
            var scope = this.getScope();

            scope.buildVersion = translate('title') + ': ' + buildVer.toString();
        },
        onItemClick: function (node) {
            var ret;
            if (node.page) {
                setTimeout(function () {
                    // need wait until route is cleared popup
                    navi.switchPage(node.page);
                }, 100);
            } else if (node.onClick) {
                (ret = node.onClick.call(this));
            } else {
                // do not hide menu when clicking
                ret = false;
            }
            return ret;
        },
        onContentClick: function () {
            return false;
        }
    });

})(window.app);
