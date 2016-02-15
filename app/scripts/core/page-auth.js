/*
* check access only to page view
* */

(function(){
    var app = window.app;
    var pages = app('pages');
    var logger = app('errors').getLogger('page-auth');
    var rules = true;

    function checkAuth(pageId){
        var res;

        var pageInst = pages(pageId);

        if (rules === true){
            // after check defined access
            res = true;
        } else if (rules === false) {
            // after check defined access
            res = false;
        }

        if (res !== false && rules && rules[pageId]) {
            // then check global access
            var item = rules[pageId];
            res = (typeof item == "function") ? item(pageId) : item;
        }

        if (res !== false && pageInst && typeof pageInst.hasAccess == "function") {
            // check page rules
            var pRes = pageInst.hasAccess();
            if (pRes !== undefined){
                res = pRes;
            }
        }

        if (res === undefined){
            res = false;
        }

        return res;
    }

    app('page-auth', checkAuth);

    //define rules in one moment and drop it
    checkAuth.set = function(newRules){
        (newRules !== undefined) && (rules = newRules);
        checkAuth.set = function(){
            logger.warning('trying to define rules again? not correct work of your APP. set() can be run ONCE.');
        };
    };

    checkAuth.addRule = function(newRule){
        for (var key in newRule){
            if (!rules[key]){
                rules[key] = newRule[key];
            } else {
                logger.warning('trying to redefine rules? rule is already exist. do NOT try to define rule again');
            }
        }
    };
})();