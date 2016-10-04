(function(){
    var app = window.app;

    //define own config here
    app('config', {
        container: '#mainContainer',
        useContentLengthHeader: false, //http module
        scrollToTopPage: true,
        pageTransition: true
    });


})();