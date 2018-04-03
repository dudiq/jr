(function (app) {
    var helper = app('helper');

    var CSS3_TRANSFORM = '-' + helper.browserPrefix + '-transform';

    var timeout = 500;
    var cnt = 0;

    app('bb-co')('ui-load-indicator', {
        tpl: 'scripts/ui-controllers/components/ui-controls/load-indicator/ui-load-indicator',
        init: function () {
            cnt++;

            this._cnt = (cnt) + '-indi';
            this._val = 0;
            this._timerId = null;
        },
        processContent: function (content) {
            var bar = $(content).find('.bar');
            this._barEl = bar[0];
        }
    // }, {
    //     doStart: function () {
    //         logger.log(this._cnt, 'doStart');
    //         var content = this.getContent();
    //         var val = this._val;
    //         if (!val || val == 100) {
    //             // start
    //             content.addClass('start');
    //             this._t = this._barEl.offsetHeight; //reflow;
    //             this._val = 0;
    //             doTimer.call(this);
    //             content.removeClass('hidden');
    //             content.removeClass('start');
    //             delete this._t;
    //         } else {
    //             // inc
    //             doTimer.call(this);
    //         }
    //     },
    //     doProgress: function () {
    //         // inc
    //         doTimer.call(this);
    //     },
    //     doStop: function () {
    //         logger.log(this._cnt, 'doStop');
    //         // stop
    //         var content = this.getContent();
    //         var el = this._barEl;
    //         clearTimeout(this._timerId);
    //         var val = this._val = 100;
    //         content.addClass('hidden');
    //         setTransform(el, val);
    //     }
    });

    function doTimer() {
        var self = this;
        var val = this._val = incVal(this._val);
        setTransform(this._barEl, val);

        clearTimeout(this._timerId);
        this._timerId = setTimeout(function () {
            doTimer.call(self);
        }, timeout);
    }

    function incVal(val) {
        var inc = 0;
        if (val < 40) {
            // do big tricks
            inc = getRandomVal(20);
        } else if (val < 70) {
            inc = getRandomVal(5);
        } else {
            // do too small tricks
            inc = getRandomVal(1);
        }

        var newVal = Math.floor((val + inc) * 10) / 10;

        if (newVal > 90) {
            val += 0.1;
        } else if (newVal > 95) {
            val += 0.01;
        } else {
            val = newVal;
        }

        if (val > 99) {
            val = 99.5;
        }

        return val;
    }

    function getRandomVal(rnd) {
        rnd = rnd || 10;
        var doubleRnd = Math.floor(Math.random() * rnd * 10) / 10;
        return doubleRnd;
    }

    function setTransform(el, val) {
        var transVal = '';
        if (val < 100) {
            transVal = 'translate3d(-' + (100 - val) + '%,0,0)';
        }
        el.style[CSS3_TRANSFORM] = transVal;
        el.style['transform'] = transVal;
    }

})(window.app);
