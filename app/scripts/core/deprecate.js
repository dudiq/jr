(function(){
    var app = window.app;
    var logger;
    var collection = {};
    app('deprecate', function(id, msg){
        if (!logger){
            logger = app('logger')('deprecate');
        }
        msg = msg || '';
        if (collection[id] !== undefined){
            // do nothing
        } else {
            // register and show warning
            collection[id] = msg;
            var newMsg = '"' + id + '" is deprecated; ' + msg;
            logger.warn(newMsg);
        }
    });
})();