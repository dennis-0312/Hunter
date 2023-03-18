/*********************************************************************************************************************************************
This script for actions (Plugin para ejecución de funciones) 
/*********************************************************************************************************************************************
File Name: TS_PL_Functions.js                                                                        
Commit: 01                                                        
Version: 1.0                                                                     
Date: 15/01/2022
ApiVersion: Script 2.1
Enviroment: SB
Governance points: N/A
=============================================================================================================================================*/
/**
 * @NApiVersion 2.1
 * @NScriptType plugintypeimpl
 */
define(['N/log', 'N/record'], (log, record) => {
    const HT_ORDEN_TRABAJO_RECORD = 'customrecord_ht_record_ordentrabajo' //HT Orden de trabajo
    const ESTADO_VENTAS = 7;

    //Script => TS_UE_Detalle_Bien
    const plGenerateOT = (body) => {
        try {
            log.debug('Log-PL-Request', body);
            let objRecord = record.create({ type: HT_ORDEN_TRABAJO_RECORD });
            objRecord.setValue({ fieldId: 'custrecord_ht_ot_orden_servicio', value: body.serviceOrder });
            objRecord.setValue({ fieldId: 'custrecord_ht_ot_cliente_id', value: body.customer });
            objRecord.setValue({ fieldId: 'custrecord_ht_ot_vehiculo', value: body.vehiculo });
            objRecord.setValue({ fieldId: 'custrecord_ht_ot_item', value: body.item });
            objRecord.setValue({ fieldId: 'custrecord_ht_ot_descripcionitem', value: body.displayname });
            objRecord.setValue({ fieldId: 'custrecord_ht_ot_estado', value: ESTADO_VENTAS });
            objRecord.setValue({ fieldId: 'custrecord_ht_ot_orden_serivicio_txt', value: body.ordenServicio });
            let response = objRecord.save();
            return response;
        } catch (error) {
            log.error('Error-plGenerateOT', error);
        }
    }

    //Script => TS_UE_Detalle_Bien
    const plDeleteOT = (body) => {
        try {

        } catch (error) {

        }
    }

    return {
        plGenerateOT: plGenerateOT
    }
});
/*********************************************************************************************************************************************
TRACKING
/*********************************************************************************************************************************************
Commit:01
Version: 1.0
Date: 15/01/2022
Author: Dennis Fernández
Description: Creación del script en SB.
==============================================================================================================================================*/