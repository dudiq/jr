(function (app) {

    //define own config here
    app('config', {
        container: '#mainContainer',
        slider: '#mainSlider',
        bottomSlider: '#bottomSlider',
        topSlider: '#topSlider',
        secondaryContainer: '#secondaryContainer', // deprecated
        portals: '#portals',
        useContentLengthHeader: false, //http module
        scrollToTopPage: true, // deprecated
        pageTransition: true,

        keyboardPopup: {
            useDiv: false,
            alwaysEnable: true
        },

        notify: {
            icons: {
                danger: 'x-icon-error',
                info: 'x-icon-info',
                warn: 'x-icon-warn',
                close: 'x-icon-cross'
            }
        }
    });


})(window.app);
