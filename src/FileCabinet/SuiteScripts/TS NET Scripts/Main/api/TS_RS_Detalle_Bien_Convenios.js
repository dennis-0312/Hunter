/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/record', 'N/search'], (log, record, search) => {
    const HT_DETALLE_BIENES_RECORD = 'customrecord_ht_formulario_detallebienes'; //HT Detalle de Bienes

    const _get = (context) => {
        log.debug('Request-GET', context);
        try {
            // let objRecord = record.create({ type: HT_DETALLE_BIENES_RECORD });
            // objRecord.setValue({ fieldId: 'custrecord_ht_db_enlace', value: context.serviceOrder });
            // objRecord.setValue({ fieldId: 'custrecord_ht_db_bien', value: context.bien });
            // objRecord.setValue({ fieldId: 'custrecord_ht_db_item', value: context.item });
            // let response = objRecord.save();
            // log.debug('Record', response);
            return context;
        } catch (error) {
            log.error('Error', error);
        }
    }

    const _post = (context) => {
        log.debug('Request-POST', context);
        //log.debug('Request-POST-typeof', typeof context);
        const jsonResponse = new Array();
        try {
            for (let i in context) {
                let objRecord = record.create({ type: HT_DETALLE_BIENES_RECORD });
                objRecord.setValue({ fieldId: 'custrecord_ht_db_enlace', value: context[i].id });
                objRecord.setValue({ fieldId: 'custrecord_ht_db_bien', value: context[i].bien });
                objRecord.setValue({ fieldId: 'custrecord_ht_db_item', value: context[i].item });
                let response = objRecord.save();
                log.debug('Record', response);
                jsonResponse.push(response);
            }
            return jsonResponse;
        } catch (error) {
            log.error('Error', error);
        }
    }

    return {
        get: _get,
        post: _post
    }
});
