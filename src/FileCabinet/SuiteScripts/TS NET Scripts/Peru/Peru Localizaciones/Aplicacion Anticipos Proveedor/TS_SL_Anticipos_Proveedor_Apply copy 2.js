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
    (config, file, log, query, record, redirect, runtime, search, task, dialog, message, serverWidget, _config) => {
        let ENVIROMENT = '';
        let SUBSIDIARY = '';
        let EXPENSE_ACCOUNT = '';
        let TAX_CODE = '';
        let DOCUMENT_TYPE = '';
        const userRecord = runtime.getCurrentUser();
        const currentScript = runtime.getCurrentScript();
        const BATCH_SIZE = 50; // Tamaño del lote para procesamiento

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
                    if (scriptContext.request.parameters.batchProcessing === 'true') {
                        processBatch(scriptContext);
                    } else {
                        mainView(scriptContext);
                    }
                } else {
                    processData(scriptContext);
                }
            }
        }

        //* ---------------------------- IDENTIFICACION DE AMBIENTE ---------------------------- */
        const configEnviroment = () => {
            let companyid = config.load({ type: config.Type.COMPANY_INFORMATION }).getValue({ fieldId: 'companyid' });
            return companyid.includes('SB') ? _config.SANDBOX : _config.PRODUCTION;
        }

        //* ---------------------------- VISTA PRINCIPAL ---------------------------- */
        const mainView = (scriptContext) => {
            //& ---------------------------- VARIABLES GENERALES ---------------------------- */
            let optionsContent = '';
            let htmlContentObjectData = '';
            //let custpage_currency_field_content = '';
            let custpage_subsidiary_field_content = '';


            //& ---------------------------- RECUPERACION DE PARAMETROS ---------------------------- */
            const amount = scriptContext.request.parameters.custpage_amount_field;
            const currency = scriptContext.request.parameters.custpage_currency_field;
            //log.debug('Params', `amount: ${amount} - currency: ${currency}`);
            let htmlFile = file.load({ id: ENVIROMENT.VARIABLES.FILE_INDEX });
            let htmlContent = htmlFile.getContents();

            // Carga de selects
            htmlContent = htmlContent.replace('_custpage_subsidiary_field_value_', getSubsidiaries(SUBSIDIARY));

            // Carga de monedas
            let custpage_currency_field_content = '';
            let arrayCurrencies = getCurrencies();
            for (let i = 0; i < arrayCurrencies.length; i++) {
                custpage_currency_field_content += `<option value="${arrayCurrencies[i].id}">${arrayCurrencies[i].name}</option>`;
            }
            htmlContent = htmlContent.replace('<!--optionsContentCurrencies-->', custpage_currency_field_content);

            //& ---------------------------- CARGA DATA ---------------------------- */
            if (amount) {
                let anticiposAbiertos = getAnticipos(amount, currency);
                let anticiposParciales = getAnticiposPartiallyApplied(amount, currency);
                //log.debug('anticiposAbiertos', anticiposAbiertos);
                //log.debug('anticiposParciales', anticiposParciales);

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

            scriptContext.response.write(htmlContent);
        }

        //* ---------------------------- FUNCIONES PARA OBTENER DATOS ---------------------------- */

        /**
         * Obtiene anticipos abiertos (no aplicados)
         * @param {number} amount - Monto máximo a buscar
         * @param {string} currency - Moneda de los anticipos
         * @returns {Array} Lista de anticipos abiertos
         */
        const getAnticipos = (amount, currency) => {
            const data = [];
            try {
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
            } catch (e) {
                log.error("Error en getAnticipos", e);
            }
            return data;
        }

        /**
         * Obtiene anticipos parcialmente aplicados
         * @param {number} amount - Monto máximo a buscar
         * @param {string} currency - Moneda de los anticipos
         * @returns {Array} Lista de anticipos parcialmente aplicados
         */
        const getAnticiposPartiallyApplied = (amount, currency) => {
            const data = [];
            try {
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
            } catch (e) {
                log.error("Error en getAnticiposPartiallyApplied", e);
            }
            return data;
        }

        //* ---------------------------- PROCESAMIENTO DE DATOS ---------------------------- */
        const processData = (scriptContext) => {
            try {
                const body = scriptContext.request.body;
                log.debug('data enviada por POST AJAX', body);

                if (body) {
                    const datosSeleccionados = JSON.parse(body);

                    if (datosSeleccionados.length > 0) {
                        // Para más de BATCH_SIZE registros, usar procesamiento por lotes
                        if (datosSeleccionados.length > BATCH_SIZE) {
                            const htmlResponse = `
                                <!DOCTYPE html>
                                <html>
                                <head>
                                    <title>Procesamiento por Lotes</title>
                                    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
                                    <style>
                                        .progress-container {
                                            width: 100%;
                                            background-color: #f3f3f3;
                                            margin: 20px 0;
                                        }
                                        .progress-bar {
                                            height: 30px;
                                            background-color: #4CAF50;
                                            text-align: center;
                                            line-height: 30px;
                                            color: white;
                                            width: 0%;
                                        }
                                        .log-container {
                                            margin-top: 20px;
                                            padding: 10px;
                                            border: 1px solid #ddd;
                                            height: 200px;
                                            overflow-y: scroll;
                                        }
                                    </style>
                                </head>
                                <body>
                                    <h2>Procesando ${datosSeleccionados.length} registros</h2>
                                    <div class="progress-container">
                                        <div id="progressBar" class="progress-bar">0%</div>
                                    </div>
                                    <div id="logContainer" class="log-container"></div>
                                    <script>
                                        $(document).ready(function() {
                                            const totalRecords = ${datosSeleccionados.length};
                                            let processed = 0;
                                            let offset = 0;
                                            const batchSize = ${BATCH_SIZE};
                                            const batchData = JSON.parse('${JSON.stringify(datosSeleccionados).replace(/'/g, "\\'")}');
                                            
                                            function processNextBatch() {
                                                $('#logContainer').append('<p>Procesando lote ' + (offset + 1) + ' a ' + Math.min(offset + batchSize, totalRecords) + '...</p>');
                                                
                                                $.ajax({
                                                    url: '/app/site/hosting/scriptlet.nl?script=${currentScript.id}&deploy=${currentScript.deploymentId}&batchProcessing=true',
                                                    type: 'GET',
                                                    data: {
                                                        offset: offset,
                                                        batchData: JSON.stringify(batchData)
                                                    },
                                                    success: function(response) {
                                                        if (response.success) {
                                                            processed += response.processed;
                                                            const progress = Math.round((response.totalProcessed / totalRecords) * 100);
                                                            $('#progressBar').css('width', progress + '%').text(progress + '%');
                                                            $('#logContainer').append('<p>' + response.message + ' - Progreso: ' + progress + '%</p>');
                                                            
                                                            if (response.hasMore) {
                                                                offset = response.nextOffset;
                                                                setTimeout(processNextBatch, 1000); // Pequeña pausa entre lotes
                                                            } else {
                                                                $('#logContainer').append('<p style="color: green;">Proceso completado exitosamente!</p>');
                                                            }
                                                        } else {
                                                            $('#logContainer').append('<p style="color: red;">Error: ' + response.message + '</p>');
                                                        }
                                                    },
                                                    error: function(xhr, status, error) {
                                                        $('#logContainer').append('<p style="color: red;">Error en la solicitud: ' + error + '</p>');
                                                    }
                                                });
                                            }
                                            
                                            processNextBatch();
                                        });
                                    </script>
                                </body>
                                </html>
                            `;

                            scriptContext.response.write(htmlResponse);
                            return;
                        } else {
                            // Procesamiento directo para menos de BATCH_SIZE registros
                            const results = procesarDatosSeleccionados(datosSeleccionados);

                            scriptContext.response.setHeader({
                                name: 'Content-Type',
                                value: 'application/json',
                            });

                            scriptContext.response.write(JSON.stringify({
                                success: true,
                                processed: results.processed,
                                totalRecords: datosSeleccionados.length,
                                message: 'Procesamiento completado'
                            }));
                            return;
                        }
                    }
                }

                // Respuesta por defecto si no hay datos
                scriptContext.response.setHeader({
                    name: 'Content-Type',
                    value: 'application/json',
                });
                scriptContext.response.write(JSON.stringify({ success: false, message: 'No se recibieron datos' }));

            } catch (error) {
                log.error('Error en processData', error);

                scriptContext.response.setHeader({
                    name: 'Content-Type',
                    value: 'application/json',
                });
                scriptContext.response.write(JSON.stringify({
                    success: false,
                    message: 'Error al procesar los datos',
                    error: error.toString()
                }));
            }
        }

        //* ---------------------------- PROCESO POR LOTES ---------------------------- */
        const processBatch = (scriptContext) => {
            const offset = parseInt(scriptContext.request.parameters.offset) || 0;
            const batchData = JSON.parse(scriptContext.request.parameters.batchData || '[]');

            try {
                const results = procesarDatosSeleccionados(batchData, offset, BATCH_SIZE);

                scriptContext.response.setHeader({
                    name: 'Content-Type',
                    value: 'application/json',
                });

                scriptContext.response.write(JSON.stringify({
                    success: true,
                    processed: results.processed,
                    totalProcessed: offset + results.processed,
                    totalRecords: batchData.length,
                    hasMore: (offset + BATCH_SIZE) < batchData.length,
                    nextOffset: offset + BATCH_SIZE,
                    message: `Procesado lote ${offset} a ${offset + results.processed}`
                }));
            } catch (error) {
                log.error('Error en processBatch', error);

                scriptContext.response.setHeader({
                    name: 'Content-Type',
                    value: 'application/json',
                });

                scriptContext.response.write(JSON.stringify({
                    success: false,
                    message: 'Error al procesar el lote',
                    error: error.toString()
                }));
            }
        }

        //* ---------------------------- FUNCIÓN PRINCIPAL DE PROCESAMIENTO ---------------------------- */
        const procesarDatosSeleccionados = (data, offset = 0, limit = data.length) => {
            let processed = 0;
            const end = Math.min(offset + limit, data.length);
            const accountCache = {}; // Cache para cuentas bancarias
            var vendorBillId = 0;

            for (let i = offset; i < end; i++) {
                const remaining = runtime.getCurrentScript().getRemainingUsage();
                log.debug('getRemainingUsage', remaining)
                if (remaining < 400) {
                    log.error({
                        title: 'Governance agotado',
                        details: `Procesados: ${processed}/${data.length}`
                    });
                    break;
                }

                const item = data[i];
                try {
                    let account;

                    // Usar cache para evitar búsquedas repetidas
                    if (!accountCache[item.currency]) {
                        const accountResult = getAccount(item.currency);
                        if (accountResult && accountResult.length > 0) {
                            accountCache[item.currency] = accountResult[0].custrecord_ts_pe_bank_account;
                        }
                    }
                    account = accountCache[item.currency];

                    // Crear factura
                    const vendorBill = record.create({ type: record.Type.VENDOR_BILL, isDynamic: true });
                    vendorBill.setValue({ fieldId: 'entity', value: item.entity });
                    vendorBill.setValue({ fieldId: 'currency', value: item.currency });
                    vendorBill.setValue({ fieldId: 'trandate', value: new Date() });
                    vendorBill.setValue({ fieldId: 'duedate', value: new Date() });
                    vendorBill.setValue({ fieldId: 'approvalstatus', value: 2 });
                    vendorBill.setValue({ fieldId: 'memo', value: `Factura para netear saldo.` });
                    vendorBill.setValue({ fieldId: 'class', value: item.clase });
                    vendorBill.setValue({ fieldId: 'department', value: item.department });
                    vendorBill.setValue({ fieldId: 'location', value: item.location });
                    vendorBill.setValue({ fieldId: 'custbody_pe_document_type', value: DOCUMENT_TYPE });
                    vendorBill.setValue({ fieldId: 'custbody_pe_serie_cxp', value: 'FF01' });
                    vendorBill.setValue({ fieldId: 'custbody_pe_number', value: item.id });

                    vendorBill.selectNewLine({ sublistId: 'expense' });
                    vendorBill.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'account', value: EXPENSE_ACCOUNT });
                    vendorBill.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'amount', value: item.amount });
                    vendorBill.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'taxcode', value: TAX_CODE });
                    vendorBill.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'class', value: item.clase });
                    vendorBill.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'department', value: item.department });
                    vendorBill.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'location', value: item.location });
                    vendorBill.commitLine({ sublistId: 'expense' });

                    vendorBillId = vendorBill.save({ enableSourcing: false, ignoreMandatoryFields: true });
                    log.debug('FACTURA', 'FACTURA: ' + vendorBillId);

                    // Crear aplicación de anticipo
                    const vendorPrepaymentApplication = record.transform({
                        fromType: record.Type.VENDOR_PREPAYMENT,
                        fromId: item.id,
                        toType: record.Type.VENDOR_PREPAYMENT_APPLICATION,
                        isDynamic: true
                    });

                    vendorPrepaymentApplication.setValue({ fieldId: 'account', value: account });
                    vendorPrepaymentApplication.setValue({ fieldId: 'memo', value: `Aplicación para netear saldo.` });

                    const linecountBill = vendorPrepaymentApplication.getLineCount({ sublistId: 'bill' });
                    for (let j = 0; j < linecountBill; j++) {
                        const billId = vendorPrepaymentApplication.getSublistValue({ sublistId: 'bill', fieldId: 'doc', line: j });
                        if (billId == vendorBillId) {
                            vendorPrepaymentApplication.selectLine({ sublistId: 'bill', line: j });
                            vendorPrepaymentApplication.setCurrentSublistValue({ sublistId: 'bill', fieldId: 'apply', value: true });
                            vendorPrepaymentApplication.commitLine({ sublistId: 'bill' });
                            break;
                        }
                    }

                    const vendorPrepaymentApplicationId = vendorPrepaymentApplication.save({ enableSourcing: false, ignoreMandatoryFields: true });
                    log.debug('APLICACIÓN', 'APLICACIÓN: ' + vendorPrepaymentApplicationId);
                    logCreate(item.id, 'Completado', 'Aplicación aplicada correctamente.');
                    processed++;
                } catch (error) {
                    log.error(`Error procesando registro ${i} (ID: ${item.id})`, error);
                    if (vendorBillId != 0) {
                        try {
                            record.delete({ type: record.Type.VENDOR_BILL, id: vendorBillId });
                            log.debug({ title: 'Registro eliminado', details: 'Se eliminó el cliente con ID: ' + vendorBillId });
                        } catch (e) {
                            log.error({ title: 'Error al eliminar registro', details: e });
                            logCreate(item.id, 'Error', JSON.stringify(e));
                        }
                    }
                    logCreate(item.id, 'Error', JSON.stringify(error));
                    // Continuar con el siguiente registro
                }
            }

            return { processed };
        }

        //* ---------------------------- FUNCIONES AUXILIARES ---------------------------- */
        const getCurrencies = () => {
            let sql = `SELECT id, name FROM currency WHERE isinactive = 'F'`;
            let resultSet = query.runSuiteQL({ query: sql, params: [] });
            return resultSet.asMappedResults();
        }

        const getSubsidiaries = (internalId) => {
            var searchResults = search.create({
                type: "subsidiary",
                filters: [
                    ['internalid', 'is', internalId]
                ],
                columns: [
                    search.createColumn({ name: "namenohierarchy", label: "Name (no hierarchy)" })
                ]
            }).run().getRange({ start: 0, end: 1 });

            return searchResults.length > 0 ? searchResults[0].getValue('namenohierarchy') : null;
        }

        const getAccount = (currency) => {
            let sql = `SELECT custrecord_ts_pe_bank_account FROM customrecord_ts_pe_account_inv_pre_apply WHERE isinactive = 'F' AND custrecord_ts_pe_currency = ?`;
            let resultSet = query.runSuiteQL({ query: sql, params: [currency] });
            return resultSet.asMappedResults();
        }

        const logCreate = (prepaymentId, estado, detail) => {
            //log.debug('logCreateParams', `${prepaymentId}, ${estado}, ${detail}`)
            const recordLog = record.create({ type: 'customrecord_ts_pe_log_prepayment_apply', isDynamic: true });
            recordLog.setValue({ fieldId: 'custrecord_ts_pe_prepayment', value: prepaymentId });
            recordLog.setValue({ fieldId: 'custrecord_ts_pe_status', value: estado });
            recordLog.setValue({ fieldId: 'custrecord_ts_pe_detail', value: detail });
            recordLog.save();
        }

        return { onRequest }
    });