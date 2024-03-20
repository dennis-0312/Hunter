/**
 * @NApiVersion 2.x
 * @NScriptType plugintypeimpl
 * @NModuleScope Public
 */
define(['N/file', 'N/record', 'N/runtime', 'N/search', 'N/log', 'N/error', 'N/query'],
    /**
    * @param {Object} pluginContext
.   * @param {String} pluginContext.content
    * @param {String} pluginContext.transactionInfo.transactionId
    * @param {String} pluginContext.transactionInfo.transactionType
    * @param {Number} pluginContext.userId
    * @returns {Object} result
    * @returns {string} result.success
    * @returns {String} result.message
    */

    function (file, record, runtime, search, log, error, query) {

        const GENERATED_FILE_FOLDER_ID = "561"; //SuiteScripts > TS NET Scripts > Electronic Invoicing
        var transactionId = '';
        var userId = '';
        const SUBSIDIARIA = 2;
        const FORM_LIQUIDACION = 128;

        function validate(pluginContext) {
            log.debug({
                title: 'Custom Log - Debug',
                details: 'This is a debug message.'
            });
            var result = { success: false, message: "" };
            try {
                var linesArray = [], retencionLineArray = [];
                transactionId = pluginContext.transactionInfo.transactionId;
                userId = pluginContext.userId
                var name = "";
                var retencionName = "";

                var setup = getEnvirommentSetup();
                var transactionRecord = getLookUpTransactionFields(transactionId);
                var name = getFileName(transactionRecord);

                if (transactionRecord.recordtype == "invoice" && (transactionRecord["custbodyts_ec_tipo_documento_fiscal.custrecordts_ec_cod_tipo_comprobante"] == "01" || transactionRecord["custbodyts_ec_tipo_documento_fiscal.custrecordts_ec_cod_tipo_comprobante"] == "18")) {
                    linesArray = generateInvoiceLines(transactionId, setup);
                    name = "FAC" + name;
                } else if (transactionRecord.recordtype == "itemfulfillment") {
                    linesArray = generateItemFulfillmentLines(transactionId, setup);
                    name = "GDR" + name;
                } else if (transactionRecord.recordtype == "creditmemo") {
                    linesArray = generateCreditNoteLines(transactionId, setup);
                    name = "NCF" + name;
                } else if (transactionRecord.recordtype == "invoice" && transactionRecord["custbodyts_ec_tipo_documento_fiscal.custrecordts_ec_cod_tipo_comprobante"] == "05") {
                    linesArray = generateDebitNoteLines(transactionId, setup);
                    name = "NDF" + name;
                } else if (transactionRecord.recordtype == "vendorbill" && transactionRecord["custbodyts_ec_tipo_documento_fiscal.custrecordts_ec_cod_tipo_comprobante"] == "03") {
                    linesArray = generateBillLines(transactionId, setup);
                    name = "LIQ" + name;
                }
                if (transactionRecord.recordtype == "vendorbill" && transactionRecord["custbodyec_tipo_de_documento_retencion.custrecordts_ec_cod_tipo_comprobante"] == "07") {
                    retencionName = (transactionRecord["custbody_ec_serie_cxc_retencion.custrecord_ts_ec_series_impresion"] + transactionRecord["custbody_ts_ec_preimpreso_retencion"]).replace(/-/gi, "");
                    retencionLineArray = generateBillWitholdingLines(transactionId, setup);
                    retencionName = "RET" + retencionName;
                }

                if (transactionRecord.recordtype == "vendorbill" && transactionRecord["custbodyec_tipo_de_documento_retencion.custrecordts_ec_cod_tipo_comprobante"] == "07") {
                    if (transactionRecord["custbodyts_ec_tipo_documento_fiscal.custrecordts_ec_cod_tipo_comprobante"] == "03") {
                        var fileContent = printLines(linesArray);
                        if (fileContent) {
                            var transactionFile = generateFileTXT(name, fileContent);
                            var fileId = transactionFile.save();
                            updateTransaction(transactionId, transactionRecord.recordtype, fileId);
                            result.success = true;
                            result.message = result.message + fileId + " - Archivo [" + name + "] generado con éxito. ";
                        } else {
                            result.success = false;
                            result.message = fileId + " - Error en la generación del Archivo [" + name + "].";
                            return result;
                        }
                    }

                    var retencionFileContent = printLines(retencionLineArray);
                    if (retencionFileContent) {
                        var transactionFile = generateFileTXT(retencionName, retencionFileContent);
                        var fileId = transactionFile.save();
                        updateTransactionRetencion(transactionId, transactionRecord.recordtype, fileId);
                        result.success = true;
                        result.message = result.message + fileId + " - Archivo [" + retencionName + "] generado con éxito. ";
                    } else {
                        result.success = false;
                        result.message = fileId + " - Error en la generación del Archivo [" + retencionName + "].";
                    }
                } else {
                    var fileContent = printLines(linesArray);
                    if (fileContent) {
                        var transactionFile = generateFileTXT(name, fileContent);
                        var fileId = transactionFile.save();
                        updateTransaction(transactionId, transactionRecord.recordtype, fileId);
                        result.success = true;
                        result.message = result.message + fileId + " - Archivo [" + name + "] generado con éxito. ";
                    } else {
                        result.success = false;
                        result.message = fileId + " - Error en la generación del Archivo [" + name + "].";
                    }
                }
                return result;
            } catch (e) {
                result.success = false;
                result.message = "Ocurrión un error: " + e.message;
            }
            return result;
        }

        function updateTransaction(transactionId, recordtype, fileId) {
            record.submitFields({
                type: recordtype,
                id: transactionId,
                values: { "custbody_ts_ec_documento_ectronico": fileId }
            });
        }

        function updateTransactionRetencion(transactionId, recordtype, fileId) {
            record.submitFields({
                type: recordtype,
                id: transactionId,
                values: { "custbodyts_ec_documento_ectronic_reten": fileId }
            });
        }

        function getFileName(transactionRecord) {
            var name = "";
            name = transactionRecord["custbody_ts_ec_serie_cxc.custrecord_ts_ec_series_impresion"] + transactionRecord["custbody_ts_ec_numero_preimpreso"];
            return name.replace(/-/gi, "");
        }

        function generateInvoiceLines(transactionId, setup) {
            try {
                var invoiceLines = [];
                var transactionRecord = getInvoiceTransaction(transactionId);

                var VEline = ['VE', transactionRecord.documentTypeCode, "FACTURA", '1.0.0', ''];
                invoiceLines.push(VEline);

                var serie = transactionRecord.serie.split('');
                var ITline = [
                    'IT',
                    // setup.enviromment,
                    '2',
                    '1',
                    transactionRecord.subsidiaryLegalName,
                    "CARSEG S.A",
                    transactionRecord.subsidiaryFederalNumber,
                    '',
                    transactionRecord.documentTypeCode,
                    serie[0] + '' + serie[1] + '' + serie[2],
                    serie[3] + '' + serie[4] + '' + serie[5] || "",
                    transactionRecord.preprint,
                    transactionRecord.subsidiaryAddress.toUpperCase(),
                    transactionRecord.customerEmail,
                    ''
                ];
                invoiceLines.push(ITline);

                var ICline = ['IC', transactionRecord.date, transactionRecord.subsidiaryAddress, transactionRecord.customerSpecialTaxPayer, transactionRecord.customerObligatedToAccountFor, transactionRecord.customerDocumentTypeCode,
                    "", transactionRecord.customerName, transactionRecord.customerDocumentNumber, transactionRecord.currency, '', '', '', '',
                    '0', "", "", "", "", "", "", "", "", "", "", "", transactionRecord.address, ''];
                invoiceLines.push(ICline);

                var detailArray = getInvoiceTotalAndDetails(transactionRecord);
                invoiceLines = invoiceLines.concat(detailArray);

                var IALines = getIALines(transactionRecord);
                invoiceLines = invoiceLines.concat(IALines);

                var PALines = getPALines(transactionRecord);
                invoiceLines.push(PALines);

                return invoiceLines;
            } catch (e) {
                logError('Error-generateInvoiceLines', e);
            }
        }

        function getInvoiceTransaction(transactionId) {
            try {
                var transactionResult = search.create({
                    type: search.Type.TRANSACTION,
                    filters: [
                        ["type", "anyof", "CustInvc"],
                        "AND",
                        ["internalidnumber", "equalto", transactionId],
                        "AND",
                        [["custbody_ht_guia_remision", "anyof", "@NONE@"], "OR", ["custbody_ht_guia_remision.mainline", "is", "T"]],
                        "AND",
                        ["formulanumeric: NVL({debitamount},0) - NVL({creditamount},0)", "notequalto", "0"],
                        "AND",
                        ["taxline", "is", "F"]
                    ],
                    columns: [
                        search.createColumn({ name: "recordtype", label: "recordtype" }),
                        search.createColumn({ name: "line", sort: search.Sort.ASC, label: "Line ID" }),
                        search.createColumn({ name: "mainline", label: "mainline" }),
                        search.createColumn({ name: "tranid", label: "tranid" }),
                        search.createColumn({ name: "mainname", label: "customer" }),
                        search.createColumn({ name: "name", join: "CUSTBODYTS_EC_TIPO_DOCUMENTO_FISCAL", label: "documentType" }),
                        search.createColumn({ name: "custrecordts_ec_cod_tipo_comprobante", join: "CUSTBODYTS_EC_TIPO_DOCUMENTO_FISCAL", label: "documentTypeCode" }),
                        search.createColumn({ name: "formulatext", formula: "{custbody_ts_ec_serie_cxc.custrecord_ts_ec_series_impresion}", label: "serie" }),
                        search.createColumn({ name: "custbody_ts_ec_numero_preimpreso", label: "preprint" }),
                        search.createColumn({ name: "total", label: "total", function: "absoluteValue" }),
                        search.createColumn({ name: "formulatext", formula: "{location}", label: "location" }),
                        search.createColumn({ name: "formulatext", formula: "{custbody_ts_ec_metodo_pago.custrecord_ts_ec_clave}", label: "paymentMethod" }),

                        search.createColumn({ name: "formulatext", formula: "to_char({trandate},'DD/MM/YYYY')", label: "date" }),
                        search.createColumn({ name: "formulatext", formula: "to_char({duedate},'DD/MM/YYYY')", label: "duedate" }),
                        search.createColumn({ name: "terms", label: "terms" }),

                        search.createColumn({ name: "formulatext", formula: "CASE WHEN {currency.symbol} = 'USD' THEN 'DOLAR' END", label: "currency" }),
                        search.createColumn({ name: "formulatext", formula: "to_char({accountingperiod.startdate},'MM/YYYY')", label: "period" }),

                        search.createColumn({ name: "name", join: "subsidiary", label: "subsidiaryName" }),
                        search.createColumn({ name: "legalname", join: "subsidiary", label: "subsidiaryLegalName" }),
                        search.createColumn({ name: "address1", join: "subsidiary", label: "subsidiaryAddress" }),
                        search.createColumn({ name: "taxidnum", join: "subsidiary", label: "subsidiaryFederalNumber" }),
                        search.createColumn({ name: "email", join: "subsidiary", label: "subsidiaryEmail" }),

                        search.createColumn({ name: "custentityec_contribuyente_especial", join: "customerMain", label: "customerSpecialTaxPayer" }),
                        search.createColumn({ name: "formulatext", formula: "{customerMain.custentity_ec_obligado_contabilidad}", label: "customerObligatedToAccountFor" }),
                        search.createColumn({ name: "custentityts_ec_cod_tipo_doc_identidad", join: "customerMain", label: "customerDocumentTypeCode" }),
                        search.createColumn({ name: "altname", join: "customerMain", label: "customerName" }),
                        search.createColumn({ name: "vatregnumber", join: "customerMain", label: "customerDocumentNumber" }),
                        search.createColumn({ name: "email", join: "customerMain", label: "customerEmail" }),
                        search.createColumn({ name: "phone", join: "customerMain", label: "phone" }),
                        search.createColumn({ name: "address1", join: "customerMain", label: "address1" }),

                        search.createColumn({ name: "billaddress1", label: "address" }),
                        //search.createColumn({ name: "billcity", label: "city" }),
                        search.createColumn({ name: "formulatext", formula: "NVL({billcity},{billingAddress.custrecord_ec_parroquia})", label: "city" }),
                        search.createColumn({ name: "custbody_ec_direccion_partida", join: "custbody_ht_guia_remision", label: "itemFulfillmentStartAddress" }),
                        search.createColumn({ name: "custbody_ec_numero_ide_destinatario", join: "custbody_ht_guia_remision", label: "itemFulfillmentAddresseDocumentNumber" }),
                        search.createColumn({ name: "custbody_ec_gr_identificaciontranspor", join: "custbody_ht_guia_remision", label: "itemFulfillmentCarrierDocumentType" }),
                        search.createColumn({ name: "custbody_ec_direccion_partida", join: "custbody_ht_guia_remision", label: "itemFulfillmentCarrierAddress" }),
                        search.createColumn({ name: "custbody_ec_gr_razonsocialtranspor", join: "custbody_ht_guia_remision", label: "itemFulfillmentCarrierLegalName" }),
                        search.createColumn({ name: "custbody_ec_ruc_transportista", join: "custbody_ht_guia_remision", label: "itemFulfillmentCarrierRuc" }),
                        search.createColumn({ name: "custbody_ec_gr_placatranspor", join: "custbody_ht_guia_remision", label: "itemFulfillmentCarrierPlate" }),
                        search.createColumn({ name: "tranid", join: "custbody_ht_guia_remision", label: "itemFulfillment" }),
                        search.createColumn({ name: "formulatext", formula: "to_char({custbody_ht_guia_remision.custbody_ec_gr_fechainiciotransporte}, 'DD/MM/YYYY')", label: "itemFulfillmentTransportStartDate" }),
                        search.createColumn({ name: "formulatext", formula: "to_char({custbody_ht_guia_remision.custbody_ec_gr_fechafintransporte}, 'DD/MM/YYYY')", label: "itemFulfillmentTransportEndDate" }),

                        search.createColumn({ name: "itemid", join: "item", label: "item.code" }),
                        search.createColumn({ name: "memo", label: "item.detail" }),
                        search.createColumn({ name: "quantity", label: "item.quantity" }),
                        search.createColumn({ name: "rate", label: "item.rate" }),
                        search.createColumn({ name: "amount", label: "item.amount", function: "absoluteValue" }),
                        search.createColumn({ name: "taxamount", label: "item.taxAmount", function: "absoluteValue" }),
                        search.createColumn({ name: "grossamount", label: "item.grossAmount", function: "absoluteValue" }),
                        search.createColumn({ name: "type", join: 'item', label: "item.type" }),
                        search.createColumn({ name: "taxcode", label: "item.taxItem" }),
                        search.createColumn({ name: "formulanumeric", formula: "{taxitem.rate}", label: "item.taxRate" }),
                        search.createColumn({ name: "custcol_ts_ec_cod_id_facturacion", label: "item.identifierCode" }),
                        search.createColumn({ name: "formulatext", formula: "{taxitem.custrecord_ts_ec_tipo_impuesto}", label: "item.taxName" }),
                        search.createColumn({ name: "formulatext", formula: "{taxitem.custrecord_ts_ec_tipo_impuesto_cod}", label: "item.taxCode" }),
                        search.createColumn({ name: "formulatext", formula: "{taxitem.custrecord_ts_ec_tar_imp_codigo}", label: "item.taxRateCode" }),
                        search.createColumn({ name: "formulatext", formula: "NVL({custcol_4601_witaxline},{custcol_4601_witaxline_exp})", label: "item.isWithholdingLine" })

                        /*search.createColumn({ name: "discountitem", label: "discountItem"}),
                        search.createColumn({ name: "discountrate", label: "discountRate"})*/
                    ]
                }).run().getRange(0, 1000);
                var transactionJson = {};
                for (var i = 0; i < transactionResult.length; i++) {
                    if (i == 0) {
                        transactionJson = getMainLineFields(transactionResult[i]);
                        transactionJson.items = [];
                    } else {
                        var item = getLineFields(transactionResult[i]);
                        transactionJson.items.push(item);
                    }

                }
                return transactionJson;
            } catch (e) {
                logError('Error-getInvoiceTransaction', e);
            }
        }

        function getInvoiceTotalAndDetails(transactionRecord) {
            try {
                var resultArray = [];
                var lineArray = [];

                // T LINE
                var subtotal12 = 0, subtotal0 = 0, subtotalNotSubject = 0, subtotalWithoutTaxation = 0, totalDescuento = 0, ICE = 0, IVA12 = 0, totalAmount = 0, tip = 0, amountToPay = 0;
                var TILineJson = {}

                for (var i = 0; i < transactionRecord.items.length; i++) {
                    var item = transactionRecord.items[i];
                    if (item.isWithholdingLine == "T") continue;

                    var DEline = ['DE', item.code.substring(0, 15), item.code.substring(0, 15), item.detail, item.quantity, item.rate, 0, item.amount, ""];
                    lineArray.push(DEline);

                    if (item.taxRateCode == '2') {
                        subtotal12 += Number(item.amount);
                        IVA12 += Number(item.taxAmount);
                    }
                    if (item.taxRateCode == '0') subtotal0 += Number(item.amount);
                    if (item.taxRateCode == '6') subtotalNotSubject += Number(item.amount);
                    subtotalWithoutTaxation += Number(item.amount);
                    totalAmount += Number(item.grossAmount);

                    var IMline = ["IM", item.taxCode, item.taxRateCode, item.taxRate, item.amount, item.taxAmount, item.taxName, ""];
                    lineArray.push(IMline);

                    // TI LINE
                    var TIKey = item.taxCode + "|" + item.taxRateCode;
                    if (TILineJson[TIKey] === undefined) {
                        TILineJson[TIKey] = [Number(item.amount), item.taxRate, Number(item.taxAmount), item.taxName];
                    } else {
                        TILineJson[TIKey][0] = TILineJson[TIKey][0] + Number(item.amount);
                        TILineJson[TIKey][2] = TILineJson[TIKey][2] + Number(item.taxAmount);
                    }
                    amountToPay += Number(item.grossAmount);
                }

                var TLine = ["T", subtotal12, subtotal0, subtotalNotSubject, subtotalWithoutTaxation, totalDescuento, ICE, IVA12, transactionRecord.total, tip, transactionRecord.total, ""];
                resultArray.push(TLine);
                for (var key in TILineJson) {
                    var invoicingTax = key.split("|");
                    var TILine = ["TI", invoicingTax[0], invoicingTax[1], TILineJson[key][0], TILineJson[key][1], TILineJson[key][2], TILineJson[key][3], ""];
                    resultArray.push(TILine);
                }
                return resultArray.concat(lineArray);
            } catch (e) {
                logError('Error-getInvoiceTotalAndDetails', e);
            }
        }

        function generateInvoiceLines(transactionId, setup) {
            try {
                var invoiceLines = [];
                var transactionRecord = getInvoiceTransaction(transactionId);

                var document = {};
                if (transactionRecord.itemFulfillmentCarrierDocumentType) {
                    document = getLookupFieldsSearch("customrecord_ts_ec_doc_identidad", transactionRecord.itemFulfillmentCarrierDocumentType, ["custrecordts_ec_identity_code_ei"]);
                }

                var VEline = ['VE', transactionRecord.documentTypeCode, "FACTURA", '1.0.0', ''];
                invoiceLines.push(VEline);

                var serie = transactionRecord.serie.split('');
                var ITline = [
                    'IT',
                    '2',
                    '1',
                    transactionRecord.subsidiaryLegalName,
                    "CARSEG S.A",
                    transactionRecord.subsidiaryFederalNumber,
                    '',
                    transactionRecord.documentTypeCode,
                    serie[0] + '' + serie[1] + '' + serie[2],
                    serie[3] + '' + serie[4] + '' + serie[5] || "",
                    transactionRecord.preprint,
                    transactionRecord.subsidiaryAddress.toUpperCase(),
                    transactionRecord.customerEmail,
                    ''
                ];
                invoiceLines.push(ITline);

                var ICline = ['IC', transactionRecord.date, transactionRecord.subsidiaryAddress, transactionRecord.customerSpecialTaxPayer, transactionRecord.customerObligatedToAccountFor, transactionRecord.customerDocumentTypeCode,
                    "", transactionRecord.customerName, transactionRecord.customerDocumentNumber, transactionRecord.currency, '', '', '', '',
                    '0', "", "", "", "", "", "", "", "", "", "", "", transactionRecord.address, ''];
                invoiceLines.push(ICline);

                var detailArray = getInvoiceTotalAndDetails(transactionRecord);
                invoiceLines = invoiceLines.concat(detailArray);

                var IALines = getIALines(transactionRecord);
                invoiceLines = invoiceLines.concat(IALines);

                var PALines = getPALines(transactionRecord);
                invoiceLines.push(PALines);

                return invoiceLines;
            } catch (e) {
                logError('Error-generateInvoiceLines', e);
            }

        }

        function getInvoiceTransaction(transactionId) {
            try {
                var transactionResult = search.create({
                    type: search.Type.TRANSACTION,
                    filters: [
                        ["type", "anyof", "CustInvc"],
                        "AND",
                        ["internalidnumber", "equalto", transactionId],
                        "AND",
                        [["custbody_ht_guia_remision", "anyof", "@NONE@"], "OR", ["custbody_ht_guia_remision.mainline", "is", "T"]],
                        "AND",
                        ["formulanumeric: NVL({debitamount},0) - NVL({creditamount},0)", "notequalto", "0"],
                        "AND",
                        ["taxline", "is", "F"]
                    ],
                    columns: [
                        search.createColumn({ name: "recordtype", label: "recordtype" }),
                        search.createColumn({ name: "line", sort: search.Sort.ASC, label: "Line ID" }),
                        search.createColumn({ name: "mainline", label: "mainline" }),
                        search.createColumn({ name: "tranid", label: "tranid" }),
                        search.createColumn({ name: "mainname", label: "customer" }),
                        search.createColumn({ name: "name", join: "CUSTBODYTS_EC_TIPO_DOCUMENTO_FISCAL", label: "documentType" }),
                        search.createColumn({ name: "custrecordts_ec_cod_tipo_comprobante", join: "CUSTBODYTS_EC_TIPO_DOCUMENTO_FISCAL", label: "documentTypeCode" }),
                        search.createColumn({ name: "formulatext", formula: "{custbody_ts_ec_serie_cxc.custrecord_ts_ec_series_impresion}", label: "serie" }),
                        search.createColumn({ name: "custbody_ts_ec_numero_preimpreso", label: "preprint" }),
                        search.createColumn({ name: "total", label: "total", function: "absoluteValue" }),
                        search.createColumn({ name: "formulatext", formula: "{location}", label: "location" }),
                        search.createColumn({ name: "formulatext", formula: "{custbody_ts_ec_metodo_pago.custrecord_ts_ec_clave}", label: "paymentMethod" }),

                        search.createColumn({ name: "formulatext", formula: "to_char({trandate},'DD/MM/YYYY')", label: "date" }),
                        search.createColumn({ name: "formulatext", formula: "to_char({duedate},'DD/MM/YYYY')", label: "duedate" }),
                        search.createColumn({ name: "terms", label: "terms" }),

                        search.createColumn({ name: "formulatext", formula: "CASE WHEN {currency.symbol} = 'USD' THEN 'DOLAR' END", label: "currency" }),
                        search.createColumn({ name: "formulatext", formula: "to_char({accountingperiod.startdate},'MM/YYYY')", label: "period" }),

                        search.createColumn({ name: "name", join: "subsidiary", label: "subsidiaryName" }),
                        search.createColumn({ name: "legalname", join: "subsidiary", label: "subsidiaryLegalName" }),
                        search.createColumn({ name: "address1", join: "subsidiary", label: "subsidiaryAddress" }),
                        search.createColumn({ name: "taxidnum", join: "subsidiary", label: "subsidiaryFederalNumber" }),
                        search.createColumn({ name: "email", join: "subsidiary", label: "subsidiaryEmail" }),

                        search.createColumn({ name: "custentityec_contribuyente_especial", join: "customerMain", label: "customerSpecialTaxPayer" }),
                        search.createColumn({ name: "formulatext", formula: "{customerMain.custentity_ec_obligado_contabilidad}", label: "customerObligatedToAccountFor" }),
                        search.createColumn({ name: "custentityts_ec_cod_tipo_doc_identidad", join: "customerMain", label: "customerDocumentTypeCode" }),
                        search.createColumn({ name: "altname", join: "customerMain", label: "customerName" }),
                        search.createColumn({ name: "vatregnumber", join: "customerMain", label: "customerDocumentNumber" }),
                        search.createColumn({ name: "email", join: "customerMain", label: "customerEmail" }),
                        search.createColumn({ name: "phone", join: "customerMain", label: "phone" }),

                        search.createColumn({ name: "billaddress1", label: "address" }),
                        //search.createColumn({ name: "billcity", label: "city" }),
                        search.createColumn({ name: "formulatext", formula: "NVL({billcity},{billingAddress.custrecord_ec_parroquia})", label: "city" }),
                        search.createColumn({ name: "custbody_ec_direccion_partida", join: "custbody_ht_guia_remision", label: "itemFulfillmentStartAddress" }),
                        search.createColumn({ name: "custbody_ec_numero_ide_destinatario", join: "custbody_ht_guia_remision", label: "itemFulfillmentAddresseDocumentNumber" }),
                        search.createColumn({ name: "custbody_ec_gr_identificaciontranspor", join: "custbody_ht_guia_remision", label: "itemFulfillmentCarrierDocumentType" }),
                        search.createColumn({ name: "custbody_ec_direccion_partida", join: "custbody_ht_guia_remision", label: "itemFulfillmentCarrierAddress" }),
                        search.createColumn({ name: "custbody_ec_gr_razonsocialtranspor", join: "custbody_ht_guia_remision", label: "itemFulfillmentCarrierLegalName" }),
                        search.createColumn({ name: "custbody_ec_ruc_transportista", join: "custbody_ht_guia_remision", label: "itemFulfillmentCarrierRuc" }),
                        search.createColumn({ name: "custbody_ec_gr_placatranspor", join: "custbody_ht_guia_remision", label: "itemFulfillmentCarrierPlate" }),
                        search.createColumn({ name: "tranid", join: "custbody_ht_guia_remision", label: "itemFulfillment" }),
                        search.createColumn({ name: "formulatext", formula: "to_char({custbody_ht_guia_remision.custbody_ec_gr_fechainiciotransporte}, 'DD/MM/YYYY')", label: "itemFulfillmentTransportStartDate" }),
                        search.createColumn({ name: "formulatext", formula: "to_char({custbody_ht_guia_remision.custbody_ec_gr_fechafintransporte}, 'DD/MM/YYYY')", label: "itemFulfillmentTransportEndDate" }),

                        search.createColumn({ name: "itemid", join: "item", label: "item.code" }),
                        search.createColumn({ name: "memo", label: "item.detail" }),
                        search.createColumn({ name: "quantity", label: "item.quantity" }),
                        search.createColumn({ name: "rate", label: "item.rate" }),
                        search.createColumn({ name: "amount", label: "item.amount", function: "absoluteValue" }),
                        search.createColumn({ name: "taxamount", label: "item.taxAmount", function: "absoluteValue" }),
                        search.createColumn({ name: "grossamount", label: "item.grossAmount", function: "absoluteValue" }),
                        search.createColumn({ name: "type", join: 'item', label: "item.type" }),
                        search.createColumn({ name: "taxcode", label: "item.taxItem" }),
                        search.createColumn({ name: "formulanumeric", formula: "{taxitem.rate}", label: "item.taxRate" }),
                        search.createColumn({ name: "custcol_ts_ec_cod_id_facturacion", label: "item.identifierCode" }),
                        search.createColumn({ name: "formulatext", formula: "{taxitem.custrecord_ts_ec_tipo_impuesto}", label: "item.taxName" }),
                        search.createColumn({ name: "formulatext", formula: "{taxitem.custrecord_ts_ec_tipo_impuesto_cod}", label: "item.taxCode" }),
                        search.createColumn({ name: "formulatext", formula: "{taxitem.custrecord_ts_ec_tar_imp_codigo}", label: "item.taxRateCode" }),
                        search.createColumn({ name: "formulatext", formula: "NVL({custcol_4601_witaxline},{custcol_4601_witaxline_exp})", label: "item.isWithholdingLine" })

                        /*search.createColumn({ name: "discountitem", label: "discountItem"}),
                        search.createColumn({ name: "discountrate", label: "discountRate"})*/
                    ]
                }).run().getRange(0, 1000);
                var transactionJson = {};
                for (var i = 0; i < transactionResult.length; i++) {
                    if (i == 0) {
                        transactionJson = getMainLineFields(transactionResult[i]);
                        transactionJson.items = [];
                    } else {
                        var item = getLineFields(transactionResult[i]);
                        transactionJson.items.push(item);
                    }

                }
                return transactionJson;
            } catch (e) {
                logError('Error-getInvoiceTransaction', e);
            }
        }

        function getInvoiceTotalAndDetails(transactionRecord) {
            try {
                var resultArray = [];
                var lineArray = [];

                // T LINE
                var subtotal12 = 0, subtotal0 = 0, subtotalNotSubject = 0, subtotalWithoutTaxation = 0, totalDescuento = 0, ICE = 0, IVA12 = 0, totalAmount = 0, tip = 0, amountToPay = 0;
                var TILineJson = {}

                for (var i = 0; i < transactionRecord.items.length; i++) {
                    var item = transactionRecord.items[i];
                    if (item.isWithholdingLine == "T") continue;

                    var DEline = ['DE', item.code.substring(0, 15), item.code.substring(0, 15), item.detail, item.quantity, item.rate, 0, item.amount, ""];
                    lineArray.push(DEline);

                    if (item.taxRateCode == '2') {
                        subtotal12 += Number(item.amount);
                        IVA12 += Number(item.taxAmount);
                    }
                    if (item.taxRateCode == '0') subtotal0 += Number(item.amount);
                    if (item.taxRateCode == '6') subtotalNotSubject += Number(item.amount);
                    subtotalWithoutTaxation += Number(item.amount);
                    totalAmount += Number(item.grossAmount);

                    var IMline = ["IM", item.taxCode, item.taxRateCode, item.taxRate, item.amount, item.taxAmount, item.taxName, ""];
                    lineArray.push(IMline);

                    // TI LINE
                    var TIKey = item.taxCode + "|" + item.taxRateCode;
                    if (TILineJson[TIKey] === undefined) {
                        TILineJson[TIKey] = [Number(item.amount), item.taxRate, Number(item.taxAmount), item.taxName];
                    } else {
                        TILineJson[TIKey][0] = TILineJson[TIKey][0] + Number(item.amount);
                        TILineJson[TIKey][2] = TILineJson[TIKey][2] + Number(item.taxAmount);
                    }
                    amountToPay += Number(item.grossAmount);
                }

                var TLine = ["T", subtotal12, subtotal0, subtotalNotSubject, subtotalWithoutTaxation, totalDescuento, ICE, IVA12, transactionRecord.total, tip, transactionRecord.total, ""];
                resultArray.push(TLine);
                for (var key in TILineJson) {
                    var invoicingTax = key.split("|");
                    var TILine = ["TI", invoicingTax[0], invoicingTax[1], TILineJson[key][0], TILineJson[key][1], TILineJson[key][2], TILineJson[key][3], ""];
                    resultArray.push(TILine);
                }

                return resultArray.concat(lineArray);
            } catch (e) {
                logError('Error-getInvoiceTotalAndDetails', e);
            }
        }

        function generateItemFulfillmentLines(transactionId, setup) {
            try {
                var itemFulfillmentLines = [];
                var transactionRecord = getItemFulfillmentTransaction(transactionId);

                //VE
                var VEline = ['VE', "06", "GuiaRemision", '1.0.0', ''];
                itemFulfillmentLines.push(VEline);

                var serie = transactionRecord.serie.split('');
                //IT
                var ITline = [
                    'IT',
                    '2',
                    '1',
                    transactionRecord.subsidiaryLegalName,
                    transactionRecord.subsidiaryLegalName,
                    transactionRecord.subsidiaryFederalNumber,
                    '',
                    "06",
                    serie[0] + '' + serie[1] + '' + serie[2],
                    serie[3] + '' + serie[4] + '' + serie[5] || "",
                    transactionRecord.preprint,
                    transactionRecord.subsidiaryAddress.replace(/\n/gi, ""),
                    transactionRecord.customerEmail,
                    ''
                ];
                itemFulfillmentLines.push(ITline);

                var ICline = ['IC', transactionRecord.date, transactionRecord.subsidiaryAddress, transactionRecord.customerSpecialTaxPayer, transactionRecord.customerObligatedToAccountFor, transactionRecord.customerDocumentTypeCode,
                    transactionRecord.tranid, transactionRecord.customerName, transactionRecord.customerDocumentNumber, transactionRecord.currency, '', '', '', '',
                    '0', '', transactionRecord.period, transactionRecord.carrierAddress.replace(/\n/gi, ""), transactionRecord.carrierLegalName, transactionRecord.carrierDocumentType, transactionRecord.carrierRuc, "", "", transactionRecord.transportStartDate,
                    transactionRecord.transportEndDate, transactionRecord.carrierPlate/*, transactionRecord.address.replace(/\n/gi, "")*/, ''];
                itemFulfillmentLines.push(ICline);

                var DESTline = ['DEST', transactionRecord.addresseeRuc, transactionRecord.addressee, transactionRecord.addresseeAddress.replace(/\n/gi, ""), transactionRecord.transferReason, "", "", transactionRecord.route,
                    "", transactionRecord.comprVenta, /*transactionRecord.motivTraslado,*/ "", "", ""];
                itemFulfillmentLines.push(DESTline);

                var detailArray = getItemFulfillmentDetail(transactionRecord.items);
                itemFulfillmentLines = itemFulfillmentLines.concat(detailArray);

                var IALine = ["IA", "Marca", "Chevrolet", ""];
                itemFulfillmentLines.push(IALine);

                return itemFulfillmentLines;
            } catch (e) {
                logError('Error-generateItemFulfillmentLines', e);
            }
        }

        function getItemFulfillmentTransaction(transactionId) {
            try {
                var transactionResult = search.create({
                    type: search.Type.TRANSACTION,
                    filters: [
                        [["type", "anyof", "ItemShip"], "AND", ["internalidnumber", "equalto", transactionId]],
                        "AND",
                        [["binnumber", "isempty", ""], "OR", ["mainline", "is", "T"]]
                    ],
                    columns: [
                        search.createColumn({ name: "recordtype", label: "recordtype" }),
                        search.createColumn({ name: "line", sort: search.Sort.ASC, label: "Line ID" }),
                        search.createColumn({ name: "mainline", label: "mainline" }),
                        search.createColumn({ name: "tranid", label: "tranid" }),
                        search.createColumn({ name: "mainname", label: "customer" }),
                        search.createColumn({ name: "formulatext", formula: "to_char({trandate},'DD/MM/YYYY')", label: "date" }),
                        search.createColumn({ name: "formulatext", formula: "{custbody_ts_ec_serie_cxc}", label: "serie" }),
                        search.createColumn({ name: "custbody_ts_ec_numero_preimpreso", label: "preprint" }),
                        search.createColumn({ name: "total", label: "total", function: "absoluteValue" }),
                        search.createColumn({ name: "formulatext", formula: "{location}", label: "location" }),

                        search.createColumn({ name: "name", join: "subsidiary", label: "subsidiaryName" }),
                        search.createColumn({ name: "legalname", join: "subsidiary", label: "subsidiaryLegalName" }),
                        search.createColumn({ name: "address1", join: "subsidiary", label: "subsidiaryAddress" }),
                        search.createColumn({ name: "taxidnum", join: "subsidiary", label: "subsidiaryFederalNumber" }),
                        search.createColumn({ name: "shipaddress", label: "address" }),
                        search.createColumn({ name: "custentityec_contribuyente_especial", join: "customerMain", label: "customerSpecialTaxPayer" }),
                        search.createColumn({ name: "formulatext", formula: "{customerMain.custentity_ec_obligado_contabilidad}", label: "customerObligatedToAccountFor" }),
                        search.createColumn({ name: "custentityts_ec_cod_tipo_doc_identidad", join: "customerMain", label: "customerDocumentTypeCode" }),
                        //search.createColumn({ name: "entitytaxid", label: "customerDocumentNumber" }),
                        search.createColumn({ name: "vatregnumber", join: "customerMain", label: "customerDocumentNumber" }),
                        search.createColumn({ name: "altname", join: "customerMain", label: "customerName" }),
                        search.createColumn({ name: "email", join: "customerMain", label: "customerEmail" }),
                        search.createColumn({ name: "phone", join: "customerMain", label: "phone" }),

                        search.createColumn({ name: "billaddress1", label: "address" }),
                        //search.createColumn({ name: "billcity", label: "city" }),
                        search.createColumn({ name: "formulatext", formula: "NVL({billcity},{billingAddress.custrecord_ec_parroquia})", label: "city" }),

                        search.createColumn({ name: "formulatext", formula: "CASE WHEN {currency.symbol} = 'USD' THEN 'DOLAR' END", label: "currency" }),
                        search.createColumn({ name: "formulatext", formula: "to_char({accountingperiod.startdate},'MM/YYYY')", label: "period" }),
                        search.createColumn({ name: "custbody_ec_gr_razonsocialtranspor", label: "carrier" }),
                        search.createColumn({ name: "custbody_ec_ruc_transportista", label: "carrierRuc" }),
                        search.createColumn({ name: "custrecordts_ec_identity_code_ei", join: "custbody_ec_gr_identificaciontranspor", label: "carrierDocumentType" }),
                        search.createColumn({ name: "custbody_ec_direccion_partida", label: "carrierAddress" }),
                        search.createColumn({ name: "custbody_ec_gr_razonsocialtranspor", label: "carrierLegalName" }),
                        search.createColumn({ name: "custbody_ec_gr_placatranspor", label: "carrierPlate" }),
                        search.createColumn({ name: "custbody_ec_gr_comprobanteventa", label: "comprVenta" }),
                        search.createColumn({ name: "custbody_ec_gr_motivotraslado", label: "motivTraslado" }),


                        search.createColumn({ name: "formulatext", formula: "to_char({custbody_ec_gr_fechainiciotransporte}, 'DD/MM/YYYY')", label: "transportStartDate" }),
                        search.createColumn({ name: "formulatext", formula: "to_char({custbody_ec_gr_fechafintransporte}, 'DD/MM/YYYY')", label: "transportEndDate" }),

                        search.createColumn({ name: "custbody_ec_gr_razonsocialdestin", label: "addressee" }),
                        search.createColumn({ name: "custbody_ec_numero_ide_destinatario", label: "addresseeRuc" }),
                        search.createColumn({ name: "custrecordts_ec_identity_code_ei", join: "custbody_ec_gr_identificaciondestin", label: "addresseeDocumentType" }),
                        search.createColumn({ name: "custbody_ec_direccion_destinatario", label: "addresseeAddress" }),
                        search.createColumn({ name: "custbody_ec_gr_motivotraslado", label: "transferReason" }),
                        search.createColumn({ name: "custbody_ec_gr_ruta", label: "route" }),

                        search.createColumn({ name: "itemid", join: "item", label: "item.code" }),
                        search.createColumn({ name: "quantity", label: "item.quantity" }),
                        search.createColumn({ name: "salesdescription", join: "item", label: "item.detail" }),
                    ]
                }).run().getRange(0, 1000);

                var transactionJson = {};
                for (var i = 0; i < transactionResult.length; i++) {
                    if (i == 0) {
                        transactionJson = getMainLineFields(transactionResult[i]);
                        transactionJson.items = [];
                    } else {
                        var item = getLineFields(transactionResult[i]);
                        transactionJson.items.push(item);
                    }
                }
                return transactionJson;
            } catch (e) {
                logError('Error-getItemFulfillmentTransaction', e);
            }
        }

        function getItemFulfillmentDetail(items) {
            try {
                var resultArray = [];
                for (var i = 0; i < items.length; i++) {
                    if (Number(items[i].quantity) > 0) {
                        var DEline = ["DE", items[i].code, items[i].code, items[i].detail, items[i].quantity, 0, 0, 0, ""];
                        resultArray.push(DEline);
                    }
                }
                return resultArray;
            } catch (e) {
                logError('Error-getItemFulfillmentDetail', e);
            }
        }

        function generateCreditNoteLines(transactionId, setup) {
            try {
                var creditNoteLines = [];
                var transactionRecord = getCreditNoteTransaction(transactionId);

                var VEline = ['VE', transactionRecord.documentTypeCode, "notaCredito", '1.0.0', ''];
                creditNoteLines.push(VEline);

                var serie = transactionRecord.serie.split('-');
                var ITline = ['IT', '2', '1', transactionRecord.subsidiaryLegalName, "CARSEG S.A", transactionRecord.subsidiaryFederalNumber, '', transactionRecord.documentTypeCode, serie[0], serie[1] || "", transactionRecord.preprint, transactionRecord.subsidiaryAddress.toUpperCase(), transactionRecord.customerEmail, ''];
                creditNoteLines.push(ITline);

                var detailArray = getCreditNoteTotalAndDetails(transactionRecord);
                var total = detailArray[0][8] || "0";

                var ICline = ['IC', transactionRecord.date, transactionRecord.subsidiaryAddress, transactionRecord.customerSpecialTaxPayer, transactionRecord.customerObligatedToAccountFor, transactionRecord.customerDocumentTypeCode,
                    "", transactionRecord.customerName, transactionRecord.customerDocumentNumber, transactionRecord.currency, '',
                    transactionRecord.documentTypeCodeRef, transactionRecord.numeroDocRef, transactionRecord.dateRef, total,
                    transactionRecord.memo, "", "", "", "", "", "", "", "", "", "", ''];
                creditNoteLines.push(ICline);

                //var detailArray = getCreditNoteTotalAndDetails(transactionRecord.items);
                creditNoteLines = creditNoteLines.concat(detailArray);

                // Se quito de la validacion  porque no hay terms en nota de credito
                var IALines = getIALines(transactionRecord);
                creditNoteLines = creditNoteLines.concat(IALines);

                return creditNoteLines;
            } catch (e) {
                logError('Error-generateCreditNoteLines', e);
            }
        }

        function getCreditNoteTransaction(transactionId) {
            try {
                var transactionResult = search.create({
                    type: search.Type.TRANSACTION,
                    filters: [
                        ["type", "anyof", "CustCred"],
                        "AND",
                        ["internalidnumber", "equalto", transactionId],
                        "AND",
                        ["formulanumeric: NVL({debitamount},0) - NVL({creditamount},0)", "notequalto", "0"],
                        "AND",
                        ["taxline", "is", "F"]
                    ],
                    columns: [
                        search.createColumn({ name: "recordtype", label: "recordtype" }),
                        search.createColumn({ name: "line", sort: search.Sort.ASC, label: "Line ID" }),
                        search.createColumn({ name: "formulatext", formula: "to_char({trandate},'DD/MM/YYYY')", label: "date" }),
                        search.createColumn({ name: "tranid", label: "tranid" }),
                        search.createColumn({ name: "mainname", label: "customer" }),
                        search.createColumn({ name: "name", join: "CUSTBODYTS_EC_TIPO_DOCUMENTO_FISCAL", label: "documentType" }),
                        search.createColumn({ name: "custrecordts_ec_cod_tipo_comprobante", join: "CUSTBODYTS_EC_TIPO_DOCUMENTO_FISCAL", label: "documentTypeCode" }),
                        search.createColumn({ name: "formulatext", formula: "{custbody_ts_ec_serie_cxc}", label: "serie" }),
                        search.createColumn({ name: "custbody_ts_ec_numero_preimpreso", label: "preprint" }),
                        search.createColumn({ name: "formulatext", formula: "CASE WHEN {currency.symbol} = 'USD' THEN 'DOLAR' END", label: "currency" }),
                        search.createColumn({ name: "memo", label: "memo" }),
                        search.createColumn({ name: "total", label: "total", function: "absoluteValue" }),
                        search.createColumn({ name: "formulatext", formula: "{location}", label: "location" }),

                        search.createColumn({ name: "legalname", join: "subsidiary", label: "subsidiaryLegalName" }),
                        search.createColumn({ name: "address1", join: "subsidiary", label: "subsidiaryAddress" }),
                        search.createColumn({ name: "taxidnum", join: "subsidiary", label: "subsidiaryFederalNumber" }),
                        search.createColumn({ name: "email", join: "subsidiary", label: "subsidiaryEmail" }),

                        search.createColumn({ name: "billaddress1", label: "address" }),
                        //search.createColumn({ name: "billcity", label: "city" }),
                        search.createColumn({ name: "formulatext", formula: "NVL({billcity},{billingAddress.custrecord_ec_parroquia})", label: "city" }),
                        search.createColumn({ name: "custrecordts_ec_cod_tipo_comprobante", join: "custbodyts_ec_doc_type_ref", label: "documentTypeCodeRef" }),
                        search.createColumn({ name: "formulatext", formula: "CONCAT({custbodyts_ec_doc_serie_ref},CONCAT('-',{custbodyts_ec_doc_number_ref}))", label: "numeroDocRef" }),
                        search.createColumn({ name: "formulatext", formula: "to_char({custbodyts_ec_doc_fecha_ref},'DD/MM/YYYY')", label: "dateRef" }),

                        search.createColumn({ name: "custentityec_contribuyente_especial", join: "customerMain", label: "customerSpecialTaxPayer" }),
                        search.createColumn({ name: "formulatext", formula: "{customerMain.custentity_ec_obligado_contabilidad}", label: "customerObligatedToAccountFor" }),
                        search.createColumn({ name: "custentityts_ec_cod_tipo_doc_identidad", join: "customerMain", label: "customerDocumentTypeCode" }),
                        search.createColumn({ name: "altname", join: "customerMain", label: "customerName" }),
                        search.createColumn({ name: "vatregnumber", join: "customerMain", label: "customerDocumentNumber" }),
                        search.createColumn({ name: "email", join: "customerMain", label: "customerEmail" }),
                        search.createColumn({ name: "phone", join: "customerMain", label: "phone" }),
                        search.createColumn({ name: "address1", join: "customerMain", label: "address1" }),
                        search.createColumn({ name: "city", join: "customerMain", label: "city1" }),
                        //search.createColumn({ name: "custrecord_ec_parroquia", join: "customerMain", label: "city" }),

                        search.createColumn({ name: "itemid", join: "item", label: "item.code" }),
                        search.createColumn({ name: "memo", label: "item.detail" }),
                        search.createColumn({ name: "quantity", label: "item.quantity", function: "absoluteValue" }),
                        search.createColumn({ name: "rate", label: "item.rate" }),
                        search.createColumn({ name: "amount", label: "item.amount", function: "absoluteValue" }),
                        search.createColumn({ name: "taxamount", label: "item.taxAmount", function: "absoluteValue" }),
                        search.createColumn({ name: "grossamount", label: "item.grossAmount", function: "absoluteValue" }),
                        search.createColumn({ name: "type", join: 'item', label: "item.type" }),
                        search.createColumn({ name: "taxcode", label: "item.taxItem" }),
                        search.createColumn({ name: "formulanumeric", formula: "{taxitem.rate}", label: "item.taxRate" }),
                        search.createColumn({ name: "custcol_ts_ec_cod_id_facturacion", label: "item.identifierCode" }),
                        search.createColumn({ name: "formulatext", formula: "{taxitem.custrecord_ts_ec_tipo_impuesto}", label: "item.taxName" }),
                        search.createColumn({ name: "formulatext", formula: "{taxitem.custrecord_ts_ec_tipo_impuesto_cod}", label: "item.taxCode" }),
                        search.createColumn({ name: "formulatext", formula: "{taxitem.custrecord_ts_ec_tar_imp_codigo}", label: "item.taxRateCode" }),
                        search.createColumn({ name: "formulatext", formula: "NVL({custcol_4601_witaxline},{custcol_4601_witaxline_exp})", label: "item.isWithholdingLine" })

                    ]
                }).run().getRange(0, 1000);
                var transactionJson = {};
                for (var i = 0; i < transactionResult.length; i++) {
                    if (i == 0) {
                        transactionJson = getMainLineFields(transactionResult[i]);
                        transactionJson.items = [];
                    } else {
                        var item = getLineFields(transactionResult[i]);
                        transactionJson.items.push(item);
                    }

                }
                return transactionJson;
            } catch (e) {
                logError('Error-getCreditNoteTransaction', e);
            }
        }

        function getCreditNoteTotalAndDetails(transactionRecord) {
            try {
                var resultArray = [];
                var lineArray = [];

                // T LINE
                var subtotal12 = 0, subtotal0 = 0, subtotalNotSubject = 0, subtotalWithoutTaxation = 0, totalDescuento = 0, ICE = 0, IVA12 = 0, totalAmount = 0, tip = 0, amountToPay = 0;
                var TILineJson = {}

                for (var i = 0; i < transactionRecord.items.length; i++) {
                    var item = transactionRecord.items[i];
                    if (item.isWithholdingLine == "T") continue;

                    var DEline = ['DE', item.code.substring(0, 15), item.code.substring(0, 15), item.detail, item.quantity, item.rate, 0, item.amount, ""];
                    //lineArray.push(DEline);

                    if (item.taxRateCode == '2') {
                        subtotal12 += Number(item.amount);
                        IVA12 += Number(item.taxAmount);
                    }
                    if (item.taxRateCode == '0') subtotal0 += Number(item.amount);
                    if (item.taxRateCode == '6') subtotalNotSubject += Number(item.amount);
                    subtotalWithoutTaxation += Number(item.amount);
                    totalAmount += Number(item.grossAmount);

                    var IMline = ["IM", item.taxCode, item.taxRateCode, item.taxRate, item.amount, item.taxAmount, item.taxName, ""];
                    //lineArray.push(IMline);

                    // TI LINE
                    var TIKey = item.taxCode + "|" + item.taxRateCode;
                    if (TILineJson[TIKey] === undefined) {
                        TILineJson[TIKey] = [Number(item.amount), item.taxRate, Number(item.taxAmount), item.taxName];
                    } else {
                        TILineJson[TIKey][0] = TILineJson[TIKey][0] + Number(item.amount);
                        TILineJson[TIKey][2] = TILineJson[TIKey][2] + Number(item.taxAmount);
                    }
                    amountToPay += Number(item.grossAmount);
                }

                var TLine = ["T", subtotal12, subtotal0, subtotalNotSubject, subtotalWithoutTaxation, totalDescuento, ICE, IVA12, transactionRecord.total, tip, transactionRecord.total, ""];
                resultArray.push(TLine);
                for (var key in TILineJson) {
                    var invoicingTax = key.split("|");
                    var TILine = ["TI", invoicingTax[0], invoicingTax[1], TILineJson[key][1], TILineJson[key][0], TILineJson[key][2], TILineJson[key][3], ""];
                    resultArray.push(TILine);
                }

                return resultArray.concat(lineArray);
            } catch (e) {
                logError('Error-getInvoiceTotalAndDetails', e);
            }
        }

        function generateDebitNoteLines(transactionId, setup) {
            try {
                var debitNoteLines = [];
                var transactionRecord = getDebitNoteTransaction(transactionId);

                var VEline = ['VE', transactionRecord.documentTypeCode, 'notaDebito', '1.0.0', ''];
                debitNoteLines.push(VEline);

                var serie = transactionRecord.serie.split('-');
                var ITline = ['IT', '2', '1', transactionRecord.subsidiaryLegalName, "CARSEG S.A", transactionRecord.subsidiaryFederalNumber, '', transactionRecord.documentTypeCode, serie[0], serie[1] || "", transactionRecord.preprint, transactionRecord.subsidiaryAddress.toUpperCase(), 'factura@suministro.com', ''];
                debitNoteLines.push(ITline);

                var ICline = ['IC', transactionRecord.date, transactionRecord.subsidiaryAddress, transactionRecord.customerSpecialTaxPayer, transactionRecord.customerObligatedToAccountFor, transactionRecord.customerDocumentTypeCode,
                    "", transactionRecord.customerName, transactionRecord.customerDocumentNumber, transactionRecord.currency, '', transactionRecord.transactionReferenceDocumentType,
                    transactionRecord.transactionReferenceSerie + "-" + transactionRecord.transactionReferenceNumber, transactionRecord.transactionReferenceDate,
                    '0', '', "", "", "", "", "", "", "", "",
                    "", "", transactionRecord.address, ''];
                debitNoteLines.push(ICline);

                var detailArray = getCreditNoteTotalAndDetails(transactionRecord);
                debitNoteLines = debitNoteLines.concat(detailArray);

                var PALines = getPALines(transactionRecord);
                debitNoteLines.push(PALines);

                var MOLine = ['MO', transactionRecord.memo, transactionRecord.total, ''];
                debitNoteLines.push(MOLine);

                var IALines = getIALines(transactionRecord);
                debitNoteLines = debitNoteLines.concat(IALines);

                return debitNoteLines;
            } catch (e) {
                logError('Error-generateDebitNoteLines', e);
            }
        }

        function getDebitNoteTransaction(transactionId) {
            try {
                var transactionResult = search.create({
                    type: search.Type.TRANSACTION,
                    filters: [
                        ["type", "anyof", "CustInvc"],
                        "AND",
                        ["internalidnumber", "equalto", transactionId],
                        "AND",
                        ["formulanumeric: NVL({debitamount},0) - NVL({creditamount},0)", "notequalto", "0"],
                        "AND",
                        ["taxline", "is", "F"]
                    ],
                    columns: [
                        search.createColumn({ name: "recordtype", label: "recordtype" }),
                        search.createColumn({ name: "line", sort: search.Sort.ASC, label: "Line ID" }),
                        search.createColumn({ name: "mainline", label: "mainline" }),

                        search.createColumn({ name: "memomain", label: "memo" }),
                        search.createColumn({ name: "tranid", label: "tranid" }),
                        search.createColumn({ name: "mainname", label: "customer" }),
                        search.createColumn({ name: "name", join: "CUSTBODYTS_EC_TIPO_DOCUMENTO_FISCAL", label: "documentType" }),
                        search.createColumn({ name: "custrecordts_ec_cod_tipo_comprobante", join: "CUSTBODYTS_EC_TIPO_DOCUMENTO_FISCAL", label: "documentTypeCode" }),
                        //search.createColumn({ name: "custbody_ts_ec_serie_cxc", label: "serie" }),
                        search.createColumn({ name: "formulatext", formula: "{custbody_ts_ec_serie_cxc}", label: "serie" }),
                        search.createColumn({ name: "custbody_ts_ec_numero_preimpreso", label: "preprint" }),
                        search.createColumn({ name: "formulatext", formula: "{custbody_ts_ec_metodo_pago.custrecord_ts_ec_clave}", label: "paymentMethod" }),

                        search.createColumn({ name: "formulatext", formula: "to_char({trandate},'DD/MM/YYYY')", label: "date" }),
                        search.createColumn({ name: "formulatext", formula: "to_char({duedate},'DD/MM/YYYY')", label: "duedate" }),
                        search.createColumn({ name: "terms", label: "terms" }),
                        search.createColumn({ name: "total", label: "total", function: "absoluteValue" }),
                        search.createColumn({ name: "formulatext", formula: "{location}", label: "location" }),
                        search.createColumn({ name: "formulatext", formula: "to_char({custbodyts_ec_doc_fecha_ref},'DD/MM/YYYY')", label: "transactionReferenceDate" }),
                        search.createColumn({ name: "custbodyts_ec_doc_number_ref", label: "transactionReferenceNumber" }),
                        search.createColumn({ name: "custbodyts_ec_doc_serie_ref", label: "transactionReferenceSerie" }),
                        search.createColumn({ name: "formulatext", formula: "{custbodyts_ec_doc_type_ref.custrecordts_ec_cod_tipo_comprobante}", label: "transactionReferenceDocumentType" }),

                        search.createColumn({ name: "formulatext", formula: "CASE WHEN {currency.symbol} = 'USD' THEN 'DOLAR' END", label: "currency" }),
                        search.createColumn({ name: "formulatext", formula: "to_char({accountingperiod.startdate},'MM/YYYY')", label: "period" }),

                        search.createColumn({ name: "name", join: "subsidiary", label: "subsidiaryName" }),
                        search.createColumn({ name: "legalname", join: "subsidiary", label: "subsidiaryLegalName" }),
                        search.createColumn({ name: "address1", join: "subsidiary", label: "subsidiaryAddress" }),
                        search.createColumn({ name: "taxidnum", join: "subsidiary", label: "subsidiaryFederalNumber" }),
                        search.createColumn({ name: "email", join: "subsidiary", label: "subsidiaryEmail" }),

                        search.createColumn({ name: "custentityec_contribuyente_especial", join: "customerMain", label: "customerSpecialTaxPayer" }),
                        search.createColumn({ name: "formulatext", formula: "{customerMain.custentity_ec_obligado_contabilidad}", label: "customerObligatedToAccountFor" }),
                        search.createColumn({ name: "custentityts_ec_cod_tipo_doc_identidad", join: "customerMain", label: "customerDocumentTypeCode" }),
                        search.createColumn({ name: "altname", join: "customerMain", label: "customerName" }),
                        search.createColumn({ name: "vatregnumber", join: "customerMain", label: "customerDocumentNumber" }),
                        search.createColumn({ name: "email", join: "customerMain", label: "customerEmail" }),
                        search.createColumn({ name: "phone", join: "customerMain", label: "phone" }),

                        search.createColumn({ name: "billaddress1", label: "address" }),
                        //search.createColumn({ name: "billcity", label: "city" }),
                        search.createColumn({ name: "formulatext", formula: "NVL({billcity},{billingAddress.custrecord_ec_parroquia})", label: "city" }),
                        search.createColumn({ name: "itemid", join: "item", label: "item.code" }),
                        search.createColumn({ name: "memo", label: "item.detail" }),
                        search.createColumn({ name: "quantity", label: "item.quantity" }),
                        search.createColumn({ name: "rate", label: "item.rate" }),
                        search.createColumn({ name: "amount", label: "item.amount" }),
                        search.createColumn({ name: "taxamount", label: "item.taxAmount" }),
                        search.createColumn({ name: "grossamount", label: "item.grossAmount" }),
                        search.createColumn({ name: "type", join: 'item', label: "item.type" }),
                        search.createColumn({ name: "taxcode", label: "item.taxItem" }),
                        search.createColumn({ name: "formulanumeric", formula: "{taxitem.rate}", label: "item.taxRate" }),
                        search.createColumn({ name: "custcol_ts_ec_cod_id_facturacion", label: "item.identifierCode" }),
                        search.createColumn({ name: "formulatext", formula: "{taxitem.custrecord_ts_ec_tipo_impuesto}", label: "item.taxName" }),
                        search.createColumn({ name: "formulatext", formula: "{taxitem.custrecord_ts_ec_tipo_impuesto_cod}", label: "item.taxCode" }),
                        search.createColumn({ name: "formulatext", formula: "{taxitem.custrecord_ts_ec_tar_imp_codigo}", label: "item.taxRateCode" }),
                        search.createColumn({ name: "formulatext", formula: "NVL({custcol_4601_witaxline},{custcol_4601_witaxline_exp})", label: "item.isWithholdingLine" })
                    ]
                }).run().getRange(0, 1000);
                var transactionJson = {};
                for (var i = 0; i < transactionResult.length; i++) {
                    if (i == 0) {
                        transactionJson = getMainLineFields(transactionResult[i]);
                        transactionJson.items = [];
                    } else {
                        var item = getLineFields(transactionResult[i]);
                        transactionJson.items.push(item);
                    }
                }
                return transactionJson;
            } catch (e) {
                logError('Error-getDebitNoteTransaction', e);
            }
        }

        function generateBillLines(transactionId, setup) {
            try {
                var transactionRecord = getBillTransaction(transactionId);
                var billLines = [];
                var VEline = ['VE', transactionRecord.documentTypeCode, "LIQUIDACIONDECOMPRA", '1.0.0', ''];
                billLines.push(VEline);

                var serie = transactionRecord.serie.split('');
                var ITline = [
                    'IT',
                    '2',
                    '1',
                    transactionRecord.subsidiaryLegalName,
                    "CARSEG S.A",
                    transactionRecord.subsidiaryFederalNumber,
                    '',
                    transactionRecord.documentTypeCode,
                    serie[0] + '' + serie[1] + '' + serie[2],
                    serie[3] + '' + serie[4] + '' + serie[5] || "",
                    transactionRecord.preprint,
                    transactionRecord.subsidiaryAddress.toUpperCase(),
                    transactionRecord.vendorEmail,
                    ''
                ];
                billLines.push(ITline);

                var ICline = ['IC', transactionRecord.date, transactionRecord.subsidiaryAddress, transactionRecord.vendorSpecialTaxPayer, transactionRecord.vendorObligatedToAccountFor, transactionRecord.vendorDocumentTypeCode,
                    "", transactionRecord.vendorName, transactionRecord.vendorDocumentNumber, transactionRecord.currency, '', '', '', '',
                    '0', '', transactionRecord.period, "", "", "", "", "", "", "", "", "", "", ''];
                billLines.push(ICline);

                var detailArray = getBillDetailLines(transactionRecord);
                billLines = billLines.concat(detailArray);

                var IALines = getIALines(transactionRecord);
                billLines = billLines.concat(IALines);

                var PALines = getPALines(transactionRecord);
                billLines.push(PALines);

                return billLines;

            } catch (e) {
                logError('Error-generateDebitNoteLines', e);
            }
        }

        function getBillTransaction(transactionId) {
            try {
                var transactionResult = search.create({
                    type: search.Type.TRANSACTION,
                    filters: [
                        ["type", "anyof", "VendBill"],
                        "AND",
                        ["internalidnumber", "equalto", transactionId],
                        "AND",
                        ["formulanumeric: NVL({debitamount},0) - NVL({creditamount},0)", "notequalto", "0"],
                        "AND",
                        ["customgl", "is", "F"],
                        "AND",
                        ["taxline", "is", "F"]
                    ],
                    columns: [
                        search.createColumn({ name: "recordtype", label: "recordtype" }),
                        search.createColumn({ name: "line", sort: search.Sort.ASC, label: "Line ID" }),
                        search.createColumn({ name: "mainline", label: "mainline" }),
                        search.createColumn({ name: "tranid", label: "tranid" }),
                        search.createColumn({ name: "name", join: "CUSTBODYTS_EC_TIPO_DOCUMENTO_FISCAL", label: "documentType" }),
                        search.createColumn({ name: "custrecordts_ec_cod_tipo_comprobante", join: "CUSTBODYTS_EC_TIPO_DOCUMENTO_FISCAL", label: "documentTypeCode" }),
                        search.createColumn({ name: "formulatext", formula: "{custbody_ts_ec_serie_cxc}", label: "serie" }),
                        search.createColumn({ name: "custbody_ts_ec_numero_preimpreso", label: "preprint" }),
                        search.createColumn({ name: "total", label: "total", function: "absoluteValue" }),
                        search.createColumn({ name: "formulatext", formula: "{location}", label: "location" }),
                        search.createColumn({ name: "formulatext", formula: "{custbody_ts_ec_metodo_pago.custrecord_ts_ec_clave}", label: "paymentMethod" }),

                        search.createColumn({ name: "formulatext", formula: "to_char({trandate},'DD/MM/YYYY')", label: "date" }),
                        search.createColumn({ name: "formulatext", formula: "to_char({duedate},'DD/MM/YYYY')", label: "duedate" }),
                        search.createColumn({ name: "terms", label: "terms" }),
                        search.createColumn({ name: "mainname", label: "vendor" }),

                        search.createColumn({ name: "formulatext", formula: "CASE WHEN {currency.symbol} = 'USD' THEN 'DOLAR' END", label: "currency" }),
                        search.createColumn({ name: "formulatext", formula: "to_char({accountingperiod.startdate},'MM/YYYY')", label: "period" }),

                        search.createColumn({ name: "name", join: "subsidiary", label: "subsidiaryName" }),
                        search.createColumn({ name: "legalname", join: "subsidiary", label: "subsidiaryLegalName" }),
                        search.createColumn({ name: "address1", join: "subsidiary", label: "subsidiaryAddress" }),
                        search.createColumn({ name: "taxidnum", join: "subsidiary", label: "subsidiaryFederalNumber" }),
                        search.createColumn({ name: "email", join: "subsidiary", label: "subsidiaryEmail" }),

                        search.createColumn({ name: "custentityec_contribuyente_especial", join: "vendor", label: "vendorSpecialTaxPayer" }),
                        search.createColumn({ name: "formulatext", formula: "{vendor.custentity_ec_obligado_contabilidad}", label: "vendorObligatedToAccountFor" }),
                        search.createColumn({ name: "custentityts_ec_cod_tipo_doc_identidad", join: "vendor", label: "vendorDocumentTypeCode" }),
                        search.createColumn({ name: "altname", join: "vendor", label: "vendorName" }),
                        search.createColumn({ name: "vatregnumber", join: "vendor", label: "vendorDocumentNumber" }),
                        search.createColumn({ name: "email", join: "vendor", label: "vendorEmail" }),
                        search.createColumn({ name: "phone", join: "vendor", label: "phone" }),
                        search.createColumn({ name: "address1", join: "vendor", label: "address1" }),
                        search.createColumn({ name: "city", join: "vendor", label: "city1" }),

                        search.createColumn({ name: "billaddress1", label: "address" }),
                        //search.createColumn({ name: "billcity", label: "city" }),
                        search.createColumn({ name: "formulatext", formula: "NVL({billcity},{billingAddress.custrecord_ec_parroquia})", label: "city" }),

                        search.createColumn({ name: "account", label: "item.account" }),
                        search.createColumn({ name: "itemid", join: "item", label: "item.code" }),
                        search.createColumn({ name: "memo", label: "item.detail" }),
                        search.createColumn({ name: "quantity", label: "item.quantity" }),
                        search.createColumn({ name: "rate", label: "item.rate" }),
                        search.createColumn({ name: "amount", label: "item.amount", function: "absoluteValue" }),
                        search.createColumn({ name: "taxamount", label: "item.taxAmount", function: "absoluteValue" }),
                        search.createColumn({ name: "grossamount", label: "item.grossAmount" }),
                        search.createColumn({ name: "type", join: 'item', label: "item.type" }),
                        search.createColumn({ name: "formulanumeric", formula: "{taxitem.rate}", label: "item.taxRate" }),

                        search.createColumn({ name: "formulatext", formula: "{taxitem.custrecord_ts_ec_tipo_impuesto}", label: "item.taxName" }),
                        search.createColumn({ name: "formulatext", formula: "{taxitem.custrecord_ts_ec_tipo_impuesto_cod}", label: "item.taxCode" }),
                        search.createColumn({ name: "formulatext", formula: "{taxitem.custrecord_ts_ec_tar_imp_codigo}", label: "item.taxRateCode" }),
                        search.createColumn({ name: "formulatext", formula: "NVL({custcol_4601_witaxline},{custcol_4601_witaxline_exp})", label: "item.isWithholdingLine" })
                    ]
                }).run().getRange(0, 1000);
                var transactionJson = {};
                for (var i = 0; i < transactionResult.length; i++) {
                    if (i == 0) {
                        transactionJson = getMainLineFields(transactionResult[i]);
                        transactionJson.items = [];
                    } else {
                        var item = getLineFields(transactionResult[i]);
                        transactionJson.items.push(item);
                    }
                }
                return transactionJson;
            } catch (e) {
                logError('Error-getDebitNoteTransaction', e);
            }
        }

        function getBillDetailLines(transactionRecord) {
            try {
                var hash = {};
                var array = transactionRecord.items;
                array = array.filter(function (current) {
                    var exists = !hash[current.account];
                    hash[current.account] = true;
                    return exists;
                });
                logError('Test', array);
                var resultArray = [];
                var lineArray = [];

                var subtotal12 = 0, subtotal0 = 0, subtotalNotSubject = 0, subtotalWithoutTaxation = 0, totalDescuento = 0, ICE = 0, IVA12 = 0, totalAmount = 0, tip = 0, amountToPay = 0;
                //var TLine = ["T", subtotal12, subtotal0, subtotalNotSubject, subtotalWithoutTaxation, totalDescuento, ICE, IVA12, totalAmount, tip, amountToPay, ""];

                var TILineJson = {}
                for (var i = 0; i < array.length; i++) {
                    var item = array[i];
                    if (item.isWithholdingLine == "T" || !item.taxCode) continue;

                    logError('Track', [{ account: item.account }])

                    var DEline = ['DE', item.code.substring(0, 15) ? item.code.substring(0, 15) : item.account.substring(0, 15), item.code.substring(0, 15), item.detail, item.quantity ? item.quantity : 1, item.rate ? item.rate : item.amount, 0, item.amount, ""];
                    //var DEline = ['DE', item.code.substring(0, 15), item.code.substring(0, 15), item.detail, item.quantity, item.rate, 0, item.amount, ""];
                    if (item.taxCode)
                        lineArray.push(DEline);


                    if (item.taxRateCode == '2') {
                        subtotal12 += Number(item.amount);
                        IVA12 += Number(item.taxAmount);
                    }
                    if (item.taxRateCode == '0') subtotal0 += Number(item.amount);
                    if (item.taxRateCode == '6') subtotalNotSubject += Number(item.amount);
                    subtotalWithoutTaxation += Number(item.amount);
                    totalAmount += Number(item.grossAmount);

                    var IMline = ["IM", item.taxCode, item.taxRateCode, item.taxRate, item.amount, parseFloat(item.taxAmount), item.taxName, ""];
                    if (item.taxCode)
                        lineArray.push(IMline);

                    amountToPay += Number(item.grossAmount);
                }

                for (var i = 0; i < array.length; i++) {
                    var item = array[i];
                    if (item.isWithholdingLine == "T" || !item.taxCode) continue;
                    //if (item.taxName == "IVA") continue;
                    logError('Track3', [{ account: item.account }])
                    // TI LINE
                    var TIKey = item.taxCode + "|" + item.taxRateCode;
                    if (TILineJson[TIKey] === undefined) {
                        TILineJson[TIKey] = [Number(item.amount), item.taxRate, Number(item.taxAmount), item.taxName];
                    } else {
                        TILineJson[TIKey][0] = TILineJson[TIKey][0] + Number(item.amount);
                        TILineJson[TIKey][2] = TILineJson[TIKey][2] + Number(item.taxAmount);
                    }
                }

                //var TLine = ["T", subtotal12, subtotal0, subtotalNotSubject, subtotalWithoutTaxation, totalDescuento, ICE, IVA12, (totalAmount + IVA12), tip, transactionRecord.total, ""];
                var TLine = ["T", subtotal12, subtotal0, subtotalNotSubject, subtotalWithoutTaxation.toFixed(2), totalDescuento, ICE, IVA12, (totalAmount + IVA12).toFixed(2), tip, (totalAmount + IVA12).toFixed(2), ""];
                resultArray.push(TLine);
                logError('Track2', TILineJson)
                for (var key in TILineJson) {
                    var invoicingTax = key.split("|");
                    var TILine = ["TI", invoicingTax[0], invoicingTax[1], TILineJson[key][0], TILineJson[key][1], TILineJson[key][2], TILineJson[key][3], ""];
                    resultArray.push(TILine);
                }
                return resultArray.concat(lineArray);
            } catch (e) {
                logError('Error-getBillDetailLines', e);
            }
        }

        // function getBillDetailLines(transactionRecord) {
        //     try {
        //         var hash = {};
        //         var array =  transactionRecord.items;
        //         array = array.filter(function (current) {
        //             var exists = !hash[current.account];
        //             hash[current.account] = true;
        //             return exists;
        //         });
        //         logError('Test', array);
        //         var resultArray = [];
        //         var lineArray = [];

        //         var subtotal12 = 0, subtotal0 = 0, subtotalNotSubject = 0, subtotalWithoutTaxation = 0, totalDescuento = 0, ICE = 0, IVA12 = 0, totalAmount = 0, tip = 0, amountToPay = 0;
        //         //var TLine = ["T", subtotal12, subtotal0, subtotalNotSubject, subtotalWithoutTaxation, totalDescuento, ICE, IVA12, totalAmount, tip, amountToPay, ""];

        //         var TILineJson = {}
        //         for (var i = 0; i < transactionRecord.items.length; i++) {
        //             var item = transactionRecord.items[i];
        //             if (item.isWithholdingLine == "T") continue;
        //             //if (item.taxName == "IVA") continue;
        //             logError('Track', [{ account: item.account }])

        //             //var DEline = ['DE', item.code.substring(0, 15) ? item.code.substring(0, 15) : item.account.substring(0, 15), item.code.substring(0, 15), item.detail, item.quantity ? item.quantity : 1, item.rate ? item.rate : item.amount, 0, item.amount, ""];
        //             var DEline = ['DE', item.code.substring(0, 15), item.code.substring(0, 15), item.detail, item.quantity, item.rate, 0, item.amount, ""];
        //             lineArray.push(DEline);
        //             if (item.taxRateCode == '2') {
        //                 subtotal12 += Number(item.amount);
        //                 IVA12 += Number(item.taxAmount);
        //             }
        //             if (item.taxRateCode == '0') subtotal0 += Number(item.amount);
        //             if (item.taxRateCode == '6') subtotalNotSubject += Number(item.amount);
        //             subtotalWithoutTaxation += Number(item.amount);
        //             totalAmount += Number(item.grossAmount);

        //             var IMline = ["IM", item.taxCode, item.taxRateCode, item.taxRate, item.amount, item.taxAmount, item.taxName, ""];
        //             lineArray.push(IMline);

        //             // TI LINE
        //             var TIKey = item.taxCode + "|" + item.taxRateCode;
        //             if (TILineJson[TIKey] === undefined) {
        //                 TILineJson[TIKey] = [Number(item.amount), item.taxRate, Number(item.taxAmount), item.taxName];
        //             } else {
        //                 TILineJson[TIKey][0] = TILineJson[TIKey][0] + Number(item.amount);
        //                 TILineJson[TIKey][2] = TILineJson[TIKey][2] + Number(item.taxAmount);
        //             }
        //             amountToPay += Number(item.grossAmount);
        //         }

        //         //var TLine = ["T", subtotal12, subtotal0, subtotalNotSubject, subtotalWithoutTaxation, totalDescuento, ICE, IVA12, (totalAmount + IVA12), tip, transactionRecord.total, ""];
        //         var TLine = ["T", subtotal12, subtotal0, subtotalNotSubject, subtotalWithoutTaxation, totalDescuento, ICE, IVA12, (totalAmount + IVA12), tip, (totalAmount + IVA12), ""];
        //         resultArray.push(TLine);
        //         for (var key in TILineJson) {
        //             var invoicingTax = key.split("|");
        //             var TILine = ["TI", invoicingTax[0], invoicingTax[1], TILineJson[key][0], TILineJson[key][1], TILineJson[key][2], TILineJson[key][3], ""];
        //             resultArray.push(TILine);
        //         }
        //         return resultArray.concat(lineArray);
        //     } catch (e) {
        //         logError('Error-getBillDetailLines', e);
        //     }
        // }

        function generateBillWitholdingLines(transactionId, setup) {
            try {
                var transactionRecord = getBillWithholdingTransaction(transactionId);

                var billLines = [];

                var VEline = ["VE", transactionRecord.documentTypeCode, "ComprobanteRetencion", "2.0.0", ""];
                billLines.push(VEline);

                var serie = transactionRecord.serie.split("");
                var ITline = [
                    "IT",
                    '2',
                    '1',
                    transactionRecord.subsidiaryLegalName,
                    "CARSEG S.A",
                    transactionRecord.subsidiaryFederalNumber,
                    "",
                    transactionRecord.documentTypeCode,
                    serie[0] + '' + serie[1] + '' + serie[2],
                    serie[3] + '' + serie[4] + '' + serie[5] || "",
                    transactionRecord.preprint,
                    transactionRecord.subsidiaryAddress.toUpperCase(),
                    transactionRecord.vendorEmail,
                    ''
                ];
                billLines.push(ITline);

                var periodoFiscal = getperiodoFiscal(transactionRecord.period);
                var ICline = [
                    "IC",
                    transactionRecord.date,
                    transactionRecord.subsidiaryAddress,
                    "",
                    // transactionRecord.vendorSpecialTaxPayer,
                    transactionRecord.vendorObligatedToAccountFor,
                    transactionRecord.vendorDocumentTypeCode,
                    "",
                    transactionRecord.vendorName,
                    transactionRecord.vendorDocumentNumber,
                    transactionRecord.currency,
                    "",
                    "",
                    "",
                    "",
                    "0",
                    "",
                    periodoFiscal,
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "NO",
                    ""
                ]
                // var ICline = [
                //     "IC",
                //     transactionRecord.date,
                //     transactionRecord.subsidiaryAddress,
                //     transactionRecord.vendorSpecialTaxPayer,
                //     transactionRecord.vendorObligatedToAccountFor,
                //     transactionRecord.vendorDocumentTypeCode,
                //     "SI",
                //     transactionRecord.vendorName,
                //     transactionRecord.vendorDocumentNumber,
                //     transactionRecord.currency,
                //     "",
                //     "",
                //     "",
                //     "",
                //     "0",
                //     "",
                //     periodoFiscal,
                //     "",
                //     "",
                //     "",
                //     "",
                //     "",
                //     "",
                //     "",
                //     "",
                //     "",
                //     "NO",
                //     ""
                // ]
                billLines.push(ICline);

                var codigoPais = getCodigoPais(transactionRecord.codPais);
                var pagoLocExt = getPagoLocExto(transactionId); //*CAMBIO ====================
                var serieCX = transactionRecord.form == FORM_LIQUIDACION ? transactionRecord.serieCxC : transactionRecord.serieCxP
                var importes = getImportes(transactionRecord.typeDocFis, serieCX, transactionRecord.numberPreImp, transactionRecord.form)
                log.debug('IMPORTES', importes);
                var DSline = [
                    "DS",//<docSustento>
                    transactionRecord.codSustento,//<codSustento>
                    transactionRecord.codDocSustento,//<codDocSustento>
                    transactionRecord.form == FORM_LIQUIDACION ? transactionRecord.numDocSustento.replace(/-/gi, "") : transactionRecord.numDocSustento2.replace(/-/gi, ""),
                    transactionRecord.fechaEmisionDocSustento,//<fechaEmisionDocSustento>
                    transactionRecord.fechaEmisionDocSustento,// <fechaRegistroContable>
                    "",//<numAutDocSustento>
                    pagoLocExt,//<pagoLocExt> 
                    pagoLocExt == "02" ? "01" : "",//</tipoRegi>
                    pagoLocExt == "02" ? codigoPais : "",//<paisEfecPago>
                    pagoLocExt == "02" ? "NO" : "",//<aplicConvDobTrib
                    pagoLocExt == "02" ? "SI" : "",//<pagExtSujRetNorLeg>
                    pagoLocExt == "02" ? "NO" : "",//<pagoRegFis>
                    transactionRecord.codDocSustento == 41 ? importes.importeTotal : "0",//<totalComprobantesReembolso>
                    transactionRecord.codDocSustento == 41 ? importes.totalSinImpuestos : "0",//<totalBaseImponibleReembolso>
                    transactionRecord.codDocSustento == 41 ? (parseFloat(importes.importeTotal) - parseFloat(importes.totalSinImpuestos)).toFixed(2) : "0",//<totalImpuestoReembolso>
                    importes.totalSinImpuestos,//<totalSinImpuestos>
                    importes.importeTotal,//<importeTotal>
                    ""
                ]
                billLines.push(DSline);

                var IMSline = getBillIMSDetailsLines(transactionId);
                billLines = billLines.concat(IMSline);

                // logError('track 1.0.0', transactionRecord);
                var TIRSLine = getBillTIRSDetailsLines(transactionRecord);
                billLines = billLines.concat(TIRSLine);

                // var detailArray = getBillWithholdingDetailsLines(transactionRecord);
                // billLines = billLines.concat(detailArray);

                if (transactionRecord.codDocSustento == 41) {
                    var RBSLine = getBillRBSDetailsLines(transactionId);
                    billLines = billLines.concat(RBSLine);
                }

                var PASLines = getPASLines(transactionRecord, importes.importeTotal);
                billLines.push(PASLines);

                var IALines = getIALines(transactionRecord);
                billLines = billLines.concat(IALines);

                return billLines;
            } catch (e) {
                logError('Error-generateRetencionLines', e);
            }
        }

        function getBillWithholdingTransaction(transactionId) {
            try {
                var transactionResult = search.create({
                    type: search.Type.TRANSACTION,
                    filters: [
                        ["type", "anyof", "VendBill"],
                        "AND",
                        ["internalidnumber", "equalto", transactionId],
                        "AND",
                        ["formulanumeric: NVL({debitamount},0) - NVL({creditamount},0)", "notequalto", "0"],
                        "AND",
                        ["customgl", "is", "F"],
                        "AND",
                        ["taxline", "is", "F"]
                    ],
                    columns: [
                        search.createColumn({ name: "recordtype", label: "recordtype" }),
                        search.createColumn({ name: "line", sort: search.Sort.ASC, label: "Line ID" }),
                        search.createColumn({ name: "mainline", label: "mainline" }),
                        search.createColumn({ name: "mainname", label: "vendor" }),
                        search.createColumn({ name: "customform", label: "form" }),
                        search.createColumn({ name: "entity", label: "entity" }),


                        search.createColumn({ name: "custrecordts_ec_cod_tipo_comprobante", join: "custbodyec_tipo_de_documento_retencion", label: "documentTypeCode" }),
                        search.createColumn({ name: "formulatext", formula: "{custbody_ec_serie_cxc_retencion}", label: "serie" }),
                        search.createColumn({ name: "custbody_ts_ec_preimpreso_retencion", label: "preprint" }),

                        search.createColumn({ name: "formulatext", formula: "{location}", label: "location" }),
                        search.createColumn({ name: "custrecordts_ec_cod_tipo_comprobante", join: "custbodyts_ec_tipo_documento_fiscal", label: "transactionReferenceDocumentTypeCode" }),

                        search.createColumn({ name: "formulatext", formula: "{custbody_ts_ec_serie_cxc}", label: "transactionReferenceSerie" }),
                        search.createColumn({ name: "formulatext", formula: "{custbody_ts_ec_numero_preimpreso}", label: "transactionReferenceNumber" }),
                        //search.createColumn({ name: "tranid", join: "appliedToTransaction", label: "transactionReference" }),
                        search.createColumn({ name: "formulatext", formula: "to_char({trandate},'DD/MM/YYYY')", label: "transactionReferenceDate" }),

                        search.createColumn({ name: "formulatext", formula: "to_char({trandate},'DD/MM/YYYY')", label: "date" }),
                        //search.createColumn({ name: "formulatext", formula: "to_char({duedate},'DD/MM/YYYY')", label: "duedate" }),
                        //search.createColumn({ name: "terms", label: "terms" }),

                        search.createColumn({ name: "custbody_ec_ret_ir", label: "withholdingTaxRenta" }),
                        search.createColumn({ name: "custbody_cod_ret_iva_100", label: "withholdingTaxIva" }),

                        search.createColumn({ name: "custbody_ec_importe_base_ir", label: "baseAmountRenta" }),
                        search.createColumn({ name: "custbody_ec_importe_base_iva", label: "baseAmountIva" }),

                        search.createColumn({ name: "formulatext", formula: "CASE WHEN {currency.symbol} = 'USD' THEN 'DOLAR' END", label: "currency" }),
                        //search.createColumn({ name: "formulatext", formula: "to_char({accountingPeriod.startdate},'MM/YYYY')", label: "period" }),
                        search.createColumn({ name: "formulatext", formula: "{postingperiod}", label: "period" }),

                        search.createColumn({ name: "name", join: "subsidiary", label: "subsidiaryName" }),
                        search.createColumn({ name: "legalname", join: "subsidiary", label: "subsidiaryLegalName" }),
                        search.createColumn({ name: "address1", join: "subsidiary", label: "subsidiaryAddress" }),
                        search.createColumn({ name: "taxidnum", join: "subsidiary", label: "subsidiaryFederalNumber" }),
                        search.createColumn({ name: "email", join: "subsidiary", label: "subsidiaryEmail" }),

                        search.createColumn({ name: "custentityec_contribuyente_especial", join: "vendor", label: "vendorSpecialTaxPayer" }),
                        search.createColumn({ name: "formulatext", formula: "{vendor.custentity_ec_obligado_contabilidad}", label: "vendorObligatedToAccountFor" }),
                        search.createColumn({ name: "custentityts_ec_cod_tipo_doc_identidad", join: "vendor", label: "vendorDocumentTypeCode" }),
                        search.createColumn({ name: "altname", join: "vendor", label: "vendorName" }),
                        search.createColumn({ name: "vatregnumber", join: "vendor", label: "vendorDocumentNumber" }),
                        search.createColumn({ name: "email", join: "vendor", label: "vendorEmail" }),
                        search.createColumn({ name: "phone", join: "vendor", label: "phone" }),

                        search.createColumn({ name: "billaddress1", label: "address" }),
                        search.createColumn({ name: "formulatext", formula: "NVL({billcity},{billingAddress.custrecord_ec_parroquia})", label: "city" }),

                        search.createColumn({ name: "account", label: "item.account" }),
                        search.createColumn({ name: "item", label: "item.id" }),
                        search.createColumn({ name: "itemid", join: "item", label: "item.code" }),
                        search.createColumn({ name: "memo", label: "item.detail" }),
                        search.createColumn({ name: "quantity", label: "item.quantity" }),
                        search.createColumn({ name: "rate", label: "item.rate" }),
                        search.createColumn({ name: "amount", label: "item.amount", function: "absoluteValue" }),
                        search.createColumn({ name: "taxamount", label: "item.taxAmount", function: "absoluteValue" }),
                        search.createColumn({ name: "grossamount", label: "item.grossAmount" }),
                        search.createColumn({ name: "type", join: 'item', label: "item.type" }),
                        search.createColumn({ name: "formulanumeric", formula: "{taxitem.rate}", label: "item.taxRate" }),

                        search.createColumn({ name: "formulatext", formula: "{taxitem.custrecord_ts_ec_tipo_impuesto}", label: "item.taxName" }),
                        search.createColumn({ name: "formulatext", formula: "{taxitem.custrecord_ts_ec_tipo_impuesto_cod}", label: "item.taxCode" }),
                        search.createColumn({ name: "formulatext", formula: "{taxitem.custrecord_ts_ec_tar_imp_codigo}", label: "item.taxRateCode" }),
                        search.createColumn({ name: "formulatext", formula: "NVL({custcol_4601_witaxline},{custcol_4601_witaxline_exp})", label: "item.isWithholdingLine" }),

                        search.createColumn({ name: "custrecord_ts_ec_codigo", join: "custbody_ts_ec_sustento_comprobante", label: "codSustento" }),
                        search.createColumn({ name: "custrecordts_ec_cod_tipo_comprobante", join: "custbodyts_ec_tipo_documento_fiscal", label: "codDocSustento" }),
                        search.createColumn({ name: "formulatext", formula: "CONCAT({custbody_ts_ec_serie_cxc.custrecord_ts_ec_series_impresion},CONCAT('-',{custbody_ts_ec_numero_preimpreso}))", label: "numDocSustento" }),
                        search.createColumn({ name: "formulatext", formula: "to_char({trandate},'DD/MM/YYYY')", label: "fechaEmisionDocSustento" }),
                        search.createColumn({ name: "custentityts_ec_entidad_extranjera", join: "vendor", label: "pagoLocExt" }),
                        search.createColumn({ name: "custentityts_ec_pais_entidad", join: "vendor", label: "codPais" }),
                        search.createColumn({ name: "custbodyts_ec_tipo_documento_fiscal", label: "typeDocFis" }),
                        search.createColumn({ name: "custbody_ts_ec_serie_cxc", label: "serieCxC" }),
                        search.createColumn({ name: "custbody_ts_ec_serie_doc_cxp", label: "serieCxP" }),
                        search.createColumn({ name: "custbody_ts_ec_numero_preimpreso", label: "numberPreImp" }),
                        search.createColumn({ name: "total", label: "total", function: "absoluteValue" }),
                        search.createColumn({ name: "formulatext", formula: "{custbody_ts_ec_metodo_pago.custrecord_ts_ec_clave}", label: "paymentMethod" }),

                        search.createColumn({ name: "custbody_ec_porcentaje_ret_10", label: "periva10" }),
                        search.createColumn({ name: "custbody_cod_ret_iva_10", label: "retiva10" }),
                        search.createColumn({ name: "custrecord_ts_ec_witaxcode_iva_retencion", join: "custbody_cod_ret_iva_10", label: "codSustentoIVA10" }),
                        search.createColumn({ name: "custrecord_ts_ec_witaxcode_tipo_retencio", join: "custbody_cod_ret_iva_10", label: "typeretiva10" }),

                        search.createColumn({ name: "custbody_ec_porcentaje_ret_20", label: "periva20" }),
                        search.createColumn({ name: "custbody_cod_ret_iva_20", label: "retiva20" }),
                        search.createColumn({ name: "custrecord_ts_ec_witaxcode_iva_retencion", join: "custbody_cod_ret_iva_20", label: "codSustentoIVA20" }),
                        search.createColumn({ name: "custrecord_ts_ec_witaxcode_tipo_retencio", join: "custbody_cod_ret_iva_20", label: "typeretiva20" }),

                        search.createColumn({ name: "custbody_ec_porcentaje_ret_30", label: "periva30" }),
                        search.createColumn({ name: "custbody_cod_ret_iva_30", label: "retiva30" }),
                        search.createColumn({ name: "custrecord_ts_ec_witaxcode_iva_retencion", join: "custbody_cod_ret_iva_30", label: "codSustentoIVA30" }),
                        search.createColumn({ name: "custrecord_ts_ec_witaxcode_tipo_retencio", join: "custbody_cod_ret_iva_30", label: "typeretiva30" }),

                        search.createColumn({ name: "custbody_ec_porcentaje_ret_70", label: "periva70" }),
                        search.createColumn({ name: "custbody_cod_ret_iva_70", label: "retiva70" }),
                        search.createColumn({ name: "custrecord_ts_ec_witaxcode_iva_retencion", join: "custbody_cod_ret_iva_70", label: "codSustentoIVA70" }),
                        search.createColumn({ name: "custrecord_ts_ec_witaxcode_tipo_retencio", join: "custbody_cod_ret_iva_70", label: "typeretiva70" }),

                        search.createColumn({ name: "custbody_ec_porcentaje_ret_100", label: "periva100" }),
                        search.createColumn({ name: "custbody_cod_ret_iva_100", label: "retiva100" }),
                        search.createColumn({ name: "custrecord_ts_ec_witaxcode_iva_retencion", join: "custbody_cod_ret_iva_100", label: "codSustentoIVA100" }),
                        search.createColumn({ name: "custrecord_ts_ec_witaxcode_tipo_retencio", join: "custbody_cod_ret_iva_100", label: "typeretiva100" }),

                        search.createColumn({ name: "custbody_ec_ret_ir", label: "retrenta1" }),
                        search.createColumn({ name: "custbody_ec_importe_base_ir", label: "imprenta1" }),
                        search.createColumn({ name: "custbody_ec_porcentaje_ret_ir", label: "perrenta1" }),
                        search.createColumn({ name: "custbody_ec_monto_de_ret_ir", label: "monrenta1" }),
                        search.createColumn({ name: "custrecord_ts_ec_witaxcode_renta_retenci", join: "custbody_ec_ret_ir", label: "codSutentoRENTA1" }),
                        search.createColumn({ name: "custrecord_ts_ec_witaxcode_tipo_retencio", join: "custbody_ec_ret_ir", label: "typeretrenta1" }),

                        search.createColumn({ name: "custbody_ec_ret_por_ir2", label: "retrenta2" }),
                        search.createColumn({ name: "custbody_ec_impb_ir2", label: "imprenta2" }),
                        search.createColumn({ name: "custbody_ec_ret_ir2", label: "perrenta2" }),
                        search.createColumn({ name: "custbody_ec_mont_ret_2", label: "monrenta2" }),
                        search.createColumn({ name: "custrecord_ts_ec_witaxcode_renta_retenci", join: "custbody_ec_ret_por_ir2", label: "codSutentoRENTA2" }),
                        search.createColumn({ name: "custrecord_ts_ec_witaxcode_tipo_retencio", join: "custbody_ec_ret_por_ir2", label: "typeretrenta2" }),

                        search.createColumn({ name: "custbody_ec_ret_por_ir3", label: "retrenta3" }),
                        search.createColumn({ name: "custbody_ec_impb_ir3", label: "imprenta3" }),
                        search.createColumn({ name: "custbody_ec_ret_ir3", label: "perrenta3" }),
                        search.createColumn({ name: "custbody_ec_mont_ret_3", label: "monrenta3" }),
                        search.createColumn({ name: "custrecord_ts_ec_witaxcode_renta_retenci", join: "custbody_ec_ret_por_ir3", label: "codSutentoRENTA3" }),
                        search.createColumn({ name: "custrecord_ts_ec_witaxcode_tipo_retencio", join: "custbody_ec_ret_por_ir3", label: "typeretrenta3" }),

                        search.createColumn({ name: "formulatext", formula: "CONCAT({custbody_ts_ec_serie_doc_cxp},CONCAT('-',{custbody_ts_ec_numero_preimpreso}))", label: "numDocSustento2" }),
                    ]
                }).run().getRange(0, 1000);
                var transactionJson = {};
                for (var i = 0; i < transactionResult.length; i++) {
                    if (i == 0) {
                        transactionJson = getMainLineFields(transactionResult[i]);
                        // var retencionIVA = getIVALineFields(transactionResult[i]);
                        // logError('Seguimiento 1.0.6', retencionIVA);
                        transactionJson.items = [];
                    } else {
                        var item = getLineFields(transactionResult[i]);
                        transactionJson.items.push(item);
                    }
                }
                return transactionJson;
            } catch (e) {
                logError('Error-getRetencionTransaction', e);
            }
        }

        function getBillWithholdingDetailsLines(transactionRecord) {
            var withholdingTaxJson = getCustomPurchaseWithholdingTax();
            //logError('Seguimiento 1.0.1', withholdingTaxJson)
            var resultArray = [];

            for (var i = 0; i < transactionRecord.items.length; i++) {
                var item = transactionRecord.items[i];
                if (item.isWithholdingLine != "T") continue;
                var list = "", id = "";
                if (item.id) {
                    list = "item";
                    id = item.id;
                } else {
                    list = "account";
                    id = item.account;
                }
                //logError('Seguimiento 1.0.2', { list: list, id: id })
                var withholdingTax = withholdingTaxJson[list][id];
                //logError('Seguimiento 1.0.3', withholdingTax)

                if (withholdingTax === undefined) continue;
                //logError('Seguimiento 1.0.4', transactionRecord)
                var baseImponible = 0;
                if (withholdingTax.id == transactionRecord.withholdingTaxRenta) {
                    baseImponible = transactionRecord.baseAmountRenta;
                } else if (withholdingTax.id == transactionRecord.withholdingTaxIva) {
                    baseImponible = transactionRecord.baseAmountIva;
                }

                // TIRLine = [
                //     "TIR",
                //     withholdingTax.typeCode,
                //     withholdingTax.taxCode,
                //     baseImponible,
                //     withholdingTax.taxRate,
                //     item.amount,
                //     "01",
                //     transactionRecord.transactionReferenceSerie/*.replace(/-/gi, "")*/ + '-' + transactionRecord.transactionReferenceNumber,
                //     transactionRecord.transactionReferenceDate,
                //     ""
                // ];

                TIRSLine = [
                    "TIRS",
                    withholdingTax.typeCode,
                    withholdingTax.taxCode,
                    baseImponible,
                    withholdingTax.taxRate,
                    item.amount,
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    ""
                ];
                resultArray.push(TIRSLine);
            }
            return resultArray;
        }

        function getBillTIRSDetailsLines(transactionRecord) {
            var resultArray = new Array();
            if (transactionRecord.retiva10) {
                var codSustento = searchLookFieldsCodigoSustento(transactionRecord.codSustentoIVA10)
                TIRSLine10 = [
                    "TIRS",
                    transactionRecord.typeretiva10,
                    codSustento,
                    (parseFloat(transactionRecord.periva10) / (10 / 100)).toFixed(2),
                    "10",
                    parseFloat(transactionRecord.periva10),
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    ""
                ];
                resultArray.push(TIRSLine10)
            }

            if (transactionRecord.retiva20) {
                var codSustento = searchLookFieldsCodigoSustento(transactionRecord.codSustentoIVA20)
                TIRSLine20 = [
                    "TIRS",
                    transactionRecord.typeretiva20,
                    codSustento,
                    (parseFloat(transactionRecord.periva20) / (20 / 100)).toFixed(2),
                    "20",
                    parseFloat(transactionRecord.periva20),
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    ""
                ];
                resultArray.push(TIRSLine20)
            }

            if (transactionRecord.retiva30) {
                var codSustento = searchLookFieldsCodigoSustento(transactionRecord.codSustentoIVA30)
                TIRSLine30 = [
                    "TIRS",
                    transactionRecord.typeretiva30,
                    codSustento,
                    (parseFloat(transactionRecord.periva30) / (30 / 100)).toFixed(2),
                    "30",
                    parseFloat(transactionRecord.periva30),
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    ""
                ];
                resultArray.push(TIRSLine30)
            }

            if (transactionRecord.retiva70) {
                var codSustento = searchLookFieldsCodigoSustento(transactionRecord.codSustentoIVA70)
                TIRSLine70 = [
                    "TIRS",
                    transactionRecord.typeretiva70,
                    codSustento,
                    (parseFloat(transactionRecord.periva70) / (70 / 100)).toFixed(2),
                    "70",
                    parseFloat(transactionRecord.periva70),
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    ""
                ];
                resultArray.push(TIRSLine70)
            }

            if (transactionRecord.retiva100) {
                var codSustento = searchLookFieldsCodigoSustento(transactionRecord.codSustentoIVA100)
                TIRSLine100 = [
                    "TIRS",
                    transactionRecord.typeretiva100,
                    codSustento,
                    (parseFloat(transactionRecord.periva100) / (100 / 100)).toFixed(2),
                    "100",
                    parseFloat(transactionRecord.periva100),
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    ""
                ];
                resultArray.push(TIRSLine100)
            }

            if (transactionRecord.retrenta1) {
                var codSustento = searchLookFieldsCodigoSustento(transactionRecord.codSutentoRENTA1)
                TIRSLine1 = [
                    "TIRS",
                    transactionRecord.typeretrenta1,
                    codSustento,
                    transactionRecord.imprenta1,
                    transactionRecord.perrenta1.replace('%', ''),
                    parseFloat(transactionRecord.monrenta1),
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    ""
                ];
                resultArray.push(TIRSLine1)
            }

            if (transactionRecord.retrenta2) {
                var codSustento = searchLookFieldsCodigoSustento(transactionRecord.codSutentoRENTA2)
                TIRSLine2 = [
                    "TIRS",
                    transactionRecord.typeretrenta2,
                    codSustento,
                    transactionRecord.imprenta2,
                    transactionRecord.perrenta2.replace('%', ''),
                    parseFloat(transactionRecord.monrenta2),
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    ""
                ];
                resultArray.push(TIRSLine2)
            }

            if (transactionRecord.retrenta3) {
                var codSustento = searchLookFieldsCodigoSustento(transactionRecord.codSutentoRENTA3)
                TIRSLine3 = [
                    "TIRS",
                    transactionRecord.typeretrenta3,
                    codSustento,
                    transactionRecord.imprenta3,
                    transactionRecord.perrenta3.replace('%', ''),
                    parseFloat(transactionRecord.monrenta3),
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    ""
                ];
                resultArray.push(TIRSLine3)
            }

            return resultArray;
        }

        function getIVALineFields(transactionResult) {
            try {
                var lineJson = new Object();
                var columns = transactionResult.columns;
                logError('Seguimiento 1.0.5', columns)
                columns.forEach(function (column) {
                    var column_key = column.label || column.name;
                    var isItem = column_key.indexOf("iva.");
                    if (isItem != -1) {
                        column_key = column_key.replace("iva.retiva", "");
                        if (!lineJson.hasOwnProperty(column_key)) {
                            lineJson[column_key] = {
                                retenciones: []
                            }
                        }
                        lineJson[column_key].retenciones.push({ rete: transactionResult.getValue(column) })
                    }
                });
                return lineJson;
            } catch (e) {
                logError('Error-getLineFields', e);
            }
        }

        function getBillIMSDetailsLines(transactionId) {
            var resultArray = []
            var searchLoad = search.create({
                type: "vendorbill",
                filters:
                    [
                        ["type", "anyof", "VendBill"],
                        "AND",
                        ["internalid", "anyof", transactionId],
                        "AND",
                        ["mainline", "is", "F"],
                        "AND",
                        ["taxline", "is", "F"],
                        "AND",
                        ["itemtype", "isnot", "Discount"],
                        "AND",
                        ["accounttype", "noneof", "OthCurrLiab"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "formulatext", summary: "GROUP", formula: "'2'", label: "codImpuestoDocSustento" }),
                        search.createColumn({ name: "formulatext", summary: "GROUP", formula: "CASE WHEN {taxItem.rate} = 0.00 THEN '0' ELSE '2' END", label: "codigoPorcentaje" }),
                        search.createColumn({ name: "formulacurrency", summary: "GROUP", formula: "CASE WHEN {taxItem.rate} = 0.00 THEN 0.00 ELSE 12.00 END", label: "tarifa" }),
                        search.createColumn({ name: "amount", summary: "SUM", label: "baseImponible" }),
                        search.createColumn({ name: "taxamount", summary: "SUM", label: "valorImpuesto" }),
                        search.createColumn({ name: "formulatext", summary: "GROUP", formula: "'IVA'", label: "impuestos" })
                    ]
            });
            var searchResultCount = searchLoad.runPaged().count;
            if (searchResultCount > 0) {
                searchLoad.run().each(function (result) {
                    if (result.getValue({ name: "amount", summary: "SUM", label: "baseImponible" }) > 0) {
                        IMSLine = [
                            "IMS",
                            result.getValue(searchLoad.columns[0]),
                            result.getValue(searchLoad.columns[1]),
                            result.getValue(searchLoad.columns[2]) == .00 ? "0.00" : result.getValue(searchLoad.columns[2]),
                            result.getValue(searchLoad.columns[3]),
                            Math.abs(result.getValue(searchLoad.columns[4])) == .00 ? "0.00" : Math.abs(result.getValue(searchLoad.columns[4])),
                            result.getValue(searchLoad.columns[5]),
                            ""
                        ]
                        resultArray.push(IMSLine)
                    }
                    return true;
                });
            }
            return resultArray;
        }

        function getCustomPurchaseWithholdingTax(itemId) {
            var jsonResult = {
                "item": {},
                "account": {}
            };
            var searchResult = search.create({
                type: "customrecord_4601_witaxcode",
                filters: [
                    [["custrecord_4601_wtc_availableon", "is", "both"], "OR", ["custrecord_4601_wtc_availableon", "is", "onpurcs"]],
                    "AND",
                    ["custrecord_4601_wtc_istaxgroup", "is", "F"]
                ],
                columns: [
                    search.createColumn({ name: "custrecord_4601_wtt_purcitem", join: "CUSTRECORD_4601_WTC_WITAXTYPE" }),
                    search.createColumn({ name: "custrecord_4601_wtt_purcaccount", join: "CUSTRECORD_4601_WTC_WITAXTYPE" }),
                    search.createColumn({ name: "custrecord_ts_ec_witaxcode_tipo_retencio" }),
                    search.createColumn({ name: "custrecord_ts_ec_tir_codigo", join: "CUSTRECORD_TS_EC_WITAXCODE_TIPO_RETENCIO" }),
                    search.createColumn({ name: "custrecord_ts_ec_cod_imp_ret_codigo", join: "CUSTRECORD_TS_EC_WITAXCODE_IVA_RETENCION", label: "Codigo" }),
                    search.createColumn({ name: "custrecord_ts_ec_cod_imp_ret_tasa", join: "CUSTRECORD_TS_EC_WITAXCODE_IVA_RETENCION" }),
                    search.createColumn({ name: "custrecord_ts_ec_cod_imp_ret_codigo", join: "CUSTRECORD_TS_EC_WITAXCODE_RENTA_RETENCI" }),
                    search.createColumn({ name: "custrecord_ts_ec_cod_imp_ret_tasa", join: "CUSTRECORD_TS_EC_WITAXCODE_RENTA_RETENCI" })
                ]
            }).run().getRange(0, 1000);

            if (searchResult.length) {
                for (var i = 0; i < searchResult.length; i++) {
                    var columns = searchResult[i].columns;
                    var id = searchResult[i].id;
                    var itemId = searchResult[i].getValue(columns[0]);
                    var accountId = searchResult[i].getValue(columns[1]);
                    var withholdingType = searchResult[i].getText(columns[2]);
                    var withholdingTypeCode = searchResult[i].getValue(columns[3]);
                    var withholdingTaxCode = "";
                    var withholdingTaxRate = "";
                    if (withholdingType == "IVA") {
                        withholdingTaxCode = searchResult[i].getValue(columns[4]);
                        withholdingTaxRate = searchResult[i].getValue(columns[5]);
                    } else if (withholdingType == "RENTA") {
                        withholdingTaxCode = searchResult[i].getValue(columns[6]);
                        withholdingTaxRate = searchResult[i].getValue(columns[7]);
                    }
                    jsonResult["item"][itemId] = {
                        id: id,
                        typeCode: withholdingTypeCode,
                        taxCode: withholdingTaxCode,
                        taxRate: withholdingTaxRate
                    };
                    jsonResult["account"][accountId] = {
                        id: id,
                        typeCode: withholdingTypeCode,
                        taxCode: withholdingTaxCode,
                        taxRate: withholdingTaxRate
                    };
                }
            }
            return jsonResult;
        }

        function getMainLineFields(transactionResult) {
            try {
                var mainLineJson = new Object();
                var mainLineJsonText = new Object();
                var columns = transactionResult.columns;
                mainLineJson.internalid = transactionResult.id;
                mainLineJson.type = transactionResult.recordtype;
                columns.forEach(function (column) {
                    var column_key = column.label || column.name;
                    var isItem = column_key.indexOf("item.");
                    if (isItem == -1) {
                        mainLineJson[column_key] = transactionResult.getValue(column);
                    }
                });

                return mainLineJson;
            } catch (e) {
                logError('Error-getMainLineFields', e);
            }

        }

        function getLineFields(transactionResult) {
            try {
                var items = [];
                var lineJson = {}
                var columns = transactionResult.columns;
                columns.forEach(function (column) {
                    var column_key = column.label || column.name;
                    var isItem = column_key.indexOf("item.");
                    if (isItem != -1) {
                        column_key = column_key.replace("item.", "");
                        lineJson[column_key] = transactionResult.getValue(column);
                        items.push(lineJson);
                    }
                });
                return lineJson;
            } catch (e) {
                logError('Error-getLineFields', e);
            }
        }

        function getIALines(transactionRecord) {
            try {
                var IALines = [];
                if (transactionRecord.recordtype == "invoice" && (transactionRecord.documentTypeCode == "01" || transactionRecord.documentTypeCode == "18")) { //& FACTURA Y DOCUMENTO 18
                    var emails = getEmails(transactionRecord.customer);
                    var addr = getAddress(transactionRecord.customer);
                    IALines.push(['IA', 'DIRECCION', addr.direccion, '']);
                    IALines.push(['IA', 'CIUDAD', addr.ciudad, '']);
                    IALines.push(['IA', 'TELEFONO', transactionRecord.phone, '']);
                    IALines.push(['IA', 'VENCIMIENTO', transactionRecord.duedate, '']);
                    IALines.push(['IA', 'EMISION', transactionRecord.location, '']);
                    if (emails.length) IALines.push(['IA', 'CORREO', emails.join(','), '']);
                } else if (transactionRecord.recordtype == "itemfulfillment") { //& GUIA DE REMISIÓN
                    var emails = getEmails(transactionRecord.customer);
                    var addr = getAddress(transactionRecord.customer);
                    IALines.push(['IA', 'DIRECCION', addr.direccion, '']);
                    IALines.push(['IA', 'CIUDAD', addr.ciudad, '']);
                    IALines.push(['IA', 'TELEFONO', transactionRecord.phone, '']);
                    IALines.push(['IA', 'VENCIMIENTO', transactionRecord.duedate, '']);
                    IALines.push(['IA', 'EMISION', transactionRecord.location, '']);
                    if (emails.length) IALines.push(['IA', 'CORREO', emails.join(','), '']);
                } else if (transactionRecord.recordtype == "creditmemo") { //& NOTA DE CREDITO
                    var emails = getEmails(transactionRecord.customer);
                    var addr = getAddress(transactionRecord.customer);
                    IALines.push(['IA', 'DIRECCION', addr.direccion, '']);
                    IALines.push(['IA', 'CIUDAD', addr.ciudad, '']);
                    IALines.push(['IA', 'TELEFONO', transactionRecord.phone, '']);
                    IALines.push(['IA', 'EMISION', transactionRecord.location, '']);
                    if (emails.length) IALines.push(['IA', 'CORREO', emails.join(','), '']);
                } else if (transactionRecord.recordtype == "invoice" && transactionRecord.documentTypeCode == "05") { //& NOTA DE DEBITO
                    var emails = getEmails(transactionRecord.customer);
                    var addr = getAddress(transactionRecord.customer);
                    IALines.push(['IA', 'DIRECCION', addr.direccion, '']);
                    IALines.push(['IA', 'CIUDAD', addr.ciudad, '']);
                    IALines.push(['IA', 'TELEFONO', transactionRecord.phone, '']);
                    IALines.push(['IA', 'EMISION', transactionRecord.location, '']);
                    if (emails.length) IALines.push(['IA', 'CORREO', emails.join(','), '']);
                } else if (transactionRecord.recordtype == "vendorbill" && transactionRecord.documentTypeCode == "03") { //& LIQUIDACION DE COMPRA
                    var emails = getEmails(transactionRecord.vendor);
                    var addr = getAddress(transactionRecord.vendor);
                    IALines.push(['IA', 'DIRECCION', addr.direccion, '']);
                    IALines.push(['IA', 'CIUDAD', addr.ciudad, '']);
                    IALines.push(['IA', 'TELEFONO', transactionRecord.phone, '']);
                    IALines.push(['IA', 'EMISION', transactionRecord.location, '']);
                    if (emails.length) IALines.push(['IA', 'CORREO', emails.join(','), '']);
                } else if (transactionRecord.recordtype == "vendorbill" && transactionRecord.documentTypeCode == "07") { //& COMPROBANTE DE RETENCION
                    var emails = getEmails(transactionRecord.vendor);
                    var addr = getAddress(transactionRecord.vendor);
                    IALines.push(['IA', 'DIRECCION', addr.direccion, '']);
                    IALines.push(['IA', 'CIUDAD', addr.ciudad, '']);
                    IALines.push(['IA', 'TELEFONO', transactionRecord.phone, '']);
                    IALines.push(['IA', 'EMISION', transactionRecord.location, '']);
                    if (emails.length) IALines.push(['IA', 'CORREO', emails.join(','), '']);
                }
                return IALines;
            } catch (e) {
                logError('Error-getIALines', e);
            }
        }

        function getPALines(transactionRecord) {
            try {
                var PALines = ["PA", transactionRecord.paymentMethod, transactionRecord.total, "", "", ""];
                if (transactionRecord.terms) {
                    var terms = getTerms(transactionRecord.terms);
                    PALines[3] = terms.daysuntilnetdue;
                    PALines[4] = terms.time;
                }
                return PALines;
            } catch (e) {
                logError('Error-getPALines', e);
            }
        }

        function getPASLines(transactionRecord, total) {
            try {
                var PASLines = ["PAS", transactionRecord.paymentMethod, total, "", "", ""];
                if (transactionRecord.terms) {
                    var terms = getTerms(transactionRecord.terms);
                    PASLines[3] = terms.daysuntilnetdue;
                    PASLines[4] = terms.time;
                }
                return PASLines;
            } catch (e) {
                logError('Error-getPASLines', e);
            }
        }

        function getEmails(customerId) {
            if (!customerId) return [];
            var searchResult = search.create({
                type: "customrecord_ht_record_correoelectronico",
                filters: [["custrecord_ht_ce_enlace", "anyof", customerId]],
                columns: ["custrecord_ht_email_email"]
            }).run().getRange(0, 1000);

            if (!searchResult.length) return [];
            var emails = [];
            for (var i = 0; i < searchResult.length; i++) {
                emails.push(searchResult[i].getValue("custrecord_ht_email_email"));
            }
            return emails;
        }

        function getTerms(termsId) {
            try {
                if (!termsId) return { daysuntilnetdue: "", time: "" };
                var termRecord = search.lookupFields({
                    type: search.Type.TERM,
                    id: termsId,
                    columns: ["daysuntilnetdue"]
                });
                termRecord.time = "dias";
                return termRecord;
            } catch (e) {
                logError('Error-getTerms', e);
            }
        }

        function getLookUpTransactionFields(id) {
            try {
                var transactionRecord = search.lookupFields({
                    type: search.Type.TRANSACTION,
                    id: id,
                    columns: [
                        "recordtype",
                        "custbodyts_ec_tipo_documento_fiscal.custrecordts_ec_cod_tipo_comprobante",
                        "custbody_ts_ec_serie_cxc.custrecord_ts_ec_series_impresion",
                        "custbody_ts_ec_numero_preimpreso",
                        "custbodyec_tipo_de_documento_retencion.custrecordts_ec_cod_tipo_comprobante",
                        "custbody_ec_serie_cxc_retencion.custrecord_ts_ec_series_impresion",
                        "custbody_ts_ec_preimpreso_retencion"
                    ]
                });
                return transactionRecord;
            } catch (e) {
                logError('Error-getLookupFieldsSearch', e);
            }
        }

        function printLines(linesArray) {
            try {
                var text = "";
                for (var i = 0; i < linesArray.length; i++) {
                    text = text + linesArray[i].join('|') + "\n";
                }
                return text;
            } catch (e) {
                logError('Error-printLines', e);
                return "";
            }
        }

        function getEnvirommentSetup() {
            var setup = {}

            setup.enviromment = runtime.envType == 'PRODUCTION' ? "2" : "1";
            setup.enviromment = "1";
            setup.issuanceType = 1;

            return setup;
        }

        function generateFileTXT(namefile, contents) {
            try {
                return file.create({
                    name: namefile + '.txt',
                    fileType: file.Type.PLAINTEXT,
                    contents: contents,
                    encoding: file.Encoding.UTF8,
                    folder: GENERATED_FILE_FOLDER_ID,
                    isOnline: true
                });
            } catch (e) {
                logError('Error-generateFileTXT', e);
            }
        }

        function logError(docstatus, response) {
            try {
                var logError = record.create({ type: 'customrecord_ec_ei_log_documents' });
                logError.setValue('custrecord_pe_ei_log_related_transaction', transactionId);
                logError.setValue('custrecord_pe_ei_log_subsidiary', SUBSIDIARIA);
                logError.setValue('custrecord_pe_ei_log_employee', /*userId*/ 4);
                logError.setValue('custrecord_ec_ei_log_status', docstatus);
                logError.setValue('custrecord_pe_ei_log_response', JSON.stringify(response));
                logError.save();
            } catch (e) {
                throw error.create({ name: "ERROR", message: response.message, notifyOff: false });
            }
        }

        function logStatus(internalid, docstatus) {
            try {
                var logStatus = record.create({ type: 'customrecord_ec_ei_document_status' });
                logStatus.setValue('custrecord_ec_ei_document', internalid);
                logStatus.setValue('custrecord_pe_ei_document_status', docstatus);
                logStatus.save();
            } catch (e) {

            }
        }

        function getAddress(entity) {
            var nkey = 0;
            var ciudad = '';
            var direccion = '';
            var sql = "SELECT addressbookaddress FROM customeraddressbook WHERE defaultbilling = 'T' AND entity = ?"
            var resultSet = query.runSuiteQL({ query: sql, params: [entity] });
            var results = resultSet.asMappedResults();
            if (results.length > 0) {
                nkey = results[0].addressbookaddress;
            }

            if (nkey != 0) {
                var sql2 = "SELECT country, city, custrecord_ec_parroquia, addr1 as direccion FROM customerAddressbookEntityAddress WHERE nkey = ?"
                var resultSet2 = query.runSuiteQL({ query: sql2, params: [nkey] });
                var results2 = resultSet2.asMappedResults();
                if (results2.length > 0) {
                    country = results2[0].country;
                    if (country == 'EC') {
                        direccion = results2[0].direccion
                        var sql3 = "SELECT name FROM customrecord_ec_record_parroquia WHERE id = ?"
                        var resultSet3 = query.runSuiteQL({ query: sql3, params: [results2[0].custrecord_ec_parroquia] });
                        var results3 = resultSet3.asMappedResults();
                        if (results3.length > 0) {
                            ciudad = results3[0].name;
                        }
                    } else {
                        direccion = results2[0].direccion
                        ciudad = results2[0].city;
                    }
                }
            }

            return {
                direccion: direccion,
                ciudad: ciudad
            }
        }

        function getperiodoFiscal(period) {
            var periodoFiscal = '';
            var sql = "SELECT to_char(startdate,'MM/YYYY') as postingperiod FROM accountingperiod WHERE periodname = ?";
            var resultSet = query.runSuiteQL({ query: sql, params: [period] });
            var results = resultSet.asMappedResults();
            periodoFiscal = results.length > 0 ? results[0].postingperiod : '';
            return periodoFiscal;
        }

        function getCodigoPais(pais) {
            var sql = "SELECT custrecord_ts_ec_codigo_pais as codigopas FROM customrecord_ts_ec_pe_pais WHERE id = ?"
            var resultSet = query.runSuiteQL({ query: sql, params: [pais] }).asMappedResults();
            var results = resultSet.length > 0 ? resultSet[0].codigopas : '';
            return results;
        }

        function getImportes(documentoFiscal, serie, numImpreso, form) {
            var totalSinImpuestos = '';
            var importeTotal = '';
            var filterSerie = new Array();
            try {
                if (form == FORM_LIQUIDACION) {
                    filterSerie = ["custbody_ts_ec_serie_cxc", "anyof", serie]
                } else {
                    filterSerie = ["custbody_ts_ec_serie_doc_cxp", "startswith", serie]
                }

                var vendorbillSearchObj = search.create({ //customsearch1834
                    type: "vendorbill",
                    filters:
                        [
                            ["type", "anyof", "VendBill"],
                            "AND",
                            // ["itemtype", "isnot", "Discount"],
                            // "AND",
                            // ["accounttype", "noneof", "OthCurrLiab"],
                            // "AND",
                            ["taxline", "is", "F"],
                            "AND",
                            ["mainline", "is", "F"],
                            "AND",
                            ["custbodyts_ec_tipo_documento_fiscal", "anyof", documentoFiscal],
                            "AND",
                            filterSerie,
                            "AND",
                            ["custbody_ts_ec_numero_preimpreso", "is", numImpreso],
                            "AND",
                            ["taxitem", "noneof", "5"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "amount", summary: "SUM", label: "Amount" }),
                            search.createColumn({ name: "taxamount", summary: "SUM", label: "Amount (Tax)" })
                        ]
                });

                //var searchResultCount = vendorbillSearchObj.runPaged().count;
                vendorbillSearchObj.run().each(function (result) {
                    totalSinImpuestos = Math.abs(result.getValue({ name: "amount", summary: "SUM", label: "Amount" }));
                    importeTotal = parseFloat(Math.abs(result.getValue({ name: "taxamount", summary: "SUM", label: "Amount (Tax)" }))) + parseFloat(totalSinImpuestos);
                    return true;
                });

                return {
                    totalSinImpuestos: parseFloat(totalSinImpuestos).toFixed(2),
                    importeTotal: parseFloat(importeTotal).toFixed(2)
                }
            } catch (error) {
                logError('Error.getImportes', error);
            }
        }

        function searchLookFieldsCodigoSustento(id) {
            try {
                var codSustento = search.lookupFields({
                    type: 'customrecord_ts_ec_codigo_impuesto_reten',
                    id: id,
                    columns: ["custrecord_ts_ec_cod_imp_ret_codigo"]
                });
                return codSustento.custrecord_ts_ec_cod_imp_ret_codigo;
            } catch (error) {
                logError('Error-getLookupFieldsSearch', error);
                return '';
            }
        }

        function getBillRBSDetailsLines(id) {
            var array = new Array();
            try {
                var mySearch = search.create({
                    type: "customrecord_ht_reembolso",
                    filters:
                        [["custrecord_ht_reembolso_informe_gastos", "anyof", id]],
                    columns:
                        [
                            search.createColumn({ name: "custentityts_ec_cod_tipo_doc_identidad", join: "CUSTRECORD_HT_EC_REEMBOLSO_DOC_PROVEEDOR", summary: "GROUP", label: "0 tipoIdentificacionProveedorReembolso" }),
                            search.createColumn({ name: "vatregnumber", join: "CUSTRECORD_HT_EC_REEMBOLSO_DOC_PROVEEDOR", summary: "GROUP", label: "1 identificacionProveedorReembolso" }),
                            search.createColumn({ name: "custentity_ts_ec_cod_pais_ent", join: "CUSTRECORD_HT_EC_REEMBOLSO_DOC_PROVEEDOR", summary: "GROUP", label: "2 codPaisPagoProveedorReembolso" }),
                            //search.createColumn({ name: "country", join: "CUSTRECORD_HT_EC_REEMBOLSO_DOC_PROVEEDOR", summary: "GROUP", label: "2 codPaisPagoProveedorReembolso" }),
                            search.createColumn({ name: "custrecordts_ec_cod_tipo_comprobante", join: "CUSTRECORD_HT_EC_REEMBOLSO_DOC_TIPO", summary: "GROUP", label: "3 tipoProveedorReembolso" }),
                            search.createColumn({ name: "formulatext", summary: "GROUP", formula: "'01'", label: "4 codDocReembolso" }),
                            search.createColumn({ name: "formulatext", summary: "GROUP", formula: "SUBSTR({custrecord_ht_ec_reembolso_doc_serie}, 1, 3)", label: "5 estabDocReembolso" }),
                            search.createColumn({ name: "formulatext", summary: "GROUP", formula: "SUBSTR({custrecord_ht_ec_reembolso_doc_serie}, 4, 3)", label: "6 ptoEmiDocReembolso" }),
                            search.createColumn({ name: "custrecord_ht_ec_reembolso_num_doc", summary: "GROUP", label: "7 secuencialDocReembolso" }),
                            search.createColumn({ name: "custrecord_fecha", summary: "GROUP", label: "8 fechaEmisionDocReembolso" }),
                            // search.createColumn({ name: "custbodyts_ec_num_autorizacion", join: "CUSTRECORD_HT_REEMBOLSO_INFORME_GASTOS", summary: "GROUP", label: "9 numeroAutorizacionDocReemb" }),
                            search.createColumn({ name: "custrecord_ht_ec_reembolso_num_folio_fis", summary: "GROUP", label: "9 numeroAutorizacionDocReemb" }),
                            search.createColumn({ name: "formulatext", summary: "GROUP", formula: "'2'", label: "10 codigo" }),
                            search.createColumn({ name: "custrecord_ts_ec_tar_imp_codigo", join: "CUSTRECORD_HT_REEMBOLSO_COD_IMPUESTO", summary: "GROUP", label: "11 codigoPorcentaje" }),
                            search.createColumn({ name: "custrecord_ht_reembolso_tasa_impuesto", summary: "GROUP", label: "12 tarifa" }),
                            search.createColumn({ name: "custrecord_ht_reembolso_importe", summary: "GROUP", label: "13 impuestoReembolso" }),
                            search.createColumn({ name: "custrecord_ht_reembolso_imp_impuestos", summary: "GROUP", label: "14 impuestoReembolso" }),
                            search.createColumn({ name: "formulatext", summary: "GROUP", formula: "'IVA'", label: "15 impuestos" })
                        ]
                });
                var searchResultCount = mySearch.runPaged().count;
                //log.debug("customrecord_ht_reembolsoSearchObj result count", searchResultCount);
                mySearch.run().each(function (result) {
                    var RBSLine = [
                        'RBS',
                        result.getValue(mySearch.columns[0]),//<tipoIdentificacionProveedorReembolso>
                        result.getValue(mySearch.columns[1]),//<identificacionProveedorReembolso>
                        result.getValue(mySearch.columns[2]),//<codPaisPagoProveedorReembolso>
                        result.getValue(mySearch.columns[3]),//<tipoProveedorReembolso>
                        result.getValue(mySearch.columns[4]),//<codDocReembolso>
                        result.getValue(mySearch.columns[5]),
                        result.getValue(mySearch.columns[6]),
                        result.getValue(mySearch.columns[7]),
                        result.getValue(mySearch.columns[8]),
                        result.getValue(mySearch.columns[9]),
                        ''
                    ]
                    array.push(RBSLine)
                    var IRBLine = [
                        'IRB',
                        result.getValue(mySearch.columns[10]),
                        result.getValue(mySearch.columns[11]),
                        result.getValue(mySearch.columns[12]).replace('%', '0'),
                        result.getValue(mySearch.columns[13]),
                        result.getValue(mySearch.columns[14]) == '.00' ? '0.00' : result.getValue(mySearch.columns[14]) == 0 ? '0.00' : result.getValue(mySearch.columns[14]),
                        result.getValue(mySearch.columns[15]),
                        ''
                    ]
                    array.push(IRBLine);
                    return true;
                });
                return array;
            } catch (error) {
                return new Array();
            }
        }

        function getPagoLocExto(id) {
            try {
                //var pagoLocExto = search.lookupFields({ type: 'vendor', id: id, columns: ['custentityts_ec_entidad_extranjera'] });
                var pagoLocExto = search.lookupFields({ type: 'vendorbill', id: id, columns: ['custbody_ts_pago_residente'] });
                pagoLocExto = pagoLocExto.custbody_ts_pago_residente[0].text;
                return pagoLocExto.substr(0, 2);
            } catch (error) { }

        }

        return {
            validate: validate
        };
    }
);
