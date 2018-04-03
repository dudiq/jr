(function (app) {
    var env = app('app-env');
    var theme = app('theme');
    var translate = app('translate');

    var prefix = 'app-settings.';

    var THEME = 'theme';
    var LANG = 'lang';

    function value(key, value) {
        var fullKey = prefix + key;
        var ret = env(fullKey, value);
        return ret;
    }

    var appSettings = app('app-settings', {
        theme: function (name) {
            if (name !== undefined) {
                value(THEME, name);
                theme(name);
            }
            return theme.getCurrent();
        },
        lang: function (val) {
            if (val !== undefined && val != translate.getCurrLang()){
                value(LANG, val);
                translate.setLang(val);
            }
            return translate.getCurrLang();
        }
    });

    // --- _initialize settings for app

    var firstTheme = value(THEME);
    firstTheme && appSettings.theme(firstTheme);

    app.onStart(function () {
        var firstLang = value(LANG);
        firstLang && appSettings.lang(firstLang);
    });

})(window.app);
