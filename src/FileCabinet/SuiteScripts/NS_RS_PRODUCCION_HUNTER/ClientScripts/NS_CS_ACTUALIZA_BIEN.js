/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/query', 'N/log', 'N/currentRecord', 'N/ui/dialog', 'N/https'], function (query, log, currentRecord, dialog, https) {

    let typeMode = "";

    function pageInit(context) {

    }

    //esta función puede ser actualizada mediante un consumo desde el cliente cuando se despliegue el api de prodcción, el archivo es "NS_RS_CONTROLLER_UE_CONSUMOS_API.js"
    //la función se llama "updateVehiculoPlataforma"
    function updateVehiculoPlataforma(id) {
        try {

            var resultado

            suiteQuery = query.runSuiteQL({
                query: `
                SELECT 
                CASE
                    WHEN (
                    SELECT custrecord_ht_pp_descripcion
                    FROM customrecord_ht_cr_pp_valores
                    WHERE id = h.custrecord_ht_co_familia_prod
                    ) LIKE '%AMI%'
                    THEN 'AMI'
                    ELSE 'PX'
                END AS plataforma,
                --(select custrecord_ht_pp_descripcion from customrecord_ht_cr_pp_valores where id = h.custrecord_ht_co_familia_prod) as plataforma,
                SUBSTR(b.entityid, INSTR(b.entityid, '-', 1, 2) + 1) as cliente,
                b.email as username,
                --b.custentity_ht_customer_id_telematic as amicliente,
                CASE WHEN (b.custentity_ht_customer_id_telematic is null or b.custentity_ht_customer_id_telematic = '') then '' else COALESCE(b.custentity_ht_customer_id_telematic, '') end as amicliente,
                TO_CHAR(a.id) as codvehiculo,
                TO_CHAR(a.id) as vehiculoid,
                --a.custrecord_ht_bien_id_telematic as amivehiculo,
                CASE WHEN (a.custrecord_ht_bien_id_telematic is null or a.custrecord_ht_bien_id_telematic = '') then '' else COALESCE(a.custrecord_ht_bien_id_telematic, '') end as amivehiculo,
                'PLC.:' || a.custrecord_ht_bien_placa || '; ' ||
                'MAR.:' || SUBSTR(d.name, INSTR(d.name, '-') + 2) || '; ' ||
                'MOD.:' || SUBSTR(e.name, INSTR(e.name, '-') + 2) || '; ' ||
                'COL.:' || SUBSTR(c.name, INSTR(c.name, '-') + 2) as descripcionvehiculo,
                TO_CHAR(f.id) as tipovehiculo,
                f.name as tipo,
                a.custrecord_ht_bien_placa as placa,
                TO_CHAR(d.id) as idmarca,
                SUBSTR(d.name, INSTR(d.name, '-') + 2) as marca,
                TO_CHAR(e.id) as idmodelo,
                SUBSTR(e.name, INSTR(e.name, '-') + 2) as modelo,
                a.custrecord_ht_bien_chasis as chasis,
                a.custrecord_ht_bien_motor as motor,
                c.custrecord_ht_bn_colorcarseg_descripcion as color,
                TO_CHAR(a.custrecord_ht_bien_ano) as anio,
                CASE when (g.custrecord_ht_cd_ruccanaldistribucion is null or g.custrecord_ht_cd_ruccanaldistribucion = '') then 'SIN DIRECCION' else COALESCE(g.custrecord_ht_cd_ruccanaldistribucion, '') end as idconcesionario,
                CASE when (g.custrecord_ht_cd_nombre is null or g.custrecord_ht_cd_nombre = '') then 'SIN DIRECCION' else COALESCE(g.custrecord_ht_cd_nombre, '') end as concesionariodesc,
                CASE when (g.custrecord_ht_cd_direccion is null or g.custrecord_ht_cd_direccion = '') then 'SIN DIRECCION' else COALESCE(g.custrecord_ht_cd_direccion, '') end as concesionariodire,
                CASE when (g_2.custrecord_ht_cd_ruccanaldistribucion is null or g_2.custrecord_ht_cd_ruccanaldistribucion = '') then 'SIN DIRECCION' else COALESCE(g_2.custrecord_ht_cd_ruccanaldistribucion, '') end as idfinanciera,
                CASE when (g_2.custrecord_ht_cd_nombre is null or g_2.custrecord_ht_cd_nombre = '') then 'SIN DIRECCION' else COALESCE(g_2.custrecord_ht_cd_nombre, '') end as financieradesc,
                CASE when (g_2.custrecord_ht_cd_direccion is null or g_2.custrecord_ht_cd_direccion = '') then 'SIN DIRECCION' else COALESCE(g_2.custrecord_ht_cd_direccion, '') end as financieradire,
                CASE when (g_3.custrecord_ht_cd_ruccanaldistribucion is null or g_3.custrecord_ht_cd_ruccanaldistribucion = '') then 'SIN DIRECCION' else COALESCE(g_3.custrecord_ht_cd_ruccanaldistribucion, '') end as idaseguradora,
                CASE when (g_3.custrecord_ht_cd_nombre is null or g_3.custrecord_ht_cd_nombre = '') then 'SIN DIRECCION' else COALESCE(g_3.custrecord_ht_cd_nombre, '') end as aseguradoradesc,
                CASE when (g_3.custrecord_ht_cd_direccion is null or g_3.custrecord_ht_cd_direccion = '') then 'SIN DIRECCION' else COALESCE(g_3.custrecord_ht_cd_direccion, '') end as aseguradoradire
                    FROM
                    customrecord_ht_record_bienes a
                JOIN
                    customer b on a.custrecord_ht_bien_propietario = b.id
                JOIN 
                    customrecord_ht_bn_colorcarseg c on a.custrecord_ht_bien_colorcarseg = c.id
                JOIN 
                    customrecord_ht_bien_marca d on a.custrecord_ht_bien_marca = d.id
                JOIN
                    customrecord_ht_bn_modelo e on a.custrecord_ht_bien_modelo = e.id
                JOIN
                    CUSTOMRECORD_HT_BIEN_TIPOBIEN f on a.custrecord_ht_bien_tipobien = f.id
                JOIN
                    CUSTOMRECORD_HT_RECORD_CANALDISTRIBUCION g on a.custrecord_ht_bien_consesionarios = g.id
                JOIN
                    CUSTOMRECORD_HT_RECORD_CANALDISTRIBUCION g_2 on a.custrecord_ht_bien_financiadovehiculo = g_2.id
                JOIN
                    CUSTOMRECORD_HT_RECORD_CANALDISTRIBUCION g_3 on a.custrecord_ht_bien_companiaseguros = g_3.id
                JOIN
                    customrecord_ht_co_cobertura h on a.id = h.custrecord_ht_co_bien
                WHERE 
                    a.id = ?
                `,
                params: [id]
            });

            res = suiteQuery.asMappedResults();

            if (res.length > 0) {
                //armar el json para consumir el servicio

                var jsonData = res[0]

                log.debug({ title: 'jsonData', results: jsonData })

                //consumir api de login desde netsuite con usuario y contraseña de https://www.hunteronline.com.ec:443/ApiNetsuite/Login
                var urltoken = 'https://www.hunteronline.com.ec:443/ApiNetsuite/Login';
                var headersToken = {
                    'Content-Type': 'application/json'
                };

                var bodyToken = {
                    "usuarioAPI": "WSNETSUITE",
                    "passAPI": "N!sEt%9"
                }

                var response = https.post({
                    url: urltoken,
                    headers: headersToken,
                    body: JSON.stringify(bodyToken)
                });

                var respuestaToken = JSON.parse(response.body);

                if (response.status === 200 || 201) {

                    //consumit el api de actualizacion
                    var urlActualizaBien = 'https://www.hunteronline.com.ec/ApiNetsuite/bien'

                    var headersActualizaBien = {
                        'Content-Type': 'application/json',
                        'accept': 'text/plain',
                        'Authorization': 'Bearer ' + respuestaToken.token
                    };

                    var responseActualizaBien = https.post({
                        url: urlActualizaBien,
                        headers: headersActualizaBien,
                        body: JSON.stringify(jsonData)
                    });

                    var respuestaActualizaBien = JSON.parse(responseActualizaBien.body);

                    if (respuestaActualizaBien.status === "200") {
                        //log.debug({ title: 'respuestaActualizaBien', results: respuestaActualizaBien })
                        resultado = respuestaActualizaBien

                    } else {
                        resultado = respuestaActualizaBien
                    }
                } else {

                    resultado = respuestaToken

                }
            }
            else {

                resultado = { error: 'no data' };

            }
        } catch (error) {
            resultado = { error: error };
            //log.error('Error en beforeSubmit', error);
        }

        return resultado;

    }
