(function (app) {
    var conf = app('config');

    app('bb-co')('portal', {
        tpl: '',
        showPortal: function () {
            this.onDefaultState();
            var parent = (conf.portals) ? document.body.querySelector(conf.portals) : document.body;
            var fragment = this._fragment || document.createDocumentFragment();
            this.appendTo(fragment);
            parent.appendChild(fragment);
            fragment = null;
        },
        hidePortal: function () {
            var fragment = this._fragment = document.createDocumentFragment();
            this.appendTo(fragment);
        }
    });

})(window.app);
