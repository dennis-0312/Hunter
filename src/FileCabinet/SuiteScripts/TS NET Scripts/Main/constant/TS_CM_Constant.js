/**
 * @NApiVersion 2.1
 */
define([], () => {

    let Constants = {
        RECORDS: {
            DOES_NOT_EXIST_ACTION: 0
        },
        SEARCHS: {
            SEARCH_FOR_GOOD: 'customsearch_ht_bienes', //HT Bienes - PRODUCCION
            TRANSACTION_SEARCH: 'customsearch_ht_transaction_search', //HT Transaction Search -  PRODUCCION
            COST_PROVISION_SEARCH: 'customsearch_ht_asiento_prov_costos_suma', //HT Asiento Provisión Costos CONSOLIDADO - PRODUCCION
            COST_PROVISION_DETAIL_SEARCH: 'customsearch_ht_asiento_prov_costos', //HT Asiento Provisión Costos DETALLE - PRODUCCION
        },
        DOCUMENT_TYPE: {
            INVOICE: 4,
        },
        TRANSACTION_TYPE: {
            SERVICE_ORDER_TYPE: 'SalesOrd',

        },
        CUSTOM_RECORD: {
            PROVISION_DETAIL: 'customrecord_ht_dp_detalle_provision', //HT Detalle de Provisión
        },
        ECUADOR_SUBSIDIARY: 2,
        EXPENSE_ACCOUNT: 2676,
        COMPONENTE_DISPOSITIVO_ID: 1,
        CONVENIO: 14
    }

    let Search = {}

    let Status = {
        ACTIVO: 1,
        SUSPENDIDO: 2,
        DESINSTALADO: 2,
        DISPONIBLE: 5,
        INACTIVO: 5,
        INSTALADO: 1,
        PROCESANDO: 4,
        VENTAS: 7,
        CHEQUEADO: 2,
        DEVOLUCION: 6,
    }

    let Parameter = {
        ADP_ACCION_DEL_PRODUCTO: 2,
        PARAM_CPT_CONFIGURA_PLATAFORMA_TELEMATIC: 5,
        TTR_TIPO_TRANSACCION: 8,
        CAMB_MOV_CUSTODIA: 131,
        CCD_CONTROL_DE_CUSTODIAS_DE_DISPOSITIVOS: 21,
        TAG_TIPO_AGRUPACION_PRODUCTO: 77,
        TCH_TIPO_CHEQUEO_OT: 6,
        COS_CIERRE_DE_ORDEN_DE_SERVICIO: 99,
        SCK_SOLICITA_CLIENTE_MONITOREO: 1,
        PXB_ITEM_SOLICITA_CLIENTE_NUEVO: 72,
        CPT_CONFIGURA_PLATAFORMA_TELEMATIC: 5,
        GOT_GENERA_SOLICITUD_DE_TRABAJO: 34,
        VOT_VARIAS_ORDENES_DE_TRABAJO: 90,
        PCD_PIDE_CODIGO_DE_ORIGEN: 53,
        PIM_PEDIR_INFORMACION_MEDICA: 60,
        CPI_CONTROL_DE_PRODUCTOS_INSTALADOS: 25,
        GPG_GENERA_PARAMETRIZACION_EN_GEOSYS: 36,
        GPT_GENERA_PARAMETRIZACION_EN_TELEMATICS: 38,
        ALQ_PRODUCTO_DE_ALQUILER: 13,
        EDC_ENTREGA_DIRECTA_A_CLIENTE: 28
    }

    let Valor = {
        SI: 9,
        NO: 18,
        VALOR_006_MANTENIMIENTO_CHEQUEO_DE_DISPOSITIVO: 44,
        VALOR_001_CHEQUEO_H_LOJACK: 105,
        VALOR_002_DESINSTALACION_DE_DISP: 21,
        VALOR_010_CAMBIO_DE_PROPIETARIO: 10,
        VALOR_001_INST_DISPOSITIVO: 43,
        VALOR_001_RENOVACION_NORMAL: 16
    }

    let customRecord = {
        BIENES: 'CUSTOMRECORD_HT_RECORD_BIENES',
        ORDEN_TRABAJO: 'CUSTOMRECORD_HT_RECORD_ORDENTRABAJO',
        CHASER: 'CUSTOMRECORD_HT_RECORD_MANTCHASER'
    }

    let Transaction = {
        SALES_ORDER: 'salesorder',
        INVOICE: 'invoice',
        ASSEMBLY_ORDER: 'workorder',
        ASSEMBLY_BUILD: 'assemblybuild'
    }

    return {
        Constants,
        Status,
        Parameter,
        Valor,
        Search,
        customRecord,
        Transaction
    }
})
