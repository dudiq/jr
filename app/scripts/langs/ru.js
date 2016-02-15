(function(){
    var app = window.app;
    var translate = app('translate');
    translate('ru', {
        title: 'My App',
        closeBack: 'Закрыть приложение?',
        loading: {
            title: 'загрузка...'
        },
        confirm: {
            yes: 'Да',
            no: 'Нет'
        },
        prompt: {
            add: 'Добавить',
            cancel: 'Отмена'
        },
        // your langs
        hashone: "это тест",
        test: {
            ver1 :"версия 1, да!",
            ver2 :"версия 2, да!"
        },
        mainPage: {
            logout: 'Выйти',
            gestures: 'Жесты',
            translate: 'Перевод',
            goToTree: 'третья',
            openSecond: 'вторая'
        }
    });
    
})();