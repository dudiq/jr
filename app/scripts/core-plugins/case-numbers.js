(function(){
    var app = window.app;

    function units(num, cases) {
        num = Math.abs(num);

        var word = '';

        if (num.toString().indexOf('.') > -1) {
            word = cases.gen;
        } else {
            word = (
                num % 10 == 1 && num % 100 != 11
                    ? cases.nom
                    : num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20)
                    ? cases.gen
                    : cases.plu
            );
        }

        return word;
    }

    app('case-numbers', units);

})();