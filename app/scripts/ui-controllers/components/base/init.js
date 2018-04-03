(function (app) {

    var templater = app('templater');
    var logger = app('logger')('cmp:init');
    var broadcast = app('broadcast');
    var dataProcessor = app('data-processor');
    var translateComponent = app('translate-component');

    var baseCompEvs = broadcast.events('component', {
        onInit: 'onInit',
        onDestroy: 'onDestroy'
    });

    var astParse;
    app('mod-require')('ast-parse', function (mod) {
        astParse = mod;
        mod = null;
    });

    var defRepl = {};

    function replaceInTpl(tpl, parentNode) {
        var dataInit = parentNode.attrs['data-init'];
        var repl;
        if (dataInit) {
            try {
                repl = JSON.parse(dataInit);
            } catch (e) {
                repl = null;
            }
        }
        var replaced = this.getReplaced(repl || defRepl);
        if (replaced) {
            for (var key in replaced) {
                var val = replaced[key];
                tpl = tpl.replaceAll(key, val);
            }
        }
        return tpl;
    }

    function initDataProc(parentNode) {
        var dataProc = parentNode.attrs['data-processor'];
        if (dataProc) {
            this._dataProcessor = dataProc ? dataProcessor(dataProc) : null;
        }
    }

    function init(parentNode) {
        if (!this.inited) {
            this._parentNode = parentNode;
            var tplPath = this.getProp('tpl');
            var rawTpl = templater.get(tplPath);
            if (!rawTpl) {
                logger.error('not defined rawTpl!');
            } else {
                if (parentNode) {
                    this._name = parentNode.name;
                    rawTpl = replaceInTpl.call(this, rawTpl, parentNode);
                    initDataProc.call(this, parentNode);
                }
                this.init(defRepl);
                var tree = this._tree = astParse(this, rawTpl);
                // make ast tree
                defineAttrs(tree, parentNode);
                this.inited = true;
                this._content = tree.el;
                broadcast.trig(baseCompEvs.onInit, this);
            }
        }
    }

    function defineAttrs(tree, pNode) {
        var el = tree.el;
        if (pNode) {
            var attrs = pNode.attrs;
            for (var key in attrs){
                if (key != 'class'){
                    el.setAttribute(key, attrs[key]);
                }
            }
        }
        translateComponent.attrs(tree);
    }

    app('bb-init', function (inst, parentNode) {
        init.call(inst, parentNode);
    });

})(window.app);
