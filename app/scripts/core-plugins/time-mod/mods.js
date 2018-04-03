(function (app) {
    var tp = app('time-processor');
    var registerFormer = tp.registerFormer;
    var setDecInt = tp.setDecInt;
    var translateWord = tp.translateWord;

    function toStr(num) {
        return num + '';
    }

    registerFormer('h', function(date){
        var ret = date.getHours();
        return toStr(ret);
    });

    registerFormer('hh', function(date){
        var ret = date.getHours();
        ret = setDecInt(ret);
        return toStr(ret);
    });

    registerFormer('m', function(date){
        var ret = date.getMinutes();
        ret = setDecInt(ret);
        return toStr(ret);
    });

    registerFormer('s', function(date){
        var ret = date.getSeconds();
        ret = setDecInt(ret);
        return toStr(ret);
    });

    registerFormer('yy', function(date){
        var ret = date.getFullYear() + "";
        ret = ret.substring(2);
        return toStr(ret);
    });

    registerFormer('yyyy', function(date){
        var ret = date.getFullYear();
        return toStr(ret);
    });

    registerFormer('sm', function(date){
        var ret = date.getMonth();
        var rets = translateWord("short-month." + ret);
        return toStr(rets);
    });

    registerFormer('dofweek', function(date){
        var ret = date.getDay();
        var rets = translateWord("week." + ret);
        return toStr(rets);
    });

    registerFormer('sweek', function(date){
        var ret = date.getDay();
        var rets = translateWord("short-week." + ret);
        return toStr(rets);
    });

    registerFormer('mfull', function(date){
        var ret = date.getMonth();
        var rets = translateWord("month-f." + ret);
        return toStr(rets);
    });

    registerFormer('tm', function(date){
        var ret = date.getMonth();
        var rets = translateWord("month." + ret);
        return toStr(rets);
    });

    registerFormer('mm', function(date){
        var ret = date.getMonth() + 1;
        ret = setDecInt(ret);
        return toStr(ret);
    });

    registerFormer('dd', function(date){
        var ret = date.getDate();
        ret = setDecInt(ret);
        return toStr(ret);
    });
})(window.app);
