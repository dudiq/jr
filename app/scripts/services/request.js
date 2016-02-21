/*
* example of requester. wrapper of http module for own server
*
* */
(function(){
    var app = window.app;
    var http = app('http');
    var config = app('app-config');
    var notify = app('notify');
    var services = app('services');

    var request = services('request', {});

    // module for return message by server code
    function servCodes(code){
        return 'text';
    }

    var requestTimeout = 120 * 1000; //80 seconds


    function getHeaders(){
        var ret = {};
        return ret;
    }

    function getParams(sParams){
        var params = {
            headers: getHeaders(),
            timeout: requestTimeout
        };
        if (sParams){
            for (var key in sParams){
                params[key] = sParams[key];
            }
        }
        return params;
    }

    function pinSuspends(def){
        def
            .progress(function(total, loaded){
                // show some progress indication
            })
            .stopped(function(){
                // show some progress indication stop
            })
            .always(function(){
                // show some progress indication stop
            })
            .fail(function(resp){
                // do process code server to user friendly text
                var msg = servCodes(resp.code);
                resp.code && notify.info(msg);
            });
    }

    request.post = function(path, data, params){
        params = getParams(params);
        var def = http.post(path, data, params);
        pinSuspends(def);
        return def;
    };

    request.get = function(path, params){
        params = getParams(params);
        (params.cache === undefined) && (params.cache = false);
        var def = http.get(path, params);
        pinSuspends(def);
        return def;
    };

    request.put = function(path, data, params){
        params = getParams(params);
        (params.url === undefined) && (params.url = path);
        (params.contentType === undefined) && (params.contentType = 'application/json; charset=UTF-8');
        (params.data === undefined) && (params.data = JSON.stringify(data));
        (params.type === undefined) && (params.type = "PUT");

        return http.send(params);
    };

    request.remove = function(path, params){
        params = getParams(params);
        (params.url === undefined) && (params.url = path);
        (params.type === undefined) && (params.type = "DELETE");
        return http.send(params);
    };


})();