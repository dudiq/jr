(function(){
    var app = window.app;
    var watchScope = app('watch-scope');
    var base = watchScope('base');
    var inherit = app('helper').inherit;

    // constructor
    function bgColorClass(){
        bgColorClass._parent.constructor.apply(this, arguments);
    }

    inherit(bgColorClass, base);

    var p = bgColorClass.prototype;

    // set value to DOM element
    p.setVal = function(val){
        this.el.css('background-color', val);
    };

    watchScope('bg-color', bgColorClass);

})();