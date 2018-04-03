(function (app) {
    var translate = app('translate');
    var helper = app('helper');

    function reverse(val, flag) {
        return flag ?
            val.split('').join('') :
            val.split('').reverse().join('');
    }

    var parser = app('input-money-parser', function (val, isReverse) {
        val = (val + '').trim();
        var newVal;
        var money;
        var tmp = reverse(val, isReverse);
        var error = parser.codes.OK;

        var matches = tmp.match(/(\d*(\.|,)\d*)|(\d*)/);

        // detect money and desc
        if (matches && matches[0]) {
            var revertMoney = matches[0];
            revertMoney = revertMoney.replace(',', '.');
            var pos = isReverse ? revertMoney.length : val.length - revertMoney.length;
            newVal = isReverse ? val.substr(pos) : val.substr(0, pos);
            var moneyStr = reverse(revertMoney, isReverse);
            money = parseFloat(moneyStr);
            if (isNaN(money)){
                error = parser.codes.WRONG_NUMBER;
            }
        } else {
            error = parser.codes.NO_MATCHES;
        }

        // detect state
        var state = -1;
        if (newVal && newVal[newVal.length - 1] == '+') {
            var pos = newVal.length - 2;
            newVal = isReverse ?
                newVal.substr(pos) :
                newVal.substr(0, pos);
            state = 1;
        }

        newVal && (newVal = newVal.trim());

        return getRetObj(error, Math.floor(money * 100), newVal, state);
    });

    parser.asString = function (val) {
        var money = 0;
        var error = parser.codes.OK;
        if (val) {
            var nums = val.split('.');
            var int = nums[0] * 100;
            var flo = (nums[1] || 0) - 0;
            money = Math.floor(int + flo);
        } else {
            error = parser.codes.WRONG_NUMBER;
        }
        return getRetObj(error, money, '', -1);
    };

    parser.numToMoney = function (val) {
        var view = (val - 0) / 100;
        var num = translate.num(view, 2);
        return num;
    };

    function getRetObj(error, money, desc, state) {
        var ret = {
            data: {
                id: helper.mongoId(),
                time: (new Date()).getTime(),
                cost: money,
                desc: desc,
                state: state
            },
            error: error
        };
        return ret;
    }

    parser.codes = {
        OK: 0,
        NO_MATCHES: 80,
        WRONG_NUMBER: 81
    };

})(window.app);
