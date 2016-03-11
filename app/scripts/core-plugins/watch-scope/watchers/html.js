(function(){
    var app = window.app;

    app('watch-scope')('html', {
        setVal: function(val){
            this.el.html(val);
        }
    });

})();