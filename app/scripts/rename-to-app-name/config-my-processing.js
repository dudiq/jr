(function(){
    var app = window.app;
    var config = app('app-config');

    app('process-my-config', function(){
        // define you own code for processing config
        // for example !config.info && (config.info = {});
        // !config.debug && (config.debug = {});

        // or if you need disable config keys for some reason, when app start

        // example:
        //
        // !config.features && (config.features = {});
        //
        // disable for broken webview version
        // if (navigator.userAgent.indexOf('42.0.2311.129') != -1){
        //     config.features.offline = false;
        // }

    });
})();