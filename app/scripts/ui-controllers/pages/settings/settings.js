(function (app) {
    var appSettings = app('app-settings');
    var dom = app('dom');

    var SettingsPage = app('bb-page')({
        id: 'settings',
        tpl: 'scripts/ui-controllers/pages/settings/settings',
        weight: 6,
        title: 'settings.t',
        processContent: function (content) {
            SettingsPage._parent.processContent.apply(this, arguments);
            var currTheme = appSettings.theme();
            var currLang = appSettings.lang();
            var themeEl = dom.find(content[0], '#theme-' + currTheme);
            if (themeEl) {
                themeEl[0].checked = true;
            }
            var langEl = dom.find(content[0], '#lang-' + currLang);
            if (langEl) {
                langEl[0].checked = true;
            }
        }
    });

})(window.app);
