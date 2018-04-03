(function (app) {

    var timerId;
    var root;
    var CHANGE_TIMEOUT = 500;
    var THEME_DEFAULT = 'dark';
    var themes = {
        dark: true,
        light: true
    };

    var currTheme = THEME_DEFAULT;

    function changeTheme(name) {
        var themeName = 'theme-';
        if (!themes[name]){
            name = THEME_DEFAULT;
        }
        if (name != THEME_DEFAULT){
            themeName = themeName + name;
        }
        currTheme = name;

        !root && (root = document.getElementsByTagName('html')[0]);

        clearTimeout(timerId);
        timerId = setTimeout(function () {
            // remove 'theme-animate' class
            var classes = root.className.split(' ');
            removeClass(classes, 'theme-animate');
            root.className = classes.join(' ');
        }, CHANGE_TIMEOUT);

        var classes = root.className.split(' ');
        removeClass(classes);
        themeName && classes.push(themeName);
        classes.push('theme-animate');
        root.className = classes.join(' ');
    }

    function removeClass(classes, toFind) {
        // clear themes
        toFind = toFind || 'theme-';
        for (var i = classes.length - 1; i >= 0; i--) {
            var item = (classes[i] + '').trim();
            if (item.indexOf(toFind) != -1) {
                // theme class
                classes.splice(i, 1);
            }
        }
    }

    changeTheme.getCurrent = function () {
        return currTheme;
    };

    app('theme', changeTheme);


})(window.app);
