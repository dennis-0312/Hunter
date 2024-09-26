//https://7451241-sb1.app.netsuite.com/app/common/scripting/plugin.nl?id=818&id=818&whence=
function customizeGlImpact(transactionRecord, standardLines, customLines, book) {
    var recordType = transactionRecord.getRecordType();
    var id = transactionRecord.getId();
    var accountCajaTransito = 122 //11001010200 FONDOS SIN DEPOSITAR
    const TIPO_PENDIENTE_FACTURAR = 1;
    const TIPO_PENDIENTE_INSTALAR = 2;
    nlapiLogExecution("ERROR", "customizeGlImpact", recordType);

    //& PROCESO DE RETENCIÓN =========================================================================
    if (recordType == 'deposit') {
        nlapiLogExecution("ERROR", recordType, 'Init');
        var accountPaymentMethod;
        var creditmemoid;
        var jsonAccounts = new Array();
        var accountMethod;
        var creditMemo;

        try {
            var countTransaction = transactionRecord.getLineItemCount('payment');
            nlapiLogExecution("ERROR", "countTransaction", countTransaction);
            for (var j = 1; j <= countTransaction; j++) {
                var json = new Array();
                var paymentidInt = transactionRecord.getLineItemValue('payment', 'id', j);
                nlapiLogExecution("ERROR", "paymentidInt", paymentidInt);
                var apply = transactionRecord.getLineItemValue('payment', 'deposit', j);
                if (apply == 'T') {
                    var filters1 = [new nlobjSearchFilter('custbody_4601_pymnt_ref_id', null, 'anyof', paymentidInt)];
                    var creditmemoSearch = nlapiSearchRecord('creditmemo', "customsearch_credit_memo_for_suitegl_sea", filters1); //~Credit Memo for SuiteGL search - DEVELOPER
                    if (creditmemoSearch) {
                        for (var i = 0; i < creditmemoSearch.length; i++) {
                            creditmemoid = creditmemoSearch[i].getValue("internalid", null, "GROUP")
                        }
                        var filters = [new nlobjSearchFilter('internalid', null, 'anyof', creditmemoid)];
                        var searchResults = nlapiSearchRecord('creditmemo', "customsearch_credit_memo_for_suitegl_s_2", filters); //~Credit Memo GL Impact for SuiteGL search - DEVELOPER
                        if (searchResults) {
                            for (var i = 0; i < searchResults.length; i++) {
                                var tranid = searchResults[i].getValue("tranid");
                                var cuenta = searchResults[i].getValue("account");
                                var amount = 0;
                                if (searchResults[i].getValue("debitfxamount").length > 0) {
                                    amount = searchResults[i].getValue("debitfxamount")
                                }

                                if (searchResults[i].getValue("creditfxamount").length > 0) {
                                    amount = searchResults[i].getValue("creditfxamount")
                                }
                                json.push({ tranid: tranid, account: cuenta, amount: amount });
                            }
                            jsonAccounts.push(json);
                        }
                    }
                    var customerpaymentSearch = nlapiSearchRecord("transaction", null,
                        [
                            ["type", "anyof", "CustDep", "CustPymt"],
                            "AND",
                            ["mainline", "is", "T"],
                            "AND",
                            ["internalid", "anyof", paymentidInt]
                        ],
                        [
                            new nlobjSearchColumn("paymentoption")
                        ]
                    );
                    if (customerpaymentSearch == null) return;
                    var paymentoption = customerpaymentSearch[0].getValue('paymentoption');
                    nlapiLogExecution("ERROR", "tarjeta", paymentoption);
                    var customrecord_ht_cuentas_nrocuotasSearch = nlapiSearchRecord("customrecord_ht_cuentas_nrocuotas", null,
                        [
                            ["custrecord_ht_cc_paymentmethod", "anyof", paymentoption]
                        ],
                        [
                            new nlobjSearchColumn("custrecord_ht_cc_cuenta")
                        ]
                    );
                    if (customrecord_ht_cuentas_nrocuotasSearch == null) return;
                    var cuenta = customrecord_ht_cuentas_nrocuotasSearch[0].getValue('custrecord_ht_cc_cuenta');
                    nlapiLogExecution("ERROR", "cuenta", cuenta);
                }
            }

            var countStandard = parseInt(standardLines.getCount());
            for (var i = 0; i < countStandard; i++) {
                //nlapiLogExecution("ERROR", "GL", standardLines.getLine(i).getAccountId());
                if (standardLines.getLine(i).getAccountId() == accountCajaTransito) {
                    // nlapiLogExecution("ERROR", "GLENTRY", standardLines.getLine(i).getAccountId());
                    // nlapiLogExecution("ERROR", "GLENTRYACCOUNT", typeof cuenta);

                    var newLine = customLines.addNewLine();
                    newLine.setCreditAmount(standardLines.getLine(i).getCreditAmount());
                    newLine.setAccountId(Number(cuenta));
                    newLine.setEntityId(standardLines.getLine(1).getEntityId());
                    newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
                    newLine.setClassId(standardLines.getLine(0).getClassId());
                    newLine.setLocationId(standardLines.getLine(0).getLocationId());
                    newLine.setMemo(standardLines.getLine(0).getMemo());

                    var newLine = customLines.addNewLine();
                    newLine.setDebitAmount(standardLines.getLine(i).getCreditAmount());
                    newLine.setAccountId(accountCajaTransito);
                    newLine.setEntityId(standardLines.getLine(1).getEntityId());
                    newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
                    newLine.setClassId(standardLines.getLine(0).getClassId());
                    newLine.setLocationId(standardLines.getLine(0).getLocationId());
                    newLine.setMemo(standardLines.getLine(0).getMemo());
                }
            }
        } catch (error) {
            nlapiLogExecution('ERROR', recordType, error);
        }
    }

    if (recordType == 'creditmemo') {
        nlapiLogExecution("ERROR", recordType, 'Init');
        var memo = transactionRecord.getFieldValue('memo');
        var i = 0;
        try {
            var createdFrom = transactionRecord.getFieldValue('createdfrom');
            nlapiLogExecution("ERROR", "CREATEDFROM", createdFrom);
            if (!createdFrom) return;
            var fields = ['recordtype', 'createdfrom', 'statusref', 'tranid'];
            var transactionFields = nlapiLookupField('transaction', createdFrom, fields);
            nlapiLogExecution("ERROR", "transactionFields", JSON.stringify(transactionFields));
            if (transactionFields.recordtype == "invoice" && transactionFields.createdfrom) {
                var createdFrom = transactionFields.createdfrom;
                var salesOrderRecord = nlapiLookupField('transaction', createdFrom, fields);
                nlapiLogExecution("ERROR", "salesOrderRecord 2", JSON.stringify(salesOrderRecord));
                if (salesOrderRecord.recordtype == "salesorder" && salesOrderRecord.statusref == "partiallyFulfilled") {
                    var costProvisionAccount = "", amount = 0, location;
                    var detalleProvision = obtenerProvisionDeLinea(createdFrom);
                    nlapiLogExecution("ERROR", "CREATEDFROM", JSON.stringify(detalleProvision));
                    if (detalleProvision == null) return;
                    var tranid = salesOrderRecord.tranid;
                    var factura = transactionFields.tranid;
                    var item = transactionRecord.getLineItemValue('item', 'item', 1);
                    var itemtxt = transactionRecord.getLineItemText('item', 'item', 1);
                    var glosa = tranid + '-' + itemtxt;
                    try {
                        var ordenTrabajo = getOrdenTrabajo(createdFrom, item)
                        glosa = tranid + '-' + ordenTrabajo + '-' + factura + '-' + itemtxt;
                    } catch (error) {
                        nlapiLogExecution('ERROR', 'Glosa', error);
                    }
                    var entityId = standardLines.getLine(0).getEntityId();
                    var deparmentId = standardLines.getLine(0).getDepartmentId();
                    var classId = standardLines.getLine(0).getClassId();
                    var locationId = detalleProvision.location;
                    agregarCustomLines(customLines, detalleProvision.provisionAmount, 0, detalleProvision.provisionAccount, entityId, deparmentId, classId, locationId, glosa);
                    agregarCustomLines(customLines, 0, detalleProvision.provisionAmount, detalleProvision.costAccount, entityId, deparmentId, classId, locationId, glosa);
                }
            }
        } catch (error) {
            nlapiLogExecution('ERROR', recordType, error);
        }
    }
    //&===============================================================================================

    if (recordType == 'itemfulfillment') {
        nlapiLogExecution("ERROR", "Provisión", 'INICIO Item Fulfillment: ' + id + ' ------------------------------------------------------------------------------------------------');
        try {
            var createdFrom = transactionRecord.getFieldValue('createdfrom');
            var ubicacion = Number(transactionRecord.getLineItemValue('item', 'location', 1));
            nlapiLogExecution("ERROR", "CREATEDFROM", createdFrom);
            var fields = ['recordtype', 'statusref']
            var transactionFields = nlapiLookupField('transaction', createdFrom, fields);
            if (transactionFields.recordtype == "salesorder") {
                var salesOrderRecord = nlapiLoadRecord('salesorder', createdFrom);
                var subsidiary = salesOrderRecord.getFieldValue('subsidiary');
                var tranid = salesOrderRecord.getFieldValue('tranid');
                var item = transactionRecord.getLineItemValue('item', 'item', 1);
                var itemtxt = transactionRecord.getLineItemText('item', 'item', 1);
                var glosa = tranid + '-' + itemtxt;
                try {
                    var ordenTrabajo = getOrdenTrabajo(createdFrom, item)
                    var factura = getFactura(createdFrom, item)
                    glosa = tranid + '-' + ordenTrabajo + '-' + factura + '-' + itemtxt;
                } catch (error) {
                    nlapiLogExecution('ERROR', 'Glosa', error);
                }
                var itemCount = salesOrderRecord.getLineItemCount('item');
                var costProvisionAccount = "", costAccount = "", amount = 0, location;
                for (var i = 1; i <= itemCount; i++) {
                    var itemtype = salesOrderRecord.getLineItemValue('item', 'itemtype', i);
                    nlapiLogExecution("ERROR", "itemtype " + i, itemtype);
                    if (itemtype == 'Assembly' || itemtype == 'InvtPart') {
                        costProvisionAccount = Number(salesOrderRecord.getLineItemValue('item', 'custcol_ht_so_cost_account_provision', i));
                        costAccount = Number(salesOrderRecord.getLineItemValue('item', 'custcol_ht_so_cost_account', i));
                        nlapiLogExecution("ERROR", "costAccount " + i, costAccount);
                        var esAsientoProvision = salesOrderRecord.getLineItemValue('item', 'custcol_ht_os_asientoprovision', i);
                        location = Number(salesOrderRecord.getLineItemValue('item', 'location', i));
                        nlapiLogExecution("ERROR", "costProvisionAccount " + i, costProvisionAccount);
                        if (!(esAsientoProvision && esAsientoProvision == "T")) continue;
                        if (!(costProvisionAccount && costAccount)) continue;
                        var itemId = Number(salesOrderRecord.getLineItemValue('item', 'item', i));
                        var itemFields = nlapiLookupField('item', itemId, ["recordtype"]);
                        if (itemFields.recordtype != "serializedassemblyitem") continue;
                        amount = obtenerCostoProvisionDeFactura(salesOrderRecord);
                        if (amount == 0) {
                            var facturaid = obtenerFacturaAgrupada(createdFrom);
                            amount = obtenerBusquedaCostoProvision(facturaid);
                        }
                        break;
                    }

                }
                nlapiLogExecution("ERROR", "amount", amount);
                //if (amount == 0) return;

                if (amount != 0) {
                    var newLine = customLines.addNewLine();
                    newLine.setDebitAmount(amount);
                    newLine.setAccountId(costProvisionAccount);
                    newLine.setEntityId(standardLines.getLine(0).getEntityId());
                    newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
                    newLine.setClassId(standardLines.getLine(0).getClassId());
                    newLine.setLocationId(location);
                    newLine.setMemo(glosa);

                    var newLine = customLines.addNewLine();
                    newLine.setCreditAmount(amount);
                    newLine.setAccountId(costAccount);
                    newLine.setEntityId(standardLines.getLine(0).getEntityId());
                    newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
                    newLine.setClassId(standardLines.getLine(0).getClassId());
                    newLine.setLocationId(location);
                    newLine.setMemo(glosa);
                }

                if (ubicacion != location) {
                    //* ASIENTO CON CUENTA MUTUA
                    var cuentaMutua = getCuentaMutua(subsidiary)
                    nlapiLogExecution("ERROR", "cuentaMutua", cuentaMutua);
                    //nlapiLogExecution("ERROR", "importe", Number(standardLines.getLine(1).getDebitAmount()) + ' - ' + Number(standardLines.getLine(1).getCreditAmount()));
                    var importe = Number(standardLines.getLine(1).getDebitAmount()) > 0 ? Number(standardLines.getLine(1).getDebitAmount()) : Number(standardLines.getLine(1).getCreditAmount())
                    //nlapiLogExecution("ERROR", "importe", importe);

                    var newLine = customLines.addNewLine();
                    newLine.setDebitAmount(importe);
                    newLine.setAccountId(cuentaMutua);
                    newLine.setEntityId(standardLines.getLine(0).getEntityId());
                    newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
                    newLine.setClassId(standardLines.getLine(0).getClassId());
                    newLine.setLocationId(location);
                    newLine.setMemo(glosa);

                    var newLine = customLines.addNewLine();
                    newLine.setCreditAmount(importe);
                    newLine.setAccountId(costAccount);
                    newLine.setEntityId(standardLines.getLine(0).getEntityId());
                    newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
                    newLine.setClassId(standardLines.getLine(0).getClassId());
                    newLine.setLocationId(ubicacion);
                    newLine.setMemo(glosa);
                }
            }
        } catch (error) {
            nlapiLogExecution('ERROR', 'ItemFulfillment', error);
        }
        nlapiLogExecution("DEBUG", "Consignación", 'FIN Item Fulfillment: ' + id + ' ----------------------------------------------------------------------------------------------------');
    }

    if (recordType == 'invoice') {
        nlapiLogExecution("ERROR", "Provisión TEST 1", 'INICIO Invoice: ' + id + ' ------------------------------------------------------------------------------------------------');
        try {
            var arrOrdenServicio = [];
            var createdFrom = transactionRecord.getFieldValue('createdfrom');
            var procesoAgrupacion = transactionRecord.getFieldValue('custbody_ht_status_process_group'); // 1: Completado
            nlapiLogExecution("ERROR", "procesoAgrupacion", procesoAgrupacion);
            nlapiLogExecution("ERROR", "CREATEDFROM", createdFrom);
            if (procesoAgrupacion == '1') {
                arrOrdenServicio = getFacturaInternas(id);
            }

            if (!createdFrom && procesoAgrupacion == '1') { // AGREGADO POR EDWIN
                for (var x = 0; x < arrOrdenServicio.length; x++) {
                    var fields = ['recordtype', 'statusref'];
                    var transactionFields = nlapiLookupField('transaction', arrOrdenServicio[x], fields);
                    if (transactionFields.recordtype == "salesorder") {
                        nlapiLogExecution("ERROR", "Status==============", transactionFields.statusref);
                    }
                    if (transactionFields.statusref == "pendingFulfillment" || transactionFields.statusref == "partiallyFulfilled" || transactionFields.statusref == "pendingBillingPartFulfilled") {
                        var salesOrderRecord = nlapiLoadRecord('salesorder', arrOrdenServicio[x]);
                        var tranid = salesOrderRecord.getFieldValue('tranid');
                        var item = transactionRecord.getLineItemValue('item', 'item', 1);
                        var customer = transactionRecord.getLineItemText('item', 'item', 1);
                        var glosa = tranid + '-' + customer;
                        try {
                            var ordenTrabajo = getOrdenTrabajo(arrOrdenServicio[x], item)
                            var factura = getFactura(arrOrdenServicio[x], item)
                            glosa = tranid + '-' + ordenTrabajo + '-' + factura + '-' + customer;
                        } catch (error) {
                            nlapiLogExecution('ERROR', 'Glosa', error);
                        }
                        var itemCount = salesOrderRecord.getLineItemCount('item');
                        var costProvisionAccount = "", costAccount = "", amount = 0, location = "";
                        for (var i = 1; i <= itemCount; i++) {
                            costProvisionAccount = Number(salesOrderRecord.getLineItemValue('item', 'custcol_ht_so_cost_account_provision', i));
                            costAccount = Number(salesOrderRecord.getLineItemValue('item', 'custcol_ht_so_cost_account', i));
                            nlapiLogExecution("ERROR", "costProvisionAccount " + i, costProvisionAccount + "|" + costAccount);
                            if (!(costProvisionAccount && costAccount)) continue;
                            var itemId = Number(salesOrderRecord.getLineItemValue('item', 'item', i));
                            var description = salesOrderRecord.getLineItemValue('item', 'description', i);
                            var itemFields = nlapiLookupField('item', itemId, ["recordtype"]);
                            if (itemFields.recordtype != "serializedassemblyitem") continue;
                            if (validarGLCosteoFactura(itemId)) continue;
                            var quantity = Number(salesOrderRecord.getLineItemValue('item', 'quantity', i));
                            nlapiLogExecution("ERROR", "quantity", quantity);
                            // var averageCost = Number(salesOrderRecord.getLineItemValue('item', 'averagecost', i));
                            location = Number(salesOrderRecord.getLineItemValue('item', 'location', i));
                            //nlapiLogExecution("ERROR", "location", location);
                            var averageCost = obtenerCostoPromedio(itemId, location);
                            //nlapiLogExecution("ERROR", "averageCost", averageCost);
                            amount = quantity * averageCost;
                            salesOrderRecord.setLineItemValue('item', 'custcol_ht_os_asientoprovision', i, "T");
                            salesOrderRecord.setLineItemValue('item', 'custcol_ht_so_cost_import', i, amount);
                            nlapiLogExecution("ERROR", "amount ", amount);
                            if (amount == 0) continue;
                            var entity = standardLines.getLine(0).getEntityId();
                            var department = standardLines.getLine(0).getDepartmentId();
                            var _class = standardLines.getLine(0).getClassId();
                            var newLine = customLines.addNewLine();
                            newLine.setDebitAmount(amount);
                            newLine.setAccountId(costAccount);
                            newLine.setMemo(glosa);
                            if (entity) newLine.setEntityId(standardLines.getLine(0).getEntityId());
                            if (department) newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
                            if (_class) newLine.setClassId(standardLines.getLine(0).getClassId());
                            newLine.setLocationId(location);
                            nlapiLogExecution("ERROR", "FIRST LINE");

                            var newLine = customLines.addNewLine();
                            newLine.setCreditAmount(amount);
                            newLine.setAccountId(costProvisionAccount);
                            newLine.setMemo(glosa);
                            if (entity) newLine.setEntityId(standardLines.getLine(0).getEntityId());
                            if (department) newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
                            if (_class) newLine.setClassId(standardLines.getLine(0).getClassId());
                            newLine.setLocationId(location);
                            nlapiLogExecution("ERROR", "SECOND LINE");
                            //break;
                        }

                        nlapiSubmitRecord(salesOrderRecord, false, true);
                        nlapiLogExecution("ERROR", "END ");
                    } else if (transactionFields.statusref == "pendingBilling" || transactionFields.statusref == "fullyBilled") {
                        nlapiLogExecution("ERROR", "customrecord_ht_dp_detalle_provision", "Agrupada");
                        var salesOrderRecord = nlapiLoadRecord('salesorder', arrOrdenServicio[x]);
                        var tranid = salesOrderRecord.getFieldValue('tranid');
                        var item = transactionRecord.getLineItemValue('item', 'item', 1);
                        var customer = transactionRecord.getLineItemText('item', 'item', 1);
                        var glosa = tranid + '-' + customer;
                        try {
                            var ordenTrabajo = getOrdenTrabajo(arrOrdenServicio[x], item)
                            var factura = getFactura(arrOrdenServicio[x], item)
                            glosa = tranid + '-' + ordenTrabajo + '-' + factura + '-' + customer;
                        } catch (error) {
                            nlapiLogExecution('ERROR', 'Glosa', error);
                        }
                        var detalleProvision = nlapiSearchRecord("customrecord_ht_dp_detalle_provision", null,
                            [["custrecord_ht_dp_transaccion_prov", "anyof", arrOrdenServicio[x]]],
                            [
                                new nlobjSearchColumn("custrecord_ht_dp_aplicado"),
                                new nlobjSearchColumn("custrecord_ht_dp_item"),
                                new nlobjSearchColumn("custrecord_ht_dp_provision"),
                                new nlobjSearchColumn("custrecord_ht_dp_tipo_provision")
                            ]
                        );

                        if (detalleProvision == null) continue;
                        if (detalleProvision[0].getValue('custrecord_ht_dp_aplicado') == 'T') continue;
                        if (!detalleProvision[0].getValue('custrecord_ht_dp_item')) continue;
                        if (detalleProvision[0].getValue('custrecord_ht_dp_tipo_provision') != TIPO_PENDIENTE_FACTURAR) continue;

                        var itemSearchResult = nlapiSearchRecord("item", null,
                            [["internalid", "anyof", detalleProvision[0].getValue('custrecord_ht_dp_item')]],
                            [
                                new nlobjSearchColumn("incomeaccount"),
                                new nlobjSearchColumn("custitem_cuenta_provision_ingreso")
                            ]
                        );

                        if (itemSearchResult == null) return;
                        var incomeAccount = itemSearchResult[0].getValue('incomeaccount');
                        var provisionAccount = itemSearchResult[0].getValue('custitem_cuenta_provision_ingreso');
                        var amount = detalleProvision[0].getValue('custrecord_ht_dp_provision');

                        nlapiLogExecution("ERROR", "incomeAccount", incomeAccount);
                        var newLine = customLines.addNewLine();
                        newLine.setDebitAmount(amount);
                        newLine.setAccountId(Number(incomeAccount));
                        newLine.setEntityId(standardLines.getLine(0).getEntityId());
                        newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
                        newLine.setClassId(standardLines.getLine(0).getClassId());
                        newLine.setLocationId(standardLines.getLine(0).getLocationId());
                        newLine.setMemo(glosa);

                        nlapiLogExecution("ERROR", "provisionAccount", provisionAccount);
                        var newLine = customLines.addNewLine();
                        newLine.setCreditAmount(amount);
                        newLine.setAccountId(Number(provisionAccount));
                        newLine.setEntityId(standardLines.getLine(0).getEntityId());
                        newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
                        newLine.setClassId(standardLines.getLine(0).getClassId());
                        newLine.setLocationId(standardLines.getLine(0).getLocationId());
                        newLine.setMemo(glosa);
                        nlapiLogExecution("ERROR", "Proccess", "final");
                        nlapiSubmitField('customrecord_ht_dp_detalle_provision', detalleProvision[0].getId(), 'custrecord_ht_dp_aplicado', 'T')
                    }
                }
            }

            if (!createdFrom) return;
            var fields = ['recordtype', 'statusref'];
            var transactionFields = nlapiLookupField('transaction', createdFrom, fields);
            if (transactionFields.recordtype == "salesorder") {
                nlapiLogExecution("ERROR", "Status==============", transactionFields.statusref);
                if (transactionFields.statusref == "pendingFulfillment" || transactionFields.statusref == "partiallyFulfilled" || transactionFields.statusref == "pendingBillingPartFulfilled") {
                    var salesOrderRecord = nlapiLoadRecord('salesorder', createdFrom);
                    var tranid = salesOrderRecord.getFieldValue('tranid');
                    var item = transactionRecord.getLineItemValue('item', 'item', 1);
                    var customer = transactionRecord.getLineItemText('item', 'item', 1);
                    var glosa = tranid + '-' + customer;
                    try {
                        var ordenTrabajo = getOrdenTrabajo(createdFrom, item)
                        var factura = getFactura(createdFrom, item)
                        glosa = tranid + '-' + ordenTrabajo + '-' + factura + '-' + customer;
                    } catch (error) {
                        nlapiLogExecution('ERROR', 'Glosa', error);
                    }
                    var itemCount = salesOrderRecord.getLineItemCount('item');
                    var costProvisionAccount = "", costAccount = "", amount = 0, location = "";
                    for (var i = 1; i <= itemCount; i++) {
                        costProvisionAccount = Number(salesOrderRecord.getLineItemValue('item', 'custcol_ht_so_cost_account_provision', i));
                        costAccount = Number(salesOrderRecord.getLineItemValue('item', 'custcol_ht_so_cost_account', i));
                        nlapiLogExecution("ERROR", "costProvisionAccount " + i, costProvisionAccount + "|" + costAccount);
                        if (!(costProvisionAccount && costAccount)) continue;
                        var itemId = Number(salesOrderRecord.getLineItemValue('item', 'item', i));
                        var description = salesOrderRecord.getLineItemValue('item', 'description', i);
                        var itemFields = nlapiLookupField('item', itemId, ["recordtype"]);
                        if (itemFields.recordtype != "serializedassemblyitem") continue;
                        if (validarGLCosteoFactura(itemId)) continue;
                        var quantity = Number(salesOrderRecord.getLineItemValue('item', 'quantity', i));
                        // var averageCost = Number(salesOrderRecord.getLineItemValue('item', 'averagecost', i));
                        location = Number(salesOrderRecord.getLineItemValue('item', 'location', i));
                        var averageCost = obtenerCostoPromedio(itemId, location);
                        nlapiLogExecution("ERROR", "quantity", quantity);
                        amount = quantity * averageCost;
                        salesOrderRecord.setLineItemValue('item', 'custcol_ht_os_asientoprovision', i, "T");
                        salesOrderRecord.setLineItemValue('item', 'custcol_ht_so_cost_import', i, amount);
                        nlapiLogExecution("ERROR", "amount ", amount);
                        if (amount == 0) continue;
                        var itemfulfillmentSearch = nlapiSearchRecord("itemfulfillment", null,
                            [
                                ["type", "anyof", "ItemShip"],
                                "AND",
                                ["mainline", "is", "T"],
                                "AND",
                                ["taxline", "is", "F"],
                                "AND",
                                ["createdfrom", "anyof", createdFrom],
                                "AND",
                                ["item", "anyof", itemId]
                            ],
                            [
                                new nlobjSearchColumn("tranid"),
                                new nlobjSearchColumn("createdfrom")
                            ]
                        );
                        nlapiLogExecution("ERROR", "itemfulfillmentSearch " + i, 'Tiene FF ' + itemfulfillmentSearch);
                        if (itemfulfillmentSearch != null) continue;
                        var entity = standardLines.getLine(0).getEntityId();
                        var department = standardLines.getLine(0).getDepartmentId();
                        var _class = standardLines.getLine(0).getClassId();
                        var newLine = customLines.addNewLine();
                        newLine.setDebitAmount(amount);
                        newLine.setAccountId(costAccount);
                        newLine.setMemo(glosa);
                        if (entity) newLine.setEntityId(standardLines.getLine(0).getEntityId());
                        if (department) newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
                        if (_class) newLine.setClassId(standardLines.getLine(0).getClassId());
                        newLine.setLocationId(location);
                        nlapiLogExecution("ERROR", "FIRST LINE");
                        var newLine = customLines.addNewLine();
                        newLine.setCreditAmount(amount);
                        newLine.setAccountId(costProvisionAccount);
                        newLine.setMemo(glosa);
                        if (entity) newLine.setEntityId(standardLines.getLine(0).getEntityId());
                        if (department) newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
                        if (_class) newLine.setClassId(standardLines.getLine(0).getClassId());
                        newLine.setLocationId(location);
                        nlapiSubmitRecord(salesOrderRecord, false, true);
                        nlapiLogExecution("ERROR", "END ");
                        //break;
                    }
                    // nlapiLogExecution("ERROR", "amount ", amount);
                    // if (amount == 0) return;
                    // var entity = standardLines.getLine(0).getEntityId();
                    // var department = standardLines.getLine(0).getDepartmentId();
                    // var _class = standardLines.getLine(0).getClassId();
                    // var newLine = customLines.addNewLine();
                    // newLine.setDebitAmount(amount);
                    // newLine.setAccountId(costAccount);
                    // newLine.setMemo(description);
                    // if (entity) newLine.setEntityId(standardLines.getLine(0).getEntityId());
                    // if (department) newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
                    // if (_class) newLine.setClassId(standardLines.getLine(0).getClassId());
                    // newLine.setLocationId(location);
                    // nlapiLogExecution("ERROR", "FIRST LINE");

                    // var newLine = customLines.addNewLine();
                    // newLine.setCreditAmount(amount);
                    // newLine.setAccountId(costProvisionAccount);
                    // newLine.setMemo(description);
                    // if (entity) newLine.setEntityId(standardLines.getLine(0).getEntityId());
                    // if (department) newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
                    // if (_class) newLine.setClassId(standardLines.getLine(0).getClassId());
                    // newLine.setLocationId(location);
                    // nlapiSubmitRecord(salesOrderRecord, false, true);
                    // nlapiLogExecution("ERROR", "END ");
                } else if (transactionFields.statusref == "pendingBilling" || transactionFields.statusref == "fullyBilled") {
                    nlapiLogExecution("ERROR", "customrecord_ht_dp_detalle_provision", "");
                    var salesOrderRecord = nlapiLoadRecord('salesorder', createdFrom);
                    var tranid = salesOrderRecord.getFieldValue('tranid');
                    var item = transactionRecord.getLineItemValue('item', 'item', 1);
                    var customer = transactionRecord.getLineItemText('item', 'item', 1);
                    var glosa = tranid + '-' + customer;
                    try {
                        var ordenTrabajo = getOrdenTrabajo(createdFrom, item)
                        var factura = getFactura(createdFrom, item)
                        glosa = tranid + '-' + ordenTrabajo + '-' + factura + '-' + customer;
                    } catch (error) {
                        nlapiLogExecution('ERROR', 'Glosa', error);
                    }
                    var detalleProvision = nlapiSearchRecord("customrecord_ht_dp_detalle_provision", null,
                        [["custrecord_ht_dp_transaccion_prov", "anyof", createdFrom]],
                        [
                            new nlobjSearchColumn("custrecord_ht_dp_aplicado"),
                            new nlobjSearchColumn("custrecord_ht_dp_item"),
                            new nlobjSearchColumn("custrecord_ht_dp_provision")
                        ]
                    );

                    if (detalleProvision == null) return;
                    if (detalleProvision[0].getValue('custrecord_ht_dp_aplicado') == 'T') return;
                    if (!detalleProvision[0].getValue('custrecord_ht_dp_item')) return;

                    var itemSearchResult = nlapiSearchRecord("item", null,
                        [["internalid", "anyof", detalleProvision[0].getValue('custrecord_ht_dp_item')]],
                        [
                            new nlobjSearchColumn("expenseaccount"),
                            new nlobjSearchColumn("custitem_cuenta_provsion_costos")
                        ]
                    );

                    if (itemSearchResult == null) return;
                    var expenseAccount = itemSearchResult[0].getValue('expenseaccount');
                    var provisionAccount = itemSearchResult[0].getValue('custitem_cuenta_provsion_costos');
                    var amount = detalleProvision[0].getValue('custrecord_ht_dp_provision');

                    nlapiLogExecution("ERROR", "expenseAccount", expenseAccount);
                    var newLine = customLines.addNewLine();
                    newLine.setDebitAmount(amount);
                    newLine.setAccountId(Number(expenseAccount));
                    newLine.setEntityId(standardLines.getLine(0).getEntityId());
                    newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
                    newLine.setClassId(standardLines.getLine(0).getClassId());
                    newLine.setLocationId(standardLines.getLine(0).getLocationId());
                    newLine.setMemo(glosa);

                    nlapiLogExecution("ERROR", "provisionAccount", provisionAccount);
                    var newLine = customLines.addNewLine();
                    newLine.setCreditAmount(amount);
                    newLine.setAccountId(Number(provisionAccount));
                    newLine.setEntityId(standardLines.getLine(0).getEntityId());
                    newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
                    newLine.setClassId(standardLines.getLine(0).getClassId());
                    newLine.setLocationId(standardLines.getLine(0).getLocationId());
                    newLine.setMemo(glosa);
                    nlapiLogExecution("ERROR", "Proccess", "final");
                    nlapiSubmitField('customrecord_ht_dp_detalle_provision', detalleProvision[0].getId(), 'custrecord_ht_dp_aplicado', 'T')
                }
            }
        } catch (error) {
            nlapiLogExecution('ERROR', 'Invoice', error);
        }
        nlapiLogExecution("ERROR", "Consignación", 'FIN Invoice: ' + id + ' ----------------------------------------------------------------------------------------------------');
    }

    if (recordType == 'itemreceipt') {
        var glosa = 0;
        var createdfrom = transactionRecord.getFieldValue('createdfrom');
        nlapiLogExecution("ERROR", "CREATEDFROM", createdfrom);

        var fields = ['recordtype', 'createdfrom'];
        var returnTransactionFields = nlapiLookupField('transaction', createdfrom, fields);
        nlapiLogExecution("ERROR", "returnTransactionFields", returnTransactionFields);
        nlapiLogExecution("ERROR", "returnTransactionFields", returnTransactionFields.createdfrom);

        if (returnTransactionFields.recordtype == "returnauthorization" && returnTransactionFields.createdfrom) {
            nlapiLogExecution("ERROR", "entro a returnauth", salesTransactionFields);

            var salesTransactionFields = nlapiLookupField('transaction', returnTransactionFields.createdfrom, fields);
            nlapiLogExecution("ERROR", "returnauthorization", salesTransactionFields);
            nlapiLogExecution("ERROR", "returnauthorization", salesTransactionFields.createdfrom);
            if (salesTransactionFields.recordtype == "salesorder") {
                nlapiLogExecution("ERROR", "salesorder", "salesorder");
                nlapiLogExecution("ERROR", "salesorder", "salesorder");
                var detalleProvision = buscarDetalleProvision(returnTransactionFields.createdfrom);
                if (detalleProvision == null) return;

                var entityId = standardLines.getLine(0).getEntityId();
                var deparmentId = standardLines.getLine(0).getDepartmentId();
                var classId = standardLines.getLine(0).getClassId();
                var locationId = standardLines.getLine(0).getLocationId();
                agregarCustomLines(customLines, detalleProvision.provisionAmount, 0, detalleProvision.incomeAccount, entityId, deparmentId, classId, locationId, glosa);
                agregarCustomLines(customLines, 0, detalleProvision.provisionAmount, detalleProvision.provisionAccount, entityId, deparmentId, classId, locationId, glosa);
            }
        }
    }

    if (recordType == 'customerpayment' || recordType == 'customerdeposit') {
        var fondoSinDepositar = transactionRecord.getFieldValue('undepfunds');
        // var cuentaAR = Number(transactionRecord.getFieldValue('aracct'));
        var cuentaAR = Number(transactionRecord.getFieldValue('account'));
        var pago = Number(transactionRecord.getFieldValue('payment'));
        var location_id = Number(transactionRecord.getFieldValue('location'));
        var paymentoption = transactionRecord.getFieldValue('paymentoption');
        var memo = transactionRecord.getFieldValue('memo'); //Add JChaveza 25.06.2024

        nlapiLogExecution("ERROR", "fondoSinDepositar", fondoSinDepositar);
        nlapiLogExecution("ERROR", "cuentaAR", cuentaAR);
        nlapiLogExecution("ERROR", "pago", pago);
        nlapiLogExecution("ERROR", "location_id", location_id);
        nlapiLogExecution("ERROR", "paymentoption", paymentoption);
        nlapiLogExecution("ERROR", "memo", memo);

        //if (fondoSinDepositar == true || fondoSinDepositar == 'T') {
        if (cuentaAR == accountCajaTransito) {
            var customrecord_ht_cuentas_nrocuotasSearch = nlapiSearchRecord("customrecord_ht_cuentas_nrocuotas", null,
                [
                    ["custrecord_ht_cc_paymentmethod", "anyof", paymentoption]
                ],
                [
                    new nlobjSearchColumn("custrecord_ht_cc_cuenta")
                ]
            );

            if (customrecord_ht_cuentas_nrocuotasSearch == null) return;
            var cuenta = customrecord_ht_cuentas_nrocuotasSearch[0].getValue('custrecord_ht_cc_cuenta');
            nlapiLogExecution("ERROR", "cuenta", cuenta);
            var entity = standardLines.getLine(0).getEntityId();
            var department = standardLines.getLine(0).getDepartmentId();
            var _class = standardLines.getLine(0).getClassId();
            nlapiLogExecution("ERROR", "entity", entity);
            nlapiLogExecution("ERROR", "department", department);
            nlapiLogExecution("ERROR", "_class", _class);

            var newLine = customLines.addNewLine();
            newLine.setDebitAmount(pago);
            newLine.setAccountId(Number(cuenta));
            if (entity) newLine.setEntityId(standardLines.getLine(0).getEntityId());
            if (department) newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
            if (_class) newLine.setClassId(standardLines.getLine(0).getClassId());
            newLine.setLocationId(location_id);
            newLine.setMemo(memo);//Add JChaveza 25.06.2024
            nlapiLogExecution("ERROR", "newLine", newLine);

            var newLine = customLines.addNewLine();
            newLine.setCreditAmount(pago);
            newLine.setAccountId(accountCajaTransito);
            if (entity) newLine.setEntityId(standardLines.getLine(0).getEntityId());
            if (department) newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
            if (_class) newLine.setClassId(standardLines.getLine(0).getClassId());
            newLine.setLocationId(location_id);
            newLine.setMemo(memo);//Add JChaveza 25.06.2024
            nlapiLogExecution("ERROR", "final", "final");


            //!PRUEBA SUITEGL, LUEGO ELIMINAR O COMENTAR =============================================================================
            // var newLine = customLines.addNewLine();
            // newLine.setDebitAmount(pago);
            // newLine.setAccountId(1837);
            // if (entity) newLine.setEntityId(standardLines.getLine(0).getEntityId());
            // if (department) newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
            // if (_class) newLine.setClassId(standardLines.getLine(0).getClassId());
            // newLine.setLocationId(location_id);
            // newLine.setMemo(memo);//Add JChaveza 25.06.2024
            // nlapiLogExecution("ERROR", "newLine", newLine);

            // var newLine = customLines.addNewLine();
            // newLine.setCreditAmount(pago);
            // newLine.setAccountId(1671);
            // if (entity) newLine.setEntityId(standardLines.getLine(0).getEntityId());
            // if (department) newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
            // if (_class) newLine.setClassId(standardLines.getLine(0).getClassId());
            // newLine.setLocationId(location_id);
            // newLine.setMemo(memo);//Add JChaveza 25.06.2024
            // nlapiLogExecution("ERROR", "final", "final");
            //! ============================================================================================================
        }
    }

    if (recordType == 'expensereport') {
        //aplicarImpuestoRetencion(transactionRecord, customLines);
    }

    if (recordType == 'inventoryadjustment') {
        var objItemsALquiler = new Array();
        var esSalidaReinAlquiler = transactionRecord.getFieldValue('custbody_ht_ai_porsalida_ra');
        var adjustmentAccount = Number(transactionRecord.getFieldValue('account'));
        nlapiLogExecution("ERROR", "adjustmentAccount", adjustmentAccount);
        try {
            if (esSalidaReinAlquiler == true || esSalidaReinAlquiler == 'T') {
                var countTransaction = transactionRecord.getLineItemCount('inventory');
                for (var j = 1; j <= countTransaction; j++) {
                    if (transactionRecord.getLineItemValue('inventory', 'custcol_ec_alq_af', j) == true || transactionRecord.getLineItemValue('inventory', 'custcol_ec_alq_af', j) == 'T') {
                        objItemsALquiler.push(transactionRecord.getLineItemValue('inventory', 'unitcost', j))
                    }
                }
                //nlapiLogExecution("ERROR", "objItemsALquiler", objItemsALquiler);
                var subsidiary = transactionRecord.getFieldValue('subsidiary');
                var location_id = Number(transactionRecord.getFieldValue('adjlocation'));
                var entity = standardLines.getLine(0).getEntityId();
                var department = standardLines.getLine(0).getDepartmentId();
                var _class = standardLines.getLine(0).getClassId();

                var countStandard = objItemsALquiler.length;
                for (var i = 0; i < countStandard; i++) {
                    var newLine = customLines.addNewLine();
                    newLine.setDebitAmount(Number(objItemsALquiler[i]));
                    newLine.setAccountId(Number(standardLines.getLine(i + 1).getAccountId()));
                    if (entity) newLine.setEntityId(standardLines.getLine(0).getEntityId());
                    if (department) newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
                    if (_class) newLine.setClassId(standardLines.getLine(0).getClassId());
                    newLine.setLocationId(location_id);
                    nlapiLogExecution("ERROR", "newLine", newLine);

                    var newLine = customLines.addNewLine();
                    newLine.setCreditAmount(Number(objItemsALquiler[i]));
                    newLine.setAccountId(adjustmentAccount);
                    if (entity) newLine.setEntityId(standardLines.getLine(0).getEntityId());
                    if (department) newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
                    if (_class) newLine.setClassId(standardLines.getLine(0).getClassId());
                    newLine.setLocationId(location_id);
                    nlapiLogExecution("ERROR", "final", "final");
                    // }
                }
            }
        } catch (error) {
            nlapiLogExecution('ERROR', 'inventoryadjustment', error);
        }

    }
}

