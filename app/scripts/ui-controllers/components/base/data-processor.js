(function (app) {

    var topDomEls = app('top-dom-elements');
    var logger = app('logger')('data-processor');
    var broadcast = app('broadcast');
    var baseCompEvs = broadcast.events('component');


    var processors = {};

    var roots = [];


    app('data-processor', function (name, inst) {
        var ret;
        if (typeof name == "object" && inst === undefined){
            // set list
            for (var key in name){
                var item = name[key];
                setProcessor(key, item);
            }
        } else {
            if (inst){
                // setter
                setProcessor(name, inst);
                ret = inst;
            } else {
                //get
                ret = processors[name];
                if (!ret){
                    logger.error('processor "%s" is not defined', name);
                }
            }
        }
        return ret;
    });

    function setProcessor(name, inst) {
        if (processors[name]){
            logger.error('data-processor already exist', name);
        } else {
            processors[name] = inst;
        }
    }

    function findByEl(children, el) {
        var ret;
        for (var i = 0, l = children.length; i < l; i++) {
            var item = children[i];
            if (!item.shown) {
                continue;
            }
            ret = item.findByEl(el);
            if (ret){
                break;
            }
        }
        return ret;
    }

    function findClosest(child) {
        do {
            if (child && child.hasAttribute && child.hasAttribute('data-processor')) {
                return child;
            }
        } while (child = child.parentNode);
    }

    app.onStart(function () {
        broadcast.on(baseCompEvs.onInit, function (cmp) {
            if (!cmp.getParent()){
                // root element
                roots.push(cmp);
            }
        });
        broadcast.on(baseCompEvs.onDestroy, function (cmp) {
            if (!cmp.getParent()){
                // root element
                var pos = roots.indexOf(cmp);
                if (pos != -1) {
                    roots.splice(pos, 1);
                }
            }
        });

        topDomEls.onBodyClick(function (ev, sEv) {
            var target = sEv.target;
            var el = findClosest(target);
            var procName = el && el.getAttribute ? el.getAttribute('data-processor') : null;

            var method = processors[procName];
            if (method) {
                var cmp = findByEl(roots, el);
                cmp && method.call(cmp);
            }
        });

    });

})(window.app);
