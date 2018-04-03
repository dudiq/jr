(function (app) {
    var attrRE = /([\w-]+)|=|(['"])([.\s\S]*?)\2/g;
    var attrsSet = /^['"]|['"]$/g;
    var voidElements = app('ast-void-elements');
    var translate = app('translate');
    var id = 1;

    var translateComponent = app('translate-component');

    app('ast-parse-tag', function (tag) {
        var i = 0;
        var key;
        id++;
        var expectingValueAfterEquals = true;
        var res = {
            id: id,
            type: 'tag',
            tag: '',
            attrs: {},
            tAttrs: {},
            el: null,
            nodes: []
        };

        tag.replace(attrRE, function (match) {
            if (match === '=') {
                expectingValueAfterEquals = true;
                i++;
                return;
            }

            if (!expectingValueAfterEquals) {
                if (key) {
                    res.attrs[key] = key; // boolean attribute
                }
                key = match;
            } else {
                if (i === 0) {
                    if (voidElements[match] || tag.charAt(tag.length - 2) === '/') {
                        res.voidElement = true;
                    }
                    res.tag = match;
                } else {
                    var attrVal = match.replace(attrsSet, '');
                    if (attrVal === 'false') {
                        attrVal = false;
                    } else if (attrVal === 'true') {
                        attrVal = true;
                    } else if (attrVal && (attrVal.indexOf('}}') == attrVal.length - 2)) {
                        // is lang
                        res.tAttrs[key] = attrVal;
                        attrVal = translate(attrVal);
                    }
                    res.attrs[key] = attrVal;
                    key = undefined;
                }
            }
            i++;
            expectingValueAfterEquals = false;
        });

        if (res.tag.indexOf('ui-') == 0){
            // ui component here
            res.type = 'component';
        } else {
            // :todo remove jq create el
            res.el = $(tag)[0];
            translateComponent.attrs(res);
        }

        return res;
    });

})(window.app);
