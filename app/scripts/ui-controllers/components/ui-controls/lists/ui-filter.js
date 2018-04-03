(function (app) {
    var helper = app('helper');

    app('bb-co')('ui-filter', {
        tpl: 'scripts/ui-controllers/components/ui-controls/lists/ui-filter',
        init: function () {
            this.defineScope({
                filters: []
            });
        },
        setFiltersList: function (list) {
            var scope = this.getScope();
            var filters = scope.filters;
            filters.clear();
            helper.arrayWalk(list, function (node) {
                var item = {
                    className : '',
                    title: node.title,
                    desc: node.desc
                };
                filters.push(item);
            });
        },
        onFilterItemClick: function () {
            // cap
        },
        onSetFilters: function () {
            // show filter popup block
        },
        processContent: function (content) {
            var self = this;
            content.on('jrclick', function (ev) {
                self.contentCallClick(ev, self, fromContext);
            });
        }
    });

    var fromContext = {
        onPreItemClick: function (el, ev) {
            var pos = el.index();
            var scope = this.getScope();
            var filters = scope.filters;
            var item = filters[pos];
            if (item){
                this.onFilterItemClick(item);
            }
        }
    };

})(window.app);
