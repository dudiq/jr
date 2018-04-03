(function (app) {
    var componentsClasses = app('bb-co-classes');
    var logger = app('logger')('ast-parse-components');
    var componentInit = app('bb-init');

    app('ast-parse-components', {
        onChildrenTag: function (parent) {
            // this. - is current component
            var toPush = parent.nodes;
            toPush.pop(); // remove <children/> node
            var parentNode = this._parentNode;
            if (parentNode) {
                var insertNodes = parentNode.nodes;
                for (var i = 0, l = insertNodes.length; i < l; i++) {
                    toPush.push(insertNodes[i]);
                }
            }
        },
        onComponentParsed: function (parsedNode) {
            // this. - is root component, where parse processed
            var ret = parsedNode;
            var tagName = parsedNode.tag;
            var CmpClass = componentsClasses[tagName];
            if (!CmpClass) {
                logger.error('not defined class name: ', tagName);
            } else {
                logger.warn(parsedNode.tag);
                var inst = new CmpClass(this);

                this._cmpData.children.push(inst);

                componentInit(inst, parsedNode);
                ret = inst._tree;
                ret._isChild = true;
            }
            return ret;
        }
    });

})(window.app);
