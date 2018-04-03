(function(){
    var app = window.app;
    var timeProcessor = app('time-processor');

    app('watch-scope')('wday', {
        setVal: function(val){
            var todayStart = timeProcessor.getDayStart();
            if (val > todayStart){
                this.el.addClass('wd-end-day');
            } else {
                this.el.removeClass('wd-end-day');
            }
        }
    });

})();
