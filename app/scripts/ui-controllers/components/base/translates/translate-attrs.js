(function (app) {
    var translate = app('translate');

    function translateAttrs(tree) {
        var el = tree.el;
        var attrs = tree.attrs;
        var tAttrs = tree.tAttrs;
        for (var key in tAttrs){
            el.setAttribute(key, attrs[key]);
        }
    }

    function translateNode(node) {
        translateAttrs(node);
        var nodes = node.nodes;
        if (nodes) {
            for (var i = 0, l = nodes.length; i < l; i++) {
                translateNode(nodes[i]);
            }
        }
        if (node.type == 'lang') {
            var text = translate(node.content);
            var el = node.el;
            if (el.hasOwnProperty('innerHTML')) {
                el.innerHTML = text;
            } else {
                el.nodeValue = text;
            }
            // debugger;
        }
    }

    app('translate-component', {
        attrs: translateAttrs,
        node: translateNode
    });

})(window.app);
