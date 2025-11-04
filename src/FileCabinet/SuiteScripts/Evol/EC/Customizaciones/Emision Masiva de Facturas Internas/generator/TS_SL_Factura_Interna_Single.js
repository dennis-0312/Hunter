/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/https', 'N/log', 'N/record', 'N/runtime', 'N/search', 'N/file', '../lib/TS_CM_Factura_Interna'],
    /**
 * @param{https} https
 * @param{log} log
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 */
    (https, log, record, runtime, search, file, _lib) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            try {
                let method = scriptContext.request.method;
                if (method == 'GET') {
                    let contentResults = new Array();
                    let contadorProcesados = 1;
                    let cantidadTotalRegistrosProcesados = 0;
                    let recordId = scriptContext.request.parameters.recordId;
                    log.error('recordId', recordId)
                    if (!verifyProcessServiceOrder(recordId)) {
                        let retorno = _lib.creacionFacturaInterna(recordId, cantidadTotalRegistrosProcesados, contadorProcesados, contentResults)
                        log.error('recordId', retorno);
                    }

                }
            } catch (error) {
                log.error('Error', error);
            }
        }

        const verifyProcessServiceOrder = (recordId) => {
            let jsonBulkFiles = new Array();
            let jsonServicesOrdersCheck = new Array();
            let existe = false;
            let loteSearchObj = search.create({
                type: "customrecord_ht_cr_fac_inter_lote",
                filters:
                    [
                        ["custrecord_ht_fibulk_estado", "anyof", "3", "4"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "custrecord_ht_fibulk_input", label: "Respuesta JSON" })
                    ]
            });
            //let searchResultCount = loteSearchObj.runPaged().count;
            //log.debug("loteSearchObj result count", searchResultCount);
            let pagedData = loteSearchObj.runPaged({ pageSize: 1000 });
            pagedData.pageRanges.forEach((pageRange) => {
                var myPage = pagedData.fetch({ index: pageRange.index });
                myPage.data.forEach((result) => {
                    let jsonFileInput = result.getValue('custrecord_ht_fibulk_input');
                    jsonBulkFiles.push(jsonFileInput);
                    return true;
                });
            });

            if (jsonBulkFiles.length > 0) {
                for (let index = 0; index < jsonBulkFiles.length; index++) {
                    const element = jsonBulkFiles[index];
                    let fileObj = file.load({ id: element });
                    if (fileObj.size < 10485760) {
                        //log.debug("fileObj.getContents()nt", fileObj.getContents());
                        //jsonServicesOrdersCheck.push(fileObj.getContents());
                        if (fileObj.getContents().includes(recordId)) {
                            existe = true;
                            break;
                        }
                    }
                }
            }
            log.debug('existe', existe);
            return existe;
        }

        return { onRequest }

    });
