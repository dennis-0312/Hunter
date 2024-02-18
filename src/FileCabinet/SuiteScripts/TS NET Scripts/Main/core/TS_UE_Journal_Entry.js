/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([
    'N/log',
    'N/query',
    'N/record',
    'N/search',
    'N/error',
    '../controller/TS_CM_Controller',
    '../constant/TS_CM_Constant',
],
    /**
 * @param{log} log
 * @param{query} query
 * @param{record} record
 * @param{search} search
 */
    (log, query, record, search, _controller, _constant) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {
            const objRecord = scriptContext.newRecord;
            const eventType = scriptContext.type;
            if (eventType === scriptContext.UserEventType.COPY) {
                try {
                    objRecord.setValue('custbody_num_vale', '');
                } catch (error) {
                    log.error('Error-beforeLoad', 'No es caja chica');
                }
            }
        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
            const objRecord = scriptContext.newRecord;
            const eventType = scriptContext.type;
            let codigocaja = '';
            let correlativo = 0;
            if (eventType === scriptContext.UserEventType.CREATE || eventType === scriptContext.UserEventType.COPY || eventType === scriptContext.UserEventType.EDIT) {
                try {
                    let sql = 'SELECT custrecord_ec_code_report_type as codigocajachica FROM customrecord_ec_report_type WHERE id = ?';
                    let params = [objRecord.getValue('custbody_ec_report_type')]
                    let resultSet = query.runSuiteQL({ query: sql, params: params });
                    let results = resultSet.asMappedResults();
                    results.length > 0 ? codigocaja = results[0]['codigocajachica'] : 0
                    log.debug('CodigoCC', results);
                    if (objRecord.getValue('custbody_num_vale').length == 0 && codigocaja == 'CC') {
                        let sql2 = 'SELECT custrecord_ec_correlativo_vale as correlativo FROM customrecord_ec_number_er WHERE id = ?';
                        let params2 = [objRecord.getValue('custbody_ec_number_er')]
                        let resultSet2 = query.runSuiteQL({ query: sql2, params: params2 });
                        let results2 = resultSet2.asMappedResults();
                        if (results2.length > 0) {
                            correlativo = results2[0]['correlativo'];
                            let correlative = generateCorrelative(Number(correlativo), objRecord.getValue('custbody_ec_number_er'));
                            objRecord.setValue('custbody_num_vale', correlative);
                        }
                    }
                } catch (error) {
                    log.error('Error-beforeSubmit', 'No es caja chica');
                }
            }
        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => { }

        // const getSerie = (documenttype, location, prefix, documentref = 0) => {
        //     let searchLoad = '';
        //     let serieResult = {
        //         'serieid': "",
        //         'peinicio': "",
        //         'serieimpr': ""
        //     }
        //     try {
        //         searchLoad = search.create({
        //             type: 'customrecordts_ec_series_impresion',
        //             filters: [
        //                 ['custrecord_ts_ec_tipo_documento', 'anyof', documenttype],
        //                 'AND',
        //                 ['custrecord_ts_ec_localidad_serie', 'anyof', location]
        //             ],
        //             columns: [
        //                 { name: 'internalid', sort: search.Sort.ASC },
        //                 'custrecord_ts_ec_rango_inicial',
        //                 'custrecord_ts_ec_series_impresion',
        //                 search.createColumn({ name: "custrecordts_ec_iniciales_tip_comprob", join: "custrecord_ts_ec_tipo_documento", label: "Status" }),
        //             ]
        //         });
        //         const searchResult = searchLoad.run().getRange({ start: 0, end: 1 });
        //         if (searchResult.length) {
        //             const column01 = searchResult[0].getValue(searchLoad.columns[0]);
        //             let column02 = searchResult[0].getValue(searchLoad.columns[1]);
        //             let column03 = searchResult[0].getValue(searchLoad.columns[2]);
        //             let column04 = searchResult[0].getValue(searchLoad.columns[3]);
        //             column03 = column04 + '-' + column03;
        //             column02 = parseInt(column02);
        //             return {
        //                 'serieid': column01,
        //                 'peinicio': column02,
        //                 'serieimpr': column03
        //             };
        //         }
        //     } catch (error) {
        //         log.error({ title: 'getPeSerie', details: error });
        //     }
        //     return serieResult;
        // }

        const generateCorrelative = (return_pe_inicio, serieid) => {
            let ceros;
            let correlative;
            let this_number = return_pe_inicio + 1;

            log.error("generateCorrelative", { return_pe_inicio, serieid });
            const next_number = this_number
            log.error('afterSubmit', next_number);
            record.submitFields({ type: 'customrecord_ec_number_er', id: serieid, values: { 'custrecord_ec_correlativo_vale': next_number } });

            if (this_number.toString().length == 1) {
                ceros = '000000';
            } else if (this_number.toString().length == 2) {
                ceros = '00000';
            } else if (this_number.toString().length == 3) {
                ceros = '0000';
            } else if (this_number.toString().length == 4) {
                ceros = '000';
            } else if (this_number.toString().length == 5) {
                ceros = '00';
            } else if (this_number.toString().length = 6) {
                ceros = '0';
            } else if (this_number.toString().length >= 7) {
                ceros = '';
            }

            correlative = ceros + this_number;
            return correlative;
        }

        return { beforeLoad, beforeSubmit, afterSubmit }

    });
