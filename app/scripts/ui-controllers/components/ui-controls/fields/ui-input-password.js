(function (app) {

    var UiInputPasswordClass = app('bb-co')('ui-input-password', 'ui-input', {
        getReplaced: function (params) {
            var ret = UiInputPasswordClass._parent.getReplaced.call(this, params);
            ret.id = 'pwd';
            ret.icon = 'x-icon-pwd';
            ret.type = 'password';
            ret.name = 'password';
            ret.maxLength = 200;
            return ret;
        }
    });

})(window.app);
