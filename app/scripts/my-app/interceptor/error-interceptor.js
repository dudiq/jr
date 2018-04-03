(function (app) {



    return;

    /// DISABLED!!!!;

    var appLogger = app('logger');
    var consoleObj = appLogger.console;

    var oldErrorMethod = consoleObj.error;

    consoleObj.error = function () {
        //:todo think about reporting system for client, GA or something else
        oldErrorMethod.apply(consoleObj, arguments);
    };

})(window.app);
