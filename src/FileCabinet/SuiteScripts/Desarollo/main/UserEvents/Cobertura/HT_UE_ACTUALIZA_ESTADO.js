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



    }

    function obtenerFechaYHoraActual() {
        const fecha = new Date();

        const dia = fecha.getDate().toString().padStart(2, '0'); // Obtén el día y asegúrate de que tenga 2 dígitos
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0'); // El mes se indexa desde 0, así que agrega 1
        const año = fecha.getFullYear();

        const horas = fecha.getHours().toString().padStart(2, '0'); // Obtén las horas y asegúrate de que tenga 2 dígitos
        const minutos = fecha.getMinutes().toString().padStart(2, '0'); // Obtén los minutos y asegúrate de que tenga 2 dígitos
        const segundos = fecha.getSeconds().toString().padStart(2, '0'); // Obtén los segundos y asegúrate de que tenga 2 dígitos

        const fechaYHoraFormateada = `${año}/${mes}/${dia} ${horas}:${minutos}:${segundos}`;
        return fechaYHoraFormateada;
    }

    function afterSubmit(context) {
        log.debug({ 'title': 'beforeSubmit', 'details': 'xdd' });

        try {

            if (context.type === 'edit') {
                // Obtiene el registro actual que se está actualizando
                var currentRecord = context.newRecord;
                // Obtiene el valor de un campo específico
                var id = currentRecord.getValue({
                    fieldId: 'id'
                });

                log.debug({ 'title': 'fieldValue', 'details': id });


                if (id != null) {

                    log.debug({ 'title': 'fieldValue', 'details': id });

                    //obtener usuario actual que realiza la edición
                    var currentUser = runtime.getCurrentUser();
                    //var usuario = currentUser.id;
                    var usuarioNombre = currentUser.name;
                    var idusuario = currentUser.id;

                    var body = {
                        "action": "test",
                        "idcobertura": id,
                        "idusuario": idusuario,
                    }

                    let resletHeaders = {
                        'Content-Type': 'application/json',
                        'Accept': '*/*'
                    }

                    let resletResponse = https.requestRestlet({
                        body: JSON.stringify(body),
                        deploymentId: 'customdeploy_routecobertura',
                        scriptId: 'customscript_routecobertura',
                        headers: resletHeaders
                    });
                    let response = resletResponse.body;

                    //parsear el resultado para evaluar el campo mensaje
                    responseparse = JSON.parse(response);

                    log.debug({ 'title': 'resultado del servicio no validado', 'details': response });


                    var resPX = '';
                    var resAMI = '';

                    if (responseparse.px && responseparse.px.status === 200) {
                        resPX = 'Actualizado en PX ' + obtenerFechaYHoraActual();
                        log.debug({ 'title': 'Resultado del servicio PX exitoso', 'details': responseparse.px });
                    } else if (responseparse.px) {
                        log.debug({ 'title': 'Resultado del servicio PX error', 'details': responseparse.px });
                    }

                    if (responseparse.ami && responseparse.ami.status === 200) {
                        resAMI = 'Actualizado en AMI ' + obtenerFechaYHoraActual();
                        log.debug({ 'title': 'Resultado del servicio AMI exitoso', 'details': responseparse.ami });
                    } else if (responseparse.ami) {
                        log.debug({ 'title': 'Resultado del servicio AMI error', 'details': responseparse.ami });
                    }

                    log.debug({ 'title': 'Resultado del servicio', 'details': resPX + ' || ' + resAMI });

                    confirmaMigraAMI_PX = resPX + ' || ' + resAMI;


                } else {
                    log.debug({ 'title': 'fieldValue', 'details': 'No se obtuvo el id del registro' });
                }

            }

        } catch (error) {
            log.error('Error en afterSubmit', error);
        }

        //actualizar campos de respuesta en netsuite y poner los dos campos uno debajo del otro
        /*currentRecord.setValue({
            fieldId: 'custrecord_ht_co_udp_pla_px_ami',
            value: confirmaMigraAMI_PX
        });*/

    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
