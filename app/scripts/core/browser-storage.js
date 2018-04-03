(function(app){

    var ls = JrMakeStorage(app.prefix, 'local-storage', window.localStorage);
    var ss = JrMakeStorage(app.prefix, 'session-storage', window.sessionStorage);

    app('local-storage', ls);
    app('session-storage', ss);
    app('browser-storage-maker', JrMakeStorage);

})(window.app);