function aplicarImpuestoRetencion(transactionRecord, customLines) {
    var countTransaction = transactionRecord.getLineItemCount('expense');
    var advanceaccount = transactionRecord.getFieldValue('advanceaccount');

    var newLine = customLines.addNewLine();
    newLine.setCreditAmount(4.06);
    newLine.setAccountId(3182);
    newLine.setLocationId(2);

    var newLine = customLines.addNewLine();
    newLine.setDebitAmount(4.06);
    newLine.setAccountId(767);
    // newLine.setMemo(creditMemo);
    newLine.setLocationId(2);

    nlapiLogExecution('ERROR', "countTransaction", countTransaction);
    nlapiLogExecution('ERROR', "advanceaccount", advanceaccount);

    /*for (var i = 1; i <= countTransaction; i++) {
        var applyWithholdingTax = transactionRecord.getLineItemValue('expense', 'custcol_4601_witaxapplies', i);
        var withholdingTax = transactionRecord.getLineItemValue('expense', 'custcol_4601_witaxcode_exp', i);
        if (applyWithholdingTax == "T" && withholdingTax) {

        }
        nlapiLogExecution('ERROR', "applyWithholdingTax " + i, applyWithholdingTax);

    }*/
}

function obtenerCostoProvisionDeFactura(salesOrderRecord) {
    var lines = salesOrderRecord.getLineItemCount('links');
    for (var i = 1; i <= lines; i++) {
        var id = salesOrderRecord.getLineItemValue('links', 'id', i)
        var recordType = nlapiLookupField('transaction', id, ["recordtype"]);
        if (recordType.recordtype != "invoice") continue;
        var amount = obtenerBusquedaCostoProvision(id);
        nlapiLogExecution('ERROR', "amount", amount);
        return amount;
    }
    return 0;
}

