/**
 * @NApiVersion 2.1
 */
define([], () => {

    let SANDBOX = {
        VARIABLES: {
            FILE_INDEX: 481563,
            PROGRESS_TIME: 3
        },
        SEARCHS: {
            PERIODS: 'customsearch_ht_accounting_period',
            SUBSIDIARIES: 'customsearch_ht_subsidiary_report'
        },
        URL: {
            NETSUITE_LINK: 'https://7451241-sb1.app.netsuite.com/app/center/card.nl?sc=-29&whence=',
            NETSUITE_LOGO: 'https://6460294-sb2.app.netsuite.com/core/media/media.nl?id=56137&c=6460294_SB2&h=LMfty6-YotUEPU3ALBtvXgn8o1jKJ0vMb11pERRILhz-b6cf&fcts=20241115205243&whence='
        }
    }

    let PRODUCTION = {
        VARIABLES: {
            FILE_INDEX: 481563,
            PROGRESS_TIME: 3
        },
        SEARCHS: {
            PERIODS: 'customsearch_ht_accounting_period',
            SUBSIDIARIES: 'customsearch_ht_subsidiary_report'
        },
        URL: {
            NETSUITE_LINK: 'https://7451241.app.netsuite.com/app/center/card.nl?sc=-29&whence=',
            NETSUITE_LOGO: 'https://6460294-sb2.app.netsuite.com/core/media/media.nl?id=56137&c=6460294_SB2&h=LMfty6-YotUEPU3ALBtvXgn8o1jKJ0vMb11pERRILhz-b6cf&fcts=20241115205243&whence='
        }
    }

    return { SANDBOX, PRODUCTION }
});
