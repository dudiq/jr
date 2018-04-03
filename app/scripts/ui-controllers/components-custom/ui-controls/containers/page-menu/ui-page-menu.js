(function (app) {
    var broadcast = app('broadcast');
    var sliderEvs = broadcast.events('slider');
    var dom = app('dom');

    app('bb-co')('ui-page-menu', {
        tpl: 'scripts/ui-controllers/components-custom/ui-controls/containers/page-menu/ui-page-menu',
        init: function () {
            broadcast.on(sliderEvs.onAppend, this.onPageChanged, this);
            this._currClass = '';
        },
        processContent: function (el) {
            this._place = el.find('.content')[0];
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
            broadcast.on(sliderEvs.onAppend, this.onPageChanged);
        }
    });

})(window.app);
