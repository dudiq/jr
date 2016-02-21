(function(){
    var app = window.app;
    var watchScope = app('watch-scope');
    var base = watchScope('base');
    var inherit = app('helper').inherit;

    // constructor
    function bgImgClass(){
        bgImgClass._parent.constructor.apply(this, arguments);
    }

    inherit(bgImgClass, base);

    var p = bgImgClass.prototype;

    // set value to DOM element
    p.setVal = function(val){
        if (val && val.indexOf('url') == -1){
            val = 'url(' + val + ')';
        }
        this.el.css('background-image', val);
    };

    watchScope('bg-img', bgImgClass);

})();