/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @param {string} altname - El valor del campo altname.
 * @returns {string} - El campo altname en el formato deseado. 
 */
define(['N/query', 'N/log', 'N/record'], function (query, log, record) {

    function _get() {
        try {
            var resultado = null;

            let data = query.runSuiteQL({
                query: `
            select
            *
            from
            CUSTOMRECORD_HT_RECORD_SEGUICLIENTE
            `
            });

            let res = data.asMappedResults();

            if (res.length > 0) {
                resultado = res;
            } else {
                resultado = { error: 'no data' };
            }

            return JSON.stringify({
                results: resultado
            });
        } catch (error) {
            log.error('error', error);
            return JSON.stringify({
                error: error
            });
        }
    }

    function _post(context) {
        try {
            let idcliente = query.runSuiteQL({
                query: `SELECT a.id from customer a where a.entityid = ?`,
                params: [`C-EC-${context.custrecord_ht_sc_cliente}`]
            })

            residc = idcliente.asMappedResults();

            if (residc.length > 0) {
                //traer id interno del cliente
                var id = residc[0]['id'];
                //var owner = residc[0]['owner'];

                let validaVehiculo = query.runSuiteQL({
                    query: `SELECT a.custrecord_ht_bien_propietario from customrecord_ht_record_bienes a where a.id = ?`,
                    params: [context.custrecord_ht_sc_vehiculo]
                })

                residv = validaVehiculo.asMappedResults();

                if (residv.length > 0) {
                    //traer id del cliente asociado al vehiculo
                    var custrecord_ht_bien_propietario = residv[0]['custrecord_ht_bien_propietario'];

                    // Crear un nuevo registro personalizado de CUSTOMRECORD_HT_RECORD_SEGUICLIENTE

                    if (custrecord_ht_bien_propietario != id) {
                        return JSON.stringify({ error: 'el vehiculo no pertenece al cliente' });
                    } else {

                        let validaUsurio = query.runSuiteQL({
                            query: `SELECT a.id from employee a where a.entityid = ?`,
                            params: [`${context.custrecord_ht_sc_empleado}`]
                        })

                        residu = validaUsurio.asMappedResults();

                        if (residu.length > 0) {
                            //traer id interno del usuario
                            var idu = residu[0]['id'];

                            var newRecord = record.create({
                                type: 'customrecord_ht_record_seguicliente',
                                isDynamic: true,
                            });

                            new Date(context.fecha)
                            // Establecer los valores de los campos del registro
                            newRecord.setValue({ fieldId: 'custrecord_ht_sc_fechapproximocontacto', value: new Date(context.custrecord_ht_sc_fechapproximocontacto) });
                            newRecord.setValue({ fieldId: 'owner', value: idu });
                            newRecord.setValue({ fieldId: 'custrecord_ht_sc_cliente', value: id });
                            newRecord.setValue({ fieldId: 'custrecord_ht_sc_seguimiento', value: context.custrecord_ht_sc_seguimiento });
                            newRecord.setValue({ fieldId: 'custrecord_ht_sc_proximocontacto', value: context.custrecord_ht_sc_proximocontacto });
                            newRecord.setValue({ fieldId: 'custrecord_ht_sc_fechacontacto', value: new Date(context.custrecord_ht_sc_fechacontacto) });
                            newRecord.setValue({ fieldId: 'custrecord_ht_sc_resultadogestion', value: context.custrecord_ht_sc_resultadogestion });
                            newRecord.setValue({ fieldId: 'custrecord_ht_sc_modocontacto', value: context.custrecord_ht_sc_modocontacto });
                            newRecord.setValue({ fieldId: 'custrecord_ht_sc_cmotivo', value: context.custrecord_ht_sc_cmotivo });
                            newRecord.setValue({ fieldId: 'custrecord_ht_sc_vehiculo', value: context.custrecord_ht_sc_vehiculo });
                            newRecord.setValue({ fieldId: 'custrecord_ht_sc_tiposeguimiento', value: context.custrecord_ht_sc_tiposeguimiento });
                            newRecord.setValue({ fieldId: 'custrecord_ht_sc_empleado', value: idu });
                            newRecord.setValue({ fieldId: 'custrecord_ht_sc_tipocliente', value: context.custrecord_ht_sc_tipocliente });
                            newRecord.setValue({ fieldId: 'custrecord_ht_sc_fechapromesa', value: new Date(context.custrecord_ht_sc_fechapromesa)});
                            newRecord.setValue({ fieldId: 'custrecord_ht_sc_estado', value: context.custrecord_ht_sc_estado });

                            // Guardar el nuevo registro
                            var recordId = newRecord.save();
                            // Devolver un mensaje de éxito
                            return {
                                result: 'Registro insertado exitosamente con ID: ' + recordId
                            }
                        } else {
                            return JSON.stringify({ error: 'no existe el usuario' });
                        }
                    }
                } else {
                    return JSON.stringify({ error: 'no existe el vehiculo' });
                }

            } else {
                return JSON.stringify({ error: 'no existe el cliente' });
            }

        } catch (error) {
            log.error('error', error);
            return {
                error: error
            };
        }
    }

    function _put(context) {
        // Implementa tu lógica PUT si es necesario
    }

    function _delete(context) {
        // Implementa tu lógica DELETE si es necesario
    }

    return {
        get: _get,
        post: _post,
        put: _put,
        delete: _delete
    }
});
