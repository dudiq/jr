(function(){
    var app = window.app;
    var watchScope = app('watch-scope');
    var base = watchScope('base');
    var inherit = app('helper').inherit;

    // constructor
    function aHrefClass(){
        aHrefClass._parent.constructor.apply(this, arguments);
    }

    inherit(aHrefClass, base);

    var p = aHrefClass.prototype;

    // set value to DOM element
    p.setVal = function(val){
        this.el.prop('href', val);
    };

    watchScope('a-href', aHrefClass);

})();