/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
*/
define([
    'N/search',
    'N/email',
    'N/file',
    'N/runtime',
    'N/log',
    'N/format',
    'N/record',
    '../Main/constant/TS_CM_Constant'
], function (search, email, file, runtime, log, format, record, _constant) {
    let currentScript = runtime.getCurrentScript();
    let currentUser = runtime.getCurrentUser();

    const ECUADOR_SUBSIDIARY = "2";
    const DOLAR_CURRENCY = "1";
    const PARAMETRIZACIONES_A_CUMPLIR = 3;

    const getInputData = () => {
        try {
            let itemsToSkipJson = getItemsToSkip();
            let itemsToConsider = getItemsToConsider();
            let today = new Date();
            let startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            let { journalValues } = getSalesOrders(itemsToSkipJson, itemsToConsider, startDate);
            log.error("valores", { journalValues });
            log.error("journalValues.length", journalValues.length);
            if (!journalValues.length) return [];
            let journalId = createJournal(journalValues, startDate);
            log.error("journalValues.map(value => { value.journalId = journalId; return value; })", journalValues.map(value => { value.journalId = journalId; return value; }))
            let retorno = journalValues.map(value => { value.journalId = journalId; return value; });
            return retorno;
        } catch (error) {
            log.error("error", error);
        }
    }

    const map = (context) => {
        log.error("map", context);
        let key = context.key;
        let value = JSON.parse(context.value);
        log.error("key", key);
        log.error("value", value);
        try {
            let detalleProvisionId = createDetalleProvision(value);
            log.error("detalleProvisionId", detalleProvisionId);
        } catch (error) {
            log.error("error", error);
        }
    }

    const getItemsToSkip = () => {
        let itemToSkip = new Object();
        let paramsSearch = search.create({
            type: "customrecord_ht_pp_main_param_prod",
            filters: [
                [
                    [
                        ["custrecord_ht_pp_parametrizacion_rela", "anyof", _constant.Parameter.CCD_CONTROL_DE_CUSTODIAS_DE_DISPOSITIVOS],
                        "AND",
                        ["custrecord_ht_pp_parametrizacion_valor", "anyof", _constant.Valor.VALOR_001_GENERA_CUSTODIAS],
                        "AND",
                        ["custrecord_ht_pp_aplicacion", "is", "T"]
                    ],
                    "OR",
                    [
                        ["custrecord_ht_pp_parametrizacion_rela", "anyof", _constant.Parameter.ALQ_PRODUCTO_DE_ALQUILER],
                        "AND",
                        ["custrecord_ht_pp_parametrizacion_valor", "anyof", _constant.Valor.SI],
                        "AND",
                        ["custrecord_ht_pp_aplicacion", "is", "T"]
                    ],
                    "OR",
                    [
                        ["custrecord_ht_pp_parametrizacion_rela", "anyof", _constant.Parameter.PGR_PRODUCTO_DE_GARANTÍA],
                        "AND",
                        ["custrecord_ht_pp_parametrizacion_valor", "anyof", _constant.Valor.SI],
                        "AND",
                        ["custrecord_ht_pp_aplicacion", "is", "T"]
                    ],
                    "OR",
                    [
                        ["custrecord_ht_pp_parametrizacion_rela", "anyof", _constant.Parameter.TDP_TIPO_DE_PRODUCTO],
                        "AND",
                        ["custrecord_ht_pp_parametrizacion_valor", "anyof", _constant.Valor.VALOR_009_DEMO],
                        "AND",
                        ["custrecord_ht_pp_aplicacion", "is", "T"]
                    ],
                    "OR",
                    [
                        ["custrecord_ht_pp_parametrizacion_rela", "anyof", _constant.Parameter.TDP_TIPO_DE_PRODUCTO],
                        "AND",
                        ["custrecord_ht_pp_parametrizacion_valor", "anyof", _constant.Valor.VALOR_013_SOFTWARE_GENERAL],
                        "AND",
                        ["custrecord_ht_pp_aplicacion", "is", "T"]
                    ],
                    "OR",
                    [
                        ["custrecord_ht_pp_parametrizacion_rela", "anyof", _constant.Parameter.IRP_ITEM_DE_REPUESTO],
                        "AND",
                        ["custrecord_ht_pp_parametrizacion_valor", "anyof", _constant.Valor.SI],
                        "AND",
                        ["custrecord_ht_pp_aplicacion", "is", "T"]
                    ],
                    "OR",
                    [
                        ["custrecord_ht_pp_parametrizacion_rela", "anyof", _constant.Parameter.IRS_ITEM_DE_RECONEXION_DE_SERVICIO],
                        "AND",
                        ["custrecord_ht_pp_parametrizacion_valor", "anyof", _constant.Valor.SI],
                        "AND",
                        ["custrecord_ht_pp_aplicacion", "is", "T"]
                    ],
                    "OR",
                    [
                        ["custrecord_ht_pp_parametrizacion_rela", "anyof", _constant.Parameter.TCH_TIPO_CHEQUEO_OT],
                        "AND",
                        ["custrecord_ht_pp_parametrizacion_valor", "anyof", _constant.Valor.VALOR_003_CHEQUEO_H_MONITOREO_PERSONAL],
                        "AND",
                        ["custrecord_ht_pp_aplicacion", "is", "T"]
                    ]
                ],
                "AND",
                ["custrecord_ht_pp_parametrizacionid", "noneof", "@NONE@"]
            ],
            columns: [
                search.createColumn({ name: "custrecord_ht_pp_parametrizacionid", label: "Param. Prod." })
            ]
        });

        paramsSearch.run().each(result => {
            let item = result.getValue('custrecord_ht_pp_parametrizacionid');
            itemToSkip[item] = item;
            return true;
        });
        return itemToSkip;
    }

    const getItemsToConsider = () => {
        let itemToConsider = new Object();
        let paramsSearch = search.create({
            type: "customrecord_ht_pp_main_param_prod",
            filters:
                [
                    [
                        [
                            ["custrecord_ht_pp_parametrizacion_rela", "anyof", _constant.Parameter.TMI_TIPO_DE_MOVIMIENTO_DE_INVENTARIO],
                            "AND",
                            ["custrecord_ht_pp_parametrizacion_valor", "anyof", _constant.Valor.VALOR_004_EGRESO],
                            "AND",
                            ["custrecord_ht_pp_aplicacion", "is", "T"]
                        ],
                        "OR",
                        [
                            ["custrecord_ht_pp_parametrizacion_rela", "anyof", _constant.Parameter.ADP_ACCION_DEL_PRODUCTO],
                            "AND",
                            ["custrecord_ht_pp_parametrizacion_valor", "anyof", _constant.Valor.VALOR_001_INST_DISPOSITIVO],
                            "AND",
                            ["custrecord_ht_pp_aplicacion", "is", "T"]
                        ],
                        "OR",
                        [
                            ["custrecord_ht_pp_parametrizacion_rela", "anyof", _constant.Parameter.GOT_GENERA_SOLICITUD_DE_TRABAJO],
                            "AND",
                            ["custrecord_ht_pp_parametrizacion_valor", "anyof", _constant.Valor.SI],
                            "AND",
                            ["custrecord_ht_pp_aplicacion", "is", "T"]
                        ]
                    ],
                    "AND",
                    ["custrecord_ht_pp_parametrizacionid", "noneof", "@NONE@"]
                ],
            columns:
                [
                    search.createColumn({ name: "custrecord_ht_pp_parametrizacionid", label: "Param. Prod." }),
                    search.createColumn({ name: "custrecord_ht_pp_parametrizacion_rela", label: "Parametrización" })
                ]
        });

        paramsSearch.run().each(result => {
            let item = result.getValue('custrecord_ht_pp_parametrizacionid');
            let parametrizacion = result.getValue('custrecord_ht_pp_parametrizacion_rela');
            if (itemToConsider[item] === undefined) itemToConsider[item] = new Array();
            itemToConsider[item].push(parametrizacion);
            return true;
        });
        return itemToConsider;
    }

    const getSalesOrders = (itemsToSkipJson, itemsToConsider, startDate) => {
        log.error("itemsToSkipJson", itemsToSkipJson);
        log.error("itemsToConsider", itemsToConsider);
        let lastPeriod = getLastPeriod(startDate);
        let salesOrderSearch = search.create({
            type: "transaction",
            filters: [
                ["type", "anyof", "SalesOrd"],
                "AND",
                ["status", "anyof", "SalesOrd:F"],
                "AND",
                ["taxline", "is", "F"],
                "AND",
                ["mainline", "is", "F"],
                "AND",
                ["item.isserialitem", "is", "T"],
                "AND",
                ["amount", "greaterthan", "0.00"],
                "AND",
                ["subsidiary", "anyof", ECUADOR_SUBSIDIARY]
            ],
            columns: [
                // search.createColumn({ name: "department", summary: "GROUP" }),
                // search.createColumn({ name: "class", summary: "GROUP" }),
                // search.createColumn({ name: "location", summary: "GROUP" }),
                // search.createColumn({ name: "formulanumeric", summary: "GROUP", formula: "{item.incomeaccount.id}" }),
                // search.createColumn({ name: "formulanumeric", summary: "GROUP", formula: "{item.custitem_cuenta_provision_ingreso.id}" }),
                // search.createColumn({ name: "grossamount", summary: "SUM" }),
                // search.createColumn({ name: "internalid", summary: "GROUP" }),
                // search.createColumn({ name: "item", summary: "GROUP" }),
                //search.createColumn({ name: 'tranid', summary: "GROUP" })

                search.createColumn({ name: "department" }),
                search.createColumn({ name: "class" }),
                search.createColumn({ name: "location" }),
                search.createColumn({ name: "formulanumeric", formula: "{item.incomeaccount.id}" }),
                search.createColumn({ name: "formulanumeric", formula: "{item.custitem_cuenta_provision_ingreso.id}" }),
                search.createColumn({ name: "grossamount" }),
                search.createColumn({ name: "internalid" }),
                search.createColumn({ name: "item" }),
                search.createColumn({ name: 'tranid' })
            ]
        });

        if (lastPeriod) {
            let periodFilter = search.createFilter({ name: 'postingperiod', operator: search.Operator.ANYOF, values: lastPeriod });
            salesOrderSearch.filters.push(periodFilter);
        }
        log.error("salesOrderSearch.length", salesOrderSearch.length);
        let journalValues = new Array(), detalleProvisionArray = [];
        salesOrderSearch.run().each((result) => {
            let columns = result.columns;
            let departamento = result.getValue(columns[0]).replace('- None -', '');
            let _class = result.getValue(columns[1]).replace('- None -', '');
            let location = result.getValue(columns[2]).replace('- None -', '');
            let incomeAccount = result.getValue(columns[3]);
            let provisionAccount = result.getValue(columns[4]);
            let amount = Number(result.getValue(columns[5]));
            let salesOrderId = result.getValue(columns[6]);
            let itemId = result.getValue(columns[7]);
            let tranId = result.getValue(columns[8])

            let countServiceOrder = verifyExistInvoice(salesOrderId, itemId);
            // let countProvision = verifyExistProvision(salesOrderId, itemId)
            if (countServiceOrder == 0 /*&& countProvision == 0*/) {
                //log.error("itemsToSkipJson[itemId]", itemsToSkipJson[itemId]);
                if (itemsToSkipJson[itemId] !== undefined) return true;
                //log.error("itemsToConsider[itemId]", itemsToConsider[itemId]);
                if (itemsToConsider[itemId] === undefined || itemsToConsider[itemId].length != PARAMETRIZACIONES_A_CUMPLIR) return true;
                //let key = `${department}|${_class}|${location}|${incomeAccount}|${provisionAccount}`;
                // if (journalValues[key] === undefined) {
                journalValues.push({
                    departamento,
                    class: _class,
                    location,
                    incomeAccount,
                    provisionAccount,
                    amount,
                    salesOrderId,
                    itemId,
                    tranId,
                });
                // } else {
                //     journalValues[key].amount = roundTwoDecimal(journalValues[key].amount + amount);
                // }
                // detalleProvisionArray.push({
                //     department,
                //     class: _class,
                //     location,
                //     incomeAccount,
                //     provisionAccount,
                //     amount,
                //     salesOrderId,
                //     itemId
                // })
            }
            return true;
        });

        return { journalValues };
    }

    const getLastPeriod = (paramStartDate) => {
        // let today = new Date();
        // let startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        let startDate = format.format({ value: paramStartDate, type: format.Type.DATE });
        log.error("startDate", startDate);
        let searchResult = search.create({
            type: "accountingperiod",
            filters: [
                ["startdate", "on", startDate],
                "AND",
                ["isquarter", "is", "F"],
                "AND",
                ["isyear", "is", "F"],
                "AND",
                ["isadjust", "is", "F"]
            ],
            columns: ["periodname"]
        }).run().getRange(0, 1);
        log.error("searchResult", searchResult.length);

        if (searchResult.length) return searchResult[0].id;
        return "";
    }

    const createJournal = (journalValues, startDate) => {
        log.error("journalValues", journalValues);
        if (!Object.keys(journalValues).length) return;

        let trandate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        trandate = startDate.getFullYear() + "/" + (startDate.getMonth() + 1) + "/" + trandate.getDate()
        let journalRecord = record.create({ type: record.Type.JOURNAL_ENTRY, isDynamic: true });
        journalRecord.setValue('form', 131);
        journalRecord.setValue('trandate', new Date(trandate));
        journalRecord.setValue('subsidiary', ECUADOR_SUBSIDIARY);
        journalRecord.setValue('currency', DOLAR_CURRENCY);
        log.error("record create");

        for (let key in journalValues) {
            let values = journalValues[key];
            log.error("values", values);

            journalRecord.selectNewLine('line');
            journalRecord.setCurrentSublistValue('line', 'account', values.incomeAccount);
            journalRecord.setCurrentSublistValue('line', 'credit', values.amount);
            journalRecord.setCurrentSublistValue('line', 'memo', values.tranId);
            if (values.department) journalRecord.setCurrentSublistValue('line', 'department', values.departmento);
            if (values.class) journalRecord.setCurrentSublistValue('line', 'class', values.class);
            if (values.location) journalRecord.setCurrentSublistValue('line', 'location', values.location);
            journalRecord.commitLine('line');

            journalRecord.selectNewLine('line');
            journalRecord.setCurrentSublistValue('line', 'account', values.provisionAccount);
            journalRecord.setCurrentSublistValue('line', 'debit', values.amount);
            journalRecord.setCurrentSublistValue('line', 'memo', values.tranId);
            if (values.department) journalRecord.setCurrentSublistValue('line', 'department', values.departmento);
            if (values.class) journalRecord.setCurrentSublistValue('line', 'class', values.class);
            if (values.location) journalRecord.setCurrentSublistValue('line', 'location', values.location);
            journalRecord.commitLine('line');
        }

        let id = journalRecord.save({ ignoreMandatoryFields: true });
        log.error("journalId", id);
        return id;
    }

    const createDetalleProvision = (values) => {
        let detalleProvision = record.create({ type: "customrecord_ht_dp_detalle_provision", isDynamic: true });
        detalleProvision.setValue("custrecord_ht_dp_asiento_provision", values.journalId);
        detalleProvision.setValue("custrecord_ht_dp_transaccion_prov", values.salesOrderId);
        detalleProvision.setValue("custrecord_ht_dp_item", values.itemId);
        detalleProvision.setValue("custrecord_ht_dp_income_account", values.incomeAccount);
        detalleProvision.setValue("custrecord_ht_dp_provision", values.amount);
        return detalleProvision.save();
    }

    const roundTwoDecimal = (value) => {
        return Math.round(Number(value) * 100) / 100;
    }

    const verifyExistInvoice = (salesOrderId, itemId) => {
        const invoiceSearchFilters = SavedSearchFilters = [
            ['type', 'anyof', 'CustInvc'],
            'AND',
            ['createdfrom', 'anyof', salesOrderId],
            'AND',
            ['item', 'anyof', itemId],
        ];

        const invoiceSearchColTranId = search.createColumn({ name: 'tranid' });
        const invoiceSearchColTranDate = search.createColumn({ name: 'trandate' });
        const invoiceSearchColItem = search.createColumn({ name: 'item' });

        const invoiceSearch = search.create({
            type: 'invoice',
            filters: invoiceSearchFilters,
            columns: [
                invoiceSearchColTranId,
                invoiceSearchColTranDate,
                invoiceSearchColItem,
            ],
        });
        const searchResultCount = invoiceSearch.runPaged().count;
        //log.debug('Count', searchResultCount);
        return searchResultCount
    }

    const verifyExistProvision = (salesOrderId, itemId) => {
        const mySearch = search.create({
            type: "customrecord_ht_dp_detalle_provision",
            filters:
                [
                    ["custrecord_ht_dp_transaccion_prov", "anyof", salesOrderId],
                    "AND",
                    ["custrecord_ht_dp_item", "anyof", itemId]
                ],
            columns:
                [
                    search.createColumn({ name: "scriptid", sort: search.Sort.ASC, label: "Script ID" }),
                    search.createColumn({ name: "custrecord_ht_dp_asiento_provision", label: "Asiento de Provisión" }),
                    search.createColumn({ name: "custrecord_ht_dp_transaccion_prov", label: "Transacción Provisionada" }),
                    search.createColumn({ name: "custrecord_ht_dp_item", label: "Item" }),
                    search.createColumn({ name: "custrecord_ht_dp_cost_account", label: "Cuenta de Costo" }),
                    search.createColumn({ name: "custrecord_ht_dp_inventory_account", label: "Cuenta de Inventario" }),
                    search.createColumn({ name: "custrecord_ht_dp_income_account", label: "Cuenta de Ingreso" }),
                    search.createColumn({ name: "custrecord_ht_dp_provision", label: "Provisión" }),
                    search.createColumn({ name: "custrecord_ht_dp_aplicado", label: "Aplicado" })
                ]
        });
        const searchResultCount = mySearch.runPaged().count;
        log.debug('Count', searchResultCount);
        return searchResultCount;
    }

    return {
        getInputData: getInputData,
        map: map,
        //summarize: summarize
    }
})