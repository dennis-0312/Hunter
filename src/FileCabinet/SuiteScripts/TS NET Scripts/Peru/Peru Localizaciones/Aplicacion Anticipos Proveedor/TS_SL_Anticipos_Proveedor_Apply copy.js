/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
    'N/config',
    'N/file',
    'N/log',
    'N/query',
    'N/record',
    'N/redirect',
    'N/runtime',
    'N/search',
    'N/task',
    'N/ui/dialog',
    'N/ui/message',
    'N/ui/serverWidget',
    './config'
],
    /**
 * @param{config} config
 * @param{file} file
 * @param{log} log
 * @param{query} query
 * @param{record} record
 * @param{redirect} redirect
 * @param{runtime} runtime
 * @param{search} search
 * @param{task} task
 * @param{dialog} dialog
 * @param{message} message
 * @param{serverWidget} serverWidget
 */
    (config, file, log, query, record, redirect, runtime, search, task, dialog, message, serverWidget, _config) => {
        let ENVIROMENT = '';
        let SUBSIDIARY = '';
        let EXPENSE_ACCOUNT = '';
        let TAX_CODE = '';
        let DOCUMENT_TYPE = '';
        const userRecord = runtime.getCurrentUser();
        const currentScript = runtime.getCurrentScript();


        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */

        const onRequest = (scriptContext) => {
            ENVIROMENT = configEnviroment();
            SUBSIDIARY = runtime.getCurrentScript().getParameter({ name: 'custscript_ts_pe_sl_subsidiary' });
            EXPENSE_ACCOUNT = runtime.getCurrentScript().getParameter({ name: 'custscript_ts_pe_sl_expense_account' });
            TAX_CODE = runtime.getCurrentScript().getParameter({ name: 'custscript_ts_pe_sl_tax_code' });
            DOCUMENT_TYPE = runtime.getCurrentScript().getParameter({ name: 'custscript_ts_pe_sl_document_type' });
            let deploymentId = currentScript.deploymentId;
            if (deploymentId == "customdeploy_ts_sl_anticipo_vendor_apply") {
                if (scriptContext.request.method == 'GET') {
                    // log.debug('userRecord', userRecord);
                    mainView(scriptContext);
                } else {
                    processData(scriptContext);
                }
            }
        }

        //* ---------------------------- IDENTIFICACION DE AMBIENTE ---------------------------- */
        const configEnviroment = () => {
            let companyid = config.load({ type: config.Type.COMPANY_INFORMATION }).getValue({ fieldId: 'companyid' });
            return companyid.includes('SB') ? _config.SANDBOX : _config.PRODUCTION
        }

        //* ---------------------------- PROCESO COMPARACION DE REPORTES SIRE VISTA ---------------------------- */
        const mainView = (scriptContext) => {
            //& ---------------------------- VARIABLES GENERALES ---------------------------- */
            let optionsContent = '';
            let htmlContentObjectData = '';
            let custpage_currency_field_content = '';
            let custpage_subsidiary_field_content = '';


            //& ---------------------------- RECUPERACION DE PARAMETROS ---------------------------- */
            const amount = scriptContext.request.parameters.custpage_amount_field;
            const currency = scriptContext.request.parameters.custpage_currency_field;
            log.debug('Params', `amount: ${amount} - currency: ${currency}`);


            //& ---------------------------- CARGA HTML ---------------------------- */
            let htmlFile = file.load({ id: ENVIROMENT.VARIABLES.FILE_INDEX });
            let htmlContent = htmlFile.getContents();


            //& ---------------------------- CARGA DE SELECT SUBSIADIARIA ---------------------------- */
            let subsidiaries = getSubsidiaries(SUBSIDIARY);
            htmlContent = htmlContent.replace('_custpage_subsidiary_field_value_', subsidiaries);


            //& ---------------------------- CARGA DE SELECT MONEDA ---------------------------- */
            let arrayCurrencies = getCurrencies();
            //log.debug('arrayCurrencies', arrayCurrencies)
            for (let i = 0; i < arrayCurrencies.length; i++) {
                const element = arrayCurrencies[i];
                custpage_currency_field_content += `<option value="${element.id}">${element.name}</option>`
            }
            htmlContent = htmlContent.replace('<!--optionsContentCurrencies-->', custpage_currency_field_content);


            //& ---------------------------- CARGA DATA ---------------------------- */
            if (amount) {
                let anticiposAbiertos = getAnticipos(amount, currency);
                let anticiposParciales = getAnticiposPartiallyApplied(amount, currency);
                log.debug('anticiposAbiertos', anticiposAbiertos);
                log.debug('anticiposParciales', anticiposParciales);

                const arregloUnido = anticiposParciales.concat(anticiposAbiertos);
                htmlContentObjectData = `datos = ${JSON.stringify(arregloUnido)};`;
                htmlContent = htmlContent.replace(/\/\/<!--htmlContentObjectData-->/g, htmlContentObjectData);

                // Devolver JSON
                scriptContext.response.setHeader({
                    name: 'Content-Type',
                    value: 'application/json',
                });
                scriptContext.response.write(JSON.stringify(arregloUnido));
                return;
            }


            //& ---------------------------- CARGA HTML AL SUITELET ---------------------------- */
            /// Si no hay parámetros, devolver el HTML normal
            // htmlFile = file.load({ id: ENVIROMENT.VARIABLES.FILE_INDEX });
            // htmlContent = htmlFile.getContents();
            scriptContext.response.write(htmlContent);
        }


        //* ---------------------------- PROCESO DE CREACIÓN DE FACTURAS Y APLICACION ---------------------------- */
        const processData = (scriptContext) => {
            try {
                const body = scriptContext.request.body;

                if (body) {
                    const datosSeleccionados = JSON.parse(body);
                    if (datosSeleccionados.length > 0) {
                        procesarDatosSeleccionados(datosSeleccionados);
                    } else {
                        log.debug('Debug', 'No se ingresaron datos.')
                    }

                    // Responder con un mensaje de éxito en formato JSON
                    scriptContext.response.setHeader({
                        name: 'Content-Type',
                        value: 'application/json',
                    });
                    scriptContext.response.write(JSON.stringify({ success: true, message: 'Datos procesados correctamente' }));
                } else {
                    // Responder con un error en formato JSON
                    scriptContext.response.setHeader({
                        name: 'Content-Type',
                        value: 'application/json',
                    });
                    scriptContext.response.write(JSON.stringify({ success: false, message: 'No se recibieron datos' }));
                }
            } catch (error) {
                log.error('Error al procesar los datos:', error);
                // Responder con un error en formato JSON
                scriptContext.response.setHeader({
                    name: 'Content-Type',
                    value: 'application/json',
                });
                scriptContext.response.write(JSON.stringify({ success: false, message: 'Error al procesar los datos' }));
            }
        }


        //~ ---------------------------- FUNCIONES CARGAR Y PROCESS DATA ---------------------------- */
        const getAnticipos = (amount, currency) => {
            const data = [];
            let vendorprepaymentSearchObj = search.create({
                type: "vendorprepayment",
                settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
                filters:
                    [
                        ["type", "anyof", "VPrep"],
                        "AND",
                        ["status", "anyof", "VPrep:B"],
                        "AND",
                        ["mainline", "is", "T"],
                        "AND",
                        ["fxamount", "lessthan", amount],
                        "AND",
                        ["currency", "anyof", currency],
                        "AND",
                        ["subsidiary", "anyof", SUBSIDIARY]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "0 Internal ID" }),
                        search.createColumn({ name: "tranid", label: "1 Document Number" }),
                        search.createColumn({ name: "trandate", label: "2 Date" }),
                        search.createColumn({ name: "entity", label: "3 Name" }),
                        search.createColumn({ name: "fxamount", label: "4 Amount" }),
                        search.createColumn({ name: "subsidiarynohierarchy", label: "5 Subsidiary (no hierarchy)" }),
                        search.createColumn({ name: "class", label: "6 Class" }),
                        search.createColumn({ name: "department", label: "7 Department" }),
                        search.createColumn({ name: "location", label: "8 Location" }),
                        search.createColumn({ name: "currency", label: "9 Currency" }),
                    ]
            });
            //let searchResultCount = vendorprepaymentSearchObj.runPaged().count;
            //log.debug("vendorprepaymentSearchObj result count", searchResultCount);
            let pagedData = vendorprepaymentSearchObj.runPaged({ pageSize: 1000 });
            for (let i = 0; i < pagedData.pageRanges.length; i++) {
                let page = pagedData.fetch({ index: pagedData.pageRanges[i].index });
                for (let j = 0; j < page.data.length; j++) {
                    let result = page.data[j];
                    let columns = result.columns;
                    data.push({
                        id: `${result.getValue(columns[0])}`,
                        number: `${result.getValue(columns[1])}`,
                        date: `${result.getValue(columns[2])}`,
                        entity: `${result.getValue(columns[3])}`,
                        status: `Pagada`,
                        amount: `${Math.abs(result.getValue(columns[4]))}`,
                        subsidiary: `${result.getValue(columns[5])}`,
                        clase: `${result.getValue(columns[6])}`,
                        department: `${result.getValue(columns[7])}`,
                        location: `${result.getValue(columns[8])}`,
                        currency: `${result.getValue(columns[9])}`,
                        vendor: `${result.getText(columns[3])}`,
                    });
                }
            }
            return data;
        }

        const getAnticiposPartiallyApplied = (amount, currency) => {
            const data = [];
            var vendorprepaymentapplicationSearchObj = search.create({
                type: "vendorprepaymentapplication",
                settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
                filters:
                    [
                        ["type", "anyof", "VPrepApp"],
                        "AND",
                        ["appliedtotransaction.status", "anyof", "VPrep:E"],
                        "AND",
                        ["formulanumeric: {appliedtotransaction.fxamount} + {fxamount}", "lessthan", amount],
                        "AND",
                        ["currency", "anyof", currency],
                        "AND",
                        ["subsidiary", "anyof", SUBSIDIARY]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", join: "appliedToTransaction", summary: "GROUP", label: "0 Internal ID" }),
                        search.createColumn({ name: "tranid", join: "appliedToTransaction", summary: "GROUP", label: "1 Document Number" }),
                        search.createColumn({ name: "trandate", join: "appliedToTransaction", summary: "GROUP", label: "2 Date" }),
                        search.createColumn({ name: "internalid", join: "vendor", summary: "GROUP", label: "3 Internal ID" }),
                        search.createColumn({ name: "formulacurrency", summary: "SUM", formula: "{appliedtotransaction.fxamount} + {fxamount}", label: "4 Formula (Currency)" }),
                        search.createColumn({ name: "subsidiary", summary: "GROUP", label: "5 Subsidiary" }),
                        search.createColumn({ name: "class", join: "appliedToTransaction", summary: "GROUP", label: "6 Class" }),
                        search.createColumn({ name: "department", join: "appliedToTransaction", summary: "GROUP", label: "7 Department" }),
                        search.createColumn({ name: "location", join: "appliedToTransaction", summary: "GROUP", label: "8 Location" }),
                        search.createColumn({ name: "currency", summary: "GROUP", label: "9 Currency" }),
                        search.createColumn({ name: "altname", join: "vendor", summary: "GROUP", label: "10 Name" }),
                    ]
            });
            //var searchResultCount = vendorprepaymentapplicationSearchObj.runPaged().count;
            //log.debug("vendorprepaymentapplicationSearchObj result count", searchResultCount);
            let pagedData = vendorprepaymentapplicationSearchObj.runPaged({ pageSize: 1000 });
            for (let i = 0; i < pagedData.pageRanges.length; i++) {
                let page = pagedData.fetch({ index: pagedData.pageRanges[i].index });
                for (let j = 0; j < page.data.length; j++) {
                    let result = page.data[j];
                    let columns = result.columns;
                    data.push({
                        id: `${result.getValue(columns[0])}`,
                        number: `${result.getValue(columns[1])}`,
                        date: `${result.getValue(columns[2])}`,
                        entity: `${result.getValue(columns[3])}`,
                        status: `Parcialmente aplicada`,
                        amount: `${Math.abs(result.getValue(columns[4]))}`,
                        subsidiary: `${result.getValue(columns[5])}`,
                        clase: `${result.getValue(columns[6])}`,
                        department: `${result.getValue(columns[7])}`,
                        location: `${result.getValue(columns[8])}`,
                        currency: `${result.getValue(columns[9])}`,
                        vendor: `${result.getValue(columns[10])}`,
                    });
                }
            }
            return data;
        }

        const procesarDatosSeleccionados = (data) => {
            log.debug('data enviada por POST AJAX', data);
            var script = runtime.getCurrentScript();
            var processed = 0;
            var vendorBillId = 0;

            var account = getAccount(data[0].currency);
            log.debug('account', account)
            for (let i = 0; i < data.length; i++) {
                //log.debug(`Índice: ${i}, Entidad: ${data[i].entity}`);
                //Crear una nueva factura de compra
                var remaining = script.getRemainingUsage();
                log.debug('getRemainingUsage', remaining)
                if (remaining < 400) {
                    log.error({
                        title: 'Governance agotado',
                        details: 'Procesados: ' + processed + '/ ' + data.length
                    });
                    break;
                }
                try {
                    var vendorBill = record.create({ type: record.Type.VENDOR_BILL, isDynamic: true });
                    vendorBill.setValue({ fieldId: 'entity', value: data[i].entity });
                    vendorBill.setValue({ fieldId: 'currency', value: data[i].currency });
                    vendorBill.setValue({ fieldId: 'trandate', value: new Date() });
                    vendorBill.setValue({ fieldId: 'duedate', value: new Date() });
                    vendorBill.setValue({ fieldId: 'approvalstatus', value: 2 });
                    vendorBill.setValue({ fieldId: 'memo', value: `Factura para netear saldo.` });
                    vendorBill.setValue({ fieldId: 'class', value: data[i].clase });
                    vendorBill.setValue({ fieldId: 'department', value: data[i].department });
                    vendorBill.setValue({ fieldId: 'location', value: data[i].location });
                    vendorBill.setValue({ fieldId: 'custbody_pe_document_type', value: DOCUMENT_TYPE });
                    vendorBill.setValue({ fieldId: 'custbody_pe_serie_cxp', value: 'FF01' });
                    vendorBill.setValue({ fieldId: 'custbody_pe_number', value: data[i].id });

                    vendorBill.selectNewLine({ sublistId: 'expense' });
                    vendorBill.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'account', value: EXPENSE_ACCOUNT });
                    vendorBill.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'amount', value: data[i].amount });
                    vendorBill.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'taxcode', value: TAX_CODE });
                    vendorBill.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'class', value: data[i].clase });
                    vendorBill.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'department', value: data[i].department });
                    vendorBill.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'location', value: data[i].location });
                    vendorBill.commitLine({ sublistId: 'expense' });

                    vendorBillId = vendorBill.save({ enableSourcing: false, ignoreMandatoryFields: true });
                    log.debug('Empezando creación de aplicación de anticipo a la factura creada', 'ID: ' + vendorBillId);

                    var vendorPrepaymentApplication = record.transform({
                        fromType: record.Type.VENDOR_PREPAYMENT,
                        fromId: data[i].id,
                        toType: record.Type.VENDOR_PREPAYMENT_APPLICATION,
                        isDynamic: true
                    });
                    vendorPrepaymentApplication.setValue({ fieldId: 'account', value: account[0].custrecord_ts_pe_bank_account });
                    vendorPrepaymentApplication.setValue({ fieldId: 'memo', value: `Aplicación para netear saldo.` });

                    let linecountBill = vendorPrepaymentApplication.getLineCount({ sublistId: 'bill' });
                    //log.debug('linecountBill', linecountBill)
                    for (let j = 0; j < linecountBill; j++) {
                        let billId = vendorPrepaymentApplication.getSublistValue({ sublistId: 'bill', fieldId: 'doc', line: j });
                        // log.debug('billId', `${billId} - ${data[i].id} - ${j}`);
                        if (billId == vendorBillId) {
                            //log.debug('billId-Apply', `${billId} - ${data[i].id} - ${j}`);
                            vendorPrepaymentApplication.selectLine({ sublistId: 'bill', line: j });
                            vendorPrepaymentApplication.setCurrentSublistValue({ sublistId: 'bill', fieldId: 'apply', value: true });
                            vendorPrepaymentApplication.commitLine({ sublistId: 'bill' });
                            break;
                        }
                    }

                    var vendorPrepaymentApplicationId = vendorPrepaymentApplication.save({ enableSourcing: false, ignoreMandatoryFields: true });
                    log.debug('plicación de anticipo creada', 'ID: ' + vendorPrepaymentApplicationId);

                    processed++

                } catch (error) {
                    log.error(`Error en el anticipo: ${data[i].id}`, error);
                    if (vendorBillId != 0) {
                        try {
                            record.delete({ type: record.Type.VENDOR_BILL, id: vendorBillId });
                            log.debug({ title: 'Registro eliminado', details: 'Se eliminó el cliente con ID: ' + vendorBillId });
                        } catch (e) {
                            log.error({ title: 'Error al eliminar registro', details: e });
                        }
                    }
                }
            }
        }

        const getCurrencies = () => {
            let sql = `SELECT id, name FROM currency WHERE isinactive = 'F'`;
            let resultSet = query.runSuiteQL({ query: sql, params: [] });
            let results = resultSet.asMappedResults();
            if (results.length > 0) {
                return results
            } else {
                return 0;
            }
        }

        const getSubsidiaries = (internalId) => {
            var searchResults = search.create({
                type: "subsidiary",
                filters: [
                    ['internalid', 'is', internalId]
                ],
                columns:
                    [
                        search.createColumn({ name: "namenohierarchy", label: "Name (no hierarchy)" })
                    ]
            }).run().getRange({ start: 0, end: 1 });;
            if (searchResults.length > 0) {
                return searchResults[0].getValue('namenohierarchy'); // Cambia 'name' por la columna correcta
            } else {
                return null;
            }
        }

        const getAccount = (currency) => {
            let sql = `SELECT custrecord_ts_pe_bank_account FROM customrecord_ts_pe_account_inv_pre_apply WHERE isinactive = 'F' AND custrecord_ts_pe_currency = ?`;
            let resultSet = query.runSuiteQL({ query: sql, params: [currency] });
            let results = resultSet.asMappedResults();
            if (results.length > 0) {
                return results
            } else {
                return 0;
            }
        }


        const csvToJson = (csvString) => {
            const lines = csvString.split("\n");
            const headers = lines[0].split(",");
            const jsonArray = [];

            for (let i = 1; i < lines.length; i++) {
                const row = lines[i].split(",");
                if (row.length === headers.length) {
                    const jsonObject = {};
                    row.forEach((value, index) => {
                        jsonObject[`campo${index + 1}`] = value.trim();
                    });
                    jsonArray.push(jsonObject);
                }
            }
            return jsonArray;
        }


        const obtenerFechasDelMes = (cadena) => {
            //const cadena = "FY 2023 : Q1 2023 : Ene 2023";
            // Usar una expresión regular para encontrar "Ene 2023"
            const regex = /(\b[A-Za-z]{3}\s\d{4}\b)/;
            const resultado = cadena.match(regex);

            if (resultado) {
                log.debug(resultado[0]); // "Ene 2023"
                // Mapeo de nombres de meses a sus números
                nombreMes = resultado[0].split(" ")[0]
                anio = resultado[0].split(" ")[1]
                const meses = {
                    "ene": 1,
                    "feb": 2,
                    "mar": 3,
                    "abr": 4,
                    "may": 5,
                    "jun": 6,
                    "jul": 7,
                    "ago": 8,
                    "sep": 9,
                    "oct": 10,
                    "nov": 11,
                    "dic": 12
                };

                // Obtener el número del mes
                const mes = meses[nombreMes.toLowerCase()];
                // Validar si el mes es válido
                if (!mes) {
                    return false
                }
                // Fecha de inicio (primer día del mes)
                const fechaInicio = new Date(anio, mes - 1, 1); // mes - 1 porque los meses en JS son 0-indexed
                // Fecha de fin (último día del mes)
                const fechaFin = new Date(anio, mes, 0); // El día 0 del siguiente mes da el último día del mes actual
                // Formatear las fechas a "DD/MM/YYYY"
                const fechaInicioFormateada = fechaInicio.toISOString().split('T')[0].split('-').reverse().join('/');
                const fechaFinFormateada = fechaFin.toISOString().split('T')[0].split('-').reverse().join('/');
                return [fechaInicioFormateada, fechaFinFormateada];
            } else {
                log.debug("No se encontró el mes y año.");
                return false
            }
        }

        return { onRequest }

    });




