(function(){
    var app = window.app;
    app('watch-scope')('bg-img', {
        setVal: function(val){
            if (val && val.indexOf('url') == -1){
                val = 'url(' + val + ')';
            }
            this.el.css('background-image', val);
        }
    });

})();