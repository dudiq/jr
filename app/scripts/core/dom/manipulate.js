(function (app) {

    var dom = app('dom');
    var helper = app('helper');
    var elClass;

    function findClosestByClassName(el, className) {
        do {
            if (el && el.className !== undefined) {
                elClass = " " + el.className + " ";
                if (elClass.indexOf(className) != -1) {
                    return el;
                }
            }
        } while (el = el.parentNode);
    }

    function findClosestByEl(child, parent) {
        do {
            if (child && child === parent) {
                return child;
            }
        } while (child = child.parentNode);
    }

    function removeClass(el, map) {
        var prevState = el.className;
        var list = prevState.split(' ');

        for (var i = 0, l = list.length; i < l; i++) {
            var item = list[i].toLowerCase();
            if (map[item]) {
                // exist
                list.splice(i, 1);
                i--;
                l--;
            }
        }
        var nextState = list.join(' ');
        if (nextState != prevState) {
            el.className = nextState;
        }
        list = null;
    }

    dom.extend({
        closestByAttr: function (el, dataAttr) {
            do {
                if (el.hasAttribute && el.hasAttribute(dataAttr)) {
                    return el;
                }
            } while (el = el.parentNode);
        },
        closest: function (el, className) {
            var ret = null;
            if (typeof className == "string") {
                ret = findClosestByClassName(el, " " + className + " ");
            } else {
                ret = findClosestByEl(el, className);
            }
            return ret;
        },
        indexOf: function (el) {
            var children = el.parentElement.children;
            var ret = -1;
            for (var i = 0, l = children.length; i < l; i++) {
                if (children[i] == el){
                    ret = i;
                    break;
                }
            }
            return ret;
        },
        detach: function (el) {
            return el.parentElement.removeChild(el);
        },
        addClass: function (el, classes) {
            var prevState = el.className;
            var list = prevState.split(' ');
            var setClasses = classes.split(' ');
            var map = {};

            for (var i = 0, l = setClasses.length; i < l; i++){
                var item = setClasses[i];
                map[item.toLowerCase()] = item;
            }

            for (var i = 0, l = list.length; i < l; i++) {
                var item = list[i].toLowerCase();
                if (map[item]) {
                    // exist
                    map[item] = false;
                }
            }

            var toSet = list.join(' ');

            for (var key in map){
                map[key] && (toSet += ' ' + map[key]);
            }
            if (prevState != toSet) {
                el.className = toSet;
            }
            list = null;
            setClasses = null;
            map = null;
        },
        removeClass: function (el, classes) {
            var remClasses = classes.split(' ');
            var map = {};

            for (var i = 0, l = remClasses.length; i < l; i++){
                var item = remClasses[i];
                map[item.toLowerCase()] = item;
            }
            if (el.length !== undefined) {
                el.length && helper.arrayWalk(el, function (item) {
                    removeClass(item, map);
                });
            } else {
                removeClass(el, map);
            }
            remClasses = null;
            map = null;
        },
        find: function (el, css) {
            return el.querySelectorAll(css);
        },
        hasClass: function (el, className) {
            var ret = false;
            className = className.toLowerCase();
            var list = (el.className).toLowerCase().split(' ');
            if (list.indexOf(className) != -1) {
                ret = true;
            }
            return ret;
        }
    });

})(app);
