(function(){
    var app = window.app;
    var translate = app('translate');

    app('watch-scope')('translate', {
        setVal: function(val){
            var el = this.el;
            var formatted = val ? translate(val) : '';
            el.html(formatted);
        }
    });

})();
