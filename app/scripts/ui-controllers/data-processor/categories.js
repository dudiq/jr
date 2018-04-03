(function (app) {
    var helper = app('helper');
    var confirmPlugin = app('confirm');
    var translate = app('translate');
    var collCategory = app('coll-category');

    function addCat(pId) {
        var msg = translate('categories.add');
        confirmPlugin.prompt(msg, '', function (val) {
            if (val) {
                var data = {
                    id: helper.mongoId(),
                    title: val
                };
                if (pId) {
                    data.catId = pId;
                }
                collCategory.pushCategory(data)
                    .catch(function () {
                        // end animate
                    })
                    .then(function () {
                        // end animate
                    });
            }
        });

    }

    app('data-processor')({
        'category.add': function () {
            addCat.call(this);
        },
        'category.addSub': function () {
            var pId = this.getCurrentId();
            addCat.call(this, pId);
        }
    });

})(app);
