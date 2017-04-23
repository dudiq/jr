(function(){
    var app = window.app;
    var logger = app('logger')('watch-css');

    app('watch-scope')('css', {
        init: function(){
            this.prevRule = "";

            var jsonRules = this.subData;
            var rules;
            try{
                rules = JSON.parse(jsonRules);
            } catch(e){
                rules = null;
                logger.error('something wrong with css rules, check it, before define', e);
            }

            this.rules = rules;

            this.getClass()._parent.init.call(this);
        },
        destroy: function(){
            this.rules = null;
            this.getClass()._parent.destroy.call(this);
        },
        setVal: function(rule){
            if (this.rules){
                var rules = this.rules;
                var el = this.el;


                //var classes = (el.className).split(" ");

                var prev = this.prevRule;
                (prev !== undefined) && el.removeClass(rules[prev]);

                var newRule = rules[rule];
                el.addClass(newRule);
                this.prevRule = rule;
            }
        }
    });

})();
