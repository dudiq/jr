(function (app) {
    var helper = app('helper');

    app('bb-co')('ui-tabs', {
        tpl: 'scripts/ui-controllers/components/ui-controls/ui-tabs',
        init: function () {
            this._onItemClickCbs = app('on-callbacks')();
            this.defineScope({
                active: 0,
                tabItems: []
            });
        },
        setTabs: function (tabItems) {
            var scopeItems = this.getScope().tabItems;
            scopeItems.clear();
            for (var i = 0, l = tabItems.length; i < l; i++){
                var item = tabItems[i];
                var type = typeof item;
                var scopeItem = {
                    active: false,
                    title: type == "object" ? item.title : item,
                    data: item
                };
                scopeItems.push(scopeItem);
            }
            scopeItems[0] && (scopeItems[0].active = true);
        },
        onItemClick: function (cb) {
            this._onItemClickCbs.push(cb);
        },
        processContent: function (content) {

            var self = this;
            content.on('jrclick', {handleWhenDown: true}, function (ev) {
                var target = $(ev.target).closest('.tab-item');
                if (target.length) {
                    // menu item click
                    var scope = self.getScope();
                    var pos = target.index();
                    var tabItems = scope.tabItems;
                    var item = tabItems[pos];
                    if (item){
                        helper.arrayWalk(tabItems, function (node) {
                            node.active = false;
                        });
                        item.active = true;
                        self._onItemClickCbs.callCbs(item.data, pos);
                    }
                }
            });
        }
    });

})(window.app);
