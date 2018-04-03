(function(app){
    var helper = app('helper');
    var ls = app('local-storage');

    var LS_KEY = 'mid';

    var machineId = ls(LS_KEY);
    if (!machineId){
        machineId = (Math.abs(Math.random()*0xff|0)).toString(16);
        ls(LS_KEY, machineId);
    }

    var lut = []; for (var i=0; i<256; i++) { lut[i] = (i<16?'0':'')+(i).toString(16); }
    function guid(){
        var timeObj = (new Date).getTime();
        var s = Math.floor((timeObj) / 1000);
        var ms = timeObj - s * 1000;

        var d1 = ms + Math.random()*0xffff|0;
        var d2 = Math.random()*0xffffffff|0;
        var d3 = machineId; //Math.random()*0xffffffff|0;
        var d4 = s.toString(16);
        return d4 +
            lut[d3&0xff] +
            lut[d1&0xff] + lut[d1>>8&0xff] + lut[d1>>16&0x0f|0x40]+
            lut[d2&0x3f|0x80]+lut[d2>>8&0xff]+lut[d2>>16&0xff]+lut[d2>>24&0xff];

    }

    helper.extendObject(helper, {
        mongoId: guid
    });

})(window.app);
