(function (app) {

    var UiInputEmailClass = app('bb-co')('ui-input-email', 'ui-input', {
        getReplaced: function (params) {
            var ret = UiInputEmailClass._parent.getReplaced.call(this, params);
            ret.icon = 'x-icon-email';
            ret.type = 'email';
            ret.name = 'email';
            ret.maxLength = 400;
            return ret;
        }
    });

})(window.app);
