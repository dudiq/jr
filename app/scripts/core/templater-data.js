/*
* this is not yet module, this is file for project build
* where ;//{{replaceData_}} replace by views, when running 'grunt build' command
* */
(function(){
    var app = window.app;


    var data;//{{replaceData}};


    app('templater').set(data);
})();