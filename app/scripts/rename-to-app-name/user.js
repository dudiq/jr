(function(){
    var app = window.app;
    var ls = app('local-storage');
    var userMod = app('user', {});

    var userData = ls('user');

    userMod.setUser = function(user){
        userData = user;
        ls('user', user);
    };

    userMod.getToken = function(){
        var ret;
        if (userData && userData.token){
            ret = userData.token;
        }
        return ret;
    };

    userMod.removeUser = function(){
        ls.remove('user');
        userData = null;
    };

    userMod.isLoggedIn = function(){
        var ret = false;
        var token = this.getToken();
        if (token){
            ret = true;
        }
        return ret;

    };

})();