(function () {
    var app = window.app;
    var cordovaDevice = app('cordova-device');
    var helper = app('helper');

    var cordovaCamera = app('cordova-camera', {});

    var isNative = app('helper').isNative;
    var camObject;
    var optionsForCamera;
    var optionsForGallery;

    var canvasRatio = document.createElement('canvas');

    var CONST_CAMERA_QUALITY = 80;

    if (isNative) {
        cordovaDevice.onReady(function () {
            camObject = navigator.camera;

            if (camObject){
                optionsForCamera = {
                    quality: CONST_CAMERA_QUALITY,
                    destinationType: camObject.DestinationType.FILE_URI,
                    sourceType: camObject.PictureSourceType.CAMERA,
                    encodingType: camObject.EncodingType.JPEG,
                    saveToPhotoAlbum: true,
                    correctOrientation: true,
                    cameraDirection: 0 // rear camera select
                };

                optionsForGallery = {
                    quality: CONST_CAMERA_QUALITY,
                    destinationType: camObject.DestinationType.NATIVE_URI,
                    sourceType: camObject.PictureSourceType.PHOTOLIBRARY,
                    encodingType: camObject.EncodingType.JPEG,
                    saveToPhotoAlbum: false,
                    correctOrientation: true
                };
            }
        });
    }

    function getPic(onSuccess, onError, options){
        if (camObject){
            camObject.getPicture(function (fileUri) {
                setTimeout(function () {
                    onSuccess(fileUri);
                }, 0);
            }, onError, options);
        } else {
            onError();
        }
    }

    function getPicture(options, params) {
        params = params || {};

        var onSuccess = params.onSuccess || function () {};
        var onError = params.onFail || function () {};

        if (!camObject || !options) {
            onError('no options or no defined camera object');
        } else {
            getPic(onSuccess, onError, options);
        }
    }

    cordovaCamera.getPhotoFromCamera = function (params, opt) {
        var defOpt = helper.clone(optionsForCamera);
        if (opt) {
            for (var key in opt){
                defOpt[key] = opt[key];
            }
        }
        getPicture(defOpt, params);
    };

    cordovaCamera.getPhotoFromGallery = function (params) {
        getPicture(optionsForGallery, params);
    };

    cordovaCamera.isCameraAvailable = function () {
        return isNative && camObject != undefined;
    };

    cordovaCamera.galleryIsAvailable = function () {
        return isNative && camObject != undefined;
    };

    cordovaCamera.detectVerticalSquash = function (img) {
        var ih = img.naturalHeight;
        canvasRatio.width = 1;
        canvasRatio.height = ih;
        var ctx = canvasRatio.getContext("2d");
        ctx.drawImage(img, 0, 0);
        var data = ctx.getImageData(0, 0, 1, ih).data;
        // search image edge pixel position in case it is squashed vertically.
        var sy = 0;
        var ey = ih;
        var py = ih;
        while (py > sy) {
            var alpha = data[(py - 1) * 4 + 3];
            if (alpha === 0) {
                ey = py;
            } else {
                sy = py;
            }
            py = (ey + sy) >> 1;
        }
        var ratio = (py / ih);
        return (ratio === 0) ? 1 : ratio;

    };

})();