(function () {
    var app = window.app;

    var selectors = ".material-input-field";

    function processInput($this){
        var parent = $this.parent();
        var value = $this.val();

        if (value !== '') {
            parent.removeClass('empty');
        } else {
            parent.addClass('empty');
        }
    }

    app('material-input', {
        processFields: function (content) {
            content.find(selectors).each(function(index, el){
                var $el = $(el);
                processInput($el);
            });
        }
    });

    app.onDomReady(function () {
        $(document).on('focusin focusout', selectors, function () {
            var el = $(this);
            processInput(el);
        });
    });

})();
