(function () {
    var app = window.app;

    var deviceOs = app('device-os', {
        TYPE_NOT_DEFINED: 'not-defined',
        TYPE_IOS: 'ios',
        TYPE_ANDROID: 'android',
        TYPE_WINDOWS: 'windows',
        TYPE_BB: 'blackberry',
        TYPE_WP: 'wp',
        device: function () {
            return osDevice;
        },
        os: function () {
            return osType;
        },
        version: function () {
            return osVersion;
        }
    });

    var userAgent = (navigator.userAgent).toLowerCase();

    var osType = '';
    var osVersion = '';
    var osDevice = '';


    function getAndroidVersion() {
        var ret = '';
        var match = userAgent.match(/android\s([0-9\.]*)/);
        ret = match ? match[1] : ret;
        return ret;
    }

    function getWPVersion() {
        var ret = '';
        var match = userAgent.match(/windows phone\s([0-9\.]*)/);
        ret = match ? match[1] : ret;
        return ret;
    }

    function getIosVersion() {
        var ret = '';
        var macIndex = userAgent.indexOf('mac os ');
        if (macIndex != -1) {
            var pieces = userAgent.split(';');
            for (var i = 0, l = pieces.length; i < l; i++) {
                var item = pieces[i];
                var pos = item.indexOf('mac os ');
                if (pos != -1) {
                    ret = item.substring(pos + 7).replace('_', '.');
                    break;
                }
            }
        } else {
            var uaindex = userAgent.indexOf('os ');
            ret = userAgent.substr(uaindex + 3, 3).replace('_', '.');
        }
        return ret;
    }

    function getWindowsVersion() {
        var ret = '';
        var match = userAgent.match(/windows nt\s([0-9\.]*)/);
        ret = match ? match[1] : ret;
        return ret;
    }

    function getBBVersion(userAgent) {
        userAgent = userAgent.toLowerCase();
        var ret = '';
        var Verposition;
        if (userAgent.indexOf("blackberry") >= 0) {
            if (userAgent.indexOf("version/") >= 0) { // ***User Agent in BlackBerry 6 and BlackBerry 7
                Verposition = userAgent.indexOf("version/") + 8;
                //document.write("Jorgesys  BB OS Version :: " + ua.substring(Verposition, Verposition + 3));
                ret = userAgent.substring(Verposition, Verposition + 3);
            } else {// ***User Agent in BlackBerry Device Software 4.2 to 5.0
                var SplitUA = userAgent.split("/");
                //document.write("Jorgesys BB OS Version :: " + SplitUA[1].substring(0, 3));
                ret = SplitUA[1].substring(0, 3);
            }
        } else if (userAgent.indexOf('rim tablet') != -1) {
            Verposition = userAgent.indexOf("version/") + 8;
            //document.write("Jorgesys  BB OS Version :: " + ua.substring(Verposition, Verposition + 3));
            ret = userAgent.substring(Verposition, Verposition + 3);
        } else {
            if (userAgent.match(/bb10/i)) {
                ret = '10';
            }
        }
        return ret;
    }

    var osTypes = {
        'android': deviceOs.TYPE_ANDROID,
        'iphone|ipad|ipod': deviceOs.TYPE_IOS,
        '(windows phone)': deviceOs.TYPE_WP,
        '(mac os)|(mac_powerpc)|(macintosh)': deviceOs.TYPE_IOS,
        '(windows nt)': deviceOs.TYPE_WINDOWS,
        '(bb10)|(blackberry)|(rim tablet)': deviceOs.TYPE_BB
    };

    function defineOsType() {
        osType = deviceOs.TYPE_NOT_DEFINED;
        var reg;
        for (var key in osTypes) {
            var type = osTypes[key];
            reg = new RegExp(key, 'i');
            if (reg.test(userAgent)) {
                osType = type;
                break;
            }
        }

        reg = null;
    }


    function defineOsVersion() {
        var types = {};
        types[deviceOs.TYPE_ANDROID] = getAndroidVersion;
        types[deviceOs.TYPE_IOS] = getIosVersion;
        types[deviceOs.TYPE_WP] = getWPVersion;
        types[deviceOs.TYPE_WINDOWS] = getWindowsVersion;
        types[deviceOs.TYPE_BB] = getBBVersion;

        types[osType] && (osVersion = types[osType]());
    }

    defineOsType();
    defineOsVersion();

})();
