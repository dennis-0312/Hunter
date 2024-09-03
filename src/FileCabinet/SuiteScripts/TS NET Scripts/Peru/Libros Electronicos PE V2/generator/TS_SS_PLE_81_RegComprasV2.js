/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/config', 'N/file', 'N/log', 'N/record', 'N/runtime', 'N/search', 'N/format'],
    /**
 * @param{config} config
 * @param{file} file
 * @param{log} log
 * @param{record} record
 * @param{redirect} redirect
 * @param{runtime} runtime
 * @param{search} search
 * @param{format} format
 */
    (config, file, log, record, runtime, search, format) => {
        const FOLDER_NAME = 'FileCabinet'
        const SEARCH1 = 'customsearch_pe_registro_de_compra_8_1'
        const SEARCH2 = 'customsearch_pe_reg_compras_8_1_er' //PE - Registro de Compra 8.1 - Expense Report
        const CUSTOM_RECORD_LOG = 'customrecord_pe_generation_logs'
        const CODIGO_LIBRO = '080100'
        const PARAMETER = 'custscript_pe_ss_ple_8_1_per_v2'
        const BOOK_NAME = 'Registro de Compras 8.1'
        let currentScript = runtime.getCurrentScript();

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const execute = (scriptContext) => {
            log.error('Proccessing', 'START ================================================================================================');
            let scriptParameters = getScriptParameters();
            let filterSubsidiary;
            let data = new Object();
            let isOneWorld = 0;
            let fedIdNumb;
            let filters = new Object();
            let filters2 = new Object();
            let jsonData = new Array();
            let stringContentReport = '';
            let recordGenerationLogId = '';

            if (scriptParameters) {
                try {
                    //& ================================================ SUBSIDIARY IN ONE WORLD ================================================ */
                    let featureSubsidiary = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
                    let filterPostingPeriod = search.createFilter({ name: 'postingperiod', operator: search.Operator.ANYOF, values: scriptParameters.selectPeriod });
                    if (featureSubsidiary || featureSubsidiary == 'T') {
                        data.custrecord_pe_subsidiary_log = scriptParameters.selectSubsidiary;
                        filterSubsidiary = search.createFilter({ name: 'subsidiary', operator: search.Operator.ANYOF, values: scriptParameters.selectSubsidiary });
                        let subLookup = search.lookupFields({ type: search.Type.SUBSIDIARY, id: scriptParameters.selectSubsidiary, columns: ['taxidnum'] });
                        fedIdNumb = subLookup.taxidnum;
                        isOneWorld = 1
                    } else {
                        let configpage = config.load({ type: config.Type.COMPANY_INFORMATION });
                        fedIdNumb = configpage.getValue('employerid');
                    }
                    log.error('fedIdNumb', fedIdNumb);


                    //& ================================================ CREATE RECORD GENERATION LOGS ================================================ */
                    data.custrecord_pe_period_log = scriptParameters.selectPeriod;
                    data.custrecord_pe_report_log = "Procesando...";
                    data.custrecord_pe_status_log = "Procesando...";
                    data.custrecord_pe_book_log = BOOK_NAME;
                    recordGenerationLogId = createGenerationLog(data);
                    log.error('recordGenerationLogId', recordGenerationLogId);


                    //& ================================================ SEARCH FOLDER ID ================================================ */
                    let folderid = getFolderId();


                    //& ================================================ GET DATA ACCOUNTING PERIOD ================================================ */
                    let perLookup = search.lookupFields({ type: search.Type.ACCOUNTING_PERIOD, id: scriptParameters.selectPeriod, columns: ['periodname', 'startdate'] });
                    let periodoFinDate = format.parse({ type: format.Type.DATE, value: perLookup.startdate });
                    perLookup = periodoFinDate.getFullYear() + completarCero(2, periodoFinDate.getMonth() + 1) + '00';


                    //& ================================================ SEARCH LOAD PROCESS ================================================ */
                    //^ SEARCH 1 ============================================================================
                    let searchLoad = search.load({ id: SEARCH1 });
                    filters = searchLoad.filters;
                    filters.push(filterPostingPeriod);
                    if (isOneWorld == 1)
                        filters.push(filterSubsidiary);
                    let searchResultCount = searchLoad.runPaged().count;
                    log.error({ title: 'searchResultCount', details: searchResultCount });
                    if (searchResultCount > 0) {
                        let pagedData = searchLoad.runPaged({ pageSize: 1000 });
                        pagedData.pageRanges.forEach((pageRange) => {
                            let myPage = pagedData.fetch({ index: pageRange.index });
                            myPage.data.forEach((result) => {
                                let llave = result.getValue(pagedData.searchDefinition.columns[46]);
                                let campoRegistro01 = result.getValue(pagedData.searchDefinition.columns[0]);
                                let campoRegistro02 = result.getValue(pagedData.searchDefinition.columns[1]);
                                let campoRegistro03 = result.getValue(pagedData.searchDefinition.columns[2]);
                                let campoRegistro04 = result.getValue(pagedData.searchDefinition.columns[3]);
                                let campoRegistro05 = result.getValue(pagedData.searchDefinition.columns[4]);
                                let campoRegistro06 = result.getValue(pagedData.searchDefinition.columns[5]);
                                let campoRegistro07 = result.getValue(pagedData.searchDefinition.columns[6]);
                                let campoRegistro08 = result.getValue(pagedData.searchDefinition.columns[7]);
                                if (campoRegistro08 == '- None -') {
                                    campoRegistro08 = '';
                                }
                                let campoRegistro09 = result.getValue(pagedData.searchDefinition.columns[8]);
                                let campoRegistro10 = result.getValue(pagedData.searchDefinition.columns[9]);
                                let campoRegistro11 = result.getValue(pagedData.searchDefinition.columns[10]);
                                let campoRegistro12 = result.getValue(pagedData.searchDefinition.columns[11]);
                                if (campoRegistro12 == '- None -') {
                                    campoRegistro12 = ''
                                }
                                let campoRegistro13 = result.getValue(pagedData.searchDefinition.columns[12]);
                                let campoRegistro14 = result.getValue(pagedData.searchDefinition.columns[13]);
                                campoRegistro14 = parseFloat(campoRegistro14).toFixed(2);

                                let campoRegistro15 = result.getValue(pagedData.searchDefinition.columns[14]);
                                campoRegistro15 = parseFloat(campoRegistro15).toFixed(2);

                                let campoRegistro16 = result.getValue(pagedData.searchDefinition.columns[15]);
                                campoRegistro16 = parseFloat(campoRegistro16).toFixed(2);

                                let campoRegistro17 = result.getValue(pagedData.searchDefinition.columns[16]);
                                if (campoRegistro17 == '.00') {
                                    campoRegistro17 = '0.00'
                                }
                                let campoRegistro18 = result.getValue(pagedData.searchDefinition.columns[17]);
                                if (campoRegistro18 == '.00') {
                                    campoRegistro18 = '0.00'
                                }
                                let campoRegistro19 = result.getValue(pagedData.searchDefinition.columns[18]);
                                if (campoRegistro19 == '.00') {
                                    campoRegistro19 = '0.00'
                                }
                                let campoRegistro20 = result.getValue(pagedData.searchDefinition.columns[19]);
                                if (campoRegistro20 == '.00') {
                                    campoRegistro20 = '0.00'
                                }
                                let campoRegistro21 = result.getValue(pagedData.searchDefinition.columns[20]);
                                if (campoRegistro21 == '.00') {
                                    campoRegistro21 = '0.00'
                                }
                                let campoRegistro22 = result.getValue(pagedData.searchDefinition.columns[21]);
                                if (campoRegistro22 == '.00') {
                                    campoRegistro22 = '0.00'
                                }
                                let campoRegistro23 = result.getValue(pagedData.searchDefinition.columns[22]);
                                if (campoRegistro23 == '.00') {
                                    campoRegistro23 = '0.00'
                                }
                                let campoRegistro24 = result.getValue(pagedData.searchDefinition.columns[23]);
                                if (campoRegistro24 == '.00') {
                                    campoRegistro24 = '0.00'
                                }
                                let campoRegistro25 = result.getValue(pagedData.searchDefinition.columns[24]);
                                let campoRegistro26 = result.getValue(pagedData.searchDefinition.columns[25]);
                                if (campoRegistro26 == '1.00') {
                                    campoRegistro26 = '1.000'
                                }
                                let campoRegistro27 = result.getValue(pagedData.searchDefinition.columns[26]);
                                if (campoRegistro27 == '- None -') {
                                    campoRegistro27 = '';
                                }
                                let campoRegistro28 = result.getValue(pagedData.searchDefinition.columns[27]);
                                if (campoRegistro28 == '- None -') {
                                    campoRegistro28 = '';
                                }
                                let campoRegistro29 = result.getValue(pagedData.searchDefinition.columns[28]);
                                if (campoRegistro29 == '- None -') {
                                    campoRegistro29 = '';
                                }
                                let campoRegistro30 = result.getValue(pagedData.searchDefinition.columns[29]);
                                if (campoRegistro30 == '- None -') {
                                    campoRegistro30 = '';
                                }
                                let campoRegistro31 = result.getValue(pagedData.searchDefinition.columns[30]);
                                if (campoRegistro31 == '- None -') {
                                    campoRegistro31 = '';
                                }
                                let campoRegistro32 = result.getValue(pagedData.searchDefinition.columns[31]);
                                if (campoRegistro32 == '- None -') {
                                    campoRegistro32 = '';
                                }
                                let campoRegistro33 = result.getValue(pagedData.searchDefinition.columns[32]);
                                if (campoRegistro33 == '- None -') {
                                    campoRegistro33 = '';
                                }
                                let campoRegistro34 = result.getValue(pagedData.searchDefinition.columns[33]);
                                if (campoRegistro34 == '- None -') {
                                    campoRegistro34 = '';
                                }
                                let campoRegistro35 = result.getValue(pagedData.searchDefinition.columns[34]);
                                if (campoRegistro35 == '- None -') {
                                    campoRegistro35 = '';
                                }
                                let campoRegistro36 = result.getValue(pagedData.searchDefinition.columns[35]);
                                if (campoRegistro36 == '- None -') {
                                    campoRegistro36 = '';
                                }
                                let campoRegistro37 = result.getValue(pagedData.searchDefinition.columns[36]);
                                if (campoRegistro37 == '- None -') {
                                    campoRegistro37 = '';
                                }
                                let campoRegistro38 = result.getValue(pagedData.searchDefinition.columns[37]);
                                if (campoRegistro38 == '- None -') {
                                    campoRegistro38 = '';
                                }
                                let campoRegistro39 = result.getValue(pagedData.searchDefinition.columns[38]);
                                let campoRegistro40 = result.getValue(pagedData.searchDefinition.columns[39]);
                                let campoRegistro41 = result.getValue(pagedData.searchDefinition.columns[40]);
                                let campoRegistro42 = result.getValue(pagedData.searchDefinition.columns[41]);
                                let periodoEmision = formatDate(campoRegistro04)['anio'] + formatDate(campoRegistro04)['mes'] + '00';
                                if ((campoRegistro06 == '01' || campoRegistro06 == '14') && (campoRegistro01 == periodoEmision)) {
                                    campoRegistro42 = '1';
                                } else if ((campoRegistro06 == '00' || campoRegistro06 == '02' || campoRegistro06 == '03' || campoRegistro06 == '04'
                                    || campoRegistro06 == '09' || campoRegistro06 == '10' || campoRegistro06 == '11' || campoRegistro06 == '15'
                                    || campoRegistro06 == '16' || campoRegistro06 == '17' || campoRegistro06 == '18' || campoRegistro06 == '20' || campoRegistro06 == '21'
                                    || campoRegistro06 == '22' || campoRegistro06 == '24' || campoRegistro06 == '27' || campoRegistro06 == '33' || campoRegistro06 == '34'
                                    || campoRegistro06 == '35' || campoRegistro06 == '40' || campoRegistro06 == '41' || campoRegistro06 == '42' || campoRegistro06 == '44'
                                    || campoRegistro06 == '45' || campoRegistro06 == '52' || campoRegistro06 == '53' || campoRegistro06 == '54' || campoRegistro06 == '91'
                                    || campoRegistro06 == '96' || campoRegistro06 == '97' || campoRegistro06 == '98' || campoRegistro06 == '30')
                                    && (campoRegistro01 == periodoEmision)) {
                                    campoRegistro42 = '0';
                                } else if ((campoRegistro06 == '01' || campoRegistro06 == '07' || campoRegistro06 == '14' || campoRegistro06 == '08' || campoRegistro06 == '50'
                                    || campoRegistro06 == '05') && (campoRegistro01 != periodoEmision)) {
                                    campoRegistro42 = '6';
                                } else if ((campoRegistro06 != '01' || campoRegistro06 != '07' || campoRegistro06 != '14' || campoRegistro06 != '10' || campoRegistro06 != '03')
                                    && (campoRegistro01 != periodoEmision)) {
                                    campoRegistro42 = '7';
                                }

                                let campoRegistro43 = result.getValue(pagedData.searchDefinition.columns[42]);
                                let campoRegistro44 = result.getValue(pagedData.searchDefinition.columns[43]);
                                let campoRegistro45 = result.getValue(pagedData.searchDefinition.columns[44]);
                                let campoRegistro46 = result.getValue(pagedData.searchDefinition.columns[45]);

                                jsonData.push({
                                    llave: llave,
                                    campoRegistro01: campoRegistro01,
                                    campoRegistro02: campoRegistro02,
                                    campoRegistro03: campoRegistro03,
                                    campoRegistro04: campoRegistro04,
                                    campoRegistro05: campoRegistro05,
                                    campoRegistro06: campoRegistro06,
                                    campoRegistro07: campoRegistro07,
                                    campoRegistro08: campoRegistro08,
                                    campoRegistro09: campoRegistro09,
                                    campoRegistro10: campoRegistro10,
                                    campoRegistro11: campoRegistro11,
                                    campoRegistro12: campoRegistro12,
                                    campoRegistro13: campoRegistro13,
                                    campoRegistro14: campoRegistro14,
                                    campoRegistro15: campoRegistro15,
                                    campoRegistro16: campoRegistro16,
                                    campoRegistro17: campoRegistro17,
                                    campoRegistro18: campoRegistro18,
                                    campoRegistro19: campoRegistro19,
                                    campoRegistro20: campoRegistro20,
                                    campoRegistro21: campoRegistro21,
                                    campoRegistro22: campoRegistro22,
                                    campoRegistro23: campoRegistro23,
                                    campoRegistro24: campoRegistro24,
                                    campoRegistro25: campoRegistro25,
                                    campoRegistro26: campoRegistro26,
                                    campoRegistro27: campoRegistro27,
                                    campoRegistro28: campoRegistro28,
                                    campoRegistro29: campoRegistro29,
                                    campoRegistro30: campoRegistro30,
                                    campoRegistro31: campoRegistro31,
                                    campoRegistro32: campoRegistro32,
                                    campoRegistro33: campoRegistro33,
                                    campoRegistro34: campoRegistro34,
                                    campoRegistro35: campoRegistro35,
                                    campoRegistro36: campoRegistro36,
                                    campoRegistro37: campoRegistro37,
                                    campoRegistro38: campoRegistro38,
                                    campoRegistro39: campoRegistro39,
                                    campoRegistro40: campoRegistro40,
                                    campoRegistro41: campoRegistro41,
                                    campoRegistro42: campoRegistro42,
                                    campoRegistro43: campoRegistro43,
                                    campoRegistro44: campoRegistro44,
                                    campoRegistro45: campoRegistro45,
                                    campoRegistro46: campoRegistro46
                                });
                            });
                        });
                    }

                    saveJson(jsonData, 'libro8.1Track')

                    //^ SEARCH 2 ============================================================================
                    let searchLoad2 = search.load({ id: SEARCH2 });
                    filters2 = searchLoad2.filters;
                    filters2.push(filterPostingPeriod);
                    if (isOneWorld == 1)
                        filters2.push(filterSubsidiary);
                    let searchResultCount2 = searchLoad2.runPaged().count;
                    log.error({ title: 'searchResultCount2', details: searchResultCount2 });
                    if (searchResultCount2 > 0) {
                        let pagedData = searchLoad2.runPaged({ pageSize: 1000 });
                        pagedData.pageRanges.forEach((pageRange) => {
                            let myPage = pagedData.fetch({ index: pageRange.index });
                            myPage.data.forEach((result) => {
                                let llave = result.getValue(pagedData.searchDefinition.columns[45]);
                                let campoRegistro01 = result.getValue(pagedData.searchDefinition.columns[0]);
                                let campoRegistro02 = result.getValue(pagedData.searchDefinition.columns[1]);
                                let campoRegistro03 = result.getValue(pagedData.searchDefinition.columns[2]);
                                let campoRegistro04 = result.getValue(pagedData.searchDefinition.columns[3]);
                                let campoRegistro05 = result.getValue(pagedData.searchDefinition.columns[4]);
                                let campoRegistro06 = result.getValue(pagedData.searchDefinition.columns[5]);
                                let campoRegistro07 = result.getValue(pagedData.searchDefinition.columns[6]);
                                let campoRegistro08 = result.getValue(pagedData.searchDefinition.columns[7]);
                                if (campoRegistro08 == '- None -') {
                                    campoRegistro08 = '';
                                }
                                let campoRegistro09 = result.getValue(pagedData.searchDefinition.columns[8]);
                                let campoRegistro10 = result.getValue(pagedData.searchDefinition.columns[9]);
                                let campoRegistro11 = result.getValue(pagedData.searchDefinition.columns[10]);
                                let campoRegistro12 = result.getValue(pagedData.searchDefinition.columns[11]);
                                if (campoRegistro12 == '- None -') {
                                    campoRegistro12 = ''
                                }
                                let campoRegistro13 = result.getValue(pagedData.searchDefinition.columns[12]);
                                let campoRegistro14 = result.getValue(pagedData.searchDefinition.columns[13]);
                                campoRegistro14 = parseFloat(campoRegistro14).toFixed(2);

                                let campoRegistro15 = result.getValue(pagedData.searchDefinition.columns[14]);
                                campoRegistro15 = parseFloat(campoRegistro15).toFixed(2);

                                let campoRegistro16 = result.getValue(pagedData.searchDefinition.columns[15]);
                                campoRegistro16 = parseFloat(campoRegistro16).toFixed(2);

                                let campoRegistro17 = result.getValue(pagedData.searchDefinition.columns[16]);
                                if (campoRegistro17 == '.00') {
                                    campoRegistro17 = '0.00'
                                }
                                let campoRegistro18 = result.getValue(pagedData.searchDefinition.columns[17]);
                                if (campoRegistro18 == '.00') {
                                    campoRegistro18 = '0.00'
                                }
                                let campoRegistro19 = result.getValue(pagedData.searchDefinition.columns[18]);
                                if (campoRegistro19 == '.00') {
                                    campoRegistro19 = '0.00'
                                }
                                let campoRegistro20 = result.getValue(pagedData.searchDefinition.columns[19]);
                                if (campoRegistro20 == '.00') {
                                    campoRegistro20 = '0.00'
                                }
                                let campoRegistro21 = result.getValue(pagedData.searchDefinition.columns[20]);
                                if (campoRegistro21 == '.00') {
                                    campoRegistro21 = '0.00'
                                }
                                let campoRegistro22 = result.getValue(pagedData.searchDefinition.columns[21]);
                                if (campoRegistro22 == '.00') {
                                    campoRegistro22 = '0.00'
                                }
                                let campoRegistro23 = result.getValue(pagedData.searchDefinition.columns[22]);
                                if (campoRegistro23 == '.00') {
                                    campoRegistro23 = '0.00'
                                }
                                let campoRegistro24 = result.getValue(pagedData.searchDefinition.columns[23]);
                                if (campoRegistro24 == '.00') {
                                    campoRegistro24 = '0.00'
                                }
                                let campoRegistro25 = result.getValue(pagedData.searchDefinition.columns[24]);
                                let campoRegistro26 = result.getValue(pagedData.searchDefinition.columns[25]);
                                if (campoRegistro26 == '1.00') {
                                    campoRegistro26 = '1.000'
                                }
                                let campoRegistro27 = result.getValue(pagedData.searchDefinition.columns[26]);
                                if (campoRegistro27 == '- None -') {
                                    campoRegistro27 = '';
                                }
                                let campoRegistro28 = result.getValue(pagedData.searchDefinition.columns[27]);
                                if (campoRegistro28 == '- None -') {
                                    campoRegistro28 = '';
                                }
                                let campoRegistro29 = result.getValue(pagedData.searchDefinition.columns[28]);
                                if (campoRegistro29 == '- None -') {
                                    campoRegistro29 = '';
                                }
                                let campoRegistro30 = result.getValue(pagedData.searchDefinition.columns[29]);
                                if (campoRegistro30 == '- None -') {
                                    campoRegistro30 = '';
                                }
                                let campoRegistro31 = result.getValue(pagedData.searchDefinition.columns[30]);
                                if (campoRegistro31 == '- None -') {
                                    campoRegistro31 = '';
                                }
                                let campoRegistro32 = result.getValue(pagedData.searchDefinition.columns[31]);
                                if (campoRegistro32 == '- None -') {
                                    campoRegistro32 = '';
                                }
                                let campoRegistro33 = result.getValue(pagedData.searchDefinition.columns[32]);
                                if (campoRegistro33 == '- None -') {
                                    campoRegistro33 = '';
                                }
                                let campoRegistro34 = result.getValue(pagedData.searchDefinition.columns[33]);
                                if (campoRegistro34 == '- None -') {
                                    campoRegistro34 = '';
                                }
                                let campoRegistro35 = result.getValue(pagedData.searchDefinition.columns[34]);
                                if (campoRegistro35 == '- None -') {
                                    campoRegistro35 = '';
                                }
                                let campoRegistro36 = result.getValue(pagedData.searchDefinition.columns[35]);
                                if (campoRegistro36 == '- None -') {
                                    campoRegistro36 = '';
                                }
                                let campoRegistro37 = result.getValue(pagedData.searchDefinition.columns[36]);
                                if (campoRegistro37 == '- None -') {
                                    campoRegistro37 = '';
                                }
                                let campoRegistro38 = result.getValue(pagedData.searchDefinition.columns[37]);
                                if (campoRegistro38 == '- None -') {
                                    campoRegistro38 = '';
                                }
                                let campoRegistro39 = result.getValue(pagedData.searchDefinition.columns[38]);
                                let campoRegistro40 = result.getValue(pagedData.searchDefinition.columns[39]);
                                let campoRegistro41 = result.getValue(pagedData.searchDefinition.columns[40]);
                                let campoRegistro42 = result.getValue(pagedData.searchDefinition.columns[41]);
                                let periodoEmision = formatDate(campoRegistro04)['anio'] + formatDate(campoRegistro04)['mes'] + '00';
                                if ((campoRegistro06 == '01' || campoRegistro06 == '14') && (campoRegistro01 == periodoEmision)) {
                                    campoRegistro42 = '1';
                                } else if ((campoRegistro06 == '00' || campoRegistro06 == '02' || campoRegistro06 == '03' || campoRegistro06 == '04'
                                    || campoRegistro06 == '09' || campoRegistro06 == '10' || campoRegistro06 == '11' || campoRegistro06 == '15'
                                    || campoRegistro06 == '16' || campoRegistro06 == '17' || campoRegistro06 == '18' || campoRegistro06 == '20' || campoRegistro06 == '21'
                                    || campoRegistro06 == '22' || campoRegistro06 == '24' || campoRegistro06 == '27' || campoRegistro06 == '33' || campoRegistro06 == '34'
                                    || campoRegistro06 == '35' || campoRegistro06 == '40' || campoRegistro06 == '41' || campoRegistro06 == '42' || campoRegistro06 == '44'
                                    || campoRegistro06 == '45' || campoRegistro06 == '52' || campoRegistro06 == '53' || campoRegistro06 == '54' || campoRegistro06 == '91'
                                    || campoRegistro06 == '96' || campoRegistro06 == '97' || campoRegistro06 == '98' || campoRegistro06 == '30')
                                    && (campoRegistro01 == periodoEmision)) {
                                    campoRegistro42 = '0';
                                } else if ((campoRegistro06 == '01' || campoRegistro06 == '07' || campoRegistro06 == '14' || campoRegistro06 == '08' || campoRegistro06 == '50'
                                    || campoRegistro06 == '05') && (campoRegistro01 != periodoEmision)) {
                                    campoRegistro42 = '6';
                                } else if ((campoRegistro06 != '01' || campoRegistro06 != '07' || campoRegistro06 != '14' || campoRegistro06 != '10' || campoRegistro06 != '03')
                                    && (campoRegistro01 != periodoEmision)) {
                                    campoRegistro42 = '7';
                                }

                                let campoRegistro43 = result.getValue(pagedData.searchDefinition.columns[42]);
                                let campoRegistro44 = result.getValue(pagedData.searchDefinition.columns[43]);
                                let campoRegistro45 = result.getValue(pagedData.searchDefinition.columns[44]);

                                jsonData.push({
                                    llave: llave,
                                    campoRegistro01: campoRegistro01,
                                    campoRegistro02: campoRegistro02,
                                    campoRegistro03: campoRegistro03,
                                    campoRegistro04: campoRegistro04,
                                    campoRegistro05: campoRegistro05,
                                    campoRegistro06: campoRegistro06,
                                    campoRegistro07: campoRegistro07,
                                    campoRegistro08: campoRegistro08,
                                    campoRegistro09: campoRegistro09,
                                    campoRegistro10: campoRegistro10,
                                    campoRegistro11: campoRegistro11,
                                    campoRegistro12: campoRegistro12,
                                    campoRegistro13: campoRegistro13,
                                    campoRegistro14: campoRegistro14,
                                    campoRegistro15: campoRegistro15,
                                    campoRegistro16: campoRegistro16,
                                    campoRegistro17: campoRegistro17,
                                    campoRegistro18: campoRegistro18,
                                    campoRegistro19: campoRegistro19,
                                    campoRegistro20: campoRegistro20,
                                    campoRegistro21: campoRegistro21,
                                    campoRegistro22: campoRegistro22,
                                    campoRegistro23: campoRegistro23,
                                    campoRegistro24: campoRegistro24,
                                    campoRegistro25: campoRegistro25,
                                    campoRegistro26: campoRegistro26,
                                    campoRegistro27: campoRegistro27,
                                    campoRegistro28: campoRegistro28,
                                    campoRegistro29: campoRegistro29,
                                    campoRegistro30: campoRegistro30,
                                    campoRegistro31: campoRegistro31,
                                    campoRegistro32: campoRegistro32,
                                    campoRegistro33: campoRegistro33,
                                    campoRegistro34: campoRegistro34,
                                    campoRegistro35: campoRegistro35,
                                    campoRegistro36: campoRegistro36,
                                    campoRegistro37: campoRegistro37,
                                    campoRegistro38: campoRegistro38,
                                    campoRegistro39: campoRegistro39,
                                    campoRegistro40: campoRegistro40,
                                    campoRegistro41: campoRegistro41,
                                    campoRegistro42: campoRegistro42,
                                    campoRegistro43: campoRegistro43,
                                    campoRegistro44: campoRegistro44,
                                    campoRegistro45: campoRegistro45
                                });
                            });
                        });
                    }


                    //& ================================================ DATA RESTRUCTURING ================================================ */
                    if (searchResultCount > 0 || searchResultCount2 > 0) {
                        const groupedData = jsonData.reduce((acc, curr) => {
                            const key = curr.llave;
                            if (!acc[key]) {
                                acc[key] = {
                                    campoRegistro01: curr.campoRegistro01,
                                    campoRegistro02: curr.campoRegistro02,
                                    campoRegistro03: curr.campoRegistro03,
                                    campoRegistro04: curr.campoRegistro04,
                                    campoRegistro05: curr.campoRegistro05,
                                    campoRegistro06: curr.campoRegistro06,
                                    campoRegistro07: curr.campoRegistro07,
                                    campoRegistro08: curr.campoRegistro08,
                                    campoRegistro09: curr.campoRegistro09,
                                    campoRegistro10: curr.campoRegistro10,
                                    campoRegistro11: curr.campoRegistro11,
                                    campoRegistro12: curr.campoRegistro12,
                                    campoRegistro13: curr.campoRegistro13,
                                    campoRegistro14: 0,
                                    campoRegistro15: 0,
                                    campoRegistro16: 0,
                                    campoRegistro17: 0,
                                    campoRegistro18: 0,
                                    campoRegistro19: 0,
                                    campoRegistro20: 0,
                                    campoRegistro21: 0,
                                    campoRegistro22: 0,
                                    campoRegistro23: 0,
                                    campoRegistro24: 0,
                                    campoRegistro25: curr.campoRegistro25,
                                    campoRegistro26: curr.campoRegistro26,
                                    campoRegistro27: curr.campoRegistro27,
                                    campoRegistro28: curr.campoRegistro28,
                                    campoRegistro29: curr.campoRegistro29,
                                    campoRegistro30: curr.campoRegistro30,
                                    campoRegistro31: curr.campoRegistro31,
                                    campoRegistro32: curr.campoRegistro32,
                                    campoRegistro33: curr.campoRegistro33,
                                    campoRegistro34: curr.campoRegistro34,
                                    campoRegistro35: curr.campoRegistro35,
                                    campoRegistro36: curr.campoRegistro36,
                                    campoRegistro37: curr.campoRegistro37,
                                    campoRegistro38: curr.campoRegistro38,
                                    campoRegistro39: curr.campoRegistro39,
                                    campoRegistro40: curr.campoRegistro40,
                                    campoRegistro41: curr.campoRegistro41,
                                    campoRegistro42: curr.campoRegistro42,
                                    campoRegistro43: curr.campoRegistro43,
                                    campoRegistro44: curr.campoRegistro44,
                                    campoRegistro45: curr.campoRegistro45,
                                    campoRegistro46: curr.campoRegistro46
                                };
                            }

                            acc[key].campoRegistro14 += parseFloat(curr.campoRegistro14);
                            acc[key].campoRegistro15 += parseFloat(curr.campoRegistro15);
                            acc[key].campoRegistro16 += parseFloat(curr.campoRegistro16);
                            acc[key].campoRegistro17 += parseFloat(curr.campoRegistro17);
                            acc[key].campoRegistro18 += parseFloat(curr.campoRegistro18);
                            acc[key].campoRegistro19 += parseFloat(curr.campoRegistro19);
                            acc[key].campoRegistro20 += parseFloat(curr.campoRegistro20);
                            acc[key].campoRegistro21 += parseFloat(curr.campoRegistro21);
                            acc[key].campoRegistro22 += parseFloat(curr.campoRegistro22);
                            acc[key].campoRegistro23 += parseFloat(curr.campoRegistro23);
                            acc[key].campoRegistro24 += parseFloat(curr.campoRegistro24);

                            return acc;
                        }, {});
                        let array = Object.values(groupedData);
                        log.error('array', array.length);


                        //& ================================================ MAPPING DATA ================================================ */
                        for (let i = 0; i < array.length; i++) {
                            stringContentReport =
                                stringContentReport + array[i].campoRegistro01 + '|' + array[i].campoRegistro02 + '|' + array[i].campoRegistro03 + '|' +
                                array[i].campoRegistro04 + '|' + array[i].campoRegistro05 + '|' + array[i].campoRegistro06 + '|' + array[i].campoRegistro07 + '|' +
                                array[i].campoRegistro08 + '|' + array[i].campoRegistro09 + '|' + array[i].campoRegistro10 + '|' + array[i].campoRegistro11 + '|' +
                                array[i].campoRegistro12 + '|' + array[i].campoRegistro13 + '|' + array[i].campoRegistro14 + '|' + array[i].campoRegistro15 + '|' +
                                array[i].campoRegistro16 + '|' + array[i].campoRegistro17 + '|' + array[i].campoRegistro18 + '|' + array[i].campoRegistro19 + '|' +
                                array[i].campoRegistro20 + '|' + array[i].campoRegistro21 + '|' + array[i].campoRegistro22 + '|' + array[i].campoRegistro23 + '|' +
                                array[i].campoRegistro24 + '|' + array[i].campoRegistro25 + '|' + array[i].campoRegistro26 + '|' + array[i].campoRegistro27 + '|' +
                                array[i].campoRegistro28 + '|' + array[i].campoRegistro29 + '|' + array[i].campoRegistro30 + '|' + array[i].campoRegistro31 + '|' +
                                array[i].campoRegistro32 + '|' + array[i].campoRegistro33 + '|' + array[i].campoRegistro34 + '|' + array[i].campoRegistro35 + '|' +
                                array[i].campoRegistro36 + '|' + array[i].campoRegistro37 + '|' + array[i].campoRegistro38 + '|' + array[i].campoRegistro39 + '|' +
                                array[i].campoRegistro40 + '|' + array[i].campoRegistro41 + '|' + array[i].campoRegistro42 + '|' + array[i].campoRegistro43 + '|' +
                                array[i].campoRegistro44 + '|' + array[i].campoRegistro45 + '|\n'
                        }


                        //& ================================================ CREATE FILE ================================================ */
                        let nameReportGenerated = 'LE' + fedIdNumb + perLookup + CODIGO_LIBRO + '00' + '1111';
                        let fileId = createFile(nameReportGenerated, scriptParameters.selectFormat, stringContentReport, folderid)
                        log.error('fileId', fileId);


                        //& ================================================ UPDATE RECORD LOG ================================================ */
                        updateRecordLog(recordGenerationLogId, fileId);


                        //*SAVE JSON =========================================================================
                        //saveJson(result, 'libro_8_1');
                    } else {
                        //& ================================================ UPDATE RECORD LOG NO HAY REGISTROS ================================================ */
                        updateRecordLog(recordGenerationLogId);
                    }
                    log.error('Proccessing', 'END =================================================================================================');
                } catch (error) {
                    updateRecordLog(recordGenerationLogId, 'error', error.message);
                    log.error('Error', error);
                    log.error('Proccessing', 'END ERROR ================================================================================================');
                }
            }
        }

        const getScriptParameters = () => {
            let scriptParameters = JSON.parse(currentScript.getParameter(PARAMETER));
            log.error("scriptParameters", scriptParameters);
            return scriptParameters;
        }

        const createGenerationLog = (data) => {
            //log.debug('data', data);
            let recordGenerationLog = record.create({ type: CUSTOM_RECORD_LOG, isDynamic: true });
            for (let key in data) {
                if (data.hasOwnProperty(key)) {
                    recordGenerationLog.setValue({ fieldId: key, value: data[key] });
                }
            }
            return recordGenerationLog.save({ enableSourcing: true, ignoreMandatoryFields: true });
        }

        const getFolderId = () => {
            let folderid;
            let folderSearchObj = search.create({
                type: "folder",
                filters: [["name", "is", FOLDER_NAME]],
                columns: [search.createColumn({ name: "internalid", label: "Internal ID" })]
            });
            let searchResultCount = folderSearchObj.runPaged().count;
            // log.debug("folderSearchObj result count", searchResultCount);
            folderSearchObj.run().each((result) => {
                folderid = result.getValue({ name: "internalid", label: "Internal ID" });
            });
            return folderid;
        }

        const completarCero = (tamano, valor) => {
            let strValor = valor + '';
            let lengthStrValor = strValor.length;
            let nuevoValor = valor + '';

            if (lengthStrValor <= tamano) {
                if (tamano != lengthStrValor) {
                    for (let i = lengthStrValor; i < tamano; i++) {
                        nuevoValor = '0' + nuevoValor;
                    }
                }
                return nuevoValor;
            } else {
                return nuevoValor.substring(0, tamano);
            }
        }

        // CONVIERTE A LA FECHA EN FORMATO JSON
        const formatDate = (dateString) => {
            let date = dateString.split('/');
            if (Number(date[0]) < 10) date[0] = '0' + Number(date[0]);
            if (Number(date[1]) < 10) date[1] = '0' + Number(date[1]);
            return { 'anio': date[2], 'mes': date[1], 'dia': date[0] }
        }

        const createFile = (nameFile, formatType, contentFile, folderid) => {
            let objFields = new Object();

            if (formatType == 'CSV') {
                objFields.name = `${nameFile}.${formatType.toLowerCase()}`;
                objFields.fileType = file.Type.CSV;
                objFields.contents = `${getCabeceraCSV()}${contentFile.replace(/\|/g, ',')}`;
            } else {
                objFields.name = `${nameFile}.txt`;
                objFields.fileType = file.Type.PLAINTEXT;
                objFields.contents = contentFile;
            }
            objFields.encoding = file.Encoding.UTF8;
            objFields.folder = folderid;
            objFields.isOnline = true;

            let fileObj = file.create(objFields);
            let fileId = fileObj.save();
            return fileId;
        }

        const updateRecordLog = (id, fileId = 0, errormessage = 0) => {
            let updateData = new Object();
            let openFile;

            if (fileId == 0) {
                updateData.custrecord_pe_report_log = 'Proceso finalizado'
                updateData.custrecord_pe_status_log = 'No hay registros'
            } else if (fileId == 'error') {
                updateData.custrecord_pe_report_log = errormessage
                updateData.custrecord_pe_status_log = 'Error'
            } else {
                openFile = file.load({ id: fileId });
                updateData.custrecord_pe_report_log = openFile.name
                updateData.custrecord_pe_status_log = 'Generated'
                updateData.custrecord_pe_file_cabinet_log = openFile.url
            }

            let updateRecordGenerationLogId = record.submitFields({
                type: CUSTOM_RECORD_LOG,
                id: id,
                values: updateData
            });
            log.error('updateRecordGenerationLogId', updateRecordGenerationLogId);
        }

        const getCabeceraCSV = () => {
            let cabeceraCSV = 'Periodo,' +
                'Numero correlativo del mes o Codigo unico de la Operacion (CUO),' +
                'Numero correlativo del asiento contable,' +
                'Fecha de emision del comprobante de pago o documento,' +
                'Fecha de Vencimiento o Fecha de Pago,' +
                'Tipo de Comprobante de Pago o Documento,' +
                'Serie del comprobante de pago o documento,' +
                'Emision de la DUA o DSI,' +
                'Numero del comprobante de pago o documento,' +
                'En caso de optar por anotar el importe total de las operaciones diarias ,' +
                'Tipo de Documento de Identidad del proveedor,' +
                'Numero de RUC del proveedor o numero de documento de Identidad,' +
                'Apellidos y nombres denominacion o razon social  del proveedor,' +
                'Base imponible de las adquisiciones gravadas que dan derecho a credito fiscal,' +
                'Monto del Impuesto General a las Ventas,' +
                'Base imponible de las adquisiciones gravadas que dan derecho a credito fiscal,' +
                'Monto del Impuesto General a las Ventas,' +
                'Base imponible de las adquisiciones gravadas que no dan derecho a credito fiscal ,' +
                'Monto del Impuesto General a las Ventas,' +
                'Valor de las adquisiciones no gravadas,' +
                'Monto del Impuesto Selectivo al Consumo,' +
                'Impuesto al Consumo de las Bolsas de Plastico,' +
                'Otros conceptos tributos y cargos que no formen parte de la base imponible,' +
                'Importe total de las adquisiciones registradas segun comprobante de pago,' +
                'Codigo  de la Moneda,' +
                'Tipo de cambio,' +
                'Fecha de emision del comprobante de pago que se modifica,' +
                'Tipo de comprobante de pago que se modifica,' +
                'Numero de serie del comprobante de pago que se modifica,' +
                'Codigo de la dependencia Aduanera de la Declaracion unica de Aduanas (DUA),' +
                'Numero del comprobante de pago que se modifica,' +
                'Fecha de emision de la Constancia de Deposito de Detraccion,' +
                'Numero de la Constancia de Deposito de Detraccion,' +
                'Marca del comprobante de pago sujeto a retencion,' +
                'Clasificacion de los bienes y servicios adquiridos,' +
                'Identificacion del Contrato o del proyecto en el caso de los Operadores de las sociedades irregulares,' +
                'Error tipo 1,' +
                'Error tipo 2,' +
                'Error tipo 3,' +
                'Error tipo 4,' +
                'Indicador de Comprobantes de pago cancelados con medios de pago,' +
                'Estado que identifica la oportunidad de la anotacion o indicacion si esta corresponde a un ajuste\n';

            return cabeceraCSV;
        }

        const saveJson = (contents, nombre) => {
            let name = new Date();
            let fileObj = file.create({
                name: `${nombre}_${name}.json`,
                fileType: file.Type.JSON,
                contents: JSON.stringify(contents),
                folder: 12899,
                isOnline: false
            });
            let id = fileObj.save();
            log.debug('JSONTrack', id)
        }

        return { execute }

    });
