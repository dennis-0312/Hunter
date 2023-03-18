/*********************************************************************************************************************************************
This script for Sales Order (Se consumira el servicio para consulta de información de NetSuite y generar la orden de trabajo) 
/*********************************************************************************************************************************************
File Name: TS_RS_Integration_3S_Turnos.js                                                                        
Commit: 01                                                        
Version: 1.0                                                                     
Date: 6/12/2022
ApiVersion: Script 2.1
Enviroment: SB
Governance points: N/A
Url: https://7451241-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=694&deploy=1
=============================================================================================================================================*/
/**
*@NApiVersion 2.1
*@NScriptType Restlet
*/
define(['N/log', 'N/search', 'N/record', 'N/query', 'N/format'], (log, search, record, query, format) => {
    const HT_CONSULTA_ORDEN_SERVICIO_SEARCH = 'customsearch_ht_consulta_orden_servicio'; //HT Consulta Orden de Servicio - PRODUCCION
    const HT_REGISTRO_BIENES_RECORD = 'customrecord_ht_record_registrobienes'; //
    const HT_ORDEN_TRABAJO_RECORD = 'customrecord_ht_record_ordentrabajo' //
    const HT_CONSULTA_ORDEN_TRABAJO_SEARCH = 'customsearch_ht_consulta_orden_trabajo'; //HT Consulta Orden de trabajo - PRODUCCION
    const ESTADO_VENTAS = 7;
    const PRIMER_TURNO = 1;
    const SEGUNDO_TURNO = 2;

    const _get = (scriptContext) => {
        // let nrodocumento = context.nrodocumento;
        // log.debug('Context', nrodocumento);
        let idOT = 'vacio';
        let idOS = 'vacio';
        let placa = 'vacio';
        log.debug('Context', scriptContext);

        try {
            let objSearch = search.create({
                type: "customrecord_ht_record_ordentrabajo",
                filters:
                    [
                        ["custrecord_ht_ot_cliente_id", "noneof", "@NONE@"],
                        "AND",
                        ["custrecord_ht_ot_orden_serivicio_txt", "startswith", scriptContext.idos]
                    ],
                columns:
                    [search.createColumn({
                        name: "internalid",
                        join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO",
                        summary: "GROUP",
                        label: "Orden Servicio ID"
                    }),
                    //  search.createColumn({
                    //     name: "internalid",
                    //     summary: "GROUP",
                    //     label: "Internal ID"
                    //  }),
                    search.createColumn({
                        name: "name",
                        summary: "GROUP",
                        sort: search.Sort.ASC,
                        label: "ID"
                    }),
                    search.createColumn({
                        name: "custrecord_ht_ot_estado",
                        summary: "GROUP",
                        label: "HT OT Estado Orden de trabajo"
                    }),
                    search.createColumn({
                        name: "custrecord_ht_ot_item",
                        summary: "GROUP",
                        label: "HT OT Ítem"
                    }),
                    search.createColumn({
                        name: "custrecord_ht_ot_cliente_id",
                        summary: "GROUP",
                        label: "Cliente"
                    }),
                    search.createColumn({
                        name: "custrecord_ht_ot_vehiculo",
                        summary: "GROUP",
                        label: "HT OT ID Vehículo"
                    })
                    ]
            });


            //filters.push(filterTecnico);
            let cantidadRegistros = objSearch.runPaged().count;
            log.debug('cantidadRegistros', cantidadRegistros);
            let result = objSearch.run().getRange({ start: 0, end: 100 });
            log.debug('Results', result);
            return result;
            // log.debug('Response', JSON.stringify(json));
            // return JSON.stringify(json);
        } catch (error) {
            log.error('Error-GET', error);
        }
    }

    const _post = (scriptContext) => {
        log.debug('Context', scriptContext);
        try {
            // let results = query.runSuiteQL({
            //     query: 'SELECT customrecord_ht_record_bienes.id as ID, customrecord_ht_record_bienes.custrecord_ht_bien_tipobien as TIPO, customrecord_ht_record_bienes.custrecord_ht_bien_marca as MARCA FROM customrecord_ht_record_bienes WHERE customrecord_ht_record_bienes.custrecord_ht_bien_placa = ?',
            //     params: [placa]
            // });
            // let id = results.results[0].values[0];

            let turno = record.create({ type: record.Type.TASK });
            turno.setValue({ fieldId: 'title', value: scriptContext.codigoTurno });
            turno.setValue({ fieldId: 'assigned', value: 4 });
            turno.setValue({ fieldId: 'startdate', value: new Date(scriptContext.fecha) });
            turno.setValue({ fieldId: 'custevent_ht_tr_hora', value: scriptContext.hora });
            turno.setValue({ fieldId: 'custevent_ht_turno_taller', value: scriptContext.taller });
            turno.setValue({ fieldId: 'company', value: scriptContext.customer });
            turno.setValue({ fieldId: 'transaction', value: scriptContext.ordenServicio });
            turno.setValue({ fieldId: 'relateditem', value: scriptContext.item });
            let recordTurno = turno.save();
            return { 'codigoTurno': recordTurno }
        } catch (error) {
            log.error('Error-POST', error);
        }
    }


    const generateOT = (id, body) => {
        try {
            let response;
            let tiempo1;
            let tiempo2;
            let idot;
            let ordenServicio = body.ordenServicio;
            let idcliente = body.idcliente;
            let tranid = body.tranid;
            let item = body.item;
            let displayname = body.displayname;
            let taller = body.taller;

            if (typeof body.tiempo1 != 'undefined') {
                tiempo1 = body.tiempo1;
            }

            if (typeof body.tiempo2 != 'undefined') {
                tiempo2 = body.tiempo2;
            }

            if (typeof body.idot != 'undefined') {
                idot = body.idot;
            }

            //log.debug('Case', '1');
            let objRecord = record.create({ type: HT_ORDEN_TRABAJO_RECORD, isDynamic: true });
            objRecord.setValue({ fieldId: 'custrecord_ht_ot_vehiculo', value: id });
            objRecord.setValue({ fieldId: 'custrecord_ht_id_orden_servicio', value: ordenServicio });
            objRecord.setValue({ fieldId: 'custrecord_ht_ot_ordenservicio', value: tranid });
            objRecord.setValue({ fieldId: 'custrecord_ht_ot_cliente', value: idcliente });
            objRecord.setValue({ fieldId: 'custrecord_ht_bien_item', value: item });
            objRecord.setValue({ fieldId: 'custrecord_ht_bien_descripcionitem', value: displayname });
            objRecord.setValue({ fieldId: 'custrecord_ht_ot_estado', value: ESTADO_VENTAS });
            objRecord.setValue({ fieldId: 'custrecord_ht_ot_taller', value: taller });
            objRecord.setValue({ fieldId: 'custrecord_ht_ot_primer_turno', value: tiempo1 });
            response = objRecord.save({ ignoreMandatoryFields: true });
            return response;
        } catch (error) {
            log.error('Error-generateOrdenTrabajo', error);
        }
    }


    const generateDetalleOS = (id, body) => {
        let ordenServicio = body.ordenServicio;
        let objRecord = record.create({ type: HT_REGISTRO_BIENES_RECORD, isDynamic: true });
        objRecord.setValue({ fieldId: 'custrecord_ht_rb_enlace', value: ordenServicio });
        objRecord.setValue({ fieldId: 'custrecord_ht_rb_bien', value: id });
        let response = objRecord.save({ ignoreMandatoryFields: true });
        return response;
    }

    return {
        get: _get,
        post: _post
    }
});
/*********************************************************************************************************************************************
TRACKING
/*********************************************************************************************************************************************
Commit:01
Version: 1.0
Date: 6/12/2022
Author: Dennis Fernández
Description: Creación del script en SB.
==============================================================================================================================================*/