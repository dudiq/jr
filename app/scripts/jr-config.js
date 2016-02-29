(function(){
    var app = window.app;

    //define own config here
    app('config', {
        container: '#mainContainer',
        useContentLengthHeader: false, //http module
        logsShowIntervals: true,
        scrollToTopPage: true,
        pageTransition: true
    });


})();