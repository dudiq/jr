(function(){
    var app = window.app;
    app('watch-scope')('data-attr', {
        setVal: function(val){
            if (this.subData){
                var dataAttr = this.subData;
                var el = this.el;
                el.data(dataAttr, val);
            }
        }
    });

})();