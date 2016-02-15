(function(){
    var app = window.app;

    function mSort(arr, field){
        for (var i = 0, l = arr.length; i < l; i++){
            var el = field ? arr[i][field] : arr[i];
            var matches = el ? el.match(/\D+|\d+/ig) : [];
            field ? arr[i][field] = matches: arr[i] = matches;
        }
        arr.sort(function(a, b){
            var ret = 0;
            var afield = field ? a[field] : a;
            var bfield = field ? b[field] : b;
            var len = afield.length > bfield.length ? bfield.length : afield.length;

            for (var i = 0; i <= len; i++){
                var ai = afield[i];
                var bi = bfield[i];

                !isNaN(ai) && (ai-=0);
                !isNaN(bi) && (bi-=0);

                if (ai != bi){
                    ret = (ai > bi) ? 1 : -1;
                    break;
                }
            }
            return ret;
        });

        for (var i = 0, l = arr.length; i < l; i++){
            if (field) {
                arr[i][field] = arr[i][field].join('');
            } else {
                arr[i] = arr[i].join('');
            }


        }

    }

    app('natural-sort', mSort);

})();