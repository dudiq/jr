(function(){
    var app = window.app;

    app('watch-scope')('a-href', {
        setVal: function(val){
            this.el.prop('href', val);
        }
    });

})();