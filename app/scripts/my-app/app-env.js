(function (app) {
    var sysLs = app('system-local-storage');
    var KEY = 'env';
    var helper = app('helper');

    var env = sysLs(KEY) || {};

    app('app-env', function (key, value) {
        if (value !== undefined) {
            env[key] = value;
            sysLs(KEY, env);
        }
        var cloned = helper.clone(env);
        return cloned[key];
    });

})(window.app);
