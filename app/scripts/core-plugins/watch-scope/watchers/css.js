(function(){
    var app = window.app;
    var watchScope = app('watch-scope');
    var base = watchScope('base');
    var errors = app('errors');
    var inherit = app('helper').inherit;

    // constructor
    function cssClass(){
        this.rules = null;
        this.prevRule = "";

        cssClass._parent.constructor.apply(this, arguments);
    }

    inherit(cssClass, base);

    var p = cssClass.prototype;

    // set value to DOM element
    p.setVal = function(rule){
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
    };

    // initialize
    p.init = function(){
        var jsonRules = this.subData;
        var rules;
        try{
            rules = JSON.parse(jsonRules);
        } catch(e){
            rules = null;
            errors.error('css-watch', 'something wrong with css rules, check it, before define', e);
        }

        this.rules = rules;

        cssClass._parent.init.call(this);
    };

    p.destroy = function(){
        this.rules = null;
        cssClass._parent.destroy.call(this);
    };

    watchScope('css', cssClass);

})();