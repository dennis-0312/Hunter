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

        const GENERATED_FILE_FOLDER_ID = "561";
        var transactionId = '';
        var userId = '';

        function validate(pluginContext) {
            log.debug({
                title: 'Custom Log - Debug',
                details: 'This is a debug message.'
            });
            var result = { success: false, message: "" };
            try {
                var linesArray = [], retencionLineArray = [];
                var transactionId = pluginContext.transactionInfo.transactionId;
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

                var serie = transactionRecord.serie.split('-');
                var ITline = ['IT', setup.enviromment, '1', transactionRecord.subsidiaryLegalName, "CARSEG S.A", transactionRecord.subsidiaryFederalNumber, '', transactionRecord.documentTypeCode, serie[0], serie[1] || "", transactionRecord.preprint, transactionRecord.subsidiaryAddress.toUpperCase(), transactionRecord.customerEmail, ''];
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

                var serie = transactionRecord.serie.split('-');
                var ITline = ['IT', setup.enviromment, '1', transactionRecord.subsidiaryLegalName, "CARSEG S.A", transactionRecord.subsidiaryFederalNumber, '', transactionRecord.documentTypeCode, serie[0], serie[1] || "", transactionRecord.preprint, transactionRecord.subsidiaryAddress.toUpperCase(), transactionRecord.customerEmail, ''];
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

                var serie = transactionRecord.serie.split('-');
                //IT
                var ITline = ['IT', setup.enviromment, '1', transactionRecord.subsidiaryLegalName, transactionRecord.subsidiaryLegalName, transactionRecord.subsidiaryFederalNumber, '', "06", serie[0], serie[1] || "", transactionRecord.preprint, transactionRecord.subsidiaryAddress.replace(/\n/gi, ""), transactionRecord.customerEmail, ''];
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
                var ITline = ['IT', setup.enviromment, '1', transactionRecord.subsidiaryLegalName, "CARSEG S.A", transactionRecord.subsidiaryFederalNumber, '', transactionRecord.documentTypeCode, serie[0], serie[1] || "", transactionRecord.preprint, transactionRecord.subsidiaryAddress.toUpperCase(), transactionRecord.customerEmail, ''];
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
                var ITline = ['IT', setup.enviromment, '1', transactionRecord.subsidiaryLegalName, "CARSEG S.A", transactionRecord.subsidiaryFederalNumber, '', transactionRecord.documentTypeCode, serie[0], serie[1] || "", transactionRecord.preprint, transactionRecord.subsidiaryAddress.toUpperCase(), 'factura@suministro.com', ''];
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

                var serie = transactionRecord.serie.split('-');
                var ITline = ['IT', setup.enviromment, '1', transactionRecord.subsidiaryLegalName, "CARSEG S.A", transactionRecord.subsidiaryFederalNumber, '', transactionRecord.documentTypeCode, serie[0], serie[1] || "", transactionRecord.preprint, transactionRecord.subsidiaryAddress.toUpperCase(), transactionRecord.vendorEmail, ''];
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
                var resultArray = [];
                var lineArray = [];

                var subtotal12 = 0, subtotal0 = 0, subtotalNotSubject = 0, subtotalWithoutTaxation = 0, totalDescuento = 0, ICE = 0, IVA12 = 0, totalAmount = 0, tip = 0, amountToPay = 0;
                //var TLine = ["T", subtotal12, subtotal0, subtotalNotSubject, subtotalWithoutTaxation, totalDescuento, ICE, IVA12, totalAmount, tip, amountToPay, ""];

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

                //var TLine = ["T", subtotal12, subtotal0, subtotalNotSubject, subtotalWithoutTaxation, totalDescuento, ICE, IVA12, (totalAmount + IVA12), tip, transactionRecord.total, ""];
                var TLine = ["T", subtotal12, subtotal0, subtotalNotSubject, subtotalWithoutTaxation, totalDescuento, ICE, IVA12, (totalAmount + IVA12), tip, (totalAmount + IVA12), ""];
                resultArray.push(TLine);
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

        function generateBillWitholdingLines(transactionId, setup) {
            try {
                var transactionRecord = getBillWithholdingTransaction(transactionId);

                var billLines = [];

                var VEline = ["VE", transactionRecord.documentTypeCode, "ComprobanteRetencion", "1.0.0", ""];
                billLines.push(VEline);

                var serie = transactionRecord.serie.split("-");
                var ITline = [
                    "IT",
                    setup.enviromment,
                    "1",
                    transactionRecord.subsidiaryLegalName,
                    "CARSEG S.A",
                    transactionRecord.subsidiaryFederalNumber,
                    "",
                    transactionRecord.documentTypeCode,
                    serie[0].replace(" ", ""),
                    serie[1] || "",
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
                    transactionRecord.vendorSpecialTaxPayer,
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
                    ""
                ]
                billLines.push(ICline);

                var detailArray = getBillWithholdingDetailsLines(transactionRecord);
                billLines = billLines.concat(detailArray);

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

                        search.createColumn({ name: "custrecordts_ec_cod_tipo_comprobante", join: "custbodyec_tipo_de_documento_retencion", label: "documentTypeCode" }),
                        search.createColumn({ name: "formulatext", formula: "{custbody_ec_serie_cxc_retencion}", label: "serie" }),
                        search.createColumn({ name: "custbody_ts_ec_preimpreso_retencion", label: "preprint" }),

                        search.createColumn({ name: "formulatext", formula: "{location}", label: "location" }),
                        search.createColumn({ name: "custrecordts_ec_cod_tipo_comprobante", join: "custbodyts_ec_tipo_documento_fiscal", label: "transactionReferenceDocumentTypeCode" }),
                        //search.createColumn({ name: "formulatext", formula: "{custbody_ts_ec_serie_doc_cxp}", label: "transactionReferenceSerie" }),
                        search.createColumn({ name: "formulatext", formula: "{custbody_ts_ec_serie_cxc}", label: "transactionReferenceSerie" }),
                        search.createColumn({ name: "formulatext", formula: "{custbody_ts_ec_numero_preimpreso}", label: "transactionReferenceNumber" }),
                        //search.createColumn({ name: "tranid", join: "appliedToTransaction", label: "transactionReference" }),
                        search.createColumn({ name: "formulatext", formula: "to_char({trandate},'DD/MM/YYYY')", label: "transactionReferenceDate" }),


                        search.createColumn({ name: "formulatext", formula: "to_char({trandate},'DD/MM/YYYY')", label: "date" }),
                        //search.createColumn({ name: "formulatext", formula: "to_char({duedate},'DD/MM/YYYY')", label: "duedate" }),
                        //search.createColumn({ name: "terms", label: "terms" }),

                        search.createColumn({ name: "custbody_ec_ret_ir", label: "withholdingTaxRenta" }),
                        search.createColumn({ name: "custbody_ec_ret_iva", label: "withholdingTaxIva" }),

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
                logError('Error-getRetencionTransaction', e);
            }
        }

        function getBillWithholdingDetailsLines(transactionRecord) {
            var withholdingTaxJson = getCustomPurchaseWithholdingTax();
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
                var withholdingTax = withholdingTaxJson[list][id];

                if (withholdingTax === undefined) continue;

                var baseImponible = 0;
                if (withholdingTax.id == transactionRecord.withholdingTaxRenta) {
                    baseImponible = transactionRecord.baseAmountRenta;
                } else if (withholdingTax.id == transactionRecord.withholdingTaxIva) {
                    baseImponible = transactionRecord.baseAmountIva;
                }

                TIRLine = [
                    "TIR",
                    withholdingTax.typeCode,
                    withholdingTax.taxCode,
                    baseImponible,
                    withholdingTax.taxRate,
                    item.amount,
                    "01",
                    transactionRecord.transactionReferenceSerie/*.replace(/-/gi, "")*/ + '-' + transactionRecord.transactionReferenceNumber,
                    transactionRecord.transactionReferenceDate,
                    ""
                ];
                resultArray.push(TIRLine);
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
                var mainLineJson = {};
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
                if (transactionRecord.recordtype == "invoice" && (transactionRecord.documentTypeCode == "01" || transactionRecord.documentTypeCode == "18")) {//& FACTURA Y DOCUMENTO 18
                    var emails = getEmails(transactionRecord.customer);
                    var addr = getAddress(transactionRecord.customer);
                    IALines.push(['IA', 'DIRECCION', addr.direccion, '']);
                    IALines.push(['IA', 'CIUDAD', addr.ciudad, '']);
                    IALines.push(['IA', 'TELEFONO', transactionRecord.phone, '']);
                    IALines.push(['IA', 'VENCIMIENTO', transactionRecord.duedate, '']);
                    //IA | PLAZO | 0 dias |
                    IALines.push(['IA', 'EMISION', transactionRecord.location, '']);
                    //IA|OBSERVACION|GTU-5082|
                    if (emails.length) IALines.push(['IA', 'CORREO', emails.join(','), '']);
                    //IA | TELSUCURSAL | (04) 6011450 |
                    //IA | INFOACTIVACION | EL USUARIO YA HA SIDO ACTIVADO POR tarmas7 @solum.com.ec|
                } else if (transactionRecord.recordtype == "itemfulfillment") { //& GUIA DE REMISIÓN
                    var emails = getEmails(transactionRecord.customer);
                    var addr = getAddress(transactionRecord.customer);
                    IALines.push(['IA', 'DIRECCION', addr.direccion, '']);
                    IALines.push(['IA', 'CIUDAD', addr.ciudad, '']);
                    IALines.push(['IA', 'TELEFONO', transactionRecord.phone, '']);
                    IALines.push(['IA', 'VENCIMIENTO', transactionRecord.duedate, '']);
                    //IA | PLAZO | 0 dias |
                    IALines.push(['IA', 'EMISION', transactionRecord.location, '']);
                    //IA|OBSERVACION|GTU-5082|
                    if (emails.length) IALines.push(['IA', 'CORREO', emails.join(','), '']);
                } else if (transactionRecord.recordtype == "creditmemo") { //& NOTA DE CREDITO
                    var emails = getEmails(transactionRecord.customer);
                    var addr = getAddress(transactionRecord.customer);
                    IALines.push(['IA', 'DIRECCION', addr.direccion, '']);
                    IALines.push(['IA', 'CIUDAD', addr.ciudad, '']);
                    IALines.push(['IA', 'TELEFONO', transactionRecord.phone, '']);
                    IALines.push(['IA', 'EMISION', transactionRecord.location, '']);
                    //IA|OBSERVACION|GTU-5082|
                    if (emails.length) IALines.push(['IA', 'CORREO', emails.join(','), '']);
                    //IA | TELSUCURSAL | (04) 6011450 |
                    //IA | USUARIO | 20504292968 |
                    //IA | CLAVE | 12345678 |
                    //IA | DESCUENTO | 0.00 |
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
                logError.setValue('custrecord_pe_ei_log_subsidiary', SUBSIDIsARIA);
                logError.setValue('custrecord_pe_ei_log_employee', userId);
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
            var sql = "SELECT addressbookaddress FROM customeraddressbook WHERE entity = ?"
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

        return {
            validate: validate
        };
    }
);
