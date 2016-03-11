(function(){
    var app = window.app;

    app('watch-scope')('bg-color', {
        setVal: function(val){
            this.el.css('background-color', val);
        }
    });

})();