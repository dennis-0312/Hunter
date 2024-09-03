//https://7451241-sb1.app.netsuite.com/app/common/scripting/plugin.nl?id=818&id=818&whence=
function customizeGlImpact(transactionRecord, standardLines, customLines, book) {
    var recordType = transactionRecord.getRecordType();
    var id = transactionRecord.getId();
    var accountCajaTransito = 122 //11001010200 CAJA EN TRANSITO INGRESOS
    var accountClienteCustodia = 286 //11004010600 DOCUMENTOS DE CLIENTES EN CUSTODIA
    var reteIVA = 1683 //ReteIR for Sales / PR: 8% IMP.RENTA RETENIDO A NOTARIOS Y REGIST.PROP.
    var reteFuente = 1697 //23-8551 Otros Pasivos Circulantes : VAT on Sales EC / PR: 100% IVA RETENIDO PROF.ARRIEND.L/C
    var cuentaPrueba = 245 //11002090000 ACTIVO : ACTIVO CORRIENTE : TC EQUIVALENTES A EFECTIVO : AMERICAN EXPRESS - CTE. 
    var cuentaHardCode = 251;
    nlapiLogExecution("ERROR", "customizeGlImpact", recordType);

    //& PROCESO DE RETENCIÓN =========================================================================
    // if (recordType == 'customerpayment') {
    //     nlapiLogExecution("ERROR", recordType, 'Init');
    //     var accountPaymentMethod;
    //     var account; //= transactionRecord.getFieldValue('account');
    //     var check;
    //     var paymentMethod = parseInt(transactionRecord.getFieldValue('paymentmethod'));
    //     var statusRef = transactionRecord.getFieldValue('statusRef')
    //     var i = 0;
    //     try {
    //         var customerpaymentSearch = nlapiSearchRecord("customerpayment", null,
    //             [
    //                 ["type", "anyof", "CustPymt"],
    //                 "AND",
    //                 ["internalid", "anyof", id],
    //                 "AND",
    //                 ["account", "anyof", accountCajaTransito]
    //             ],
    //             [
    //                 new nlobjSearchColumn("account"),
    //                 new nlobjSearchColumn("otherrefnum")
    //             ]
    //         );

    //         if (customerpaymentSearch) {
    //             account = customerpaymentSearch[0].getValue('account')
    //             check = customerpaymentSearch[0].getValue('otherrefnum')
    //         }

    //         if (account == accountCajaTransito && paymentMethod.toString().length > 0 && statusRef == 'notDeposited') {
    //             nlapiLogExecution("DEBUG", recordType, 'Cheque: ' + check);
    //             nlapiLogExecution("ERROR", recordType, 'Cheque: ' + check);
    //             if (check.length > 0) {
    //                 accountPaymentMethod = parseInt(accountClienteCustodia)
    //                 //accountPaymentMethod = parseInt(cuentaPrueba)
    //             } else {
    //                 var resultados = nlapiSearchRecord("customrecord_ht_cuentas_nrocuotas", null,
    //                     [
    //                         ["custrecord_ht_cc_paymentmethod", "anyof", paymentMethod]
    //                     ],
    //                     [
    //                         new nlobjSearchColumn("custrecord_ht_cc_cuenta", null, "GROUP")
    //                     ]
    //                 );

    //                 if (resultados) {
    //                     accountPaymentMethod = parseInt(resultados[0].getValue('custrecord_ht_cc_cuenta', null, "GROUP"))
    //                     // for (var i = 0; i < resultados.length; i++) {
    //                     //     var resultado = resultados[i];
    //                     //     var valorCampo = resultado.getValue('custrecord_ht_cc_paymentmethod');
    //                     // }
    //                 }
    //             }

    //             nlapiLogExecution("DEBUG", recordType, 'account: ' + account + ' - ' + paymentMethod + ' - ' + accountPaymentMethod);
    //             nlapiLogExecution("ERROR", recordType, 'account: ' + account + ' - ' + paymentMethod + ' - ' + accountPaymentMethod);
    //             var newLine = customLines.addNewLine();
    //             newLine.setCreditAmount(standardLines.getLine(i).getDebitAmount());
    //             newLine.setAccountId(accountCajaTransito);
    //             newLine.setEntityId(standardLines.getLine(i).getEntityId());
    //             newLine.setDepartmentId(standardLines.getLine(i).getDepartmentId());
    //             newLine.setClassId(standardLines.getLine(i).getClassId());
    //             newLine.setLocationId(standardLines.getLine(i).getLocationId());

    //             var newLine = customLines.addNewLine();
    //             newLine.setDebitAmount(standardLines.getLine(i).getDebitAmount());
    //             newLine.setAccountId(accountPaymentMethod);
    //             newLine.setEntityId(standardLines.getLine(i).getEntityId());
    //             newLine.setDepartmentId(standardLines.getLine(i).getDepartmentId());
    //             newLine.setClassId(standardLines.getLine(i).getClassId());
    //             newLine.setLocationId(standardLines.getLine(i).getLocationId());
    //         }
    //     } catch (error) {
    //         nlapiLogExecution('ERROR', recordType, error);
    //     }
    // }

    if (recordType == 'deposit') {
        nlapiLogExecution("ERROR", recordType, 'Init');
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
                    var customerpaymentSearch = nlapiSearchRecord("customerpayment", null,
                        [
                            ["type", "anyof", "CustPymt"],
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
            // nlapiLogExecution("DEBUG", 'JSONFinal: ' + recordType, JSON.stringify(jsonAccounts));
            // nlapiLogExecution("ERROR", 'JSONFinal: ' + recordType, JSON.stringify(jsonAccounts));

            // for (var k = 0; k < jsonAccounts.length; k++) {
            //     creditMemo = jsonAccounts[k][0].tranid;
            //     var reteIVAAcc = parseInt(jsonAccounts[k][0].account);
            //     var reteIVAAmount = parseFloat(jsonAccounts[k][0].amount);
            //     var reteFuenteAcc = parseInt(jsonAccounts[k][1].account);
            //     var reteFuenteAmount = parseFloat(jsonAccounts[k][1].amount);
            //     var methodAcc = parseInt(jsonAccounts[k][2].account);
            //     var methodAmount = parseFloat(jsonAccounts[k][2].amount);
            //     accountMethod = methodAcc;
            //     //nlapiLogExecution("DEBUG", 'SuiteGL', accountMethod);

            //     var newLine = customLines.addNewLine();
            //     newLine.setDebitAmount(reteIVAAmount);
            //     newLine.setAccountId(reteIVAAcc);
            //     newLine.setMemo(creditMemo);
            //     newLine.setEntityId(standardLines.getLine(0).getEntityId());
            //     newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
            //     newLine.setClassId(standardLines.getLine(0).getClassId());
            //     newLine.setLocationId(standardLines.getLine(0).getLocationId());

            //     var newLine = customLines.addNewLine();
            //     newLine.setDebitAmount(reteFuenteAmount);
            //     newLine.setAccountId(reteFuenteAcc);
            //     newLine.setMemo(creditMemo);
            //     newLine.setEntityId(standardLines.getLine(0).getEntityId());
            //     newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
            //     newLine.setClassId(standardLines.getLine(0).getClassId());
            //     newLine.setLocationId(standardLines.getLine(0).getLocationId());

            //     var newLine = customLines.addNewLine();
            //     newLine.setCreditAmount(methodAmount);
            //     newLine.setAccountId(methodAcc);
            //     newLine.setMemo(creditMemo);
            //     newLine.setEntityId(standardLines.getLine(0).getEntityId());
            //     newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
            //     newLine.setClassId(standardLines.getLine(0).getClassId());
            //     newLine.setLocationId(standardLines.getLine(0).getLocationId());
            // }

            var countStandard = parseInt(standardLines.getCount());
            for (var i = 0; i < countStandard; i++) {
                //nlapiLogExecution("ERROR", "GL", standardLines.getLine(i).getAccountId());
                if (standardLines.getLine(i).getAccountId() == accountCajaTransito) {
                    // nlapiLogExecution("ERROR", "GLENTRY", standardLines.getLine(i).getAccountId());
                    // nlapiLogExecution("ERROR", "GLENTRYACCOUNT", typeof cuenta);

                    var newLine = customLines.addNewLine();
                    newLine.setCreditAmount(standardLines.getLine(i).getCreditAmount());
                    newLine.setAccountId(Number(cuenta));
                    newLine.setEntityId(standardLines.getLine(0).getEntityId());
                    newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
                    newLine.setClassId(standardLines.getLine(0).getClassId());
                    newLine.setLocationId(standardLines.getLine(0).getLocationId());

                    var newLine = customLines.addNewLine();
                    newLine.setDebitAmount(standardLines.getLine(i).getCreditAmount());
                    newLine.setAccountId(accountCajaTransito);
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
        nlapiLogExecution("ERROR", recordType, 'Init');
        var accountPaymentMethod;
        var account; //= transactionRecord.getFieldValue('account');
        var memo = transactionRecord.getFieldValue('memo');
        //nlapiLogExecution("DEBUG", "MEMO", memo);
        var check;
        var paymentMethod;
        var i = 0;
        // try {
        //     var countStandard = parseInt(standardLines.getCount());
        //     var j = 1
        //     var palabra = "Withholding Tax";

        //     if (memo.indexOf(palabra) !== -1) {
        //         nlapiLogExecution('DEBUG', recordType, 'Aplica Retención');
        //         nlapiLogExecution("DEBUG", recordType, 'DEBIT line: ' + 1 + ' - amount: ' + standardLines.getLine(1).getDebitAmount());
        //         nlapiLogExecution("DEBUG", recordType, 'DEBIT line: ' + 2 + ' - amount: ' + standardLines.getLine(2).getDebitAmount());
        //         nlapiLogExecution("DEBUG", recordType, 'CREDIT line: ' + 0 + ' - amount: ' + standardLines.getLine(0).getCreditAmount());

        //         nlapiLogExecution('ERROR', recordType, 'Aplica Retención');
        //         nlapiLogExecution("ERROR", recordType, 'DEBIT line: ' + 1 + ' - amount: ' + standardLines.getLine(1).getDebitAmount());
        //         nlapiLogExecution("ERROR", recordType, 'DEBIT line: ' + 2 + ' - amount: ' + standardLines.getLine(2).getDebitAmount());
        //         nlapiLogExecution("ERROR", recordType, 'CREDIT line: ' + 0 + ' - amount: ' + standardLines.getLine(0).getCreditAmount());

        //         var creditmemoSearch = nlapiSearchRecord("creditmemo", null,
        //             [
        //                 ["type", "anyof", "CustCred"],
        //                 "AND",
        //                 ["internalid", "anyof", id]
        //             ],
        //             [
        //                 new nlobjSearchColumn("internalid", null, "GROUP"),
        //                 // new nlobjSearchColumn("tranid", null, "GROUP"),
        //                 // new nlobjSearchColumn("tranid", "CUSTBODY_4601_PYMNT_REF_ID", "GROUP"),
        //                 new nlobjSearchColumn("paymentmethod", "CUSTBODY_4601_PYMNT_REF_ID", "GROUP"),
        //                 new nlobjSearchColumn("otherrefnum", "CUSTBODY_4601_PYMNT_REF_ID", "GROUP")
        //             ]
        //         );

        //         if (creditmemoSearch) {
        //             paymentMethod = creditmemoSearch[0].getValue("paymentmethod", "CUSTBODY_4601_PYMNT_REF_ID", "GROUP")
        //             check = creditmemoSearch[0].getValue("otherrefnum", "CUSTBODY_4601_PYMNT_REF_ID", "GROUP")
        //         }
        //         nlapiLogExecution('DEBUG', 'CHECK', check + ' - ' + paymentMethod);
        //         nlapiLogExecution('ERROR', 'CHECK', check + ' - ' + paymentMethod);
        //         if (check.length > 0 && check != '- None -') {
        //             accountPaymentMethod = parseInt(accountClienteCustodia)
        //             //accountPaymentMethod = parseInt(cuentaPrueba)
        //         } else {
        //             var resultados2 = nlapiSearchRecord("customrecord_ht_cuentas_nrocuotas", null,
        //                 [
        //                     ["custrecord_ht_cc_paymentmethod", "anyof", paymentMethod]
        //                 ],
        //                 [
        //                     new nlobjSearchColumn("custrecord_ht_cc_cuenta", null, "GROUP")
        //                 ]
        //             );

        //             if (resultados2) {
        //                 accountPaymentMethod = parseInt(resultados2[0].getValue('custrecord_ht_cc_cuenta', null, "GROUP"))
        //             }
        //             nlapiLogExecution('DEBUG', recordType, 'ACCOUNT: ' + accountPaymentMethod);
        //         }

        //         // if (standardLines.getLine(1).getAccountId() == reteIVA) {
        //         var newLine = customLines.addNewLine();
        //         newLine.setCreditAmount(standardLines.getLine(1).getDebitAmount());
        //         newLine.setAccountId(reteIVA);
        //         newLine.setEntityId(standardLines.getLine(i).getEntityId());
        //         newLine.setDepartmentId(standardLines.getLine(i).getDepartmentId());
        //         newLine.setClassId(standardLines.getLine(i).getClassId());
        //         newLine.setLocationId(standardLines.getLine(i).getLocationId());
        //         // }

        //         // if (standardLines.getLine(2).getAccountId() == reteFuente) {
        //         var newLine = customLines.addNewLine();
        //         newLine.setCreditAmount(standardLines.getLine(2).getDebitAmount());
        //         newLine.setAccountId(reteFuente);
        //         newLine.setEntityId(standardLines.getLine(i).getEntityId());
        //         newLine.setDepartmentId(standardLines.getLine(i).getDepartmentId());
        //         newLine.setClassId(standardLines.getLine(i).getClassId());
        //         newLine.setLocationId(standardLines.getLine(i).getLocationId());
        //         // }

        //         var newLine = customLines.addNewLine();
        //         newLine.setDebitAmount(standardLines.getLine(0).getCreditAmount());
        //         newLine.setAccountId(accountPaymentMethod);
        //         newLine.setEntityId(standardLines.getLine(i).getEntityId());
        //         newLine.setDepartmentId(standardLines.getLine(i).getDepartmentId());
        //         newLine.setClassId(standardLines.getLine(i).getClassId());
        //         newLine.setLocationId(standardLines.getLine(i).getLocationId());
        //     }
        // } catch (error) {
        //     nlapiLogExecution('ERROR', recordType, error);
        // }

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
                    agregarCustomLines(customLines, 0, detalleProvision.provisionAmount, detalleProvision.costAccount, entityId, deparmentId, classId, locationId);
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
            nlapiLogExecution("ERROR", "CREATEDFROM", createdFrom);
            var fields = ['recordtype', 'statusref']
            var transactionFields = nlapiLookupField('transaction', createdFrom, fields);
            if (transactionFields.recordtype == "salesorder") {
                var salesOrderRecord = nlapiLoadRecord('salesorder', createdFrom);
                var itemCount = salesOrderRecord.getLineItemCount('item');
                var costProvisionAccount = "", costAccount = "", amount = 0, location;
                for (var i = 1; i <= itemCount; i++) {
                    costProvisionAccount = Number(salesOrderRecord.getLineItemValue('item', 'custcol_ht_so_cost_account_provision', i));
                    costAccount = Number(salesOrderRecord.getLineItemValue('item', 'custcol_ht_so_cost_account', i));
                    var esAsientoProvision = salesOrderRecord.getLineItemValue('item', 'custcol_ht_os_asientoprovision', i);
                    location = Number(salesOrderRecord.getLineItemValue('item', 'location', i));
                    nlapiLogExecution("ERROR", "costProvisionAccount " + i, costProvisionAccount);
                    //var inventoryAccount = transactionRecord.getLineItemValue('item', 'custcol_ht_so_inventory_account', i);
                    if (!(esAsientoProvision && esAsientoProvision == "T")) continue;
                    if (!(costProvisionAccount && costAccount)) continue;
                    var itemId = Number(salesOrderRecord.getLineItemValue('item', 'item', i));
                    var itemFields = nlapiLookupField('item', itemId, ["recordtype"]);
                    if (itemFields.recordtype != "serializedassemblyitem") continue;
                    amount = obtenerCostoProvisionDeFactura(salesOrderRecord);
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
                newLine.setAccountId(costAccount);
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
        nlapiLogExecution("ERROR", "Provisión TEST 1", 'INICIO Invoice: ' + id + ' ------------------------------------------------------------------------------------------------');
        try {
            var createdFrom = transactionRecord.getFieldValue('createdfrom');
            nlapiLogExecution("ERROR", "CREATEDFROM", createdFrom);
            if (!createdFrom) return;
            var fields = ['recordtype', 'statusref'];
            var transactionFields = nlapiLookupField('transaction', createdFrom, fields);
            if (transactionFields.recordtype == "salesorder") {
                nlapiLogExecution("ERROR", "Status==============", transactionFields.statusref);
                if (transactionFields.statusref == "pendingFulfillment" || transactionFields.statusref == "partiallyFulfilled" || transactionFields.statusref == "pendingBillingPartFulfilled") {
                    var salesOrderRecord = nlapiLoadRecord('salesorder', createdFrom);
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
                        break;
                    }
                    nlapiLogExecution("ERROR", "amount ", amount);

                    if (amount == 0) return;
                    var entity = standardLines.getLine(0).getEntityId();
                    var department = standardLines.getLine(0).getDepartmentId();
                    var _class = standardLines.getLine(0).getClassId();
                    var newLine = customLines.addNewLine();
                    newLine.setDebitAmount(amount);
                    newLine.setAccountId(costAccount);
                    newLine.setMemo(description);
                    if (entity) newLine.setEntityId(standardLines.getLine(0).getEntityId());
                    if (department) newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
                    if (_class) newLine.setClassId(standardLines.getLine(0).getClassId());
                    newLine.setLocationId(location);
                    nlapiLogExecution("ERROR", "FIRST LINE");

                    var newLine = customLines.addNewLine();
                    newLine.setCreditAmount(amount);
                    newLine.setAccountId(costProvisionAccount);
                    newLine.setMemo(description);
                    if (entity) newLine.setEntityId(standardLines.getLine(0).getEntityId());
                    if (department) newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
                    if (_class) newLine.setClassId(standardLines.getLine(0).getClassId());
                    newLine.setLocationId(location);
                    nlapiSubmitRecord(salesOrderRecord, false, true);

                    nlapiLogExecution("ERROR", "END ");
                } else if (transactionFields.statusref == "pendingBilling" || transactionFields.statusref == "fullyBilled") {
                    nlapiLogExecution("ERROR", "customrecord_ht_dp_detalle_provision", "");

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

                    nlapiLogExecution("ERROR", "provisionAccount", provisionAccount);
                    var newLine = customLines.addNewLine();
                    newLine.setCreditAmount(amount);
                    newLine.setAccountId(Number(provisionAccount));
                    newLine.setEntityId(standardLines.getLine(0).getEntityId());
                    newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
                    newLine.setClassId(standardLines.getLine(0).getClassId());
                    newLine.setLocationId(standardLines.getLine(0).getLocationId());
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
                agregarCustomLines(customLines, detalleProvision.provisionAmount, 0, detalleProvision.incomeAccount, entityId, deparmentId, classId, locationId);
                agregarCustomLines(customLines, 0, detalleProvision.provisionAmount, detalleProvision.provisionAccount, entityId, deparmentId, classId, locationId);
            }
        }
    }

    if (recordType == 'customerpayment') {
        var fondoSinDepositar = transactionRecord.getFieldValue('undepfunds');
        var cuentaAR = Number(transactionRecord.getFieldValue('aracct'));
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

        if (fondoSinDepositar == true || fondoSinDepositar == 'T') {
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
        }

    }

    if (recordType == 'expensereport') {
        //aplicarImpuestoRetencion(transactionRecord, customLines);
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
        ["19", "43"], //CCD - CONTROL DE CUSTODIAS DE DISPOSITIVOS
        ["11", "2"], //ALQ - PRODUCTO DE ALQUILER
        ["56", "2"], //PGR - PRODUCTO DE GARANTÍA
        ["8", "103"], //TDP - TIPO DE PRODUCTO --- 009 - DEMO
        ["8", "107"], //TDP - TIPO DE PRODUCTO --- 013 - SOFTWARE GENERAL
        ["44", "2"], //IRP - ITEM DE REPUESTO
        ["45", "2"]  //MPT - MANEJA PROCESOS DE TALLER
    ]
}

function obtenerParametrizacionAConsiderar() {
    return [
        ["80", "111"], //TMI - TIPO DE MOVIMIENTO DE INVENTARIO
        ["2", "31"], //ADP - ACCION DEL PRODUCTO
        ["32", "2"] //GOT - GENERA SOLICITUD DE TRABAJO
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
        var quantity = Number(salesOrderRecord.getLineItemValue('item', 'quantity', i));
        //var averageCost = Number(salesOrderRecord.getLineItemValue('item', 'averagecost', i));
        var averageCost = obtenerCostoPromedio(itemId, location);
        provisionAmount = quantity * averageCost;
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

function agregarCustomLines(customLines, debit, credit, account, entity, department, classId, location) {

    var newLine = customLines.addNewLine();
    if (debit) newLine.setDebitAmount(Number(debit));
    else if (credit) newLine.setCreditAmount((credit));
    newLine.setAccountId(Number(account));
    if (entity) newLine.setEntityId(Number(entity));
    if (department) newLine.setDepartmentId(Number(department));
    if (classId) newLine.setClassId(Number(classId));
    if (location) newLine.setLocationId(Number(location));
}

function validarGLCosteoFactura(itemId) {
    var parametrizaciones = obtenerParametrizacionNoConsiderar();
    var filtrosBusqueda = obtenerFiltrosBusqueda(itemId, parametrizaciones);
    nlapiLogExecution("ERROR", "filtrosBusqueda", JSON.stringify(filtrosBusqueda));
    var parametrizacionesNoConsiderar = nlapiSearchRecord("customrecord_ht_pp_main_param_prod", null, filtrosBusqueda, [new nlobjSearchColumn("custrecord_ht_pp_parametrizacionid")]);

    parametrizaciones = obtenerParametrizacionAConsiderar();
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