//https://7451241-sb1.app.netsuite.com/app/common/scripting/plugin.nl?id=818&id=818&whence=
function customizeGlImpact(transactionRecord, standardLines, customLines, book) {
    var recordType = transactionRecord.getRecordType();
    var id = transactionRecord.getId();
    var accountCajaTransito = 122 //11001010200 CAJA EN TRANSITO INGRESOS
    var accountClienteCustodia = 2689 //11004010600 DOCUMENTOS DE CLIENTES EN CUSTODIA
    var reteIVA = 255 //ReteIR for Sales 
    var reteFuente = 210 //23-8551 Otros Pasivos Circulantes : VAT on Sales EC
    var cuentaPrueba = 2416 //11002090000 ACTIVO : ACTIVO CORRIENTE : TC EQUIVALENTES A EFECTIVO : AMERICAN EXPRESS - CTE.
    nlapiLogExecution("ERROR", "customizeGlImpact", recordType);

    if (recordType == 'itemfulfillment') {
        nlapiLogExecution("ERROR", "Provisión", 'INICIO Item Fulfillment: ' + id + ' ------------------------------------------------------------------------------------------------');
        try {
            var createdFrom = transactionRecord.getFieldValue('createdfrom');
            nlapiLogExecution("ERROR", "CREATEDFROM", createdFrom);

            var fields = ['recordtype', 'statusref']
            var transactionFields = nlapiLookupField('transaction', createdFrom, fields);

            if (transactionFields.recordtype == "salesorder") {

                var salesOrderRecord = nlapiLoadRecord('salesorder', createdFrom);
                var itemCount = salesOrderRecord.getLineItemCount('item');

                var costProvisionAccount = "", amount = 0, location;
                for (var i = 1; i <= itemCount; i++) {
                    costProvisionAccount = Number(salesOrderRecord.getLineItemValue('item', 'custcol_ht_so_cost_account', i));
                    var esAsientoProvision = salesOrderRecord.getLineItemValue('item', 'custcol_ht_os_asientoprovision', i);
                    location = Number(salesOrderRecord.getLineItemValue('item', 'location', i));
                    nlapiLogExecution("ERROR", "costProvisionAccount " + i, costProvisionAccount);
                    //var inventoryAccount = transactionRecord.getLineItemValue('item', 'custcol_ht_so_inventory_account', i);
                    if (!(esAsientoProvision && esAsientoProvision == "T")) continue;
                    if (!costProvisionAccount) continue;
                    var itemId = Number(salesOrderRecord.getLineItemValue('item', 'item', i));
                    var itemFields = nlapiLookupField('item', itemId, ["recordtype"]);
                    if (itemFields.recordtype != "serializedassemblyitem") continue;
                    var quantity = Number(salesOrderRecord.getLineItemValue('item', 'quantity', i));
                    var averageCost = Number(salesOrderRecord.getLineItemValue('item', 'averagecost', i));
                    amount = quantity * averageCost;
                    break;
                }
                nlapiLogExecution("ERROR", "amount", amount);

                if (amount == 0) return;

                var newLine = customLines.addNewLine();
                newLine.setDebitAmount(amount);
                newLine.setAccountId(costProvisionAccount);
                newLine.setEntityId(standardLines.getLine(0).getEntityId());
                newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
                newLine.setClassId(standardLines.getLine(0).getClassId());
                newLine.setLocationId(location);

                var newLine = customLines.addNewLine();
                newLine.setCreditAmount(amount);
                newLine.setAccountId(costProvisionAccount);
                newLine.setEntityId(standardLines.getLine(0).getEntityId());
                newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
                newLine.setClassId(standardLines.getLine(0).getClassId());
                newLine.setLocationId(location);
            }
        } catch (error) {
            nlapiLogExecution('ERROR', 'ItemFulfillment', error);
        }
        nlapiLogExecution("DEBUG", "Consignación", 'FIN Item Fulfillment: ' + id + ' ----------------------------------------------------------------------------------------------------');
    }

    if (recordType == 'invoice') {
        nlapiLogExecution("ERROR", "Provisión", 'INICIO Invoice: ' + id + ' ------------------------------------------------------------------------------------------------');
        try {

            var createdFrom = transactionRecord.getFieldValue('createdfrom');
            nlapiLogExecution("ERROR", "CREATEDFROM", createdFrom);

            if (!createdFrom) return;

            var fields = ['recordtype', 'statusref'];
            var transactionFields = nlapiLookupField('transaction', createdFrom, fields);
            if (transactionFields.recordtype == "salesorder") {

                if (transactionFields.statusref == "pendingFulfillment" || transactionFields.statusref == "partiallyFulfilled") {

                    var salesOrderRecord = nlapiLoadRecord('salesorder', createdFrom);
                    var itemCount = salesOrderRecord.getLineItemCount('item');
                    var costProvisionAccount = "", amount = 0, location = "";
                    for (var i = 1; i <= itemCount; i++) {
                        costProvisionAccount = Number(salesOrderRecord.getLineItemValue('item', 'custcol_ht_so_cost_account', i));
                        nlapiLogExecution("ERROR", "costProvisionAccount " + i, costProvisionAccount);
                        if (!costProvisionAccount) continue;
                        var itemId = Number(salesOrderRecord.getLineItemValue('item', 'item', i));
                        var itemFields = nlapiLookupField('item', itemId, ["recordtype"]);
                        if (itemFields.recordtype != "serializedassemblyitem") continue;
                        if (validarGLCosteoFactura(itemId)) continue;
                        var quantity = Number(salesOrderRecord.getLineItemValue('item', 'quantity', i));
                        var averageCost = Number(salesOrderRecord.getLineItemValue('item', 'averagecost', i));
                        location = Number(salesOrderRecord.getLineItemValue('item', 'location', i));
                        amount = quantity * averageCost;
                        salesOrderRecord.setLineItemValue('item', 'custcol_ht_os_asientoprovision', i, "T");
                        break;
                    }
                    nlapiLogExecution("ERROR", "amount ", amount);

                    if (amount == 0) return;
                    var entity = standardLines.getLine(0).getEntityId();
                    var department = standardLines.getLine(0).getDepartmentId();
                    var _class = standardLines.getLine(0).getClassId();
                    var newLine = customLines.addNewLine();
                    newLine.setDebitAmount(amount);
                    newLine.setAccountId(costProvisionAccount);
                    if (entity) newLine.setEntityId(standardLines.getLine(0).getEntityId());
                    if (department) newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
                    if (_class) newLine.setClassId(standardLines.getLine(0).getClassId());
                    newLine.setLocationId(location);
                    nlapiLogExecution("ERROR", "FIRST LINE");

                    var newLine = customLines.addNewLine();
                    newLine.setCreditAmount(amount);
                    newLine.setAccountId(costProvisionAccount);
                    if (entity) newLine.setEntityId(standardLines.getLine(0).getEntityId());
                    if (department) newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
                    if (_class) newLine.setClassId(standardLines.getLine(0).getClassId());
                    newLine.setLocationId(location);

                    nlapiSubmitRecord(salesOrderRecord, false, true);
                    nlapiLogExecution("ERROR", "END ");

                } else if (transactionFields.statusref == "pendingBilling") {
                    var detalleProvision = nlapiSearchRecord("customrecord_ht_dp_detalle_provision", null,
                        [["custrecord_ht_dp_transaccion_prov", "anyof", createdFrom]],
                        [
                            new nlobjSearchColumn("custrecord_ht_dp_aplicado"),
                            new nlobjSearchColumn("custrecord_ht_dp_item"),
                            new nlobjSearchColumn("custrecord_ht_dp_provision")
                        ]
                    );
                    if (detalleProvision != null) return;
                    if (detalleProvision[0].getValue('custrecord_ht_dp_aplicado') == 'T') return;
                    if (!detalleProvision[0].getValue('custrecord_ht_dp_item')) return;
                    var itemSearchResult = nlapiSearchRecord("custrecord_ht_dp_item", null,
                        [["internalid", "anyof", detalleProvision[0].getValue('custrecord_ht_dp_item')]],
                        [
                            new nlobjSearchColumn("incomeaccount"),
                            new nlobjSearchColumn("custitem_cuenta_provision_ingreso")
                        ]
                    );
                    if (itemSearchResult != null) return;
                    var incomeAccount = itemSearchResult[0].getValue('incomeaccount');
                    var provisionAccount = itemSearchResult[0].getValue('custitem_cuenta_provision_ingreso');
                    var amount = detalleProvision[0].getValue('custrecord_ht_dp_provision');
                    var newLine = customLines.addNewLine();
                    newLine.setDebitAmount(amount);
                    newLine.setAccountId(provisionAccount);
                    newLine.setEntityId(standardLines.getLine(0).getEntityId());
                    newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
                    newLine.setClassId(standardLines.getLine(0).getClassId());
                    newLine.setLocationId(standardLines.getLine(0).getLocationId());

                    var newLine = customLines.addNewLine();
                    newLine.setCreditAmount(amount);
                    newLine.setAccountId(incomeAccount);
                    newLine.setEntityId(standardLines.getLine(0).getEntityId());
                    newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
                    newLine.setClassId(standardLines.getLine(0).getClassId());
                    newLine.setLocationId(standardLines.getLine(0).getLocationId());

                    nlapiSubmitField('customrecord_ht_dp_detalle_provision', detalleProvision[0].getId(), 'custrecord_ht_dp_aplicado', 'T')

                }
            }
        } catch (error) {
            nlapiLogExecution('ERROR', 'Invoice', error);
        }
        nlapiLogExecution("ERROR", "Consignación", 'FIN Invoice: ' + id + ' ----------------------------------------------------------------------------------------------------');
    }

    if (recordType == 'itemreceipt') {
        var createdFrom = transactionRecord.getFieldValue('createdfrom');
        nlapiLogExecution("ERROR", "CREATEDFROM", createdFrom);

        var fields = ['recordtype', 'createdfrom'];
        var transactionFields = nlapiLookupField('transaction', createdFrom, fields);

        if (transactionFields.recordtype == "returnauthorization" && transactionFields.createdFrom) {
            var transactionFields = nlapiLookupField('transaction', transactionFields.createdFrom, fields);

            if (transactionFields.recordtype == "salesorder") {
                var detalleProvision = buscarDetalleProvision(transactionFields.createdFrom);
                if (detalleProvision == null) return;

                var entityId = standardLines.getLine(0).getEntityId();
                var deparmentId = standardLines.getLine(0).getDepartmentId();
                var classId = standardLines.getLine(0).getClassId();
                var locationId = standardLines.getLine(0).getLocationId();
                agregarCustomLines(customLines, detalleProvision.provisionAmount, 0, detalleProvision.incomeAccount, entityId, deparmentId, classId, locationId);
                agregarCustomLines(customLines, 0, detalleProvision.provisionAmount, detalleProvision.provisionAccount, entityId, deparmentId, classId, locationId);
            }
        }
    }

    if (recordType == 'customerpayment') {
        var accountPaymentMethod;
        var account; //= transactionRecord.getFieldValue('account');
        var check;
        var paymentMethod = parseInt(transactionRecord.getFieldValue('paymentmethod'));
        var statusRef = transactionRecord.getFieldValue('statusRef')
        var i = 0;
        try {
            var customerpaymentSearch = nlapiSearchRecord("customerpayment", null,
                [
                    ["type", "anyof", "CustPymt"],
                    "AND",
                    ["internalid", "anyof", id],
                    "AND",
                    ["account", "anyof", accountCajaTransito]
                ],
                [
                    new nlobjSearchColumn("account"),
                    new nlobjSearchColumn("otherrefnum")
                ]
            );

            if (customerpaymentSearch) {
                account = customerpaymentSearch[0].getValue('account')
                check = customerpaymentSearch[0].getValue('otherrefnum')
            }

            if (account == accountCajaTransito && paymentMethod.toString().length > 0 && statusRef == 'notDeposited') {
                nlapiLogExecution("DEBUG", recordType, 'Cheque: ' + check);
                if (check.length > 0) {
                    accountPaymentMethod = parseInt(accountClienteCustodia)
                    //accountPaymentMethod = parseInt(cuentaPrueba)
                } else {
                    var resultados = nlapiSearchRecord("customrecord_ht_cuentas_nrocuotas", null,
                        [
                            ["custrecord_ht_cc_paymentmethod", "anyof", paymentMethod]
                        ],
                        [
                            new nlobjSearchColumn("custrecord_ht_cc_cuenta", null, "GROUP")
                        ]
                    );

                    if (resultados) {
                        accountPaymentMethod = parseInt(resultados[0].getValue('custrecord_ht_cc_cuenta', null, "GROUP"))
                        // for (var i = 0; i < resultados.length; i++) {
                        //     var resultado = resultados[i];
                        //     var valorCampo = resultado.getValue('custrecord_ht_cc_paymentmethod');
                        // }
                    }
                }

                nlapiLogExecution("DEBUG", recordType, 'account: ' + account + ' - ' + paymentMethod + ' - ' + accountPaymentMethod);
                var newLine = customLines.addNewLine();
                newLine.setCreditAmount(standardLines.getLine(i).getDebitAmount());
                newLine.setAccountId(accountCajaTransito);
                newLine.setEntityId(standardLines.getLine(i).getEntityId());
                newLine.setDepartmentId(standardLines.getLine(i).getDepartmentId());
                newLine.setClassId(standardLines.getLine(i).getClassId());
                newLine.setLocationId(standardLines.getLine(i).getLocationId());

                var newLine = customLines.addNewLine();
                newLine.setDebitAmount(standardLines.getLine(i).getDebitAmount());
                newLine.setAccountId(accountPaymentMethod);
                newLine.setEntityId(standardLines.getLine(i).getEntityId());
                newLine.setDepartmentId(standardLines.getLine(i).getDepartmentId());
                newLine.setClassId(standardLines.getLine(i).getClassId());
                newLine.setLocationId(standardLines.getLine(i).getLocationId());
            }
        } catch (error) {
            nlapiLogExecution('ERROR', recordType, error);
        }
    }

    if (recordType == 'deposit') {
        var accountPaymentMethod;
        var creditmemoid;
        var jsonAccounts = new Array();
        var accountMethod;
        var creditMemo;

        try {
            var countTransaction = transactionRecord.getLineItemCount('payment');
            for (var j = 1; j <= countTransaction; j++) {
                var json = new Array();
                var paymentidInt = transactionRecord.getLineItemValue('payment', 'id', j);
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
                }
            }
            nlapiLogExecution("DEBUG", 'JSONFinal: ' + recordType, JSON.stringify(jsonAccounts));

            for (var k = 0; k < jsonAccounts.length; k++) {
                creditMemo = jsonAccounts[k][0].tranid;

                var reteIVAAcc = parseInt(jsonAccounts[k][0].account);
                var reteIVAAmount = parseFloat(jsonAccounts[k][0].amount);

                var reteFuenteAcc = parseInt(jsonAccounts[k][1].account);
                var reteFuenteAmount = parseFloat(jsonAccounts[k][1].amount);

                var methodAcc = parseInt(jsonAccounts[k][2].account);
                var methodAmount = parseFloat(jsonAccounts[k][2].amount);
                accountMethod = methodAcc;
                //nlapiLogExecution("DEBUG", 'SuiteGL', accountMethod);

                var newLine = customLines.addNewLine();
                newLine.setDebitAmount(reteIVAAmount);
                newLine.setAccountId(reteIVAAcc);
                newLine.setMemo(creditMemo);
                newLine.setEntityId(standardLines.getLine(0).getEntityId());
                newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
                newLine.setClassId(standardLines.getLine(0).getClassId());
                newLine.setLocationId(standardLines.getLine(0).getLocationId());

                var newLine = customLines.addNewLine();
                newLine.setDebitAmount(reteFuenteAmount);
                newLine.setAccountId(reteFuenteAcc);
                newLine.setMemo(creditMemo);
                newLine.setEntityId(standardLines.getLine(0).getEntityId());
                newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
                newLine.setClassId(standardLines.getLine(0).getClassId());
                newLine.setLocationId(standardLines.getLine(0).getLocationId());

                var newLine = customLines.addNewLine();
                newLine.setCreditAmount(methodAmount);
                newLine.setAccountId(methodAcc);
                newLine.setMemo(creditMemo);
                newLine.setEntityId(standardLines.getLine(0).getEntityId());
                newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
                newLine.setClassId(standardLines.getLine(0).getClassId());
                newLine.setLocationId(standardLines.getLine(0).getLocationId());
            }

            var countStandard = parseInt(standardLines.getCount());
            for (var i = 0; i < countStandard; i++) {
                if (standardLines.getLine(i).getAccountId() == accountCajaTransito) {
                    var newLine = customLines.addNewLine();
                    newLine.setCreditAmount(standardLines.getLine(i).getCreditAmount());
                    newLine.setAccountId(accountMethod);
                    // newLine.setMemo(creditMemo);
                    newLine.setEntityId(standardLines.getLine(0).getEntityId());
                    newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
                    newLine.setClassId(standardLines.getLine(0).getClassId());
                    newLine.setLocationId(standardLines.getLine(0).getLocationId());

                    var newLine = customLines.addNewLine();
                    newLine.setDebitAmount(standardLines.getLine(i).getCreditAmount());
                    newLine.setAccountId(accountCajaTransito);
                    // newLine.setMemo(creditMemo);
                    newLine.setEntityId(standardLines.getLine(0).getEntityId());
                    newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
                    newLine.setClassId(standardLines.getLine(0).getClassId());
                    newLine.setLocationId(standardLines.getLine(0).getLocationId());
                }
            }
        } catch (error) {
            nlapiLogExecution('ERROR', recordType, error);
        }
    }

    if (recordType == 'creditmemo') {
        var accountPaymentMethod;
        var account; //= transactionRecord.getFieldValue('account');
        var memo = transactionRecord.getFieldValue('memo');
        //nlapiLogExecution("DEBUG", "MEMO", memo);
        var check;
        var paymentMethod;
        var i = 0;
        try {
            var countStandard = parseInt(standardLines.getCount());
            var j = 1
            var palabra = "Withholding Tax";

            if (memo.indexOf(palabra) !== -1) {
                nlapiLogExecution('DEBUG', recordType, 'Aplica Retención');
                nlapiLogExecution("DEBUG", recordType, 'DEBIT line: ' + 1 + ' - amount: ' + standardLines.getLine(1).getDebitAmount());
                nlapiLogExecution("DEBUG", recordType, 'DEBIT line: ' + 2 + ' - amount: ' + standardLines.getLine(2).getDebitAmount());
                nlapiLogExecution("DEBUG", recordType, 'CREDIT line: ' + 0 + ' - amount: ' + standardLines.getLine(0).getCreditAmount());

                var creditmemoSearch = nlapiSearchRecord("creditmemo", null,
                    [
                        ["type", "anyof", "CustCred"],
                        "AND",
                        ["internalid", "anyof", id]
                    ],
                    [
                        new nlobjSearchColumn("internalid", null, "GROUP"),
                        // new nlobjSearchColumn("tranid", null, "GROUP"),
                        // new nlobjSearchColumn("tranid", "CUSTBODY_4601_PYMNT_REF_ID", "GROUP"),
                        new nlobjSearchColumn("paymentmethod", "CUSTBODY_4601_PYMNT_REF_ID", "GROUP"),
                        new nlobjSearchColumn("otherrefnum", "CUSTBODY_4601_PYMNT_REF_ID", "GROUP")
                    ]
                );

                if (creditmemoSearch) {
                    paymentMethod = creditmemoSearch[0].getValue("paymentmethod", "CUSTBODY_4601_PYMNT_REF_ID", "GROUP")
                    check = creditmemoSearch[0].getValue("otherrefnum", "CUSTBODY_4601_PYMNT_REF_ID", "GROUP")
                }
                nlapiLogExecution('DEBUG', 'CHECK', check + ' - ' + paymentMethod);
                if (check.length > 0 && check != '- None -') {
                    accountPaymentMethod = parseInt(accountClienteCustodia)
                    //accountPaymentMethod = parseInt(cuentaPrueba)
                } else {
                    var resultados2 = nlapiSearchRecord("customrecord_ht_cuentas_nrocuotas", null,
                        [
                            ["custrecord_ht_cc_paymentmethod", "anyof", paymentMethod]
                        ],
                        [
                            new nlobjSearchColumn("custrecord_ht_cc_cuenta", null, "GROUP")
                        ]
                    );

                    if (resultados2) {
                        accountPaymentMethod = parseInt(resultados2[0].getValue('custrecord_ht_cc_cuenta', null, "GROUP"))
                    }
                    nlapiLogExecution('DEBUG', recordType, 'ACCOUNT: ' + accountPaymentMethod);
                }

                // if (standardLines.getLine(1).getAccountId() == reteIVA) {
                var newLine = customLines.addNewLine();
                newLine.setCreditAmount(standardLines.getLine(1).getDebitAmount());
                newLine.setAccountId(reteIVA);
                newLine.setEntityId(standardLines.getLine(i).getEntityId());
                newLine.setDepartmentId(standardLines.getLine(i).getDepartmentId());
                newLine.setClassId(standardLines.getLine(i).getClassId());
                newLine.setLocationId(standardLines.getLine(i).getLocationId());
                // }

                // if (standardLines.getLine(2).getAccountId() == reteFuente) {
                var newLine = customLines.addNewLine();
                newLine.setCreditAmount(standardLines.getLine(2).getDebitAmount());
                newLine.setAccountId(reteFuente);
                newLine.setEntityId(standardLines.getLine(i).getEntityId());
                newLine.setDepartmentId(standardLines.getLine(i).getDepartmentId());
                newLine.setClassId(standardLines.getLine(i).getClassId());
                newLine.setLocationId(standardLines.getLine(i).getLocationId());
                // }

                var newLine = customLines.addNewLine();
                newLine.setDebitAmount(standardLines.getLine(0).getCreditAmount());
                newLine.setAccountId(accountPaymentMethod);
                newLine.setEntityId(standardLines.getLine(i).getEntityId());
                newLine.setDepartmentId(standardLines.getLine(i).getDepartmentId());
                newLine.setClassId(standardLines.getLine(i).getClassId());
                newLine.setLocationId(standardLines.getLine(i).getLocationId());
            }

        } catch (error) {
            nlapiLogExecution('ERROR', recordType, error);
        }

        try {
            var createdFrom = transactionRecord.getFieldValue('createdfrom');
            nlapiLogExecution("ERROR", "CREATEDFROM", createdFrom);
            if (!createdFrom) return;

            var fields = ['recordtype', 'createdfrom'];
            var transactionFields = nlapiLookupField('transaction', createdFrom, fields);

            nlapiLogExecution("ERROR", "transactionFields", JSON.stringify(transactionFields));

            if (transactionFields.recordtype == "invoice" && transactionFields.createdfrom) {
                var createdFrom = transactionFields.createdfrom;
                var transactionFields = nlapiLookupField('transaction', createdFrom, fields);
                nlapiLogExecution("ERROR", "transactionFields 2", JSON.stringify(transactionFields));

                if (transactionFields.recordtype == "salesorder") {

                    var costProvisionAccount = "", amount = 0, location;

                    var detalleProvision = obtenerProvisionDeLinea(createdFrom);
                    nlapiLogExecution("ERROR", "CREATEDFROM", JSON.stringify(detalleProvision));
                    
                    if (detalleProvision == null) return;

                    var entityId = standardLines.getLine(0).getEntityId();
                    var deparmentId = standardLines.getLine(0).getDepartmentId();
                    var classId = standardLines.getLine(0).getClassId();
                    var locationId = detalleProvision.location;
                    agregarCustomLines(customLines, detalleProvision.provisionAmount, 0, detalleProvision.provisionAccount, entityId, deparmentId, classId, locationId);
                    agregarCustomLines(customLines, 0, detalleProvision.provisionAmount, detalleProvision.provisionAccount, entityId, deparmentId, classId, locationId);
                }
            }
        } catch (error) {
            nlapiLogExecution('ERROR', recordType, error);
        }
    }
}

