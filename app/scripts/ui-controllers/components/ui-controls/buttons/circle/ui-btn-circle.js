(function (app) {

    var UiCircleBtn = app('bb-co')('ui-btn-circle', 'ui-btn', {
        tpl: 'scripts/ui-controllers/components/ui-controls/buttons/circle/ui-btn-circle',
        getReplaced: function (opt) {
            return UiCircleBtn._parent.getReplaced.call(this, {
                icon: opt.icon || 'x-icon-plus'
            });
        }
    });

})(window.app);
