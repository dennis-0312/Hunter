/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/log', 'N/https', 'N/runtime'], function (log, https, runtime) {

    var confirmaMigraAMI_PX

    function beforeLoad(context) {
        /*if (context.type == 'save') {
            alert("Prueba al presionar actualizar xdxdxd");
        }*/
    }

    function beforeSubmit(context) {

        try {

            var fechaActual = obtenerFechaActual();

            if (context.type === 'edit') {
                // Obtiene el registro actual que se está actualizando
                var currentRecord = context.newRecord;
                // Obtiene el valor de un campo específico
                var id = currentRecord.getValue({
                    fieldId: 'custrecord_ht_co_numerodispositivo'
                });

                
                if (id != null) {

                    log.debug({ 'title': 'fieldValue', 'details': id });

                    //obtener usuario actual que realiza la edición
                    var currentUser = runtime.getCurrentUser();
                    //var usuario = currentUser.id;
                    var usuarioNombre = currentUser.name;

                    var body = {
                        "valor": `${id}`,
                        "tipoOperacion": "updateEstadoPlataforma",
                        "usuario": `${usuarioNombre}`,
                    }

                    let resletHeaders = {
                        'Content-Type': 'application/json',
                        'Accept': '*/*'
                    }



                    let resletResponse = https.requestRestlet({
                        body: JSON.stringify(body),
                        deploymentId: 'customdeploy_ns_rs_controller_ue_consumo',
                        scriptId: 'customscript_ns_rs_controller_ue_consumo',
                        headers: resletHeaders
                    });
                    let response = resletResponse.body;

                    //parsear el resultado para evaluar el campo mensaje
                    responseparse = JSON.parse(response);

                    log.debug({ 'title': 'resultado del servicio no validado', 'details': response });

                    var resPX
                    var resAMI

                    if (responseparse.statusPX == "200") {
                        resPX = 'Actualizado en PX ' + fechaActual
                        log.debug({ 'title': 'resultado del servicio exitoso', 'details': response });
                    } else {
                        resPX = 'Error en PX ' + fechaActual
                        log.debug({ 'title': 'resultado del servicio error', 'details': response });
                    }

                    if (responseparse.statusAMI == "200") {
                        resAMI = 'Actualizado en AMI ' + fechaActual
                        log.debug({ 'title': 'resultado del servicio exitoso', 'details': response });
                    } else {
                        resAMI = 'Error en AMI ' + fechaActual
                        log.debug({ 'title': 'resultado del servicio error', 'details': response });
                    }

                    log.debug({ 'title': 'resultado del servicio', 'details': resPX + '\n' + resAMI });

                    confirmaMigraAMI_PX = resPX + '\n' + resAMI


                } else {
                    log.debug({ 'title': 'fieldValue', 'details': 'No se obtuvo el id del registro' });
                }
            }
        } catch (error) {
            log.error('Error en beforeSubmit', error);
        }

        //actualizar campos de respuesta en netsuite y poner los dos campos uno debajo del otro
        currentRecord.setValue({
            fieldId: 'custrecord_ht_co_udp_pla_px_ami',
            value: confirmaMigraAMI_PX
        });

    }

    function obtenerFechaActual() {
        const fecha = new Date();

        const dia = fecha.getDate().toString().padStart(2, '0'); // Obtén el día y asegúrate de que tenga 2 dígitos
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0'); // El mes se indexa desde 0, así que agrega 1
        const año = fecha.getFullYear();

        const fechaFormateada = `${año}/${mes}/${dia}`;
        return fechaFormateada;
    }

    function afterSubmit(context) {

    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
