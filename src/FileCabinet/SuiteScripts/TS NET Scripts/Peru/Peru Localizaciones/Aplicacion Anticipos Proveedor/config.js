/**
 * @NApiVersion 2.1
 */
define([], () => {
    let SANDBOX = {
        VARIABLES: {
            NAME_BUTTON: "Comparar vs NetSuite",
            NAME_BUTTON_SNON_XLS: 'Descargar XLS',
            NAME_BUTTON_NNOS_XLS: 'Descargar XLS',
            FILE_INDEX: 255937,
            RCE: 'RCE',
            RVE: 'RVIE',
            PROGRESS_TIME: 3
        },
        FILES: {
            INPUTFILES: 25193,
            OUTPUTFILES: 25194
        },
        SEARCHS: {
            PERIODS: 'customsearch_sj_pe_accounting_period',
            RCE: 'customsearch_ts_registro_compra_sire',
            RVE: 'customsearch_ts_registro_ventas_sire',
        },
        URL: {
            NETSUITE_LINK: 'https://6460294-sb2.app.netsuite.com/app/center/card.nl?sc=-29&whence=',
            NETSUITE_LOGO: 'https://6460294-sb2.app.netsuite.com/core/media/media.nl?id=56137&c=6460294_SB2&h=LMfty6-YotUEPU3ALBtvXgn8o1jKJ0vMb11pERRILhz-b6cf&fcts=20241115205243&whence='
        }
    }

    let PRODUCTION = {
        VARIABLES: {
            NAME_BUTTON: "Comparar vs NetSuite",
            NAME_BUTTON_SNON_XLS: 'Descargar XLS',
            NAME_BUTTON_NNOS_XLS: 'Descargar XLS',
            FILE_INDEX: 846898,
            RCE: 'RCE',
            RVE: 'RVIE',
            PROGRESS_TIME: 5
        },
        FILES: {
            INPUTFILES: 0,
            OUTPUTFILES: 0
        },
        SEARCHS: {
            PERIODS: 'customsearch_sj_pe_accounting_period',
            RCE: 'customsearch_ts_registro_compra_sire',
            RVE: 'customsearch_ts_registro_ventas_sire',
        },
        URL: {
            NETSUITE_LINK: '',
            NETSUITE_LOGO: ''
        }
    }

    return {
        SANDBOX,
        PRODUCTION
    }
})