/*
    function saveRecord(context) {

        var value = false
        //mensaje de alerta javascritp confirmacion preguntando si quiere actualizar la información ahora en plataforma
        var opcion = confirm("¿Desea actualizar la información de plataforma en este momento? \n\nSi presionas 'Aceptar' se actualizará la información en plataforma y Netsuite.\nSi presionas 'Cancelar' se actualizará la información solo en Netsuite.");

        if (opcion == true) {

            try {

                var id = currentRecord.get().getValue({
                    fieldId: 'id'
                });

                if (id != null) {

                    log.debug({ 'title': 'idVehiculoEnviado', details: id });

                    let responesupdateVehiculoPlataforma = updateVehiculoPlataforma(id);

                    //log.debug({ 'title': 'responesupdateVehiculoPlataforma', 'details': responesupdateVehiculoPlataforma });

                    if (responesupdateVehiculoPlataforma.status == "200") {

                        log.debug({ 'title': 'resultado del servicio exitoso', 'details': responesupdateVehiculoPlataforma });
                        alert('¡Se actualizó la información del vehiculo ' + id + ' en plataforma ' + responesupdateVehiculoPlataforma.plataforma + '!' +'Mensaje: ' + responesupdateVehiculoPlataforma.mensaje );
                        value = true;

                    } else {

                        log.debug({ 'title': 'resultado del servicio error', 'details': responesupdateVehiculoPlataforma });
                        alert('¡No se actualizó la información del vehiculo ' + id + ' en plataforma! Validar con sistemas - Mensaje: ' + responesupdateVehiculoPlataforma.mensaje);
                        value = true;

                    }

                } else {
                    log.debug({ 'title': 'registroId', details: 'No se obtuvo el id del registro' });
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

    }
*/
    return {
        pageInit: pageInit,
        //saveRecord: saveRecord
    }
});
