(function (app) {

    app('bb-co')('ui-input', {
        tpl: 'scripts/ui-controllers/components/ui-controls/fields/ui-input',
        init: function () {
            this._input = null;
            this._oldValue = '';
        },
        getReplaced: function (params) {
            return {
                'name="{{_name}}"': params.name && ('name="' + params.name + '"') || '',
                'maxlength="{{_maxLength}}"': (params.hasOwnProperty('maxLength')) && ('maxlength="' + params.maxLength + '"') || '',
                '{{_inputType}}': params.type || 'text',
                'placeholder="{{_inputPlaceholder}}"': params.placeholder && ('placeholder="' + params.placeholder + '"') || '',
                '{{_useIcon}}' : params.icon ? 'is-using-icon' : '',
                '{{_inputIcon}}': params.icon || 'helper-hide',
                'value="{{_value}}"' : params.hasOwnProperty('value') && ('value="' + params.value + '"') || ''
            };
        },
        onDefaultState: function () {
            // drop input value
            this._input.val('');
            this._oldValue = '';
        },
        onEnterPressed: function () {
            this._input.blur();
            this._focusHolder.focus();
            _onChanged.call(this);
        },
        onChanged: function (oldVal, newVal) {
            // cap
        },
        getValue: function () {
            return this._input.val();
        },
        setValue: function (val) {
            this._input.val(val);
            this._oldValue = this._input.val();
        },
        processContent: function (content) {
            var self = this;
            var input = this._input = content.find('input').eq(0);
            this._focusHolder = content.find('.ui-input-holder');
            var name = content.attr('name');
            if (name) {
                content.removeAttr('name');
                input.attr('name', name);
            }
            input.on('keypress keydown', function (ev) {
                var keycode = (ev.keyCode ? ev.keyCode : ev.which);
                if (keycode == 13 || keycode == 9){
                    self.onEnterPressed();
                }
            });
            input.on('blur', function () {
                _onChanged.call(self);
            });
        }
    });

    function _onChanged() {
        var newVal = this._input.val();
        var oldVal = this._oldValue;
        if (oldVal !== newVal){
            this._oldValue = newVal;
            this.onChanged(oldVal, newVal);
        }
    }

})(window.app);
