(function () {

    window.app('dom').extend({
        on: function (elem, type, handler) {
            if (elem.addEventListener) {
                elem.addEventListener(type, handler, false);
            } else {
                elem.attachEvent('on' + type, handler);
            }
        },
        off: function (elem, type, handler) {
            if (elem.removeEventListener) {
                elem.removeEventListener(type, handler, false);
            } else {
                elem.detachEvent('on' + type, handler);
            }
        }
    });

})();
