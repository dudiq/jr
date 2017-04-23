(function(){
    var app = window.app;
    var timeInfo = app('time-logger')('nat-sort');
    var logger = app('logger')('nat-sort');
    var helper = app('helper');

    var SPECIAL_SORT_FIELD = '__sortField__';
    var SP_FIELD_N = '__sortField-n__';
    var SP_FIELD_X = '__sortField-x__';
    var SP_FIELD_D = '__sortField-d__';
    var SP_FIELD_D_2 = '__sortField-d2__';
    var SP_FIELD_D_3 = '__sortField-d3__';
    var PREFIX = '_.';

    var re = /(^([+\-]?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?(?=\D|\s|$))|^0x[\da-fA-F]+$|\d+)/g;
    var sre = /^\s+|\s+$/g;   // trim pre-post whitespace
    var snre = /\s+/g;        // normalize all whitespace to single ' ' character
    var dre = /(^([\w ]+,?[\w ]+)?[\w ]+,?[\w ]+\d+:\d+(:\d+)?[\w ]?|^\d{1,4}[\/\-]\d{1,4}[\/\-]\d{1,4}|^\w+, \w+ \d+, \d{4})/;
    var hre = /^0x[0-9a-f]+$/i;
    var ore = /^0/;
    var uniRe = /[^\x00-\x80]/;

    function normChunk(s, l) {
        // normalize spaces; find floats not starting with '0', string or 0 if not defined (Clint Priest)
        var ret = (!s.match(ore) || l == 1) && parseFloat(s) || s.replace(snre, ' ').replace(sre, '') || 0;
        return ret;
    }

    function insesitive(s, isInsensitive) {
        // var ret = (s + '').trim();//(naturalSort.insensitive && ('' + s).toLowerCase() || '' + s).replace(sre, '');
        var ret = (isInsensitive && ('' + s).toLowerCase() || '' + s).replace(sre, '');
        return ret;
    }

    function naturalSortOptimized(objectA, objectB) {
        var xN = objectA[SP_FIELD_N];
        var yN = objectB[SP_FIELD_N];
        var xD = objectA[SP_FIELD_D] || objectA[SP_FIELD_D_2];
        var yD = objectB[SP_FIELD_D] || xD && objectB[SP_FIELD_D_3] || null;

        var oFxNcL, oFyNcL;
        // first try and sort Hex codes or Dates
        if (yD) {
            if (xD < yD) { return -1; }
            else if (xD > yD) { return 1; }
        }
        // natural sorting through split numeric strings and default strings
        for(var cLoc = 0, xNl = xN.length, yNl = yN.length, numS = Math.max(xNl, yNl); cLoc < numS; cLoc++) {
            oFxNcL = xN[cLoc];
            oFyNcL = yN[cLoc];
            // handle numeric vs string comparison - number < string - (Kyle Adams)
            if (isNaN(oFxNcL) !== isNaN(oFyNcL)) {
                return isNaN(oFxNcL) ? 1 : -1;
            }
            // if unicode use locale comparison
            // if (/[^\x00-\x80]/.test(oFxNcL + oFyNcL) && oFxNcL.localeCompare) {
            //     var comp = oFxNcL.localeCompare(oFyNcL);
            //     return comp / Math.abs(comp);
            // }
            if (uniRe.test(oFxNcL + oFyNcL)) {
                var comp = (oFxNcL == oFyNcL) ? 0 :
                    (oFxNcL > oFyNcL ? 1 : -1);
                if (comp !== 0) {
                    return comp;
                }
                // return comp / Math.abs(comp);
            }
            if (oFxNcL < oFyNcL) { return -1; }
            else if (oFxNcL > oFyNcL) { return 1; }
        }
        return 0;
    }

    var profile = false;

    app('natural-sort', function (arr, field) {
        if (!field){
            logger.error('field not defined, sorting not working');
            return;
        }

        timeInfo.startTimer();

        var sortField = SPECIAL_SORT_FIELD;

        addSpecialField(arr, field);

        timeInfo.portionTimer('special Field');

        // !profile && arr.length > 100 && console.profile();

        arr.sort(function(a, b){
            var aField = a[sortField];
            var bField = b[sortField];

            var ret = 0;
            if (aField !== bField){
                // ret = aField > bField ? 1 : -1;
                // ret = naturalSort(aField, bField);
                ret = naturalSortOptimized(a, b);
            }

            return ret;
        });

        // !profile && arr.length > 100 && console.profileEnd() && (profile = true);

        timeInfo.portionTimer('nat sort');

        removeSpecialField(arr);

        timeInfo.portionTimer('rev Field');
        timeInfo.stopTimer();
        var tt = timeInfo.getShortDetails();
        logger.log('sort time:', 'len:', arr.length, tt);
    });

    function addSpecialField(arr, fieldVar) {
        // need prepare sort field for sorting
        // and remove special field after sort
        var isMethod = (typeof fieldVar == "function");

        helper.arrayWalk(arr, function (item) {
            var val;
            if (isMethod){
                val = PREFIX + fieldVar(item);
            } else {
                val = PREFIX + item[fieldVar];
            }
            item[SPECIAL_SORT_FIELD] = val;
            var x = item[SP_FIELD_X] = insesitive(val);
            var xN = item[SP_FIELD_N] = x.replace(re, '\0$1\0').replace(/\0$/,'').replace(/^\0/,'').split('\0');

            item[SP_FIELD_D] = parseInt(x.match(hre), 16);
            item[SP_FIELD_D_2] = (xN.length !== 1 && Date.parse(x));
            item[SP_FIELD_D_3] = x.match(dre) && Date.parse(x);

            for(var cLoc = 0, xNl = xN.length; cLoc < xNl; cLoc++) {
                var xnChunk = normChunk(xN[cLoc] || '', xNl);
                xN[cLoc] = xnChunk;
            }
        });
    }

    function removeSpecialField(arr) {
        helper.arrayWalk(arr, function (item) {
            delete item[SP_FIELD_D];
            delete item[SP_FIELD_N];
            delete item[SP_FIELD_X];
            delete item[SP_FIELD_D_2];
            delete item[SP_FIELD_D_3];

            delete item[SPECIAL_SORT_FIELD];
        });
    }

})();
