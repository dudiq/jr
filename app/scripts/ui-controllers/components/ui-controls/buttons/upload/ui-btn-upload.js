(function (app) {
    var helper = app('helper');
    var deviceOs = app('device-os');
    // var uiBtnActions = uiComp.getActionsByName('ui-btn');

    var codes = {
        OK: 0,
        UNKNOWN_ERROR: 2,
        WRONG_ACCEPT: 10
    };

    var useNativeChooser = (function () {
        var ret = false;
        if (helper.isNative &&
            (deviceOs.os() == deviceOs.TYPE_ANDROID)) {
            var ver = deviceOs.version();
            if (ver == '4.4.2' || ver == '4.4.3'){
                // need this hack
                ret = true;
            } else {
                // all done
            }
        }
        return ret;
    })();

    function onSelectFiles(err, files) {
        this._files = files;
        this.onSelectFiles(err, this._files);
    }

    var UiUploadBtn = app('bb-co')('ui-btn-upload', 'ui-btn', {
        tpl: 'scripts/ui-controllers/components/ui-controls/buttons/upload/ui-btn-upload',
        init: function () {
            this._files = null;
        },
        getReplaced: function (opt) {
            return UiUploadBtn._parent.getReplaced.call(this, {
                icon: opt.icon || 'x-icon-upload'
            });
        },
        processContent: function (content) {
            var input = this._input = content.find('input');
            var self = this;
            var fChooser = window.fileChooser || null;
            var useChooser = useNativeChooser && fChooser;

            content.on('click', function () {
                self._files = null;
                if (useChooser) {
                    fChooser.open(function (file) {
                        var filePath = 'file://' + file;
                        onSelectFiles.call(self, codes.OK, [filePath]);
                    }, function (file) {
                        onSelectFiles.call(self, codes.UNKNOWN_ERROR, file);
                    });
                } else {
                    //input.val('');
                }
            });
            if (useChooser) {
                input.detach();
            } else {
                input.on('change', function () {
                    onSelectFiles.call(self, codes.OK, this.files);
                });
            }
            // UiUploadBtn._parent.processContent.apply(this, arguments);
        },
        getValue: function () {
            var ret = this._files;
            return ret;
        },
        onDefaultState: function () {
            UiUploadBtn._parent.onDefaultState.apply(this, arguments);
            this._input && this._input.val('');
        },
        onSelectFiles: function (code, files) {
            this._files = files;
            var method = this.getAttr('data-select-file');
            var proc = method && app('data-processor')(method);
            proc && proc(code, files);
        },
        destroy: function () {
            UiUploadBtn._parent.destroy.apply(this, arguments);
            this._input = null;
        }
    });

})(window.app);