function obtenerBusquedaCostoProvision(id) {
    nlapiLogExecution('ERROR', "obtenerBusquedaCostoProvision");
    var invoiceSearch = nlapiSearchRecord("invoice", null,
        [
            ["type", "anyof", "CustInvc"],
            "AND",
            ["internalid", "anyof", id],
            "AND",
            ["customgl", "is", "T"]
        ],
        [
            new nlobjSearchColumn("formulacurrency").setFormula("NVL({debitamount},0) - NVL({creditamount},0)")
        ]
    );
    if (!invoiceSearch) return 0;
    return invoiceSearch[0].getValue("formulacurrency");
}

function obtenerFacturaAgrupada(soid) {
    var facturaAgrupada = nlapiSearchRecord("customrecord_ht_fact_internas_asociadas", null,
        [
            ["custrecord_orden_servicio", "anyof", soid]
        ],
        [
            new nlobjSearchColumn("custrecord_nro_factura"),
            new nlobjSearchColumn("custrecord_orden_servicio")
        ]
    );
    if (!facturaAgrupada) return 0;
    return facturaAgrupada[0].getValue("custrecord_nro_factura");
}

function obtenerFiltrosBusqueda(itemId, parametrizaciones) {
    var filtrosResultante = [], filtrosParametrizaciones = [];
    for (var i = 0; i < parametrizaciones.length; i++) {
        var parametrizacion = [
            ["custrecord_ht_pp_parametrizacion_rela", "anyof", parametrizaciones[i][0]],
            "AND",
            ["custrecord_ht_pp_parametrizacion_valor", "anyof", parametrizaciones[i][1]],
            "AND",
            ["custrecord_ht_pp_aplicacion", "is", "T"]
        ];
        filtrosParametrizaciones.push(parametrizacion);
        if (i != parametrizaciones.length - 1) filtrosParametrizaciones.push("OR");
    }
    filtrosResultante.push(filtrosParametrizaciones);
    filtrosResultante.push("AND");
    filtrosResultante.push(["custrecord_ht_pp_parametrizacionid", "anyof", itemId]);
    return filtrosResultante;
}

