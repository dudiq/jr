(function (app) {

    var comp = app('bb-co');
    var componentInit = app('bb-init');
    var conf = app('config');

    var portals = {};

    app('portal', function (opt) {
        var id = opt.id;
        if (!portals[id]) {
            var compClass = comp(opt.id, 'portal', opt);
            var inst = new compClass();
            componentInit(inst);
            inst.draw();
            portals[id] = inst;
        }
        return portals[id];
    });

    app('bb-co')('portal', {
        tpl: '',
        init: function () {
            this._isPortal = true;
        },
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
