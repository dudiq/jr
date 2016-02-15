(function(){
    var app = window.app;
    var templater = app('templater');
    var objectTemplate = app('object-template', {});


    function createReplaceData(item){
        var rep = {};

        for (var key in item){
            var newKey = "{{" + key + "}}";
            rep[newKey] = item[key];
        }
        return rep;
    }


    objectTemplate.parse = function(id, arr){
        var buff = "";
        if (arr.length){
            for (var i = 0, l = arr.length; i < l; i++){
                var obj = arr[i];
                var tpl = templater.get(id, createReplaceData(obj));
                buff += templater.translate(tpl) + '\n';
            }
        }
        return buff;
    };

})();