function obtenerParametrizacionNoConsiderar() {
    return [
        ["129", "1813"], //CCD - CONTROL DE CUSTODIAS DE DISPOSITIVOS
        ["132", "1798"], //ALQ - PRODUCTO DE ALQUILER
        ["111", "1798"], //PGR - PRODUCTO DE GARANTÍA
        ["117", "1849"], //TDP - TIPO DE PRODUCTO --- 009 - DEMO
        //["117", "107"], //TDP - TIPO DE PRODUCTO --- 013 - SOFTWARE GENERAL
        ["150", "1798"], //IRP - ITEM DE REPUESTO
        //["45", "1798"]  //MPT - MANEJA PROCESOS DE TALLER
    ]
}

function obtenerParametrizacionAConsiderar() {
    return [
        ["126", "1805"], //TMI - TIPO DE MOVIMIENTO DE INVENTARIO
        ["104", "1797"], //ADP - ACCION DEL PRODUCTO
        ["122", "1798"] //GOT - GENERA SOLICITUD DE TRABAJO               //Cambio de Edwin 57784 por 122
    ];
}

function obtenerProvisionDeLinea(createdFrom) {
    var salesOrderRecord = nlapiLoadRecord('salesorder', createdFrom);
    var itemCount = salesOrderRecord.getLineItemCount('item');
    var location = ""
    var costProvisionAccount = "", costAccount = "", provisionAmount = 0;
    for (var i = 1; i <= itemCount; i++) {
        costProvisionAccount = Number(salesOrderRecord.getLineItemValue('item', 'custcol_ht_so_cost_account_provision', i));
        costAccount = Number(salesOrderRecord.getLineItemValue('item', 'custcol_ht_so_cost_account', i));
        var esAsientoProvision = salesOrderRecord.getLineItemValue('item', 'custcol_ht_os_asientoprovision', i);
        location = Number(salesOrderRecord.getLineItemValue('item', 'location', i));
        nlapiLogExecution("ERROR", "costProvisionAccount " + i, costProvisionAccount + "|" + costAccount);
        if (!(esAsientoProvision && esAsientoProvision == "T")) continue;
        if (!(costProvisionAccount && costAccount)) continue;
        var itemId = Number(salesOrderRecord.getLineItemValue('item', 'item', i));
        var itemFields = nlapiLookupField('item', itemId, ["recordtype"]);
        if (itemFields.recordtype != "serializedassemblyitem") continue;
        //var quantity = Number(salesOrderRecord.getLineItemValue('item', 'quantity', i));
        provisionAmount = Number(salesOrderRecord.getLineItemValue('item', 'custcol_ht_so_cost_import', i));
        //var averageCost = Number(salesOrderRecord.getLineItemValue('item', 'averagecost', i));
        //var averageCost = obtenerCostoPromedio(itemId, location);
        //provisionAmount = quantity * averageCost;
        break;
    }
    if (!(costProvisionAccount && costAccount)) return null;
    return {
        provisionAccount: costProvisionAccount,
        costAccount: costAccount,
        provisionAmount: provisionAmount,
        location: location
    }
}

