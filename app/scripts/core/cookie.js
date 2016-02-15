/**
 *  Cookie module for store, getting and setting data
 *  https://developer.mozilla.org/en-US/docs/Web/API/document.cookie
 *
 * */
(function(){
    var app = window.app;
    var cookie = app('cookie', {});
    var errors = app('errors');


    // Getting item by options and parse them
    function getItem(sKey, options) {
        options = options || {};
        var val = decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" +
            encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;

        if (val && options.json) {
            try{
                val = JSON.parse(val);
            } catch(e){
                errors.error('cookie','cant\' parse cookie item');
            }
        }
        return val;
    }

    // set imte by options
    function setItem(sKey, sValue, options) {
        options = options || {};
        var vEnd = options.expires;
        var sPath = options.path;
        var sDomain = options.domain;
        var bSecure = options.secure;
        if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
        var sExpires = "";
        if (vEnd) {
            switch (vEnd.constructor) {
                case Number:
                    sExpires = (vEnd === Infinity) ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
                    break;
                case String:
                    sExpires = "; expires=" + vEnd;
                    break;
                case Date:
                    sExpires = "; expires=" + vEnd.toUTCString();
                    break;
            }
        }

        (options.json) &&(sValue = JSON.stringify(sValue));
        document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) +
            sExpires +
            (sDomain ? "; domain=" + sDomain : "") +
            (sPath ? "; path=" + sPath : "") +
            (bSecure ? "; secure" : "");
        return true;
    }

    // just remove
    function removeItem(sKey, options) {
        options = options || {};
        if (!sKey || !hasItem(sKey)) { return false; }
        document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" +
            ( options.domain ? "; domain=" + options.domain : "") +
            ( options.path ? "; path=" + options.path : "");
        return true;
    }

    // check for having
    function hasItem(sKey) {
        return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
    }

    //just return all keys
    function keys() {
        var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
        for (var nIdx = 0; nIdx < aKeys.length; nIdx++) { aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]); }
        return aKeys;
    }



    // defined interface

    cookie.set = setItem;

    cookie.get = getItem;

    cookie.remove = removeItem;

    cookie.has = hasItem;

})();