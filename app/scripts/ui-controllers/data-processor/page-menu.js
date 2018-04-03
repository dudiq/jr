(function (app) {
    var mainSlider = app('main-slider');

    app('data-processor')({
        'pagemenu.settings': function () {
            mainSlider.switchTo('settings');
        },
        'pagemenu.analytic': function () {
            mainSlider.switchTo('analytic');
        },
        'pagemenu.categories': function () {
            mainSlider.switchTo('categories');
        },
        'pagemenu.addNewExpense': function () {
            mainSlider.switchTo('addNewExpense');
        },
        'pagemenu.expense': function () {
            mainSlider.switchTo('expense');
        }
    });

})(window.app);