function buscarDetalleProvision(salesOrderId) {
    nlapiLogExecution("ERROR", "salesOrderId", salesOrderId);
    var detalleProvision = nlapiSearchRecord("customrecord_ht_dp_detalle_provision", null,
        [["custrecord_ht_dp_transaccion_prov", "anyof", salesOrderId]],
        [
            new nlobjSearchColumn("incomeaccount", "CUSTRECORD_HT_DP_ITEM", null),
            new nlobjSearchColumn("custitem_cuenta_provision_ingreso", "CUSTRECORD_HT_DP_ITEM", null),
            new nlobjSearchColumn("custrecord_ht_dp_provision")
        ]
    );
    if (detalleProvision == null) return null;
    var columns = detalleProvision[0].getAllColumns();
    return {
        incomeAccount: detalleProvision[0].getValue(columns[0]),
        provisionAccount: detalleProvision[0].getValue(columns[1]),
        provisionAmount: detalleProvision[0].getValue(columns[2])
    };
}

function agregarCustomLines(customLines, debit, credit, account, entity, department, classId, location, glosa) {
    var newLine = customLines.addNewLine();
    if (debit) newLine.setDebitAmount(Number(debit));
    else if (credit) newLine.setCreditAmount((credit));
    newLine.setAccountId(Number(account));
    if (entity) newLine.setEntityId(Number(entity));
    if (department) newLine.setDepartmentId(Number(department));
    if (classId) newLine.setClassId(Number(classId));
    if (location) newLine.setLocationId(Number(location));
    if (glosa != 0) newLine.setMemo(glosa);

}

