/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/record', 'N/search'], function(log, record, search) {

     function _get(busqueda) {
        try {
            log.debug('Request', busqueda);
            // let busqueda = "1;
            let objRecord = record.load({ type: 'customrecord_ht_co_cobertura', id: busqueda.busqueda });
            log.debug('Busqueda.........', objRecord);

            return {
                objRecord: objRecord
            }
        } catch (error) {
            log.error('Error-GET', error)
        }

    }

  function _post(context) {
        try {
            //REQUEST
            log.debug('Request', context);
            let customerform = context.customerform;
            let usuario = context.usuario;
            let activo = 'T';
            let isinactive = 'F';
            log.debug('Usuario Ingreso.........', usuario);
            let objRecord = record.create({ type: "customrecord_ht_co_cobertura", isDynamic: true });
            //PRIMARY INFORMATION
             log.debug('FECHAS.....','desde_flag: ' + context.inicial + ' - ' + 'hasta_flag: ' + context.final);
           
            objRecord.setValue({ fieldId: 'customform', value: customerform});
            objRecord.setValue({ fieldId: 'custrecord_ht_co_bien', value: context.bien });
            objRecord.setValue({ fieldId: 'custrecord_ht_co_orden_servicio', value: context.orden });
            objRecord.setValue({ fieldId: 'custrecord_ht_co_coberturainicial', value: new Date(context.inicial) });
            objRecord.setValue({ fieldId: 'custrecord_ht_co_plazo', value: context.plazo });
            objRecord.setValue({ fieldId: 'custrecord_ht_co_coberturafinal', value: new Date(context.final) });
            //objRecord.setValue({ fieldId: 'custrecord_ht_co_activo', value: activo});
           // objRecord.setValue({ fieldId: 'isinactive', value: isinactive });
            let cobertura = objRecord.save({ ignoreMandatoryFields: false });
            log.debug('OrdenServicio.....', cobertura);

            return "Grabado..........";

        } catch (error) {
            log.error('Error', error);
        }
    }

    function _put(context) {
        try {
            log.debug('Result', 'Hola Mundo..put.');
        } catch (error) {
            log.error('Error', error);
        }

    }

    function _delete(context) {
        try {
            log.debug('Result', 'Hola Mundo..delete.');
        } catch (error) {
            log.error('Error', error);
        }

    }

    return {
        get: _get,
        post: _post,
        put: _put,
        delete: _delete
    }
});