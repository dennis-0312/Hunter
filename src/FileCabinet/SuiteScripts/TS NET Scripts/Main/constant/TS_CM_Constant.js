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
        EXPENSE_ACCOUNT: 450,
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
        PRODUCCION: 5,
        TELEFONO_CELULAR: 1,
        TELEFONO_CONVENCIONAL: 10,
        CODIGO_CAJA_CHICA: 'CC',
        MOVISTAR: '001',
        CLARO: '002',
        EMAIL_TYPE_AMI: 2,
        FEL: {
            ELECTRONIC_DOCUMENT_PACKAGE: 2,
            EC_EI_TEMPLATE_TRANSFER_ORDER: 3
        },
        UNIDAD_TIEMPO: {
            ANIO: 1,
            MESES: 2,
            DIA: 3
        }
    }

    let Search = {}

    let Status = {
        INSTALADO: 1,
        DESINSTALADO: 2,
        DANADO: 3,
        CODIGO_BLANCO: 4,
        DISPONIBLE: 5,
        PERDIDO: 6,
        DADO_DE_BAJO: 7,
        ENTREGADO_A_CLIENTE: 8,
        RESERVADO: 9,
        ANULADO: 10,
        CONVERTIDO: 11,
        ACTIVO: 1,
        SUSPENDIDO: 2,
        INACTIVO: 5,
        PROCESANDO: 4,
        VENTAS: 7,
        CHEQUEADO: 2,
        DEVOLUCION: 6,
        APROBADO: 1,
        APROBACION_PENDIENTE: 2,
        PENDIENTE_DE_ACTIVACION: 3,
        PAGADO: 1,
        BILL_PAID_IN_FULL: 93,
        ENVIADO_A_CORTE: 1,
        CONCILIADO: 2,
        EN_PROCESO_DE_CORTE: 2,
        SIN_DISPOSITIVO: 4,
        RENOVACION: 8,
        CORTE: 3,
        PROCESO_CONCILIACION: 1,
        CONFIRMADO: 2,
        APPROVED: 2,
        PENDING_APPROVAL: 1,
        ESTADO_CONVENIO_INACTIVO: 3,
        FACTURA_INTERNA_ANULADA: 3
    }

    let Parameter = {
        ADP_ACCION_DEL_PRODUCTO: 104, //ADP - ACCION DEL PRODUCTO
        PARAM_CPT_CONFIGURA_PLATAFORMA_TELEMATIC: 152, //CPT - CONFIGURA PLATAFORMA TELEMATIC
        TTR_TIPO_TRANSACCION: 118, //TTR - TIPO TRANSACCION
        CCD_CONTROL_DE_CUSTODIAS_DE_DISPOSITIVOS: 129, //CCD - CONTROL DE CUSTODIAS DE DISPOSITIVOS
        TAG_TIPO_AGRUPACION_PRODUCTO: 116, //TAG - TIPO AGRUPACION PRODUCTO
        TCH_TIPO_CHEQUEO_OT: 125, //TCH - TIPO DE CHEQUEO O/T
        COS_CIERRE_DE_ORDEN_DE_SERVICIO: 188, //COS - CIERRE DE ORDEN DE SERVICIO
        SCK_SOLICITA_CLIENTE_MONITOREO: 115, //SCK - SOLICITA CLIENTE MONITOREO
        PXB_ITEM_SOLICITA_CLIENTE_NUEVO: 144, //PXB - ITEM SOLICITA CLIENTE NUEVO
        CPT_CONFIGURA_PLATAFORMA_TELEMATIC: 152, //CPT - CONFIGURA PLATAFORMA TELEMATIC
        GOT_GENERA_SOLICITUD_DE_TRABAJO: 122, //GOT - GENERA SOLICITUD DE TRABAJO
        VOT_VARIAS_ORDENES_DE_TRABAJO: 120, //VOT - GENERA VARIAS ORDENES DE TRABAJO
        PCD_PIDE_CODIGO_DE_ORIGEN: 143, //PCD - PIDE CODIGO DE ORIGEN
        PIM_PEDIR_INFORMACION_MEDICA: 151, //PIM - PEDIR INFORMACION MEDICA
        CPI_CONTROL_DE_PRODUCTOS_INSTALADOS: 127, //CPI - CONTROL DE PRODUCTOS INSTALADOS
        GPG_GENERA_PARAMETRIZACION_EN_GEOSYS: 109, //GPG - GENERA PARAMETRIZACION EN GEOSYS
        GPT_GENERA_PARAMETRIZACION_EN_TELEMATICS: 153, //GPT - GENERA PARAMETRIZACION EN TELEMATICS
        ALQ_PRODUCTO_DE_ALQUILER: 132, //ALQ - PRODUCTO DE ALQUILER
        EDC_ENTREGA_DIRECTA_A_CLIENTE: 128, //EDC - ENTREGA DIRECTA A CLIENTE
        PGR_PRODUCTO_DE_GARANTÍA: 111, //PGR - PRODUCTO DE GARANTÍA
        GOF_GENERA_SOLICITUD_DE_FACTURACION: 108, //GOF - GENERA SOLICITUD DE FACTURACION
        APR_SOLICITA_APROBACIÓN: 105, //APR - SOLICITA APROBACIÓN
        CPC_HMONITOREO_CAMBIO_PROPETARIO_CON_COBERTURAS: '0', //CPC - H. MONITOREO CAMBIO PROPETARIO CON COBERTURAS
        CPR_CONVERSION_DE_PRODUCTO_UPGRADE: 106, //CPR - CONVERSION DE PRODUCTO-UPGRADE
        PNB_PIDE_NUMBER_BOX: 161, //PNB - PIDE NUMBER BOX
        PMI_PRODUCTO_PARA_MONITOREO_DE_INMUEBLES: 146, //PMI - PRODUCTO PARA MONITOREO DE INMUEBLES
        TDP_TIPO_DE_PRODUCTO: 117, //TDP - TIPO DE PRODUCTO
        TRN_TIPO_DE_RENOVACION: 142, //TRN - TIPO DE RENOVACION
        BOT_BUSCAR_ORDEN_DE_TRABAJO: '0', //BOT - BUSCAR ORDEN DE TRABAJO
        CAC_CONTROL_ASOCIACION_COOPERATIVA: 162, //CAC - CONTROL ASOCIACION COOPERATIVA
        IET_PEDIR_INF_DE_EJEC_TRABAJO: 138, //IET - PEDIR INF. DE EJEC. TRABAJO
        SDE_SOLICITA_DISPOSITIVOS_ENTREGADOS: 131, //SDE - SOLICITA DISPOSITIVOS ENTREGADOS
        IRS_ITEM_DE_RECONEXION_DE_SERVICIO: 164, //IRS - ITEM DE RECONEXION DE SERVICIO
        IGS_PRODUCTO_MONITOREADO_POR_GEOSYS: 110, //IGS - PRODUCTO MONITOREADO POR GEOSYS
        TRM_SERVICIO_DE_TRANSMISION: 140, //TRM - SERVICIO DE TRANSMISION
        THC_HUNTER_CARGO_TECNOLOGIA: 178, //THC - HUNTER CARGO TECNOLOGÍA
        IRP_ITEM_DE_REPUESTO: 150, //IRP - ITEM DE REPUESTO
        PCI_PRODUCTO_CONTROL_INTERNO: 169, //PCI - PRODUCTO CONTROL INTERNO
        GPR_GRUPO_DE_PRODUCCION: 133, //GPR - GRUPO DE PRODUCCION
        PRO_ITEM_COMERCIAL_DE_PRODUCCION: 124, //PRO - ITEM COMERCIAL DE PRODUCCION
        DSR_DEFINICION_DE_SERVICIOS: 147, //DSR - DEFINICION DE SERVICIOS
        UDP_UTILIZA_PARALIZADOR: 139, //UDP - UTILIZA PARALIZADOR
        FAM_FAMILIA_DE_PRODUCTOS: 107, //FAM - FAMILIA DE PRODUCTOS
        RFC_REVISION_DE_FAMILIA_DE_CUSTODIA: 184, //RFC - REVISIÓN DE FAMILIA DE CUSTODIA
        RLP_REVISION_DE_NIVEL_DE_PRECIOS: 185, //RLP - REVISION DE NIVEL DE PRECIOS
        PHV_PRODUCTO_HABILITADO_PARA_LA_VENTA: 112, //PHV - PRODUCTO HABILITADO PARA LA VENTA 
        PPS_PEDIR_PERIODO_DE_SERVICIO: 113, //PPS - PEDIR PERIODO DE SERVICIO
        TMI_TIPO_DE_MOVIMIENTO_DE_INVENTARIO: 126, //TMI - TIPO DE MOVIMIENTO DE INVENTARIO
        VBI_VALIDACION_DE_BIEN_INGRESADO: 'VBI',
        AVP_ARTICULO_DE_VENTA_PRODUCCION: 184, //AVP - ARTICULO DE VENTA PRODUCCION
    }

    let Valor = {
        VALOR_001_CHEQUEO_H_LOJACK: 1807, //001 - CHEQUEO H. LOJACK
        VALOR_001_GENERA_CUSTODIAS: 1857, //001 - GENERA CUSTODIAS
        VALOR_001_INST_DISPOSITIVO: 1797, //001 - INST. DISPOSITIVO
        VALOR_001_RENOVACION_NORMAL: 1839, //001 - RENOVACION NORMAL
        VALOR_002_DESINSTALACION_DE_DISP: 1809, //002 - DESINSTALACION DE DISP.
        VALOR_002_ENTREGA_CUSTODIAS: 1813, //002 - ENTREGA CUSTODIAS
        VALOR_002_RENOVACION_ANTICIPADA: 2062, //002 - RENOVACION ANTICIPADA
        VALOR_003_REINSTALACION_DE_DISP: 2026, //003 - REINSTALACION DE DISP
        VALOR_004_RENOVACION_DE_DISP: 1838, //004 - RENOVACION DE DISP.
        VALOR_004_EGRESO: 1805, //004 - EGRESO
        VALOR_006_MANTENIMIENTO_CHEQUEO_DE_DISPOSITIVO: 1831, //006 - MANTENIMIENTO- CHEQUEO DE DISPOSITIVO
        VALOR_007_CHEQUEO_DE_COMPONENTES: 2449, //007 - CHEQUEO DE COMPONENTES
        VALOR_008_BASICO: 130, //008 - BASICO
        VALOR_009_DEMO: '0', //009 - DEMO
        VALOR_010_CAMBIO_DE_PROPIETARIO: 1851, //010 - CAMBIO DE PROPIETARIO
        VALOR_011_INSTALACION_OTROS_PRODUCTOS: 1815, //011 - INSTALACION OTROS PRODUCTOS
        VALOR_013_SOFTWARE_GENERAL: '0', //013 - SOFTWARE GENERAL
        VALOR_015_VENTA_SERVICIOS: 1822, //015 - VENTA SERVICIOS
        VALOR_CAMB_GPS_TDE_DEALER_MOV_CUSTODIA: 1854, //CET - CAMB GPS TDE-DEALER (MOV. CUSTODIA)
        VALOR_LOJ_LOJACK: 7, //LOJ - LOJACK
        VALOR_MON_MONITOREO: 1, //MON - MONITOREO
        NO: 1799, //N - NO
        SI: 1798, //S - SI
        VALOR_X_USO_CONVENIOS: 1853, //X - USO DE CONVENIOS
        VALOR_003_CHEQUEO_H_MONITOREO_PERSONAL: 1876
    }

    let Codigo_parametro = {
        COD_VBI_VALIDACION_DE_BIEN_INGRESADO: 'VBI',
        COD_ADP_ACCION_DEL_PRODUCTO: 'ADP',
        COD_PARAM_CPT_CONFIGURA_PLATAFORMA_TELEMATIC: 'CPT',
        COD_TTR_TIPO_TRANSACCION: 'TTR',
        COD_CCD_CONTROL_DE_CUSTODIAS_DE_DISPOSITIVOS: 'CCD',
        COD_TAG_TIPO_AGRUPACION_PRODUCTO: 'FAM',
        COD_TCH_TIPO_CHEQUEO_OT: 'TCH',
        COD_COS_CIERRE_DE_ORDEN_DE_SERVICIO: 'COS',
        COD_SCK_SOLICITA_CLIENTE_MONITOREO: 'SCK',
        COD_PXB_ITEM_SOLICITA_CLIENTE_NUEVO: 'PXB',
        COD_CPT_CONFIGURA_PLATAFORMA_TELEMATIC: 'CPT',
        COD_GOT_GENERA_SOLICITUD_DE_TRABAJO: 'GOT',
        COD_VOT_VARIAS_ORDENES_DE_TRABAJO: 'VOT',
        COD_PCD_PIDE_CODIGO_DE_ORIGEN: 'PCD',
        COD_PIM_PEDIR_INFORMACION_MEDICA: 'PIM',
        COD_CPI_CONTROL_DE_PRODUCTOS_INSTALADOS: 'CPI',
        COD_GPG_GENERA_PARAMETRIZACION_EN_GEOSYS: 'GPG',
        COD_GPT_GENERA_PARAMETRIZACION_EN_TELEMATICS: 'GPT',
        COD_ALQ_PRODUCTO_DE_ALQUILER: 'ALQ',
        COD_EDC_ENTREGA_DIRECTA_A_CLIENTE: 'EDC',
        COD_PGR_PRODUCTO_DE_GARANTÍA: 'PGR',
        COD_GOF_GENERA_SOLICITUD_DE_FACTURACION: 'GOF',
        COD_APR_SOLICITA_APROBACIÓN: 'APR',
        COD_CPC_HMONITOREO_CAMBIO_PROPETARIO_CON_COBERTURAS: 'CPC',
        COD_CPR_CONVERSION_DE_PRODUCTO_UPGRADE: 'CPR',
        COD_PNB_PIDE_NUMBER_BOX: 'PNB',
        COD_PMI_PRODUCTO_PARA_MONITOREO_DE_INMUEBLES: 'PMI',
        COD_TDP_TIPO_DE_PRODUCTO: 'TDP',
        COD_TRN_TIPO_DE_RENOVACION: 'TRN',
        COD_BOT_BUSCAR_ORDEN_DE_TRABAJO: 'BOT',
        COD_CAC_CONTROL_ASOCIACION_COOPERATIVA: 'CAC',
        COD_IET_PEDIR_INF_DE_EJEC_TRABAJO: 'IET',
        COD_CPR_CONVERSION_DE_PRODUCTO_UPGRADE: 'CPR',
        COD_SDE_SOLICITA_DISPOSITIVOS_ENTREGADOS: 'SDE',
        COD_IRS_ITEM_DE_RECONEXION_DE_SERVICIO: 'IRS',
        COD_IGS_PRODUCTO_MONITOREADO_POR_GEOSYS: 'IGS',
        COD_TRM_SERVICIO_DE_TRANSMISION: 'TRM',
        COD_THC_HUNTER_CARGO_TECNOLOGIA: 'THC',
        COD_IRP_ITEM_DE_REPUESTO: 'IRP',
        COD_PCI_PRODUCTO_CONTROL_INTERNO: 'PCI',
        COD_GPR_GRUPO_DE_PRODUCCION: 'GPR',
        COD_PRO_ITEM_COMERCIAL_DE_PRODUCCION: 'PRO',
        COD_DSR_DEFINICION_DE_SERVICIOS: 'DSR',
        COD_UDP_UTILIZA_PARALIZADOR: 'UDP',
        COD_FAM_FAMILIA_DE_PRODUCTOS: 'FAM',
        COD_RFC_REVISION_DE_FAMILIA_DE_CUSTODIA: 'RFC',
        COD_RLP_REVISION_DE_NIVEL_DE_PRECIOS: 'RLP',
        COD_RFU_REVISIÓN_DE_FAMILIA_UPGRADE: 'RFU',
        COD_PPS_PEDIR_PERIODO_DE_SERVICIO: 'PPS',
        COD_AVP_ARTICULO_DE_VENTA_PRODUCCION: 'AVP' //AVP - ARTICULO DE VENTA PRODUCCION
    }

    let Codigo_Valor = {
        COD_SI: 'S',
        COD_NO: 'N',
        COD_VALOR_006_MANTENIMIENTO_CHEQUEO_DE_DISPOSITIVO: '006',
        COD_VALOR_001_CHEQUEO_H_LOJACK: '001',
        COD_VALOR_002_DESINSTALACION_DE_DISP: '002',
        COD_VALOR_010_CAMBIO_DE_PROPIETARIO: '010',
        COD_VALOR_001_INST_DISPOSITIVO: '001',
        COD_VALOR_001_RENOVACION_NORMAL: '001',
        COD_VALOR_001_GENERA_CUSTODIAS: '001',
        COD_VALOR_002_ENTREGA_CUSTODIAS: '002',
        COD_VALOR_003_REINSTALACION_DE_DISP: '003',
        COD_VALOR_LOJ_LOJACK: 'LOJ',
        COD_VALOR_004_RENOVACION_DE_DISP: '004',
        COD_VALOR_CAMB_GPS_TDE_DEALER_MOV_CUSTODIA: 'CAMB GPS TDE',
        COD_VALOR_011_INSTALACION_OTROS_PRODUCTOS: '011',
        COD_VALOR_015_VENTA_SERVICIOS: '015',
        COD_VALOR_008_BASICO: '008',
        COD_VALOR_MON_MONITOREO: 'MON',
        COD_VALOR_002_RENOVACION_ANTICIPADA: '002',
        COD_VALOR_009_DEMO: '009'
    }

    let customRecord = {
        BIENES: 'CUSTOMRECORD_HT_RECORD_BIENES',
        ORDEN_TRABAJO: 'CUSTOMRECORD_HT_RECORD_ORDENTRABAJO',
        CHASER: 'CUSTOMRECORD_HT_RECORD_MANTCHASER',
        CUSTODIA: 'CUSTOMRECORD_HT_RECORD_CUSTODIA',
        COMISIONES_EXTERNAS: 'CUSTOMRECORD_RECORD_COMISIONEXTERNA',
        DISPOSITIVO: 'CUSTOMRECORD_HT_RECORD_DETALLECHASERDISP',
        SIM: 'CUSTOMRECORD_HT_RECORD_DETALLECHASERSIM',
        DATOS_TECNICOS: 'customrecord_ht_record_mantchaser',
        ASIENTOS_EVOLUTION: 'customrecord_ht_ae_asientos_evolution'
    }

    let Transaction = {
        SALES_ORDER: 'salesorder',
        INVOICE: 'invoice',
        ASSEMBLY_ORDER: 'workorder',
        ASSEMBLY_BUILD: 'assemblybuild',
        BIN: 'bin',
        VENDOR_PAYMENT: 'vendorpayment',
        CHECK: 'check',
        VENDOR_BILL: 'vendorbill',
        TRANSFER_ORDER: 'transferorder',
        VENDOR_PRE_PAYMENT: 'vendorprepayment'
    }

    let Entity = {
        CUSTOMER: 'customer',
        VENDOR: 'vendor',
        LEAD: 'lead',
        PROSPECT: 'prospect'
    }

    let Form = {
        CANDADO: 229,
        VEHICULO: 154,
        ORDEN_SERVICIO_CLIENT: 103,
        ORDEN_PROVEDURIA: 137,
        STANDAR_SALES_ORDER: 68,
        OT_HT_ACCESORIOS_ALQUILER: 130,
    }

    let Roles = {
        EC_CUENTAS_POR_COBRAR: 1221
    }

    let PriceLevels = {
        PVP: 1,
        PERSONALIZADO: -1
    }

    //?N/ui/message Module
    // message.Type.CONFIRMATION
    // message.Type.INFORMATION
    // message.Type.WARNING
    // message.Type.ERROR

    return {
        Constants,
        Status,
        Parameter,
        Valor,
        Search,
        customRecord,
        Transaction,
        Form,
        Roles,
        Codigo_parametro,
        Codigo_Valor,
        PriceLevels,
        Entity
    }
})