function validarGLCosteoFactura(itemId) {
    var parametrizaciones = obtenerParametrizacionNoConsiderar();
    var filtrosBusqueda = obtenerFiltrosBusqueda(itemId, parametrizaciones);
    //nlapiLogExecution("ERROR", "filtrosBusqueda", JSON.stringify(filtrosBusqueda));
    var parametrizacionesNoConsiderar = nlapiSearchRecord("customrecord_ht_pp_main_param_prod", null, filtrosBusqueda, [new nlobjSearchColumn("custrecord_ht_pp_parametrizacionid")]);

    parametrizaciones = obtenerParametrizacionAConsiderar();
    nlapiLogExecution("ERROR", "parametrizaciones", parametrizaciones);
    filtrosBusqueda = obtenerFiltrosBusqueda(itemId, parametrizaciones);
    var parametrizacionesAConsiderar = nlapiSearchRecord("customrecord_ht_pp_main_param_prod", null, filtrosBusqueda, [new nlobjSearchColumn("custrecord_ht_pp_parametrizacionid")]);
    nlapiLogExecution("ERROR", "CREATEDFROM5", parametrizacionesNoConsiderar);
    nlapiLogExecution("ERROR", "CREATEDFROM6", parametrizacionesAConsiderar);
    nlapiLogExecution("ERROR", "CREATEDFROM7", parametrizacionesAConsiderar.length + '==' + parametrizaciones.length);
    return parametrizacionesNoConsiderar != null || !(parametrizacionesAConsiderar != null && parametrizacionesAConsiderar.length == parametrizaciones.length);
}

