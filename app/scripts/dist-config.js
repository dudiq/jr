(function(){
    var app = window.app;

    // config for PRODUCTION version

    app('app-config', {

    });


    // for production release, drop all warnings and info messages, showing only errors
    var errors = app('errors');
    errors.setLevel(errors.LEVEL_PROD);

})();