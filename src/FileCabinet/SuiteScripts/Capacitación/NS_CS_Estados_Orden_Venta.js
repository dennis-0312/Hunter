/**
 *@NApiVersion 2.1
*@NScriptType ClientScript
*/
define(['N/url', 'N/currentRecord'], function (url, currentRecord) {

    function fieldChanged(context) {
        let filtro1 = '';
        let filtro2 = '';
        let filtro3 = '';
        let accion = 1;

        let fechaDesde = context.currentRecord.getValue('fecha_desde');
        let fechaHasta = context.currentRecord.getValue('fecha_hasta');
        console.log('desde: ' + fechaDesde + ' - ' + 'hasta: ' + fechaHasta);
        let fecha_desde_flag = context.currentRecord.getValue('fecha_desde_flag');
        let fecha_hasta_flag = context.currentRecord.getValue('fecha_hasta_flag');
        console.log('desde_flag: ' + fecha_desde_flag + ' - ' + 'hasta_flag: ' + fecha_hasta_flag);
        let ordenvid = context.currentRecord.getValue('listaordenventa');
        let ordenvid_flag = context.currentRecord.getValue('listaov_flag');

        if (fechaDesde.length != 0 && fechaHasta.length != 0) {
            let paginaId = context.currentRecord.getValue('custpage_pagina');
            filtro1 = ordenvid != -1 ? ordenvid : ordenvid_flag;
            fechaDesde = sysDate(fechaDesde);
            fechaHasta = sysDate(fechaHasta);
            paginaId = paginaId.split('_')[1]; //* pagina_1 == [pagina], [1]
            window.onbeforeunload = null;
            document.location = url.resolveScript({
                scriptId: 'customscript_ns_ui_estados_orden_venta',
                deploymentId: 'customdeploy_ns_ui_estado_orden_venta',
                params: {
                    accion: accion,
                    paginaId: paginaId,
                    fechaDesde: fechaDesde,
                    fechaHasta: fechaHasta,
                    ordenvid: filtro1
                }
            });
        } else if (context.fieldId == 'custpage_pagina') {
            if (fecha_desde_flag.length != 0 && fecha_hasta_flag.length != 0) {
                let paginaId = context.currentRecord.getValue('custpage_pagina');
                filtro1 = ordenvid != -1 ? ordenvid : ordenvid_flag;
                paginaId = paginaId.split('_')[1]
                window.onbeforeunload = null;
                document.location = url.resolveScript({
                    scriptId: 'customscript_ns_ui_estados_orden_venta',
                    deploymentId: 'customdeploy_ns_ui_estado_orden_venta',
                    params: {
                        accion: accion,
                        paginaId: paginaId,
                        fechaDesde: fecha_desde_flag,
                        fechaHasta: fecha_hasta_flag,
                        ordenvid: filtro1,
                    }
                });
            }
        } else if (ordenvid != -1) {
            let paginaId = context.currentRecord.getValue('custpage_pagina');
            filtro1 = ordenvid != -1 ? ordenvid : ordenvid_flag;
            filtro2 = fechaDesde.length != 0 ? fechaDesde : fecha_desde_flag;
            filtro3 = fechaDesde.length != 0 ? fechaHasta : fecha_hasta_flag;
            paginaId = paginaId.split('_')[1]
            window.onbeforeunload = null;
            document.location = url.resolveScript({
                scriptId: 'customscript_ns_ui_estados_orden_venta',
                deploymentId: 'customdeploy_ns_ui_estado_orden_venta',
                params: {
                    accion: accion,
                    paginaId: paginaId,
                    fechaDesde: filtro2,
                    fechaHasta: filtro3,
                    ordenvid: filtro1
                }
            });
        }
    }

    const sysDate = (date_param) => {
        try {
            let date = new Date(date_param);
            var tdate = date.getDate();
            var month = date.getMonth() + 1; // jan = 0
            var year = date.getFullYear();
            const currentDate = tdate + '/' + month + '/' + year;
            return currentDate
        } catch (e) {
            log.error('Error-sysDate', e);
        }
    }


    return {
        fieldChanged: fieldChanged
    }
});
