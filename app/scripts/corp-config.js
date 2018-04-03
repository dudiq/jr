(function(app){
    // config for production

    app('app-config', {
        // server: {
        //     version: 'v1',
        //     serviceUrl: 'http://localhost',
        //     storageUrl: 'https://localhost'
        // }
    });

    var appLogger = app('logger');
    appLogger.logLevel(appLogger.LEVEL_PROD);

})(window.app);
