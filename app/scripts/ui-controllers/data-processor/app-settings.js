(function (app) {
    var appSettings = app('app-settings');

    app('data-processor')({
        'app-settings.setDefaults': function () {
            var currTheme = appSettings.theme();
            var currLang = appSettings.lang();
        },
        'app-settings.theme.light': function () {
            appSettings.theme('light');
        },
        'app-settings.theme.default': function () {
            appSettings.theme('default');
        },
        'app-settings.lang.ru': function () {
            appSettings.lang('ru');
        },
        'app-settings.lang.en': function () {
            appSettings.lang('en');
        }
    });

})(window.app);
