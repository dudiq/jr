(function (app) {

    app('bb-co')('ui-settings-menu', 'ui-popup-menu', {
        tpl: 'scripts/ui-controllers/components-custom/ui-controls/menus/settings-menu/ui-settings-menu',
        routeKey: 'settings-menu',
        overflow: true,
        onContentClick: function () {
            return false;
        }
    });

})(window.app);
