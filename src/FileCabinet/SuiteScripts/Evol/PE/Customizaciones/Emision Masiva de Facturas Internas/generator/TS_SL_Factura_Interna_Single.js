/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/https', 'N/log', 'N/record', 'N/runtime', 'N/search', '../lib/TS_CM_Factura_Interna'],
    /**
 * @param{https} https
 * @param{log} log
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 */
    (https, log, record, runtime, search, _lib) => {
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
                    let retorno = _lib.creacionFacturaInterna(recordId, cantidadTotalRegistrosProcesados, contadorProcesados, contentResults)
                    log.error('recordId', retorno);
                }
            } catch (error) {
                log.error('Error', error);
            }
        }

        return { onRequest }

    });
