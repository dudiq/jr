(function(){
    var app = window.app;
    var watchScope = app('watch-scope');
    var base = watchScope('base');
    var inherit = app('helper').inherit;

    // constructor
    function dataAttrClass(){

        dataAttrClass._parent.constructor.apply(this, arguments);
    }

    inherit(dataAttrClass, base);

    var p = dataAttrClass.prototype;

    // set value to DOM element
    p.setVal = function(val){
        if (this.subData){
            var dataAttr = this.subData;
            var el = this.el;
            el.data(dataAttr, val);
        }
    };

    watchScope('data-attr', dataAttrClass);

})();