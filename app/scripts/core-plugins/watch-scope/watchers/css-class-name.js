(function(){
    var app = window.app;
    app('watch-scope')('css-class-name', {
        setVal: function(val){
            var old = this._oldVal;
            var el = this.el;
            if (old){
                el.removeClass(old);
            }
            el.addClass(val);
            this._oldVal = val;
        }
    });

})();