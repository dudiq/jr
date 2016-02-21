(function(){
    var app = window.app;
    var watchScope = app('watch-scope');
    var base = watchScope('base');
    var inherit = app('helper').inherit;

    var skipHtml = ['input', 'select', 'textarea'];

    var CONST_TYPE_HTML = 'html';
    var CONST_TYPE_EDIT = 'edit';

    // constructor
    function change(){
        this._setTypeVal = CONST_TYPE_HTML;

        // defined events for change instance
        this.evs = ['keypress', 'keyup', 'copy', 'paste', 'cut', 'change'];

        change._parent.constructor.apply(this, arguments);
    }

    inherit(change, base);

    var p = change.prototype;


    function setHtmlVal(el, val){
        el.html(val);
    }

    function setTypeVal(el, val){
        var type = (el.prop('type') + "").toLowerCase();
        switch (type){
            case "radio":
                this.triggerGroup(!val);
                break;
            case "checkbox":
                el.prop('checked', val);
                break;

            default:
                el.val(val);
                break;
        }
    }

    // set value to DOM element
    p.setVal = function(val){
        var el = this.el;
        var type = this._setTypeVal;
        if (type == CONST_TYPE_HTML){
            setHtmlVal(el, val);
        } else if (type == CONST_TYPE_EDIT){
            setTypeVal.call(this, el, val);
        }

    };

    p.updateRadioValues = function(val){
        if (!this.stopSet){
            this.stopSet = true;
            this.el.prop("checked", val);
            this.setPropValue(val);
            this.stopSet = false;
        }
    };

    // initialize
    p.init = function(){
        var self = this;
        var el = this.el;
        var nodeName = el[0].nodeName.toLowerCase();
        var typeVal = CONST_TYPE_HTML;
        if (skipHtml.indexOf(nodeName) == -1) {
            typeVal = CONST_TYPE_HTML;
        } else {
            typeVal = CONST_TYPE_EDIT;
        }

        this._setTypeVal = typeVal;

        //define initial value (first)
        var value = this.getPropValue();
        this.setVal(value);


        // bind object changes
        this.bindObjectChanges();

        if (el.is(":radio")){
            var groupName = el.prop('name');
            this.bindGroup(groupName, function(val){
                self.updateRadioValues(val);
            });
        }

        // bind dom changes
        (typeVal == CONST_TYPE_EDIT) && this.evs.length && this.bindElementChanges(this.evs, function(oldVal){
            var newVal = el.val();

            var type = (el.prop('type') + "").toLowerCase();

            switch (type){
                case "number":
                    newVal = parseFloat(newVal);
                    if (isNaN(newVal)){
                        newVal = "";
                    }
                    break;
                case "radio":
                    newVal = el.is(":checked");
                    self.triggerGroup(!newVal);
                    break;
                case "checkbox":
                    newVal = el.is(":checked");
                    break;
            }

            return newVal;
        });
    };

    watchScope('change', change);

})();