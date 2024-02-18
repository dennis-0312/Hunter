/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/query', 'N/log', 'N/currentRecord', 'N/ui/dialog', 'N/https'], function (query, log, currentRecord, dialog, https) {

    function pageInit(context) { }


    function updateClientePlataforma(id) {

        try {

            var resultado

            suiteQuery = query.runSuiteQL({
                query: `
                select
                SUBSTR(a.entityid, 1, INSTR(a.entityid, '-', 1, 2) - 1) as id_cliente,
                a.custentity_ht_cl_primernombre as primer_nombre,
                a.custentity_ht_cl_segundonombre as segundo_nombre,
                a.custentity_ht_cl_apellidopaterno as apellido_paterno,
                a.custentity_ht_cl_apellidomaterno as apellido_materno,
                (select TOP 1 a_1.label from CustomerAddressbook a_1 where a_1.entity = a.id) as direccion,
                '' as telefono_convencional,
                (select TOP 1 from customrecord_ht_registro_telefono a_2 where a_2.custrecord_ht_campo_lbl_entidad_teefono = a.id and a_2.custrecord_ht_campo_list_tipo_telefono = '4') as telefono_celular                
                from
                    customer a
                where
                    a.entityid = ?
                `,
                params: [id]
            });

            res = suiteQuery.asMappedResults();

            if (res.length > 0) {
                //armar el json para consumir el servicio

                var jsonData = res[0]

                resultado = jsonData;
            }

        } catch (error) {

            resultado = { error: error };
            //log.error('Error en updateClientePlataforma', error);
        }

        return resultado;

    }

    function saveRecord(context) {
        log.debug({ 'title': 'idClienteEnviado', details: 'xdddddd' });

        return true;

             /*
        var value = false
        //mensaje de alerta javascritp confirmacion preguntando si quiere actualizar la información ahora en plataforma - Cliente
        var opcion = confirm("¿Desea actualizar la información de plataforma en este momento? \n\nSi presionas 'Aceptar' se actualizará la información en plataforma y Netsuite.\nSi presionas 'Cancelar' se actualizará la información solo en Netsuite.");

        if (opcion == true) {

            try {

                var entityid = currentRecord.get().getValue({
                    fieldId: 'entityid'
                });

                log.debug({ 'title': 'idClienteEnviado', details: entityid });

                value = true;
   

                if (entityid != null) {

                    log.debug({ 'title': 'idClienteEnviado', details: entityid });

                    let responesupdateClientePlataforma = updateClientePlataforma(entityid);

                    log.debug({ 'title': 'responesupdateClientePlataforma', 'details': responesupdateClientePlataforma });
                    
                    if (responesupdateClientePlataforma.status == "200") {

                        log.debug({ 'title': 'resultado del servicio exitoso', 'details': responesupdateClientePlataforma });
                        alert('¡Se actualizó la información del vehiculo ' + id + ' en plataforma ' + responesupdateClientePlataforma.plataforma + '!' + 'Mensaje: ' + responesupdateVehiculoPlataforma.mensaje);
                        value = true;

                    } else {

                        log.debug({ 'title': 'resultado del servicio error', 'details': responesupdateClientePlataforma });
                        alert('¡No se actualizó la información del vehiculo ' + id + ' en plataforma! Validar con sistemas - Mensaje: ' + responesupdateVehiculoPlataforma.mensaje);
                        value = true;

                    }
                    
                    value = true;

                } else {
                    log.debug({ 'title': 'idClienteEnviado', details: 'No se obtuvo el id del registro' });
                }

                //return true;

            } catch (error) {
                log.error('Error en saveRecord', error);
                return true;
            }

        } else {
            //alert("¡Has rechazado la actualización!");
            value = true;
        }

        return value;
*/
    }


    return {
        pageInit: pageInit,
        saveRecord: saveRecord
    }
});
