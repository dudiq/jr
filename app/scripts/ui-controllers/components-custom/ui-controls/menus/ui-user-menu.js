(function (app) {
    var navi = app('navi');

    var defItems = [
        {
            icon: 'x-icon-pencil',
            title: 'accountPopupMenu.input',
            page: 'expense'
        },
        {
            icon: 'x-icon-price-tag',
            title: 'accountPopupMenu.categories',
            page: 'categories'
        },
        {
            icon: 'x-icon-stats-dots',
            title: 'accountPopupMenu.analytic',
            page: 'analytic'
        },
        {
            title: ''
        },
        {
            icon: 'x-icon-cog',
            title: 'accountPopupMenu.settings',
            page: 'app-settings'
        }
    ];

    var UiAccountPopupMenu = app('bb-co')('ui-user-menu', 'ui-popup-menu', {
        tpl: 'scripts/ui-controllers/components-custom/ui-controls/menus/ui-user-menu',
        init: function () {
            UiAccountPopupMenu._parent.init.call(this);
            this.setItems(defItems);
        },
        onItemClick: function (node) {
            var ret;
            if (node.page) {
                navi.switchPage(node.page);
            } else {
                node.onClick && (ret = node.onClick.call(this));
            }
            return ret;
        }
    });

})(window.app);
