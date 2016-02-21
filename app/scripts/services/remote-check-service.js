(function(){
    var app = window.app;
    var services = app('services');
    var request = services('request');
    var remoteCheckService = services('remove-check', {});

    remoteCheckService.check = function(cb){
        request
            .get('http://google.com')
            .done(cb);
    };

})();