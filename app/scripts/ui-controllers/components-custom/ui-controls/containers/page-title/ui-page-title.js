(function (app) {
    var broadcast = app('broadcast');
    var sliderEvs = broadcast.events('slider');
    var dom = app('dom');

    app('bb-co')('ui-page-title', {
        tpl: 'scripts/ui-controllers/components-custom/ui-controls/containers/page-title/ui-page-title',
        init: function () {
            broadcast.on(sliderEvs.onAppend, this.onPageChanged, this);
        },
        processContent: function (el) {
            this._place = el.find('.content')[0];
            var sel = el.find('select')[0];
            this._sel = sel;
            app('data-processor')('pouches.init')(sel);
        },
        onPageChanged: function (page) {
            if (!this._place){
                return;
            }
            var id = page.getProp('weight');
            var curr = this._currClass;
            curr && dom.removeClass(this._place, curr);
            curr = 'active-' + (id - 2);
            dom.addClass(this._place, curr);
            this._currClass = curr;
        },
        destroy: function () {
            app('data-processor')('pouches.drop')(this._sel);
            broadcast.on(sliderEvs.onAppend, this.onPageChanged);
        }
    });

})(window.app);
