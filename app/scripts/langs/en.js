(function(){
    var app = window.app;
    var translate = app('translate');
    translate('en', {
        title: 'My App',
        closeBack: 'Do You really want to close App?',
        loading: {
            title: 'loading...'
        },
        confirm: {
            yes: 'Yes',
            no: 'No'
        },
        prompt: {
            add: 'Add',
            cancel: 'Cancel'
        },
        // your langs
        hashone: "this is test",
        test: {
            ver1 :"testver 1, yeahh!",
            ver2 :"testver 2, yeahh!"
        },
        mainPage: {
            logout: 'Logout',
            gestures: 'gestures',
            translate: 'translate',
            goToTree: 'open tree page',
            openSecond: 'open second page'
        }
    });

})();