(function (app) {
    var appConfig = app('app-config');

    var serviceUrl = '';

    var restServiceUrl = '';

    app('server-urls', {
        getRestServiceUrl: function () {
            updateUrls();
            return restServiceUrl;
        }
    });

    function updateUrls() {
        var path = appConfig.server.serviceUrl;
        if (serviceUrl != path){
            serviceUrl = path + '/api/' + appConfig.server.version;
            restServiceUrl = serviceUrl;
        }

    }

})(window.app);
