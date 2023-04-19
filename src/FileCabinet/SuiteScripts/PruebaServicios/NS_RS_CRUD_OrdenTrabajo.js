/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/record', 'N/search'], function(log, record, search) {

    function _get(busqueda) {
        try {
            log.debug('Request', busqueda);
            // let busqueda = "17866";
            //customrecord_ht_record_ordentrabajo
           let objRecord = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: busqueda.busqueda });
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
            const start = Date.now();
            log.debug('Request', context);
            let vatregnumber = context.customer;
            let customerform = context.customerform;
            let estado = '7';
            let usuario = context.usuario;
            // consulta de internalId
            var busquedaCustomer = search.create({
                type: search.Type.CUSTOMER,
                columns: ['entityid', 'altname', 'internalid'],
                filters: ['vatregnumber', search.Operator.STARTSWITH, vatregnumber]
            });
            var myResultSet = busquedaCustomer.run().getRange({ start: 0, end: 1 });;
            //log.debug('Busqueda.........', myResultSet);
            log.debug('Busqueda.........', myResultSet);

            var theCount = busquedaCustomer.runPaged().count;
            if (theCount != 1) {
                log.debug('Error consulta', myResultSet);
            } else {

                //consulta de customer el id
                for (let i in myResultSet) {
                    var altname = myResultSet[i].getValue(busquedaCustomer.columns[1]);
                    var customer = myResultSet[i].getValue(busquedaCustomer.columns[2]);
                }
                log.debug('Busqueda.customer........', customer);
                log.debug('Usuario Ingreso.........', usuario);
                let objRecord = record.create({ type: 'customrecord_ht_record_ordentrabajo', isDynamic: true });
                //PRIMARY INFORMATION
                objRecord.setValue({ fieldId: 'customform', value: customerform });
                objRecord.setValue({ fieldId: 'custrecord_ht_ot_cliente', value: customer }); //* //REQUEST
                objRecord.setValue({ fieldId: 'custrecord_ht_id_orden_servicio', value: context.orden });
                objRecord.setValue({ fieldId: 'custrecord_ht_ot_vehiculo', value: context.vehiculo });
                objRecord.setValue({ fieldId: 'custrecord_ht_ot_estado', value: estado });
                objRecord.setValue({ fieldId: 'custrecord_ht_bien_usuarioingreso', value: usuario });

 log.debug('OrdenServicio.....', objRecord);
                let OrdenTrabajoId = objRecord.save({ ignoreMandatoryFields: false });
                log.debug('OrdenServicio.....', OrdenTrabajoId);

            }
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