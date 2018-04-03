(function (app) {

    app('bb-co')('page', {
        id: '',
        tpl: '',
        weight: 0,
        title: '',
        processContent: function (content) {
            var pageClassName = 'ui-page-' + this.getProp('id');
            if (content.addClass) {
                content.addClass('jr-page ' + pageClassName);
            } else {
                content.className += ('jr-page ' + pageClassName);
            }
        }
    });

})(window.app);
