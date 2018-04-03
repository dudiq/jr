(function (app) {
    var helper = app('helper');
    var pushToWatchedArray = helper('pushToWatchedArray');
    var dom = app('dom');

    var UiPopupClass = app('bb-co')('ui-popup-menu', 'ui-popup', {
        tpl: 'scripts/ui-controllers/components/ui-controls/menus/ui-popup-menu',
        overflow: false,
        init: function () {
            UiPopupClass._parent.init.apply(this, arguments);
            this.defineScope({
                items: []
            });
        },
        setItems: function (data) {
            var list = this.getScope().items;
            list.clear();
            pushToWatchedArray(list, data);
        },
        processContent: function (content) {
            var self = this;
            self.showPopup();
            // bind to parent el for catch showing
            content.parent().on('jrclick', function (ev) {
                self.showPopup();
            });

            content.on('jrclick', function (ev) {
                var items = self.getScope().items;
                var item = self.getRepeatScopeItem(ev, '.ui-popup-menu-item', items);
                var ret;
                if (item) {
                    ret = self.onItemClick(item);
                } else {
                    if (self.canOutsideClick()) {
                        if (dom.closest(ev.target, 'uia-overflow')) {
                            ret = true;
                        } else {
                            ret = self.onContentClick(ev);
                        }
                    } else {
                        ret = self.onContentClick(ev);
                    }
                }

                if (ret !== false){
                    self.isShown() && self.hidePopup();
                }

            });
            UiPopupClass._parent.processContent.apply(this, arguments);
        },
        onItemClick: function (item) {
            // cap
        },
        onContentClick: function () {
            // cap
        }
    });

})(window.app);
