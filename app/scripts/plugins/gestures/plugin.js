(function(){
    var app = window.app;
    var errors = app('errors');

    var collection = {};

    app('gestures', function(name, newGes){
        if (newGes){
            // setter
            if (collection[name]){
                errors.error('gestures', 'gesture "' + name +'" already exists!');
            } else {
                collection[name] = newGes;
            }
        }
        return collection[name];
    });

})();