(function(){
    var app = window.app;
    var timeProcessor = app('time-processor');

    app('watch-scope')('time-offset', {
        setVal: function(val){
            if (this.subData){
                var subData = this.subData;
                var el = this.el;
                var newDate = new Date(val);
                var formatted = '';
                if (newDate.getTime && !isNaN(newDate.getTime())){
                    var offsetMs = newDate.getTimezoneOffset() * 60 * 1000;

                    var time = newDate.getTime() + offsetMs;

                    formatted = timeProcessor.format(time, subData);
                }
                el.html(formatted);
            }
        }
    });

})();