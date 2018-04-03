(function(){
    window.app('translate').addWords('ru', {
        docTitle: 'Coinote - считаем свои расходы',
        title: 'Coinote',
        system: {
            errorHttpParse: 'Ошибка при обработке данных с сервера'
        },
        loading: {
            title: 'Загрузка'
        },
        error: 'Ошибка',
        confirm: {
            yes: 'Да',
            no: 'Нет'
        },
        prompt: {
            add: 'Добавить',
            cancel: 'Отмена'
        },

        accountPopupMenu: {
            addAccount: 'Добавить аккаунт',
            confirmSwitch: 'Вы действительно хотите переключиться на другого пользователя ?',
            confirmLogin: 'Вы хотите зайти под другим пользователем ?',

            input: 'Расходы',
            categories: 'Категории',
            analytic: 'Аналитика',
            settings: 'Настройки приложения',
            export: 'Экспорт',
            migrate: 'Миграция',
            profile: '',
            exit: 'Выход'
        },

        procs: {
            confirmExit: 'Вы точно хотите выйти ?',
            back: 'Назад'
        },

        empty: {
            expense: 'Хмм, похоже у вас еще нет записей по расходам. <br> Попробуйте <span class="uia-link_decoration">добавить</span>',
            cats: 'Упс, у вас нет категорий'
        },

        // pages

        login: {
            getCode: 'Получить код',
            phoneHere: '+799900000000',
            codeHere: 'ввести код',
            enter: 'Вход',
            register: 'Регистрация',
            phone: 'Телефон',
            email: 'емаил',
            password: 'пароль'
        },

        expense: {
            t: 'Расходы',
            putHolder: 'уточнение...',
            newT: 'Расходы',
            add: 'Добавить',
            change: 'Изменить',
            remove: 'Точно удалить "%s" ?',
            updateCost: 'Правим сумму для "%s"',
            showMore: 'Еще...',
            footer: {
                today: 'Сегодня',
                current: 'Текущий',
                prev: 'Прошлый'
            }
        },

        categories: {
            t: 'Категории',
            add: 'Добавить новую',
            remove: 'Точно удалить "%s" ?',
            updateTitle: 'Правим категорию "%s"'
        },

        theme: {
            light: 'Светлая',
            dark: 'Темная'
        },

        migrate: {
            t: 'Миграция',
            exportDone: 'Успешно сохранили в фаил: ',
            importDone: 'Импорт прошел успешно',
            error: 'Что-то пошло не так'
        },

        analytic: {
            t: 'Аналитика',
            total: 'Всего'
        },

        pageMenu: {
            pouches: "Кошельки",
            def: 'Основной',
            add: 'Добавить',
            remove: 'Удалить'
        },

        settings: {
            t: 'Настройки',
            langs: 'Языки',
            theme: 'Тема',
            migrate: 'Миграция'
        }

    });

})();
