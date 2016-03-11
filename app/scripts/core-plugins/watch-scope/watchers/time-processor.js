(function(){
    var app = window.app;
    var timeProcessor = app('time-processor');

    app('watch-scope')('time-processor', {
        setVal: function(val){
            if (this.subData){
                var subData = this.subData;
                var el = this.el;
                var formatted = timeProcessor.format(val, subData);
                el.html(formatted);
            }
        }
    });

})();