function obtenerCostoPromedio(itemid, location) {
    var itemSearch = nlapiSearchRecord("item", null,
        [
            ["internalid", "anyof", itemid],
            "AND",
            ["inventorylocation", "anyof", location]
        ],
        [
            new nlobjSearchColumn("displayname"),
            new nlobjSearchColumn("inventorylocation"),
            new nlobjSearchColumn("locationaveragecost")
        ]
    );

    if (itemSearch == null) return;
    var costoPromedio = Number(itemSearch[0].getValue('locationaveragecost'));
    nlapiLogExecution("ERROR", "costoPromedio", costoPromedio);
    return costoPromedio;
}

function getCuentaMutua(subsidiary) {
    var subsidiarySearch = nlapiSearchRecord("subsidiary", null,
        [
            ["internalid", "anyof", subsidiary]
        ],
        [new nlobjSearchColumn("custrecord_ht_cuenta_mutua_provision")]
    );

    if (subsidiarySearch == null) return;
    var cuentaMutua = Number(subsidiarySearch[0].getValue('custrecord_ht_cuenta_mutua_provision'));
    return cuentaMutua;
}

function getOrdenTrabajo(createdFrom, item) {
    var ordentrabajoSearch = nlapiSearchRecord("customrecord_ht_record_ordentrabajo", null,
        [
            ["custrecord_ht_ot_orden_servicio", "anyof", createdFrom],
            "AND",
            ["custrecord_ht_ot_item", "anyof", item]
        ],
        [
            new nlobjSearchColumn("name")
        ]
    );
    if (ordentrabajoSearch == null) return '';
    return ordentrabajoSearch[0].getValue('name');
}

