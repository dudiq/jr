(function (app) {

    var helper = app('helper');
    var logger = app('logger')('base-component');
    var watchScope = app('scope');
    var componentsClasses = app('bb-co-classes');
    var broadcast = app('broadcast');
    var translateComponent = app('translate-component');
    var dom = app('dom');

    var baseCompEvs = broadcast.events('component');

    var fragment = document.createDocumentFragment();

    function BaseComponent(parent) {
        this._scope = null;
        this._name = null;
        this._content = null;

        this.drawn = false;
        this.shown = false;
        this.inited = false;
        this._cmpData = {
            children: [],
            parent: parent
        };

        this._tree = {};
    }

    //next step, add data-processor attr processing

    helper.extendClass(BaseComponent, {
        getReplaced: function () {
            // cap
        },
        init: function () {
            // cap
        },
        getScope: function () {
            return this._scope;
        },
        getAttr: function (key) {
            return this._parentNode.attrs[key];
        },
        getProp: function (name) {
            // :todo what about __proto__ support???
            return this.__proto__[name];
        },
        getContent: function () {
            return this._content;
        },
        processContent: function (content) {
            // cap
        },
        updateTranslates: function () {
            translateComponent.node(this._tree);
            walkDownChildren(this, 'updateTranslates');
        },
        redraw: function () {
            logger.warn(':todo implement .redraw()');
        },
        defineScope: function (val) {
            if (this._scope) {
                logger.error('trying define scope for component again "%s"', this._name);
            } else {
                this._scope = val;
            }
            return this._scope;
        },
        getName: function () {
            return this._name;
        },
        hasAccess: function () {
            // cap
        },
        show: function () {
            if (!this.shown) {
                this.shown = true;
                logger.warn(':todo implement .show()');
                // this._content && this._content.show();
                // this.onShow();
            }
        },
        hide: function () {
            if (this.shown) {
                this.shown = false;
                logger.warn(':todo implement .hide()');
                // this._content && this._content.hide();
                // this.onHide();
            }
        },
        draw: function () {
            if (!this.drawn) {
                walkDownChildren(this, 'draw');
                var content = this._tree.el;
                var el = $(content);//:todo replace to native dom
                this.processContent(el);

                var scope = this.getScope();
                if (scope) {
                    this._ws && this._ws.destroy();
                    this._ws = watchScope(el, scope);
                }
                el = null;

                this.drawn = true;
            }
            this.shown = true;
            this.onShow();
        },
        appendTo: function (place) {
            var content = this._tree.el;
            if (content) {
                place.appendChild(content);
            } else {
                logger.error('content is not created!');
            }
        },
        detach: function () {
            this.shown = false;
            this._content && fragment.appendChild(this._content);
        },
        find: function (name) {
            var ret = findChild.call(this, findByName, name);
            return ret;
        },
        findByEl: function (el) {
            var ret = findChild.call(this, findByEl, el);
            return ret;
        },
        getParent: function () {
            return this._cmpData.parent;
        },
        isShown: function () {
            return this.shown;
        },
        onDefaultState: function () {
            walkDownChildren(this, 'onDefaultState');
        },
        onBeforeShow: function () {
            logger.warn(':todo implement .onBeforeShow()');
        },
        onShow: function () {
            logger.warn(':todo implement .onShow()');
        },
        onBeforeHide: function () {
            logger.warn(':todo implement .onBeforeHide()');
        },
        onHide: function () {
            logger.warn(':todo implement .onHide()');
        },

        contentCallClick: function(ev, self, extMethodsContext) {
            var ret;
            var el = dom.closestByAttr(ev.target, 'data-call');
            if (el){
                var handlerName = el.getAttribute('data-call');
                var handler = self[handlerName];

                if (extMethodsContext && extMethodsContext[handlerName]){
                    handler = extMethodsContext[handlerName];
                }

                handler && (ret = handler.call(self, el, ev));
            }
            return ret;
        },
        getRepeatScopeItem: function (ev, className, items) {
            var ret;
            var el = dom.closest(ev.target, className);
            if (el){
                var pos = dom.indexOf(el);
                var btn = items[pos];
                if (btn){
                    ret = btn;
                }
            }
            return ret;
        },

        // runDataProcessor: function () {
        //     return this._dataProcessor && this._dataProcessor.apply(this, arguments);
        // },

        destroy: function () {
            broadcast.trig(baseCompEvs.onDestroy, this);
            this._ws && this._ws.destroy();

            this._parentNode = null;
            this._ws = null;
            this._scope = null;
            this.inited = false;
            this.drawn = false;
            this.shown = false;

            logger.warn(':todo implement .destroy() for children');
            this._tree = null;

            var oldContent = this._content;
            fragment.appendChild(oldContent);
            this._content = oldContent = null;
        }
    });

    function findByName(name) {
        var ret = (this._tree.attrs.name == name) ? this : null;
        return ret;
    }

    function findByEl(el) {
        var ret = null;
        if (this._tree.el == el) {
            ret = this;
        } else {
            if (findInTree(this._tree, el)) {
                ret = this;
            }
        }
        return ret;
    }

    function findInTree(tree, el) {
        var ret = tree.el == el;
        var nodes = tree.nodes;
        if (!ret && nodes) {
            for (var i = 0, l = nodes.length; i < l; i++) {
                var item = nodes[i];
                if (item._isChild) {
                    continue;
                }
                if (item.el == el) {
                    ret = true;
                }
                !ret && (ret = findInTree(item, el));
                if (ret) {
                    break;
                }
            }
        }
        return ret;
    }

    function findChild(method, a1, a2) {
        var ret = !this._isPortal ?
            method.call(this, a1, a2) :
            null;
        if (!ret) {
            var children = this._cmpData.children;
            for (var i = 0, l = children.length; i < l; i++) {
                var item = children[i];
                ret = method.call(item, a1, a2);
                !ret && (ret = findChild.call(item, method, a1, a2));
                if (ret) {
                    break;
                }
            }
        }
        return ret;
    }

    function walkDownChildren(context, method) {
        var children = context._cmpData.children;
        for (var i = 0, l = children.length; i < l; i++) {
            var item = children[i];
            item[method]();
        }
    }

    //maker
    app('bb-co', function (name, parent, params) {
        if (!parent) {
            return componentsClasses[name];
        } else {
            if (componentsClasses[name]) {
                logger.error('component already defined "%s"', name);
            } else {
                var type = typeof parent;
                if (!params && type == "object") {
                    params = parent;
                    parent = BaseComponent;
                }
                if (!params && !parent) {
                    parent = BaseComponent;
                }
                if (typeof parent == "string") {
                    parent = componentsClasses[parent];
                }
                !params && (params = {});
                var ComponentClass = componentsClasses[name] = helper.createClass(parent, params);
                return ComponentClass;
            }
        }
    });

})(window.app);
