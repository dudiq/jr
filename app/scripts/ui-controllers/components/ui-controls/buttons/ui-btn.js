(function (app) {

    app('bb-co')('ui-btn', {
        tpl: 'scripts/ui-controllers/components/ui-controls/buttons/ui-btn',
        getReplaced: function (opt) {
            return {
                '{{_btnIcon}}': opt.icon || '',
                '{{_btnTitle}}': opt.title || ''
            };
        }
    });

})(window.app);
