(function(){
    var app = window.app;
    app('watch-scope')('css-class-name', {
        setVal: function(val){
            var setVal = val;
            var subData = this.subData;
            if (subData){
                setVal = subData + val;
            }
            var old = this._oldVal;
            var el = this.el;
            if (old){
                el.removeClass(old);
            }
            el.addClass(setVal);
            this._oldVal = setVal;
        }
    });

})();
