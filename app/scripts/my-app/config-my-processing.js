(function(){
    var app = window.app;
    var config = app('app-config');

    app('process-my-config', function(){
        // define you own code for processing config
        !config.features && (config.features = {});
    });
})();
