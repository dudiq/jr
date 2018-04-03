(function (app) {
    var helper = app('helper');
    var broadcast = app('broadcast');
    var timeLogger = app('time-logger')('slider');
    var logger = app('logger')('slider');
    var componentInit = app('bb-init');
    var roots = app('basic-roots');
    var pageAuth = app('page-auth');
    var animateFrame = app('animation-frame');

    var sliderEvs = broadcast.events('slider', {
        onAppend: 'onAppend',
        onDetach: 'onDetach'
    });


    var CONST_ANIMATIONS = "webkitAnimationEnd animationend oanimationend msAnimationEnd";

    function SliderClass(opt) {
        var self = this;
        opt = this._opt = opt || {};
        this._currentItem = null;
        this._container = opt.container;
        this._tick = 0;

        this._sliding = {
            working: false,
            inPage: null,
            outPage: null
        };

    }


    helper.extendClass(SliderClass, {
        hasAccess: function () {
            return pageAuth.apply(pageAuth, arguments);
        },
        getCurrent: function () {
            return this._currentItem;
        },
        switchTo: function (id) {
            if (this.hasAccess(id)) {
                var nextItem = roots(id);
                var currItem = this._currentItem;
                var self = this;
                this._tick++;
                if (this._tick > 35536) {
                    this._tick = 0;
                }
                var tick = this._tick;
                if (nextItem && !nextItem.inited) {
                    timeLogger.startTimer();
                    componentInit(nextItem);
                    timeLogger.stopTimer();
                    var details = timeLogger.getShortDetails();
                    logger.warn('.init() page', details);
                }

                animateFrame(function () {
                    if (tick == self._tick) {
                        timeLogger.startTimer();
                        switchToNext.call(self, currItem, nextItem);
                        timeLogger.stopTimer();
                        var details = timeLogger.getShortDetails();
                        logger.log('.switchTo.call() page', details);
                    }
                });
            } else {
                logger.error('no access to page %s', id);
            }
        }
    });


    function switchToNext(prevItem, nextItem) {
        // need do this in reqanimframe
        var fragment = document.createDocumentFragment();
        nextItem.draw();
        nextItem.onDefaultState();
        nextItem.appendTo(fragment);
        this._container.appendChild(fragment);
        broadcast.trig(sliderEvs.onAppend, nextItem);
        if (prevItem){
            prevItem.detach();
            broadcast.trig(sliderEvs.onDetach, prevItem);
        }
        fragment = null;
        //page.weight < currentPage.weight
        this._currentItem = nextItem;
    }

    app('slider', SliderClass);

})(window.app);
