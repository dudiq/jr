(function (app) {
    var config = app('config');
    var helper = app('helper');
    var templater = app('templater');
    
    var broadcast = app('broadcast');
    var translateEvs = broadcast.events('translate');
    var naviEvs = broadcast.events('navigation');

    var container;
    var secContainers = [];
    
    function SecondContainerClass(opt) {
        this._init(opt);
    }
    
    helper.extendClass(SecondContainerClass, {
        _init: function(opt){
            this.drawn = false;
            this.shown = false;
            this.content = null;
            this.viewId = opt.viewId;
            this.id = opt.id;
            var pages = this.pages = {};
            helper.arrayWalk(opt.pages, function (id) {
                pages[id] = true;
            });
            this.initComponents();
        },
        _onShow: function () {
            this.shown = true;
            this.onComponentsShow();
        },
        _onHide: function () {
            this.shown = false;
            this.onComponentsHide();
        },
        _detach: function () {
            this.content && this.content.detach();
        },
        _draw: function () {
            if (!this.drawn) {
                this.drawn = true;
                var rawTpl = templater.get(this.viewId);
                var tpl = templater.translate(rawTpl);

                var content = this.content = $(tpl);
                this.prepareComponentsContent(content);
            }
        }
    });

    helper.mixinClass(SecondContainerClass.prototype, app('component')('mixin-container'));

    app('secondary-container', {
        putInto: function (opt) {
            var inst = new SecondContainerClass(opt);
            secContainers.push(inst);
        }
    });
    
    function showComponents(page) {
        // append page components
        // detach old components
        var pageId = page.id;
        helper.arrayWalk(secContainers, function (item) {
            if (item.pages[pageId]){
                // need show
                item._draw();
                container.append(item.content);
                if (!this.shown){
                    item._onShow();
                }
            } else {
                // detach
                item._detach();
            }
        });
    }

    helper.onDomReady(function () {
        var secondaryContainer = app('config').secondaryContainer;
        secondaryContainer && (container = $(secondaryContainer).first());
        broadcast.on(translateEvs.onLangSet, function () {
            
        });
        broadcast.on(naviEvs.onBeforePageShow, showComponents);
    });
    
})(window.app);