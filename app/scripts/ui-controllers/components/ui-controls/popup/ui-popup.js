(function (app) {
    var routeCmd = app('route-commander');
    var logger = app('logger')('ui-popup');
    var topDomEls = app('top-dom-elements');
    var dom = app('dom');
    var onBodyClick = app('on-callbacks')();

    var lastTime = 0;
    var PREV_TIME = 100;

    var UiPopup = app('bb-co')('ui-popup', {
        tpl: 'scripts/ui-controllers/components/ui-controls/popup/ui-popup',
        init: function () {
            UiPopup._parent.init.call(this);

            var routeKey = this._routeKey = this.getAttr('data-route-key');
            var outsideClick = this.getAttr('data-outside-click');
            this._canOutsideClick = outsideClick = (outsideClick !== false);

            var self = this;
            if (routeKey){
                this._routeInst = routeCmd.createCommander({
                    key: routeKey,
                    onRemoved: function (value) {
                        logger.log('onRemoved', value);
                        self.hideInDom();
                    },
                    onSets: function (value) {
                        logger.log('onSets', value);
                        self.showInDom();
                    },
                    onChanged: function (value) {
                        logger.log('onChanged', value);
                    }
                });
            }
            (outsideClick !== false) && onBodyClick.push(this._onGbState = function (ev, subEv) {
                var now = (new Date).getTime();
                if (lastTime <= (now - PREV_TIME)) {
                    if (!subEv.isDefaultPrevented()){
                        if (self.isShown() && self.isPopupVisible()) {
                            // var isClickInsideMenu = (dom.closest(subEv.target, self.getContent()[0]));
                            // !isClickInsideMenu && self.onParentClick();
                            // this.hidePopup();
                        }
                    }
                }
            });

        },
        getReplaced: function (opt) {
            return {
                '{{_popupTitle}}' : opt.title || ''
            };
        },
        showInDom: function () {
            dom.removeClass(this.getContent(), 'helper-hide');
        },
        hideInDom: function () {
            // :todo add remove to fragment, or destroy element fully
            dom.addClass(this.getContent(), 'helper-hide');
        },
        isPopupVisible: function () {
            return !dom.hasClass(this.getContent(), 'helper-hide');
        },
        canOutsideClick: function () {
            return this._canOutsideClick;
        },
        showPopup: function () {
            lastTime = (new Date()).getTime();
            // this.onDefaultState();
            this.showInDom();
            this._routeKey && routeCmd.setKey(this._routeKey, true);
        },
        hidePopup: function () {
            if (this.isPopupVisible()) {
                this.hideInDom();
            }
            var routeKey = this._routeKey;
            if (routeKey) {
                routeCmd.isExist(routeKey) && routeCmd.removeKey(routeKey);
            }
        },

        processContent: function (content) {
            content.addClass('helper-hide');
            // this.showPopup();
            var overflow = content.find('.uia-overflow');
            var self = this;
            if (this.getProp('overflow') === false){
                overflow.remove();
            }
            content.on('jrclick', function (ev) {
                if (
                    (self._canOutsideClick && dom.closest(ev.target, 'uia-overflow')) || // overflow click
                    (self._canOutsideClick && dom.hasClass(ev.target, 'content-place-wrap')) ||
                    dom.closest(ev.target, 'header-close-btn') // close btn click
                ) {
                    self.hidePopup();
                }
            });
            UiPopup._parent.processContent.apply(this, arguments);
        },
        //onDefaultState: function () {
         //   UiPopup._parent.onDefaultState.apply(this, arguments);
        //},
        destroy: function () {
            onBodyClick.dropCb(this._onGbState);
            this._routeInst && this._routeInst.destroy();
            this._routeInst = null;
            UiPopup._parent.destroy.call(this);
        }
    });

    topDomEls.onBodyClick(function () {
        onBodyClick.callCbs.apply(onBodyClick, arguments);
    });

})(window.app);
