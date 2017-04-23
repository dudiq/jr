(function(){
    var app = window.app;
    var logger = app('logger')('gestures');

    var collection = {};

    app('gestures', function(name, newGes){
        if (newGes){
            // setter
            if (collection[name]){
                logger.error('gesture "' + name +'" already exists!');
            } else {
                collection[name] = newGes;
            }
        }
        return collection[name];
    });

})();
