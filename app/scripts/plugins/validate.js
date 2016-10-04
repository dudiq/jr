(function(){
    var app = window.app;

    var emailReg = new RegExp('[\\w\\.+]{1,}[@][\\w\\-]{1,}([.]([\\w\\-]{1,})){1,5}$', 'ig');

    var validate = {};

    var selectors = '.check-validate:visible';
    var errorClass = 'validation-error';
    var passwordClass = 'validate-pwd';
    var passwordSelectors = '.' + passwordClass + ':visible';

    var PWD_MIN_LENGTH = 3;

    validate.testEmail = function(val){
        emailReg.lastIndex = 0;
        var ret = emailReg.test(val);
        return ret;
    };

    function validateItem($this){
        var res = true;
        var value = $this.val();
        var type = $this.attr('type');
        var minLen = $this.attr('min-length');
        var trimValue = value.trim();

        if (minLen){
            res = (trimValue.length < minLen);
        }

        switch (type){
            case "email":
                res = validate.testEmail(value);
                break;
            case "password":
                res = (trimValue.length > PWD_MIN_LENGTH);
                break;
        }

        return res;
    }

    function processError($this, isValid){
        var parent = $this.parent();

        isValid ?
            parent.removeClass(errorClass) :
            parent.addClass(errorClass);
    }

    function processPasswords(fields){
        var firstValue = $(fields[0]).val();
        var isValid = true;

        $.each(fields, function(index, el){
            var $el = $(el);
            var value = $el.val();
            var trimValue = value.trim();
            var isValid = (trimValue !== '') && (value === firstValue) && (trimValue.length > PWD_MIN_LENGTH);
            processError($el, isValid);
        });

        return isValid;
    }

    validate.isValid = function(content){
        var res = true;
        var fields = content.find(passwordSelectors);
        content.find(selectors).each(function(index, el){
            var $el = $(el);
            var isValid = validateItem($el);
            var isPassword = $el.hasClass(passwordClass);

            if (isPassword) {
                isValid = processPasswords(fields);
            } else if (!isValid) {
                processError($el, isValid);
            }

            if (res) {
                res = isValid;
            }

        });

        return res;
    };

    validate.bindContent = function(content){
        var fields = content.find(passwordSelectors);
        content.on('focusout keyup', selectors, function(){
            var el = $(this);
            var isValid = validateItem(el);
            var isPassword = el.hasClass(passwordClass);
            processError(el, isValid);

            if (isPassword) {
                processPasswords(fields);
            }
        });
    };

    app('validate', validate);

})();
