(function (app) {
    var makeStorage = app('browser-storage-maker');
    var consts = app('const');
    var appPrefix = consts.APP_PREFIX + '-';

    var sysLs = makeStorage(appPrefix, 'system-local-storage', window.localStorage);
    var sysSs = makeStorage(appPrefix, 'system-session-storage', window.sessionStorage);

    app('system-local-storage', sysLs);
    app('system-session-storage', sysSs);

})(window.app);
