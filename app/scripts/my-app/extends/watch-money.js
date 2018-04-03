(function(app){
    var parser = app('input-money-parser');

    app('watch-scope')('money', {
        setVal: function(val){
            var num = parser.numToMoney(val);
            this.el.html(num);
        }
    });

})(window.app);
