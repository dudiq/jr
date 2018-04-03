(function (app) {
    var route = app('route');
    var logger = app('logger')('user-route');

    var currUser = null;

    route.addMainField('user', {
        index: 1,
        onSet: function (val) {
            logger.log('onSet', val, currUser);
            currUser = val;
        },
        onChanged: function (val) {
            logger.log('onChanged', val, currUser);
            if (app('my-app').isLoggedIn()){
                logger.warn('user changed! reloading!');
                setTimeout(function () {
                    window.location.reload();
                }, 500);
            }
        },
        onRemoved: function () {
            logger.log('onRemoved', currUser);
            var pageVal = route.getFieldValueByIndex(0);
            if (pageVal != currUser){
                currUser = null;
            }
        }
    });

    currUser = route.getFieldValueByIndex(1);

})(window.app);
