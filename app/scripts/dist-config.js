(function(app){
    // config for production

    app('app-config', {

    });

    var appLogger = app('logger');
    appLogger.logLevel(appLogger.LEVEL_PROD);

})(window.app);