function obtenerFiltrosBusqueda(itemId, parametrizaciones) {
    var filtrosResultante = [], filtrosParametrizaciones = [];
    for (var i = 0; i < parametrizaciones.length; i++) {
        var parametrizacion = [
            ["custrecord_ht_pp_parametrizacion_rela", "anyof", parametrizaciones[i][0]],
            "AND",
            ["custrecord_ht_pp_parametrizacion_valor", "anyof", parametrizaciones[i][1]]
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
        ["21", "55"],
        ["13", "9"],
        ["58", "9"],
        ["10", "115"],
        ["10", "119"],
        ["46", "9"],
        ["47", "9"]
    ]
}

function obtenerParametrizacionAConsiderar() {
    return [
        ["82", "123"],
        ["2", "43"],
        ["34", "9"]
    ];
}

function obtenerProvisionDeLinea(createdFrom) {
    var salesOrderRecord = nlapiLoadRecord('salesorder', createdFrom);
    var itemCount = salesOrderRecord.getLineItemCount('item');
    var location = ""
    var costProvisionAccount = "", provisionAmount = 0;
    for (var i = 1; i <= itemCount; i++) {
        costProvisionAccount = Number(salesOrderRecord.getLineItemValue('item', 'custcol_ht_so_cost_account', i));
        var esAsientoProvision = salesOrderRecord.getLineItemValue('item', 'custcol_ht_os_asientoprovision', i);
        location = Number(salesOrderRecord.getLineItemValue('item', 'location', i));
        nlapiLogExecution("ERROR", "costProvisionAccount " + i, costProvisionAccount);
        if (!(esAsientoProvision && esAsientoProvision == "T")) continue;
        if (!costProvisionAccount) continue;
        var itemId = Number(salesOrderRecord.getLineItemValue('item', 'item', i));
        var itemFields = nlapiLookupField('item', itemId, ["recordtype"]);
        if (itemFields.recordtype != "serializedassemblyitem") continue;
        var quantity = Number(salesOrderRecord.getLineItemValue('item', 'quantity', i));
        var averageCost = Number(salesOrderRecord.getLineItemValue('item', 'averagecost', i));
        provisionAmount = quantity * averageCost;
        break;
    }
    if (!costProvisionAccount) return null;
    return {
        provisionAccount: costProvisionAccount,
        provisionAmount: provisionAmount,
        location: location
    }
}

function buscarDetalleProvision(salesOrderId) {
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

function agregarCustomLines(customLines, debit, credit, account, entity, department, classId, location) {

    var newLine = customLines.addNewLine();
    if (debit) newLine.setDebitAmount(debit);
    else if (credit) newLine.setCreditAmount(credit);
    newLine.setAccountId(account);
    if (entity) newLine.setEntityId(entity);
    if (department) newLine.setDepartmentId(department);
    if (classId) newLine.setClassId(classId);
    if (location) newLine.setLocationId(location);
}

function validarGLCosteoFactura(itemId) {
    var parametrizaciones = obtenerParametrizacionNoConsiderar();
    var filtrosBusqueda = obtenerFiltrosBusqueda(itemId, parametrizaciones);
    nlapiLogExecution("ERROR", "filtrosBusqueda", JSON.stringify(filtrosBusqueda));
    var parametrizacionesNoConsiderar = nlapiSearchRecord("customrecord_ht_pp_main_param_prod", null, filtrosBusqueda, [new nlobjSearchColumn("custrecord_ht_pp_parametrizacionid")]);

    parametrizaciones = obtenerParametrizacionAConsiderar();
    filtrosBusqueda = obtenerFiltrosBusqueda(itemId, parametrizaciones);
    var parametrizacionesAConsiderar = nlapiSearchRecord("customrecord_ht_pp_main_param_prod", null, filtrosBusqueda, [new nlobjSearchColumn("custrecord_ht_pp_parametrizacionid")]);
    return parametrizacionesNoConsiderar != null || !(parametrizacionesAConsiderar != null && parametrizacionesAConsiderar.length == parametrizaciones.length);
}

// json.push({
//     // linea: i,
//     // tranid: searchResults[i].getValue("tranid"),
//     account: cuenta,
//     amount: amount,
//     //creditfxamount: searchResults[i].getValue("creditfxamount")
// });

// var reteIVAAcc = parseInt(searchResults[0].getValue("account"))
                        // var reteIVAAmount = parseFloat(searchResults[0].getValue("creditfxamount"))

                        // var reteFuenteAcc = parseInt(searchResults[1].getValue("account"))
                        // var reteFuenteAmount = parseFloat(searchResults[1].getValue("creditfxamount"))

                        // var methodAcc = parseInt(searchResults[2].getValue("account"))
                        // var methodAmount = parseFloat(searchResults[2].getValue("debitfxamount"))

                        // nlapiLogExecution('DEBUG', 'iva', reteIVAAcc + ' - ' + typeof reteIVAAcc);
                        // nlapiLogExecution('DEBUG', 'iva', reteIVAAmount + ' - ' + typeof reteIVAAmount);

                        // nlapiLogExecution('DEBUG', 'fuente', reteFuenteAcc + ' - ' + typeof reteFuenteAcc);
                        // nlapiLogExecution('DEBUG', 'fuente', reteFuenteAmount + ' - ' + typeof reteFuenteAmount);

                        // nlapiLogExecution('DEBUG', 'method', methodAcc + ' - ' + typeof methodAcc);
                        // nlapiLogExecution('DEBUG', 'method', methodAmount + ' - ' + typeof methodAmount);


                        //     nlapiLogExecution("DEBUG", recordType, i + 'cuenta: ' + account + ' - debitfxamount: ' + debitfxamount + ' - creditfxamount: ' + creditfxamount);
                        // }
                        // nlapiLogExecution("DEBUG", recordType, 'cuenta: ' + searchResults[2].getValue("account") + ' - debitfxamount: ' + searchResults[0].getValue("creditfxamount") + ' - creditfxamount: ' + searchResults[1].getValue("creditfxamount"));