(function (app) {
    var dom = app('dom');
    var logger = app('logger')('list-editing');

    app('data-processor')({
        'list.editing': function (target, className, cb) {
            className = className || 'is-editing';

            var id = target.getAttribute('data-id');
            var isEditing = false;
            if (id) {
                var el = this.getContent();
                if (!dom.hasClass(target, className)){
                    var els = el.getElementsByClassName(className);
                    dom.removeClass(els, className);
                    dom.addClass(target, className);
                    isEditing = true;
                } else {
                    dom.removeClass(target, className);
                    isEditing = false;
                }
            } else {
                logger.error('id is not defined');
            }
            cb && cb(id, isEditing);
            return id;
        }
    });

})(window.app);
