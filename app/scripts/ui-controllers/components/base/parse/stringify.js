(function (app) {

    function attrString(attrs) {
        var buff = [];
        for (var key in attrs) {
            buff.push(key + '="' + attrs[key] + '"');
        }
        if (!buff.length) {
            return '';
        }
        return ' ' + buff.join(' ');
    }

    function stringify(buff, doc) {
        switch (doc.type) {
            case 'text':
                return buff + doc.content;
            case 'tag':
                buff += '<' + doc.tag + (doc.attrs ? attrString(doc.attrs) : '') + (doc.voidElement ? '/>' : '>');
                if (doc.voidElement) {
                    return buff;
                }
                return buff + doc.nodes.reduce(stringify, '') + '</' + doc.tag + '>';
        }
    }

    app('ast-stringify', function (doc) {
        return doc.reduce(function (token, rootEl) {
            return token + stringify('', rootEl);
        }, '');
    });

})(window.app);
