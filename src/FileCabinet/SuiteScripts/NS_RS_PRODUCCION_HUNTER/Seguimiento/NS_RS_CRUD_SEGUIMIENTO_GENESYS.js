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
            employee
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
                error: error.message
            });
        }
    }

    function _post(context) {

        var respuestaServicio = null
        var validaSiguientePaso = 0
        var ProcesoFinal = 0
        var codInternoUsuario
        var codInternoCliente
        var OBS = null
        var datavehiculo
        var dataCliente

        try {

            OBS = "[SEGUIMIENTO_GENESYS]" + context.SEGUIMIENTO + " //CANAL:" + context.CANAL + " //TELEFONO_LLAMANTE:" + context.TELEFONO_LLAMANTE + " //FECHA_CONTACTO_GENESYS:" + context.FECHA_CONTACTO + " //TELEFONO_ALTERNO:" + context.TELEFONO_ALTERNO + " //MODO_PROXIMO_CONTACTO:" + context.MODO_PROXIMO_CONTACTO + " //ID_CONVERSACION:" + context.ID_CONVERSACION + " //ID_CONTACTO:" + context.ID_CONTACTO

            if (context.clave == "GeneSysCloud#$537") { //VALIDA ACCESO
                validaSiguientePaso = 1
            } else {
                validaSiguientePaso = 0
                respuestaServicio = "error, usted no esta autorizado para usar el servicio, no ha ingresado la clave correcta o no ha proporcionado la clave de acceso"
            }

            if (validaSiguientePaso == 1) { //OBTIENE CODIGO DE USUARIO
                validaSiguientePaso = 0

                let codEmpleado = query.runSuiteQL({
                    query: `SELECT TOP 1 a.id from employee a where a.email = ?`,
                    params: [`${context.CORREO}`]
                })

                var rescodE = codEmpleado.asMappedResults();

                if (rescodE.length > 0) {
                    validaSiguientePaso = 1

                    //traer id interno del usuario
                    codInternoUsuario = rescodE[0]['id'];

                } else {
                    validaSiguientePaso = 0
                    respuestaServicio = "error, el usuario no existe"
                }

            }

            if (validaSiguientePaso == 1) { //OBTIENE CODIGO DE CLIENTE
                validaSiguientePaso = 0

                let codCliente = query.runSuiteQL({
                    query: `SELECT TOP 1 a.id from customer a where a.entityid = ?`,
                    params: [`C-EC-${context.ID_CLIENTE}`]
                })

                dataCliente = codCliente.asMappedResults();

                if (dataCliente.length > 0) {
                    //traer id interno del cliente
                    codInternoCliente = dataCliente[0]['id'];
                    validaSiguientePaso = 1

                    //VALIDA SI VEHICULO PERTENECE AL CLIENTE
                    let validaVehiculo = query.runSuiteQL({
                        query: `SELECT a.custrecord_ht_bien_propietario from customrecord_ht_record_bienes a where a.id = ?`,
                        params: [context.ID_VEHICULO]
                    })

                    datavehiculo = validaVehiculo.asMappedResults();

                    if (datavehiculo.length > 0) {
                        //traer id del cliente asociado al vehiculo
                        var custrecord_ht_bien_propietario = datavehiculo[0]['custrecord_ht_bien_propietario'];

                        if (custrecord_ht_bien_propietario != codInternoCliente) {
                            validaSiguientePaso = 0
                            respuestaServicio = "error, el vehiculo no pertenece al cliente"
                        } else {
                            validaSiguientePaso = 1
                        }
                    }

                } else {
                    validaSiguientePaso = 0
                    respuestaServicio = "error, el cliente no existe"
                }
            }

            if (validaSiguientePaso == 1) { //TRAE CODIGO DE TIPIFICACION
                validaSiguientePaso = 0

                let codTipificacion = query.runSuiteQL({
                    query: `SELECT TOP 1 a.custrecord_ht_cod_tipi_genesys from customrecord_est_mot_homologa_genesys a where a.custrecord_ht_cod_tipi_genesys = ?`,
                    params: [`${context.ID_TIPIFICACION}`]
                })

                var rescodT = codTipificacion.asMappedResults();

                if (rescodT.length > 0) {
                    validaSiguientePaso = 1
                } else {
                    validaSiguientePaso = 0
                    respuestaServicio = "error, la tipificacion no existe"
                }
            }

            if (validaSiguientePaso == 0) {
                validaSiguientePaso = 0
                return {
                    "respuestaServicio": respuestaServicio
                }
            } else {
                ProcesoFinal = 1
            }

            if (ProcesoFinal == 1) { //INSERTA REGISTRO
                validaSiguientePaso = 0
                ProcesoFinal = 0

                var newRecordSeguimiento = record.create({
                    type: 'customrecord_ht_record_seguicliente',
                    isDynamic: true,
                });

                //new Date(context.fecha)
                // Establecer los valores de los campos del registro
                newRecordSeguimiento.setValue({ fieldId: 'custrecord_ht_sc_fechapproximocontacto', value: new Date(context.FECHA_PROXIMO_CONTACTO) });
                newRecordSeguimiento.setValue({ fieldId: 'owner', value: codInternoUsuario });
                newRecordSeguimiento.setValue({ fieldId: 'custrecord_ht_sc_cliente', value: codInternoCliente });
                newRecordSeguimiento.setValue({ fieldId: 'custrecord_ht_sc_seguimiento', value: OBS });
                newRecordSeguimiento.setValue({ fieldId: 'custrecord_ht_sc_proximocontacto', value: context.MODO_PROXIMO_CONTACTO });
                newRecordSeguimiento.setValue({ fieldId: 'custrecord_ht_sc_fechacontacto', value: new Date(context.FECHA_CONTACTO) });
                newRecordSeguimiento.setValue({ fieldId: 'custrecord_ht_sc_resultadogestion', value: context.RESULTADO_GESTION });
                newRecordSeguimiento.setValue({ fieldId: 'custrecord_ht_sc_modocontacto', value: context.FORMA_CONTACTO });
                //newRecord.setValue({ fieldId: 'custrecord_ht_sc_cmotivo', value: context.custrecord_ht_sc_cmotivo });
                newRecordSeguimiento.setValue({ fieldId: 'custrecord_ht_sc_vehiculo', value: context.ID_VEHICULO });
                //newRecord.setValue({ fieldId: 'custrecord_ht_sc_tiposeguimiento', value: context.custrecord_ht_sc_tiposeguimiento });
                newRecordSeguimiento.setValue({ fieldId: 'custrecord_ht_sc_empleado', value: codInternoUsuario });
                newRecordSeguimiento.setValue({ fieldId: 'custrecord_ht_sc_tipocliente', value: "1" });
                newRecordSeguimiento.setValue({ fieldId: 'custrecord_ht_sc_fechapromesa', value: new Date(context.FECHA_PROMESA_CONTACTO) });
                //newRecord.setValue({ fieldId: 'custrecord_ht_sc_estado', value: context.custrecord_ht_sc_estado });

                // Guardar el nuevo registro
                var recordId = newRecordSeguimiento.save();
                // Devolver un mensaje de éxito
                if (recordId) {
                    var newRecordLog = record.create({
                        type: 'customrecord_ht_datos_log_consumo_apis',
                        isDynamic: true,
                    });

                    // Establecer los valores de los campos del registro
                    newRecordLog.setValue({ fieldId: 'name', value: "SEGUIMIENTO_GENESYS" });
                    newRecordLog.setValue({ fieldId: 'custrecord_ht_api', value: "https://7451241-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=1162&deploy=1" });
                    newRecordLog.setValue({ fieldId: 'custrecord_ht_categoria', value: "SEGUIMIENTO" });
                    newRecordLog.setValue({ fieldId: 'custrecord_ht_chasis', value: datavehiculo[0]['custrecord_ht_bien_chasis'] });
                    newRecordLog.setValue({ fieldId: 'custrecord_ht_cliente_propietario', value: dataCliente[0]['entityid'] });
                    newRecordLog.setValue({ fieldId: 'custrecord_ht_codigo_vehiculo', value: context.ID_VEHICULO });
                    newRecordLog.setValue({ fieldId: 'custrecord_ht_fecha', value: new Date(context.FECHA_CONTACTO) });
                    newRecordLog.setValue({ fieldId: 'custrecord_ht_fecha_ingreso', value: new Date(context.FECHA_CONTACTO) });
                    newRecordLog.setValue({ fieldId: 'custrecord_ht_motor', value: datavehiculo[0]['custrecord_ht_bien_motor'] });
                    newRecordLog.setValue({ fieldId: 'custrecord_ht_origen', value: "GENESYS" });
                    newRecordLog.setValue({ fieldId: 'custrecord_ht_resultado', value: OBS });
                    newRecordLog.setValue({ fieldId: 'custrecord_ht_sub_categoria', value: "SEGUIMIENTO - GENESYS" });
                    newRecordLog.setValue({ fieldId: 'custrecord_ht_tipo_registro', value: "SEGUIMIENTO" });
                    newRecordLog.setValue({ fieldId: 'custrecord_ht_usuario', value: codInternoUsuario });
                    newRecordLog.save();

                    return {
                        respuestaServicio: 'Registro insertado exitosamente con ID: ' + recordId
                    }
                } else {
                    respuestaServicio = "error, no se pudo insertar el registro"
                }

            }
        } catch (error) {
            log.debug({ title: 'Error', results: error })
            return {
                respuestaServicio: error.message
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
