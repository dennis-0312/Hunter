/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = == = = = = = = = = = = =\
||                                                                                                                  
||   This script for Customer (Generación de identificador para cliente)                                            
||                                                                                                                  
||   File Name: TS_UE_Orden_Trabajo_2.js                                                                            
||                                                                                                                  
||   Commit      Version     Date            ApiVersion         Enviroment       Governance points                  
||   01          1.0         26/01/2023      Script 2.1         SB               N/A                                
||                                                                                                                  
\  = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = == = = = = = = = = = = = */
/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/search', 'N/record', 'N/redirect', 'N/ui/serverWidget'], (log, search, record, redirect, serverWidget) => {
    const afterSubmit = (context) => {
        var type_event = context.type;
        var currentRecord = context.newRecord;
        const idRecord = currentRecord.id;
        let objRecord = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: idRecord, isDynamic: true });
        if (type_event == context.UserEventType.EDIT) {


            let idOrdenTrabajo = objRecord.getValue('custrecord_ht_ot_serieproductoasignacion');
            let dispositivo = objRecord.getValue('custrecord_ht_ot_dispositivo');
            let modelo = objRecord.getValue('custrecord_ht_ot_modelo');
            let unidad = objRecord.getValue('custrecord_ht_ot_unidad');
            let firmware = objRecord.getValue('custrecord_ht_ot_firmware');
            let script = objRecord.getValue('custrecord_ht_ot_script');
            let servidor = objRecord.getValue('custrecord_ht_ot_servidor');
            let simcard = objRecord.getValue('custrecord_ht_ot_simcard');
            let apn = objRecord.getValue('custrecord_ht_ot_apn');
            let imei = objRecord.getValue('custrecord_ht_ot_imei');
            let vid = objRecord.getValue('custrecord_ht_ot_vid');
            let ubicacion = objRecord.getValue('custrecord_ht_ot_ubicacion');

            let supervisor = objRecord.getValue('custrecord_ht_ot_supervisorasignacion');
            let asignado = objRecord.getValue('custrecord_ht_ot_tecnicoasignacion');
            let fechaTrabajo = objRecord.getValue('custrecord_ht_ot_fechatrabajoasignacion');
            let horatrabajo = objRecord.getValue('custrecord_ht_ot_horatrabajoasignacion');
            if (idOrdenTrabajo != '' && dispositivo != '' && modelo != '' && unidad != '' && firmware != '' && script != '' && servidor != '' && simcard != '' && apn != '' && imei != '' && vid != '' && ubicacion != '' && supervisor != '' && asignado != '' && fechaTrabajo != '' && horatrabajo != '') {
                log.debug('entra');
                objRecord.setValue('custrecord_ht_ot_estado', 2);
              	objRecord.save();
            }
        }

    }

    const beforeLoad = (context) => {
        var form = context.form;
        var currentRecord = context.newRecord;
        const idRecord = currentRecord.id;
        var type_event = context.type;

        if (type_event == context.UserEventType.VIEW) {
            let objRecord = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: idRecord, isDynamic: true });
            let idOrdenTrabajo = objRecord.getValue('custrecord_ht_ot_ordenfabricacion');
            let idOrdenServicio = objRecord.getValue('custrecord_ht_ot_orden_servicio');
            let estado = objRecord.getValue('custrecord_ht_ot_estado');
            if (estado == 4) {
                form.addButton({
                    id: 'custpage_ts_fabricarproducto',
                    label: 'Ensamble de Dispositivo',
                    functionName: 'printproducto(' + idOrdenTrabajo + ')'
                });
                form.clientScriptModulePath = './TS_CS_Print_Producto.js';
            }
        }
    }
    return {
        afterSubmit: afterSubmit,
        beforeLoad: beforeLoad
    }
});
/********************************************************************************************************************
TRACKING
/********************************************************************************************************************
/* Commit:01
Version: 1.0
Date: 26/01/2023
Author: Jeferson Mejia
Description: Creación del script.
===================================================================================================================*/