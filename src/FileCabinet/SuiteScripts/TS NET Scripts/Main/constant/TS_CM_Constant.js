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
        CONVENIO: 14,
        FLUJO_CUSTODIA: 2,
        CREATE: 'create',
        EDIT: 'edit',
        COPY: 'copy',
        VEHICULO: 1,
        MOTO: 2,
        TERRESTRE: 1,
        MARITIMO: 2,
        TANQUE: 3,
        INMUEBLE: 4,
        PRODUCCION: 5
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
        CONVERTIDO: 11,
        APROBADO: 1,
        APROBACION_PENDIENTE: 2,
        PENDIENTE_DE_ACTIVACION: 3,
        PAGADO: 1,
        BILL_PAID_IN_FULL: 93,
        ENVIADO_A_CORTE: 1,
        CONCILIADO: 2,
        EN_PROCESO_DE_CORTE: 2,
        SIN_DISPOSITIVO: 4
    }

    let Parameter = {
        ADP_ACCION_DEL_PRODUCTO: 2,
        PARAM_CPT_CONFIGURA_PLATAFORMA_TELEMATIC: 5,
        TTR_TIPO_TRANSACCION: 8,
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
        EDC_ENTREGA_DIRECTA_A_CLIENTE: 28,
        PGR_PRODUCTO_DE_GARANTÍA: 58,
        GOF_GENERA_SOLICITUD_DE_FACTURACION: 33,
        APR_SOLICITA_APROBACIÓN: 11,
        CPC_HMONITOREO_CAMBIO_PROPETARIO_CON_COBERTURAS: 24,
        CPR_CONVERSION_DE_PRODUCTO_UPGRADE: 26,
        PNB_PIDE_NUMBER_BOX: 66,
        PMI_PRODUCTO_PARA_MONITOREO_DE_INMUEBLES: 63,
        TDP_TIPO_DE_PRODUCTO: 10,
        TRN_TIPO_DE_RENOVACION: 84,
        BOT_BUSCAR_ORDEN_DE_TRABAJO: 100,
        CAC_CONTROL_ASOCIACION_COOPERATIVA: 19,
        IET_PEDIR_INF_DE_EJEC_TRABAJO: 43,
        CPR_CONVERSION_DE_PRODUCTO_UPGRADE: 26,
        SDE_SOLICITA_DISPOSITIVOS_ENTREGADOS: 74,
        IRS_ITEM_DE_RECONEXION_DE_SERVICIO: 47,
        IGS_PRODUCTO_MONITOREADO_POR_GEOSYS: 44,
        TRM_SERVICIO_DE_TRANSMISION: 83,
        THC_HUNTER_CARGO_TECNOLOGIA: 92,
        IRP_ITEM_DE_REPUESTO: 46,
        PCI_PRODUCTO_CONTROL_INTERNO: 93,
        GPR_GRUPO_DE_PRODUCCION: 37,
        PRO_ITEM_COMERCIAL_DE_PRODUCCION: 70,
        DSR_DEFINICION_DE_SERVICIOS: 3,
        UDP_UTILIZA_PARALIZADOR: 87
    }

    let Valor = {
        SI: 9,
        NO: 18,
        VALOR_006_MANTENIMIENTO_CHEQUEO_DE_DISPOSITIVO: 44,
        VALOR_001_CHEQUEO_H_LOJACK: 105,
        VALOR_002_DESINSTALACION_DE_DISP: 21,
        VALOR_010_CAMBIO_DE_PROPIETARIO: 10,
        VALOR_001_INST_DISPOSITIVO: 43,
        VALOR_001_RENOVACION_NORMAL: 16,
        VALOR_001_GENERA_CUSTODIAS: 55,
        VALOR_002_ENTREGA_CUSTODIAS: 56,
        VALOR_003_REINSTALACION_DE_DISP: 26,
        VALOR_LOJ_LOJACK: 19,
        VALOR_004_RENOVACION_DE_DISP: 15,
        VALOR_CAMB_GPS_TDE_DEALER_MOV_CUSTODIA: 131,
        VALOR_011_INSTALACION_OTROS_PRODUCTOS: 46,
        VALOR_015_VENTA_SERVICIOS: 50,
        VALOR_008_BASICO: 114,
        VALOR_MON_MONITOREO: 7,
        VALOR_002_RENOVACION_ANTICIPADA: 20,
        VALOR_009_DEMO: 115,
        VALOR_003_CHEQUEO_H_MONITOREO_PERSONAL: 95

    }

    let customRecord = {
        BIENES: 'CUSTOMRECORD_HT_RECORD_BIENES',
        ORDEN_TRABAJO: 'CUSTOMRECORD_HT_RECORD_ORDENTRABAJO',
        CHASER: 'CUSTOMRECORD_HT_RECORD_MANTCHASER',
        CUSTODIA: 'CUSTOMRECORD_HT_RECORD_CUSTODIA',
        COMISIONES_EXTERNAS: 'CUSTOMRECORD_RECORD_COMISIONEXTERNA'
    }

    let Transaction = {
        SALES_ORDER: 'salesorder',
        INVOICE: 'invoice',
        ASSEMBLY_ORDER: 'workorder',
        ASSEMBLY_BUILD: 'assemblybuild',
        BIN: 'bin',
        VENDOR_PAYMENT: 'vendorpayment'
    }

    let Form = {
        CANDADO: 229,
        VEHICULO: 154
    }

    let Roles = {
        EC_CUENTAS_POR_COBRAR: 1221
    }

    return {
        Constants,
        Status,
        Parameter,
        Valor,
        Search,
        customRecord,
        Transaction,
        Form,
        Roles
    }
})
