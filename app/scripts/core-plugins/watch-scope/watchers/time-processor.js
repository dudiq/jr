(function(){
    var app = window.app;
    var watchScope = app('watch-scope');
    var base = watchScope('base');
    var inherit = app('helper').inherit;
    var timeProcessor = app('time-processor');

    // constructor
    function dateModClass(){

        dateModClass._parent.constructor.apply(this, arguments);
    }

    inherit(dateModClass, base);

    var p = dateModClass.prototype;

    // set value to DOM element
    p.setVal = function(val){
        if (this.subData){
            var subData = this.subData;
            var el = this.el;
            var formatted = timeProcessor.format(val, subData);
            el.html(formatted);
        }
    };

    watchScope('time-processor', dateModClass);

})();