(function(){
    //todo, change to validate not dom elements, but just array of elements

    //find and check valid data from required inputs only

    var app = window.app;
    var helper = app('helper');

    var emailReg = new RegExp('[\\w\\.+]{1,}[@][\\w\\-]{1,}([.]([\\w\\-]{1,})){1,5}$', 'ig');

    app('validate', validate);

    function validate(objects, onRemove){
        var ret = {};
        ret.passed = {};
        ret.notPassed = {};

        for (var key in objects){
            var item = objects[key];
            if (!item){
                continue;
            }
            if (!helper.isArray(item)){
                item = [item];
            }
            for (var i = 0, l = item.length; i < l; i++){
                var el = item[i];
                el && processItem(ret, key, el, onRemove);
            }
        }

        return ret;
    }

    validate.testEmail = function(val){
        emailReg.lastIndex = 0;
        var ret = emailReg.test(val);
        return ret;
    };

    function processItem(ret, key, item, onRemove){
        var res = true;
        var val = item.val();
        switch (key){
            case "email":
                res = validate.testEmail(val);
                break;
            case "name":
                res = (val.trim() != "");
                break;
            case "password":
                res = ((val.trim()).length > 5);
                break;
            default:
                res = (val.trim() != "");
                break;
        }

        ret.passed && (ret.passed[key] = val);
        if (!res) {
            ret.passed = false;
            (ret.notPassed[key] = item);
            (function(el){
                el.parent().addClass('jr-dirty');
                el.on('touchstart.jrdirty mousedown.jrdirty cut.jrdirty paste.jrdirty keydown.jrdirty keyup.jrdirty change.jrdirty', function(){
                    el.off('.jrdirty');
                    el.parent().removeClass('jr-dirty');
                    onRemove();
                });
            })(item);
        }

    }

})();