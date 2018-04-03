(function (app) {
    var dom = app('dom');
    var logger = app('logger')('pouches.js');
    var confirmPlugin = app('confirm');
    var translate = app('translate');
    var helper = app('helper');
    var collPouch = app('coll-pouch');
    var appEnv = app('app-env');
    var broadcast = app('broadcast');
    var pouchProcEvs = broadcast.events('pouch-processor', {
        onChanged: 'onChanged'
    });

    var KEY = 'pouch';

    var DEF_POUCH = 'default';
    var currPouchId = appEnv(KEY) || DEF_POUCH;
    var pouches;

    function setCurrent(id) {
        currPouchId = id;
        appEnv(KEY, id);
        broadcast.trig(pouchProcEvs.onChanged, currPouchId);
    }

    function getTitle(id) {
        var ret = '';
        var children = pouches.children;
        for (var i = 0, l = children.length; i < l; i++) {
            var child = children[i];
            if (child.value == id) {
                ret = child.innerHTML;
            }
        }
        return ret;
    }

    var actions = {
        'default': function (sel) {
            setCurrent(DEF_POUCH);
        },
        'action-remove': function (sel) {
            var val = currPouchId;
            var title = getTitle(currPouchId);
            if (val != DEF_POUCH) {
                var msg = translate('categories.remove', title);
                confirmPlugin.confirm(msg, function () {
                    collPouch.removePouch(val)
                        .catch(function (reason) {
                            logger.error(reason);
                        })
                        .then(function () {
                            sel.value = DEF_POUCH;
                            setCurrent(DEF_POUCH);
                            updatePouchList();
                        });
                }, function () {
                    sel.value = currPouchId;
                });
            } else {
                sel.value = currPouchId;
            }
        },
        'action-add': function (sel) {
            var msg = translate('categories.add');
            confirmPlugin.prompt(msg, '', function (val) {
                if (val) {
                    var id = helper.mongoId();
                    var data = {
                        id: id,
                        name: val
                    };
                    collPouch.pushPouch(data)
                        .catch(function () {
                            // end animate
                        })
                        .then(function () {
                            updatePouchList();
                            // end animate
                            sel.value = id;
                            broadcast.trig(pouchProcEvs.onChanged, currPouchId);
                        });
                }
            }, function () {
                sel.value = currPouchId;
            });
        }
    };

    function onChange() {
        var sel = this;
        var val = sel.value;
        if (actions[val]) {
            actions[val](sel);
        } else {
            setCurrent(val);
        }
        logger.log('val', val);
    }

    function updatePouchList() {
        collPouch.getPouches()
            .catch(function (reason) {
                logger.error(reason);
            })
            .then(function (value) {
                var frag = document.createDocumentFragment();
                var option = document.createElement('option');
                option.value = DEF_POUCH;
                option.innerHTML = translate('{{pageMenu.def}}');
                if (currPouchId == DEF_POUCH) {
                    option.selected = true;
                }
                frag.appendChild(option);
                for (var i = 0, l = value.length; i < l; i++) {
                    var item = value[i];
                    option = document.createElement('option');
                    option.value = item.id;
                    option.innerHTML = item.name;
                    if (currPouchId == item.id) {
                        option.selected = true;
                    }
                    frag.appendChild(option);
                }
                pouches.innerHTML = '';
                pouches.appendChild(frag);
            });

    }

    app('data-processor')({
        'pouches.getCurrent': function () {
            var ret;
            if (currPouchId != DEF_POUCH) {
                ret = currPouchId;
            }
            return ret;
        },
        'pouches.init': function (sel) {
            dom.on(sel, 'change', onChange);
            var pouList = dom.find(sel, '#pouches-list');
            pouches = pouList && pouList[0];
            updatePouchList();
        },
        'pouches.drop': function (sel) {
            dom.off(sel, onChange);
            sel = null;
            pouches = null;
        }
    });

})(window.app);
