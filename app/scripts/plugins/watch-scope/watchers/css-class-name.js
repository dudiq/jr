(function(){
    var app = window.app;
    var watchScope = app('watch-scope');
    var base = watchScope('base');
    var inherit = app('helper').inherit;

    // constructor
    function cssClassNameClass(){
        cssClassNameClass._parent.constructor.apply(this, arguments);
    }

    inherit(cssClassNameClass, base);

    var p = cssClassNameClass.prototype;

    // set value to DOM element
    p.setVal = function(val){
        var old = this._oldVal;
        var el = this.el;
        if (old){
            el.removeClass(old);
        }
        el.addClass(val);
        this._oldVal = val;
    };

    watchScope('css-class-name', cssClassNameClass);

})();