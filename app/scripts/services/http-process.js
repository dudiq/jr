/*
 * http request process responce from server
 *
 * for what this?
 *
 * this is for correctly processing server response
 *
 * */
(function(){
    var app = window.app;
    var http = app('http');
    var logger = app('errors').getLogger('http-response');

    function onDone(respObj, servObj){
        if (servObj){
            respObj.code = servObj.code;
            respObj.message = servObj.message;
            respObj.time = servObj.time;
            if (respObj.code != 0){
                //error from server
                onFail(respObj, servObj, respObj.code);
            } else {
                respObj.response = servObj.response;
            }
        } else {
            onFail(respObj, servObj, 1001);
        }
    }

    function onFail(respObj, servObj, code){
        respObj.code = code;
        respObj.response = servObj;
        respObj.error = true;
    }

    function processDataResponse(returnData, data, xhr){
        // what is returnData object for other parts of system ?
        if (!returnData){
            returnData = {
                code: null, //returned server code
                error: false,
                message: null, // default to error the message is set below
                response: null, //returned server response

                time: null //time for sync maybe?
            };
        }

        // Set message
        if (xhr && xhr.status !== undefined && xhr.statusText !== undefined) {
            returnData.message = http.getMessage(xhr.status, xhr.statusText);
        }

        if (data){
            if (typeof data == "string") {
                //processing string
                try {
                    var parsed = JSON.parse(data);
                    onDone(returnData, parsed);
                } catch(e){
                    logger.error('httpResponse-plugin', e);
                    onFail(returnData, data, 1000);
                }
            } else {
                if (data && data.response){
                    // return as is;
                    onDone(returnData, data);
                } else {
                    // return as predefined object
                    onDone(returnData, {
                        error: false,
                        code: 0,
                        time: null,
                        message: "OK",
                        response: data
                    });
                }
            }
        } else {
            //all is wrong and bad....
            returnData.error = true;
            try {
                if (xhr){
                    var parsed = JSON.parse(xhr.responseText);
                    returnData.response = parsed;
                    if (parsed){
                        if (parsed.message){
                            returnData.message = http.getMessage(xhr.status, parsed.message);
                        }
                        if (parsed.hasOwnProperty('code')){
                            returnData.code = parsed.code;
                        }
                    } else {
                        onFail(returnData, parsed, 1001);
                    }
                } else {
                    onFail(returnData, data, 1002);
                }
            } catch(e){
                onFail(returnData, data, 1000);
            }
        }


        if (returnData.error){
            if (xhr && xhr.status == 0 && returnData.response === null){
                // if server is down
                returnData.message = http.getMessage('0', '{{system.noServerConnection}}');
            }
        }

        return returnData;
    }

    http.setProcess(processDataResponse);

    // for process any other requests from server (websockets, etc...)
    app('process-data-response', processDataResponse);
})();