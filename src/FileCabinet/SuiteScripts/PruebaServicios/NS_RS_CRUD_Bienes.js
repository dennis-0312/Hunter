/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/record', 'N/search'], function(log, record, search) {

    function _get(busqueda) {
        try {
            log.debug('Request', busqueda);
            // let busqueda = "3";
            //customrecord_ht_record_ordentrabajo
            //let objRecord = record.load({ type: record.Type.CUSTOMERECORD_HT_RECORD_ORDEN_TRABAJO, id: busqueda.busqueda });
            let objRecord = record.load({ type: 'customrecord_ht_record_bienes', id: busqueda.busqueda });
            log.debug('Busqueda.........', objRecord);
            let ht_bien_codigo = objRecord.getValue({ fieldId: 'custrecord_ht_bien_codigo' });
            let ht_bien_propietario = objRecord.getValue({ fieldId: 'custrecord_ht_bien_propietario' });
            let ht_bien_estadocontrato = objRecord.getValue({ fieldId: 'custrecord_ht_bien_estadocontrato' });

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
            let vatregnumber = context.customer;
            let customerform = context.customerform;
            let usuario = context.usuario;
            let ht_bien_tipobien = context.tipobien //1
            let ht_bien_tipoterrestre = context.tipoterrestre //1
            let ht_bn_estadobien = context.estadobien //11
            let ht_bien_marca = context.marca //2
            let ht_bien_tipo = context.tipo //3
            let ht_bien_transmision= context.transmision //1
            let ht_bien_aireacondicionado=context.aireacondicionado //1
            let ht_bien_usovehiculo=context.usovehiculo //1
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
                // CREATION ORDER RECORD
                //let objRecord = record.create({ type: record.Type.SALES_ORDER, isDynamic: true });
                let objRecord = record.create({ type: "customrecord_ht_record_bienes", isDynamic: true });
                //PRIMARY INFORMATION
                objRecord.setValue({ fieldId: 'customform', value: customerform });//REQUEST
                objRecord.setValue({ fieldId: 'altname', value: context.altname });//REQUEST
                objRecord.setValue({ fieldId: 'custrecord_ht_bien_propietario', value: customer }); //* //REQUEST}
                objRecord.setValue({ fieldId: 'custrecord_ht_bien_codigo', value: context.codigo });
                objRecord.setValue({ fieldId: 'custrecord_ht_bien_tipobien', value: ht_bien_tipobien });
                objRecord.setValue({ fieldId: 'custrecord_ht_bien_tipoterrestre', value: ht_bien_tipoterrestre });
                objRecord.setValue({ fieldId: 'custrecord_ht_bn_estadobien', value: ht_bn_estadobien });
                objRecord.setValue({ fieldId: 'custrecord_ht_bien_placa', value: context.placa });
                objRecord.setValue({ fieldId: 'custrecord_ht_bien_chasis', value: context.chasis });
                objRecord.setValue({ fieldId: 'custrecord_ht_bien_motor', value: context.motor });
                objRecord.setValue({ fieldId: 'custrecord_ht_bien_marca', value: ht_bien_marca });
                objRecord.setValue({ fieldId: 'custrecord_ht_bien_modelo', value: context.modelo });
                objRecord.setValue({ fieldId: 'custrecord_ht_bien_tipo', value: ht_bien_tipo });
                objRecord.setValue({ fieldId: 'custrecord_ht_bien_caractadicional', value: context.caractadicional });
                objRecord.setValue({ fieldId: 'custrecord_ht_bien_numeropuertas', value: context.numeropuertas });
                objRecord.setValue({ fieldId: 'custrecord_ht_bien_transmision', value: ht_bien_transmision });
                objRecord.setValue({ fieldId: 'custrecord_ht_bien_colorcarseg', value: context.colorcarseg });
                objRecord.setValue({ fieldId: 'custrecord_ht_bien_colorfabricante', value: context.colorfabricante });
                objRecord.setValue({ fieldId: 'custrecord_ht_bien_colormatricula', value: context.colormatricula });
                objRecord.setValue({ fieldId: 'custrecord_bien_version', value: context.version });
                objRecord.setValue({ fieldId: 'custrecord_ht_bien_tipocabina', value: context.tipocabina });
                objRecord.setValue({ fieldId: 'custrecord_ht_bien_cilindraje', value: context.cilindraje });
                objRecord.setValue({ fieldId: 'custrecord_ht_bien_traccion', value: context.traccion });
                objRecord.setValue({ fieldId: 'custrecord_ht_bien_combustible', value: context.combustible});
                objRecord.setValue({ fieldId: 'custrecord_ht_bien_aireacondicionado', value: ht_bien_aireacondicionado });
                objRecord.setValue({ fieldId: 'custrecord_ht_bien_numeropuertas', value: context.numeropuertas });
                objRecord.setValue({ fieldId: 'custrecord_ht_bien_kilometraje', value: context.kilometraje });
                objRecord.setValue({ fieldId: 'custrecord_ht_bien_ano', value: context.anio });
                objRecord.setValue({ fieldId: 'custrecord_ht_bien_avaluo', value: context.avaluo });
                objRecord.setValue({ fieldId: 'custrecord_ht_bien_tonelaje', value: context.tonelaje });
                objRecord.setValue({ fieldId: 'custrecord_ht_bien_plazo', value: context.plazo});
                objRecord.setValue({ fieldId: 'custrecord_ht_bien_tipoflota', value: context.tipoflota});
                objRecord.setValue({ fieldId: 'custrecord_ht_bien_clave', value: context.clave });
                objRecord.setValue({ fieldId: 'custrecord_ht_bien_recorrido', value: context.recorrido});
                objRecord.setValue({ fieldId: 'custrecord_ht_bien_usovehiculo', value: ht_bien_usovehiculo});

                let BienId = objRecord.save({ ignoreMandatoryFields: false });
              
               log.debug('Bien.....', BienId);
                //response = objRecord.save({ ignoreMandatoryFields: true });
                //log.debug('Bien.....', response);
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