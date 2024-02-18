/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/query', 'N/log', 'N/currentRecord', 'N/ui/dialog', 'N/https'], function (query, log, currentRecord, dialog, https) {

    function pageInit(context) {

    }
/*
    function updateCoberturaPlataforma(id) {
    
      try {

            var resultado

            suiteQuery = query.runSuiteQL({
                query: `
            SELECT
                CASE
                WHEN (
                SELECT custrecord_ht_pp_descripcion
                FROM customrecord_ht_cr_pp_valores
                WHERE id = b.custrecord_ht_co_familia_prod
                ) LIKE '%AMI%'
                THEN 'AMI'
                ELSE 'PX'
            END AS plataforma,
            TO_CHAR(b.custrecord_ht_co_bien) as codVehiculo,
            TO_CHAR(a.id) as idVehiculo,
            a.custrecord_ht_bien_placa as placaVehiculo,
            TO_CHAR(d.id) as idMarcaVehiculo,
            SUBSTR(d.name, INSTR(d.name, '-') + 2) as marcaVehiculo,
            TO_CHAR(e.id) as idModeloVehiculo,
            SUBSTR(e.name, INSTR(e.name, '-') + 2) as modeloVehiculo,
            a.custrecord_ht_bien_chasis as chasisVehiculo,
            a.custrecord_ht_bien_motor as motorVehiculo,
            c.custrecord_ht_bn_colorcarseg_descripcion as colorVehiculo,
            TO_CHAR(a.custrecord_ht_bien_ano) as anioVehiculo,
            f.name as tipoVehiculo,
            TO_CHAR(b.custrecord_ht_co_familia_prod) as idFamiliaProdructo,
            (select custrecord_ht_pp_descripcion from customrecord_ht_cr_pp_valores where id = b.custrecord_ht_co_familia_prod) as familiaProdructo,
            b.custrecord_ht_co_numerodispositivo as serieDispositivo,
            b.custrecord_ht_co_vid as vidDispositivo,
            '' as idMarcaDispositivo,
            '' as marcaDispositivo,
            '' as idModeloDispositivo,
            '' as modeloDispositivo,
            b.custrecord_ht_co_imei as imeiDispositivo,
            '' as direccionMacSim,
            '' as serieSim,
            b.custrecord_ht_co_nocelularsimcard as numeroCelularSim,
            SUBSTR(b.custrecord_ht_co_operadora, INSTR(b.custrecord_ht_co_operadora, ' - ') + 3) as operadoraSim,
            CASE
                WHEN (
                SELECT isinactive
                FROM customrecord_ht_cr_pp_valores
                WHERE id = b.custrecord_ht_co_familia_prod
                ) LIKE '%F%'
                THEN 'ACT'
                ELSE 'INC'
            END AS estadoFamiliaProducto,
            'OPERAD' as NemonicoUsuario
            FROM
                customrecord_ht_record_bienes a
            JOIN
                customrecord_ht_co_cobertura b ON a.id = b.custrecord_ht_co_bien
            JOIN 
                customrecord_ht_bn_colorcarseg c on a.custrecord_ht_bien_colorcarseg = c.id
            JOIN 
                customrecord_ht_bien_marca d on a.custrecord_ht_bien_marca = d.id
            JOIN
                customrecord_ht_bn_modelo e on a.custrecord_ht_bien_modelo = e.id
            JOIN
                CUSTOMRECORD_HT_BIEN_TIPOBIEN f on a.custrecord_ht_bien_tipobien = f.id
            WHERE
                b.id = ?;
                `,
                params: [id]
            });

            res = suiteQuery.asMappedResults();

            if (res.length > 0) {
                var jsonData = res[0]

                log.debug({ 'title': 'jsonDataQL', details: jsonData });

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

                log.debug({ 'title': 'respuestaToken', 'details': respuestaToken });

                if (response.status === 200 || 201) {

                    //consumit el api de actualizacion
                    var urlActualizaCobertura = 'https://www.hunteronline.com.ec/ApiNetsuite/Estado'

                    var headersActualizaCobertura = {
                        'Content-Type': 'application/json',
                        'accept': 'text/plain',
                        'Authorization': 'Bearer ' + respuestaToken.token
                    };

                    var responseActualizaCobertura = https.post({
                        url: urlActualizaCobertura,
                        headers: headersActualizaCobertura,
                        body: JSON.stringify(jsonData)
                    });

                    var respuestaActualizaCobertura = JSON.parse(responseActualizaCobertura.body);

                    if (respuestaActualizaCobertura.status === "200") {
                        log.debug({ title: 'exito-respuestaActualizaCobertura', results: respuestaActualizaCobertura })
                        resultado = respuestaActualizaCobertura

                    } else {
                        log.debug({ title: 'error-respuestaActualizaCobertura', results: respuestaActualizaCobertura })
                        resultado = respuestaActualizaCobertura
                    }

                } else {

                    resultado = respuestaToken

                }
            } else {

                resultado = { error: 'no data' };

            }
        } catch (error) {

            resultado = { error: error };
            //log.error('Error en updateClientePlataforma', error);
        }

        return resultado;

    }

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

                    log.debug({ 'title': 'idCoberturaEnviado', details: id });

                    let responesupdateCoberturaPlataforma = updateCoberturaPlataforma(id);

                    log.debug({ 'title': 'responesupdateCoberturaPlataformaTest22', 'details': responesupdateCoberturaPlataforma });

                    if (responesupdateCoberturaPlataforma.status == "200") {

                        log.debug({ 'title': 'resultado del servicio exitoso', 'details': responesupdateCoberturaPlataforma });
                        alert('¡Se actualizó la información de la cobertura ' + id + ' en plataforma ' + responesupdateCoberturaPlataforma.plataforma + '!' + 'Mensaje: ' + responesupdateCoberturaPlataforma.mensaje);
                        value = true;

                    } else {

                        log.debug({ 'title': 'resultado del servicio error', 'details': responesupdateCoberturaPlataforma });
                        alert('¡No se actualizó la información de la cobertura ' + id + ' en plataforma! Validar con sistemas - Mensaje: ' + responesupdateCoberturaPlataforma.mensaje);
                        value = true;

                    }

                    //value = true;

                } else {
                    log.debug({ 'title': 'registroId', details: 'No se obtuvo el id del registro' });
                }

            } catch (error) {
                log.error('Error en saveRecord', error);
                value = true;
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
