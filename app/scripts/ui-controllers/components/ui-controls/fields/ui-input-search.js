(function (app) {

    var UiInputSearchClass = app('bb-co')('ui-input-search', 'ui-input', {
        getReplaced: function (params) {
            var ret = UiInputSearchClass._parent.getReplaced.call(this, params);
            ret.placeholder = '{{searchPlaceholder}}';
            ret.icon = 'x-icon-search';
            return ret;
        }
    });

})(window.app);
