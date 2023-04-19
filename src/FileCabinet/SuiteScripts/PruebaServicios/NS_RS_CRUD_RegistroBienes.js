/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/record', 'N/search'], function(log, record, search) {

   function _get(busqueda) {
        try {
            log.debug('Request', busqueda);
            // let busqueda = "301";
            //customrecord_ht_record_ordentrabajo
            //let objRecord = record.load({ type: record.Type.CUSTOMERECORD_HT_RECORD_ORDEN_TRABAJO, id: busqueda.busqueda });
            let objRecord = record.load({ type: 'customrecord_ht_record_registrobienes', id: busqueda.busqueda });
            log.debug('Busqueda.........', objRecord);
            let rb_enlace = objRecord.getValue({ fieldId: 'custrecord_ht_rb_enlace' });
            let rb_placa = objRecord.getValue({ fieldId: 'custrecord_ht_rb_placa' });
            let rb_chasis = objRecord.getValue({ fieldId: 'custrecord_ht_rb_chasis' });

            return {
                objRecord: objRecord
            }
        } catch (error) {
            log.error('Error-GET', error)
        }

    }


  function _post(context) {
        try {
            //se utiliza para enlazar el bien a la os
            //REQUEST
            //custrecord_ht_rb_enlace=11
            //custrecord_ht_rb_bien=4
            //custrecord_ht_rb_fechafinalcobertura
            log.debug('Request', context);
            let rb_enlace_os = context.custrecord_ht_rb_enlace;
            let ht_rb_bien = context.custrecord_ht_rb_bien;
            let t_rb_fechafinalcobertura = context.custrecord_ht_rb_fechafinalcobertura
            let usuario = context.usuario
            log.debug('Usuario Ingreso.........', usuario);

            // CREATION ORDER RECORD
            let objRecord = record.create({ type: 'customrecord_ht_record_registrobienes' });
            //PRIMARY INFORMATION
            objRecord.setValue({ fieldId: 'custrecord_ht_rb_enlace', value: rb_enlace_os });
            objRecord.setValue({ fieldId: 'custrecord_ht_rb_bien', value: ht_rb_bien });
            objRecord.setValue({ fieldId: 'custrecord_ht_rb_fechafinalcobertura', value: t_rb_fechafinalcobertura });
            let recordId = objRecord.save({ ignoreMandatoryFields: false });
            log.debug('Registro Bien.....', recordId);
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