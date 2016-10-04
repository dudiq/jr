(function(){
    var app = window.app;

    var C_SELECTORS = 'input, select, textarea';

    var dataSerialize = app('data-serialize', function(content, map){
        var res;
        if (map === undefined){
            // getter
            res = {};

            content.find(C_SELECTORS).each(function(index, el){
                var $el = $(el);
                var name = $el.attr('name') || $el.data('name');

                if (name && !(name in res)) {
                    res[name] = getValue($el, content);
                }
            });
        } else {
            //setter
            content.find(C_SELECTORS).each(function(index, el){
                var $el = $(el);
                var name = $el.attr('name') || $el.data('name');

                if (name && (!map || map.hasOwnProperty(name))) {
                    // for map == null, drop all values
                    var val = map ? map[name] : '';
                    setValue($el, val);
                }
            });
        }
        return res;
    });

    function setValue($el, val) {
        if ($el.is('input[type=checkbox],input[type=radio]')) {
            val = (val === '') ? false : val;
            $el.prop('checked', val);
        } else if ($el.is('textarea')) {
            $el.text(val);
        } else {
            $el.val(val);
        }
    }

    function getValue($el, content){
        var val = $el.val();

        if ($el.is('input[type=checkbox]')) {
            val = $el.prop('checked');
        } else if ($el.is('textarea')) {
            val = $el.text();
        } else if ($el.is('input[type=radio]')) {
            var name = $el.attr('name');
            var selector = 'input[name=' + name + ']:checked';
            var input = content.find(selector);
            val = input.val();
        }

        (val == 'null') && (val = null);
        (val == 'true') && (val = true);
        (val == 'false') && (val = false);

        return val;
    }

})();