function getFactura(createdFrom, item) {
    var invoiceSearch = nlapiSearchRecord("invoice", null,
        [
            ["type", "anyof", "CustInvc"],
            "AND",
            ["createdfrom", "anyof", createdFrom],
            "AND",
            ["item", "anyof", item]
        ],
        [
            new nlobjSearchColumn("tranid")
        ]
    );
    if (invoiceSearch == null) return '';
    return invoiceSearch[0].getValue('tranid');
}

function getCuentaAFTransito(subsidiary) {
    var subsidiarySearch = nlapiSearchRecord(
        "subsidiary",
        null,
        [
            ["internalid", "anyof", subsidiary]
        ],
        [new nlobjSearchColumn("custrecord_ht_cuenta_activo_fijo_transit")]
    );

    if (subsidiarySearch == null) return;
    var cuentaAFTransito = Number(subsidiarySearch[0].getValue('custrecord_ht_cuenta_activo_fijo_transit'));
    return cuentaAFTransito;
}

function getFacturaInternas(idFactura) {
    var ordenServicio = [];
    var invoiceSearch = nlapiSearchRecord("invoice", null,
        [
            ["type", "anyof", "CustInvc"],
            "AND",
            ["internalidnumber", "equalto", idFactura]
        ],
        [
            new nlobjSearchColumn("formulanumeric", null, "GROUP").setFormula("{custrecord_nro_factura.custrecord_orden_servicio.id}")
        ]
    );

    if (invoiceSearch != null) {
        for (var j = 0; j < invoiceSearch.length; j++) {
            var columns = invoiceSearch[j].getAllColumns();
            var idOS = invoiceSearch[j].getValue(columns[0]);
            ordenServicio.push(idOS);
        }
        return ordenServicio;
    } else {
        return ordenServicio;
    }

}