/*
* HTTP httpMod module
*
* */
(function(){
    var app = window.app;

    //httpMod plugin
    var httpMod = app('http', {});

    var suspend = app('suspend');
    var config = app('config');

    var timeout = 1000 * 40;

    var useContentLengthHeader = (config.useContentLengthHeader === undefined) ? true : config.useContentLengthHeader;

    // Send simple request to any url
    // params can be view in http://api.jquery.com/jQuery.ajax/
    //

    // getting message TEXT for give it to user
    function getMessage(code, text){
        var ret = text;
        if (code !== undefined && code !== null){
            ret += ' (' + code + ')';
        }
        return ret;
    }

    // processing data when responce was given. fail or done - nevermind
    // this is processing all data
    var processDataResponse = function (returnData, data, xhr){
        var parsed;
        if (data){
            if (typeof data == "string") {
                //processing string
                try {
                    parsed = JSON.parse(data);
                    returnData.response = parsed;
                } catch(e){
                    returnData.message = "{{system.errorHttpParse}}";
                    returnData.response = data;
                    returnData.error = true;
                }
            } else {
                // return as is, json, array or other
                returnData.response = data;
            }
        } else {
            //all is wrong and bad....
            returnData.error = true;
            try {
                parsed = JSON.parse(xhr.responseText);
                if (parsed && parsed.description){
                    returnData.message = getMessage(xhr.status, parsed.description);
                }
//                if (parsed.hasOwnProperty('code')){
//                    returnData.code = parsed.code;
//                }
                returnData.response = parsed;
            } catch(e){
                returnData.response = data;
            }
        }
    };

    // define response from server and call callback
    function onResponse(context, def, data, clientError, xhr, returnRaw){
        var returnData = {
            clientCode: null,
            //code: null, //returned server code
            error: clientError,
            message: null, // default to error the message is set below
            response: null //returned server response
            //time: null //time for sync
        };

        // Set message
        if (xhr && xhr.status !== undefined && xhr.statusText !== undefined) {
            returnData.message = getMessage(xhr.status, xhr.statusText);
        }

        returnData.clientCode = xhr.status;

        if (returnRaw){
            returnData.response = data;
        } else {
            processDataResponse.call(context, returnData, data, xhr);
        }

        var args = [returnData, xhr];

        def && (returnData.error ? def.reject.apply(def, args) : def.resolve.apply(def, args));
    }

    // set correct args by arguments
    function processArgs(url, params, callback){
        var path;
        var sendParams;
        if (typeof url == "object") {
            path = url.url;
            sendParams = url;
        } else {
            path = url;
            sendParams = params;
        }

        sendParams = sendParams || {};
        return callback(path, sendParams);
    }

    function onProgressProcessing(evt, total, onProgress){
        var loaded = 0;
        if (evt.loaded !== undefined) {
            loaded = evt.loaded;
        } else if (evt.position !== undefined){
            loaded++;
        }
        onProgress && onProgress(total, loaded);
    }

    function prepareProgress(onProgress){
        return function(){
            var xhr = new window.XMLHttpRequest();
            var total = 0;
            var started = false;
            function setTotal(evt){
                if (!started){
                    started = true;
                    if (evt.lengthComputable) {
                        total = evt.total;
                    } else if (useContentLengthHeader) {
                        try {
                            var len = xhr.getResponseHeader('Content-Length') - 0;
                            if (!isNaN(len)) {
                                total = len;
                            }
                        } catch (e) {
                        }
                    }
                }
            }

            // set upload progress
            xhr.upload && xhr.upload.addEventListener("progress", function(evt) {
                setTotal(evt);
                onProgressProcessing(evt, total, onProgress);
            }, false);

            // set download progress
            xhr.addEventListener("progress", function(evt) {
                setTotal(evt);
                onProgressProcessing(evt, total, onProgress);
            }, false);
            return xhr;
        };
    }


    // send request, it's just a jQuery request
    httpMod.send = function(url, paramsArg){
        //strange logic of js. can't rewrite argument, if it undefined, that's why using 'paramsArg'
        var params = paramsArg || {};
        if (typeof url == "object"){
            params = url;
        }
        (typeof url == "string") && (params.url = url);

        var def = suspend();

        var resendCounter = params.resend;

        var returnRaw = (params.returnRaw === true);

        var definedXhr = params.xhr || prepareProgress(function(total, loaded){
                def.progressing(total, loaded);
            });

        var ajaxSetup = {
            url: params.url,
            async: params.async,
            headers: params.headers,
            beforeSend: params.beforeSend,
            processData: params.processData,
            contentType: params.contentType,
            crossDomain: params.crossDomain,
            data: params.data,
            dataType: params.dataType || "html",
            type: params.type || "POST",
            xhr: definedXhr,
            cache: params.cache,
            timeout: params.timeout || timeout
        };

        var processOnResponse = true; //if calling MANUAL .abort() for http def httpMod, don't call .fail or .done

        // if params.resend defined, need more than one request to send
        function getAjax(){
            return $.ajax(ajaxSetup)
                .done(function(data, textStatus, XMLHttpRequest){
                    processOnResponse && onResponse(this, def, data, false, XMLHttpRequest, returnRaw);
                    params = null;
                })
                .fail(function(XMLHttpRequest, textStatus, errorThrown) {
                    if (resendCounter && resendCounter > 0){
                        resendCounter--;
                        params.request = getAjax();
                    } else {
                        processOnResponse && onResponse(this, def, null, true, XMLHttpRequest, returnRaw);
                        params = null;
                    }
                });
        }

        params.request = getAjax();

        // WARNING!!!
        //
        //    processing stop request, NOT abort!
        //    abort and stop - it's different operations
        //    if request was .abort(), it will generate onFail() process,
        //    but if was .stop(), it will NOT generate any fail or always callback
        //    and drop all any other def callbacks
        //
        // BE CAREFULL
        def.aborted(function(){
            resendCounter = 0;
            params && params.request.abort();
            params = null;
        });

        def.stopped(function(){
            processOnResponse = false;
            resendCounter = 0;
            params && params.request.abort();
            params = null;
        });
        return def;
    };

    // processing get request
    httpMod.get = function(url, params){
        return processArgs(url, params, function(pUrl, pParams){
            pParams.type = "GET";
            return httpMod.send(pUrl, pParams);
        });
    };

    // processing post request
    httpMod.post = function(url, data, params){
        params = params || {};
        params.type = "POST";
        params.contentType = (params.contentType === undefined) ? "application/json; charset=UTF-8" : params.contentType;
        params.processData = (params.processData !== undefined) ? params.processData : false;
        params.data = (params.stringify !== false) ? JSON.stringify(data) : data;
        return httpMod.send(url, params);
    };

    // define own process for data, when response come in
    httpMod.setProcess = function(callback){
        processDataResponse = callback;
    };

    httpMod.getMessage = getMessage;

})();
