(function (app) {
    var config = app('config');
    var broadcast = app('broadcast');
    var route = app('route');
    var logger = app('logger')('--start-point--');
    var SliderClass = app('slider');
    var roots = app('basic-roots');
    var timeLogger = app('time-logger')('start-point');
    var animateFrame = app('animation-frame');


    var routeEvs = broadcast.events('route');
    var translateEvs = broadcast.events('translate');

    var PAGE_INDEX = 0;


    function defineRoute(slider) {
        route.addMainField('slider', {
            index: PAGE_INDEX,
            onSet: function (alias) {
                logger.log('onSet', alias);
                slider.switchTo(alias);
            },
            onChanged: function (alias) {
                logger.log('onChanged', alias);
                slider.switchTo(alias);
            },
            onRemoved: function () {
                logger.log('onRemoved');
                // need logic here?
                //:todo go to default page
            },
            onArgsChanged: function (args) {
                logger.log('onArgsChanged');
                // need logic here?
            }
        });
    }

    function defineEdgeSliders() {
        var topSlider = new SliderClass({
            container: document.querySelector(config.topSlider)
        });

        var bottomSlider = new SliderClass({
            container: document.querySelector(config.bottomSlider)
        });

        bottomSlider.switchTo('bottom');
        topSlider.switchTo('top');
    }

    app('main-slider', {
        switchTo: function (name, opt) {
            var args;
            if (opt) {
                for (var key in opt) {
                    args += '/' + key + '=' + opt[key];
                }
            }

            route.pushByField(PAGE_INDEX, name, args);
        }
    });

    function updateRootsByTranslates() {
        roots.map(updateTranslates);
    }

    function updateTranslates(page) {
        if (page.inited && page.drawn) {
            timeLogger.startTimer();
            page.updateTranslates();
            timeLogger.stopTimer();
            var details = timeLogger.getShortDetails();
            logger.warn('.translate pages', details);
        }
    }

    app.onStart(function(){

        var container = document.querySelector(config.slider);
        var slider = new SliderClass({
            container: container
        });

        defineRoute(slider);

        defineEdgeSliders();

        broadcast.on(translateEvs.onLangSet, function () {
            animateFrame(updateRootsByTranslates);
        });

        broadcast.one(routeEvs.started, function(){
            // if app runned without any page, just goto main
            if (!slider.getCurrent()){
                //:todo default redirect

            //     logger.warn('app is not processed first page! trying to run default page');
                // broadcast.trig(naviEvs.onDefaultPage);
            }
        });
    });


})(window.app);
