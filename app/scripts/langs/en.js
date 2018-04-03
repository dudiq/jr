(function () {
    window.app('translate').addWords('en', {
        docTitle: 'Coinote. Coin your money',
        title: 'Coinote',
        system: {
            errorHttpParse: 'Error receiving data from the server'
        },
        loading: {
            title: 'Loading'
        },
        error: 'Error',
        confirm: {
            yes: 'Yes',
            no: 'No'
        },
        prompt: {
            add: 'Add',
            cancel: 'Cancel'
        },

        accountPopupMenu: {
            addAccount: 'Add account',
            confirmSwitch: 'Are you sure want to switch to another account ?',
            confirmLogin: 'Are you want to login using other account ?',

            input: 'Expenses',
            categories: 'Categories of expenses',
            analytic: 'Analytic',
            settings: 'App settings',
            export: 'Export',
            migrate: 'Migrates',
            profile: '',
            exit: 'Logout'
        },

        procs: {
            confirmExit: 'Are you sure want to logout ?',
            back: 'Back'
        },

        empty: {
            expense: 'Hmm, seems that nothing to showing. <br>Try <span class="uia-link_decoration">add</span> new',
            cats: 'Oops, you have no categories'
        },

        // pages

        login: {
            getCode: 'Get code',
            phoneHere: '+799900000000',
            codeHere: 'enter code',
            enter: 'Login',
            register: 'Register',
            phone: 'Phone',
            email: 'Email',
            password: 'Password'
        },

        expense: {
            t: 'Expenses',
            putHolder: 'refinement...',
            newT: 'Expenses',
            add: 'Add',
            change: 'Change',
            remove: 'Want to remove "%s" ?',
            updateCost: 'Changing cost for "%s" ?',
            showMore: 'Show more...',
            footer: {
                today: 'Today',
                current: 'Current',
                prev: 'Previous'
            }
        },

        categories: {
            t: 'Categories',
            add: 'Add new',
            remove: 'Want to remove "%s" ?',
            updateTitle: 'Changing title for "%s"'
        },

        theme: {
            light: 'Light',
            dark: 'Dark'
        },

        migrate: {
            t: 'Migrates',
            exportDone: 'Save to file: ',
            importDone: 'Import was done',
            error: 'Something goes wrong'
        },

        analytic: {
            t: 'Analytic',
            total: 'Total'
        },

        pageMenu: {
            pouches: "Pouches",
            def: 'Main',
            add: 'Add',
            remove: 'Remove'
        },

        settings: {
            t: 'Settings',
            langs: 'Languages',
            theme: 'Theme',
            migrate: 'Migrate'
        }

    });

})();
