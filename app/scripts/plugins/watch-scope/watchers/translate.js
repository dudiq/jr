(function(){
    var app = window.app;
    var watchScope = app('watch-scope');
    var base = watchScope('base');
    var inherit = app('helper').inherit;
    var translate = app('translate');

    // constructor
    function dateModClass(){

        dateModClass._parent.constructor.apply(this, arguments);
    }

    inherit(dateModClass, base);

    var p = dateModClass.prototype;

    // set value to DOM element
    p.setVal = function(val){
        var el = this.el;
        var formatted = val ? translate.getTranslate(val) : '';
        el.html(formatted);
    };

    watchScope('translate', dateModClass);

})();