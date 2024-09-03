function customizeGlImpact(transactionRecord, standardLines, customLines, book) {
    var recordType = transactionRecord.getRecordType();

    if (recordType == 'vendorbill') {
        var currency = transactionRecord.getFieldValue('currency');
        nlapiLogExecution("DEBUG", "Record", 'vendorbill');
        if (currency == 1) {
            var debitTotal = 0, creditTotal = 0, redondeo = 0, flag = 0;
            var account = nlapiLookupField('subsidiary', transactionRecord.getFieldValue('subsidiary'), 'custrecord_pe_detraccion_account_dol');
            nlapiLogExecution("DEBUG", "account", account);
            var debitAccount = nlapiLookupField('customrecord_pe_detraction_account', 1, 'custrecord_pe_debit_account')
            var creditAccount = nlapiLookupField('customrecord_pe_detraction_account', 1, 'custrecord_pe_credit_account')
            debitAccount = transactionRecord.getFieldValue('account')
            creditAccount = transactionRecord.getFieldValue('account')
            nlapiLogExecution("DEBUG", "debitAccount", debitAccount);
            nlapiLogExecution("DEBUG", "creditAccount", creditAccount);
            /*var searchFilters = new Array();
            searchFilters[0] = new nlobjSearchFilter('type', null, 'anyof','Discount');
            searchFilters[1] = new nlobjSearchFilter('account', null, 'anyof',account);
    
            var searchColumns = new Array();
            searchColumns[0] = new nlobjSearchColumn('internalid');
    
            var searchResults = nlapiSearchRecord('discountitem', null, searchFilters, searchColumns);
    
            if (searchResults!=null && searchResults.length > 0){
                var itemDis =  searchResults[0].getValue('internalid');
                nlapiLogExecution("ERROR", "itemDis", itemDis);
            }*/

            var countStandard = parseInt(standardLines.getCount());
            for (var i = 1; i < countStandard; i++) {
                var itemID = standardLines.getLine(i).getAccountId();
                if (itemID == account) {
                    /*if(Number(standardLines.getLine(i).getDebitAmount()) > 0 ){
                        if(Number(standardLines.getLine(i).getDebitAmount()) > 1){
                            flag = 'Debit';
                        }
                        flagDebit = true;
                        if(monto_1 != 0){
                            monto_1 = standardLines.getLine(i).getDebitAmount() - Number(standardLines.getLine(i).getDebitAmount()).toFixed();
                        }else{
                            monto_2 = standardLines.getLine(i).getDebitAmount() - Number(standardLines.getLine(i).getDebitAmount()).toFixed();
                        }
                        
                    }
    
                    if(Number(standardLines.getLine(i).getCreditAmount()) > 0){
                        if(Number(standardLines.getLine(i).getCreditAmount()) > 1){
                            flag = 'Credit';
                        }
                        flagCredit = true;
                        if(monto_1 != 0){
                            monto_1 = standardLines.getLine(i).getCreditAmount() - Number(standardLines.getLine(i).getCreditAmount()).toFixed();
                        }else{
                            monto_2 = standardLines.getLine(i).getCreditAmount() - Number(standardLines.getLine(i).getCreditAmount()).toFixed();
                        }
                    }*/
                    if (Number(standardLines.getLine(i).getCreditAmount()) > 1 || Number(standardLines.getLine(i).getDebitAmount()) > 1) {
                        flag = i;
                    }

                    /*var debit = standardLines.getLine(i).getDebitAmount() - Number(standardLines.getLine(i).getDebitAmount()).toFixed();
                    var credit = standardLines.getLine(i).getCreditAmount() - Number(standardLines.getLine(i).getCreditAmount()).toFixed();*/


                    var total_debit = Math.round(Math.abs(standardLines.getLine(i).getDebitAmount())) * -1;
                    var debit = total_debit + Math.abs(standardLines.getLine(i).getDebitAmount()) || 0;

                    var total_credit = Math.round(Math.abs(standardLines.getLine(i).getCreditAmount())) * -1;
                    var credit = total_credit + Math.abs(standardLines.getLine(i).getCreditAmount()) || 0;

                    /*var debit = ((standardLines.getLine(i).getDebitAmount()).toString()).split('.');
                    debit = Number(debit[1]) /100 || 0;
                    var credit = ((standardLines.getLine(i).getCreditAmount()).toString()).split('.')
                    credit = Number(credit[1]) /100 || 0;*/
                    nlapiLogExecution("ERROR", "MONTO parseados", debit + '- >> ' + credit);
                    nlapiLogExecution("ERROR", "Motitos credit", credit + '- >> ' + standardLines.getLine(i).getCreditAmount() + '- >> ' + ((standardLines.getLine(i).getCreditAmount()).toString()).split('.'));
                    debitTotal = debitTotal + debit;
                    creditTotal = creditTotal + credit;
                    nlapiLogExecution("ERROR", "MONTO", debitTotal + '- >> ' + creditTotal);
                }

            }

            redondeo = debitTotal - creditTotal;
            nlapiLogExecution("ERROR", "redondeo", redondeo);
            if (redondeo != 0) {
                if (Math.abs(redondeo) > 0.49) {
                    var montoRedondo = 1 - Math.abs(redondeo);
                    if (montoRedondo < 0) {
                        var newLine = customLines.addNewLine();
                        newLine.setDebitAmount(Math.abs(montoRedondo));
                        newLine.setAccountId(Number(account));
                        newLine.setDepartmentId(standardLines.getLine(flag).getDepartmentId());
                        newLine.setClassId(standardLines.getLine(flag).getClassId());
                        newLine.setLocationId(standardLines.getLine(flag).getLocationId());

                        var newLine = customLines.addNewLine();
                        newLine.setCreditAmount(Math.abs(montoRedondo));
                        newLine.setAccountId(Number(creditAccount));
                        newLine.setDepartmentId(standardLines.getLine(flag).getDepartmentId());
                        newLine.setClassId(standardLines.getLine(flag).getClassId());
                        newLine.setLocationId(standardLines.getLine(flag).getLocationId());

                    } else {
                        var newLine = customLines.addNewLine();
                        newLine.setCreditAmount(Math.abs(montoRedondo));
                        newLine.setAccountId(Number(account));
                        newLine.setDepartmentId(standardLines.getLine(flag).getDepartmentId());
                        newLine.setClassId(standardLines.getLine(flag).getClassId());
                        newLine.setLocationId(standardLines.getLine(flag).getLocationId());

                        var newLine = customLines.addNewLine();
                        newLine.setDebitAmount(Math.abs(montoRedondo));
                        newLine.setAccountId(Number(debitAccount));
                        newLine.setDepartmentId(standardLines.getLine(flag).getDepartmentId());
                        newLine.setClassId(standardLines.getLine(flag).getClassId());
                        newLine.setLocationId(standardLines.getLine(flag).getLocationId());
                    }
                } else {
                    if (redondeo < 0) {
                        nlapiLogExecution("ERROR", "AQUIIII", redondeo.toFixed(2) + ' -> ' + typeof (account));
                        var newLine = customLines.addNewLine();
                        newLine.setDebitAmount(Math.abs(redondeo));
                        newLine.setAccountId(Number(account));
                        newLine.setDepartmentId(standardLines.getLine(flag).getDepartmentId());
                        newLine.setClassId(standardLines.getLine(flag).getClassId());
                        newLine.setLocationId(standardLines.getLine(flag).getLocationId());

                        var newLine = customLines.addNewLine();
                        newLine.setCreditAmount(Math.abs(redondeo));
                        newLine.setAccountId(Number(creditAccount));
                        newLine.setDepartmentId(standardLines.getLine(flag).getDepartmentId());
                        newLine.setClassId(standardLines.getLine(flag).getClassId());
                        newLine.setLocationId(standardLines.getLine(flag).getLocationId());

                    } else {
                        var newLine = customLines.addNewLine();
                        newLine.setCreditAmount(Math.abs(redondeo));
                        newLine.setAccountId(Number(account));
                        newLine.setDepartmentId(standardLines.getLine(flag).getDepartmentId());
                        newLine.setClassId(standardLines.getLine(flag).getClassId());
                        newLine.setLocationId(standardLines.getLine(flag).getLocationId());

                        var newLine = customLines.addNewLine();
                        newLine.setDebitAmount(Math.abs(redondeo));
                        newLine.setAccountId(Number(debitAccount));
                        newLine.setDepartmentId(standardLines.getLine(flag).getDepartmentId());
                        newLine.setClassId(standardLines.getLine(flag).getClassId());
                        newLine.setLocationId(standardLines.getLine(flag).getLocationId());

                    }
                    nlapiLogExecution("ERROR", "REDONDEO", redondeo.toFixed(2));
                }
            }
        }


        /*if(redondeo != 0){
            if(){
                var newLine = customLines.addNewLine();
                newLine.setCreditAmount(0.01);
                newLine.setAccountId(3042);
                newLine.setEntityId(standardLines.getLine(0).getEntityId());
                newLine.setDepartmentId(standardLines.getLine(1).getDepartmentId());
                newLine.setClassId(standardLines.getLine(1).getClassId());
                newLine.setLocationId(standardLines.getLine(1).getLocationId());
            }else{
    
            }
            nlapiLogExecution("ERROR", "REDONDEO", redondeo );
        }
    
    
    
        
    
        nlapiLogExecution("ERROR", "TEST", standardLines.getLine(1).getEntityId());
        nlapiLogExecution("ERROR", "TEST", standardLines.getLine(1).getDepartmentId());
        nlapiLogExecution("ERROR", "TEST", standardLines.getLine(1).getClassId());
        nlapiLogExecution("ERROR", "TEST", standardLines.getLine(1).getLocationId());
    
        var newLine = customLines.addNewLine();
        newLine.setCreditAmount(0.01);
        newLine.setAccountId(3042);
        newLine.setEntityId(standardLines.getLine(0).getEntityId());
        newLine.setDepartmentId(standardLines.getLine(1).getDepartmentId());
        newLine.setClassId(standardLines.getLine(1).getClassId());
        newLine.setLocationId(standardLines.getLine(1).getLocationId());
    
        var newLine = customLines.addNewLine();
        newLine.setDebitAmount(0.01);
        newLine.setAccountId(2366);
        newLine.setEntityId(standardLines.getLine(0).getEntityId());
        newLine.setDepartmentId(standardLines.getLine(1).getDepartmentId());
        newLine.setClassId(standardLines.getLine(1).getClassId());
        newLine.setLocationId(standardLines.getLine(1).getLocationId());
        nlapiLogExecution("DEBUG", "END", "");*/
    }
}
/*
        //nlapiLogExecution("DEBUG", "Inicio", 'INICIO-----------------------------');
        var accountToCredit = 0;
        var accountToDebit = 0;
        var accountMatchConsig = 0;
        var recordType = transactionRecord.getRecordType();
        var esconsignacion = transactionRecord.getFieldValue('custbody_pe_es_consignacion');
        var typeCreatedFrom = transactionRecord.getFieldValue('custbody_pe_flag_created_from');
        nlapiLogExecution("DEBUG", "TypeCreatedFrom", typeCreatedFrom);
        if (typeCreatedFrom == 'salesorder') {
            accountToCredit = 2975; //COSTO MERCADERIA IBERO 691210 - L6
            accountToDebit = 669; //201110 COSTO MERCADERIA NACIONAL 201110 - L6
            accountMatchConsig = 123; //Reembolsos a pagar
        } else if (typeCreatedFrom == 'transferorder') {
            accountToCredit = 216; //Inventario en tránsito
            accountToDebit = 669; //201110 COSTO MERCADERIA NACIONAL 201110 - L6
            accountMatchConsig = 217; //Inventario externo en tránsito
        }

        if (recordType == 'itemreceipt') {
            nlapiLogExecution("DEBUG", "Consignación", 'INICIO Item Receipt -------------------------------------------------');
            try {
                if (typeCreatedFrom == 'purchaseorder' && esconsignacion == 'T') {
                    var countStandard = parseInt(standardLines.getCount());
                    for (var i = 1; i < countStandard; i++) {
                        var sku = transactionRecord.getLineItemText('item', 'item', i);
                        var newLine = customLines.addNewLine();
                        newLine.setDebitAmount(standardLines.getLine(i).getDebitAmount());
                        newLine.setAccountId(123);
                        newLine.setMemo(sku);
                        var newLine = customLines.addNewLine();
                        newLine.setCreditAmount(standardLines.getLine(i).getDebitAmount());
                        newLine.setAccountId(standardLines.getLine(i).getAccountId());
                        newLine.setMemo(sku);
                        nlapiLogExecution("DEBUG", "ITEM", sku + ' - is consig');
                    }
                } else if (typeCreatedFrom == 'transferorder') {
                    nlapiLogExecution("DEBUG", "transferorder", 'Item Receipt');
                    var countStandard = parseInt(standardLines.getCount());
                    var countTransaction = transactionRecord.getLineItemCount('item');
                    var j = 1
                    for (var i = 1; i < countStandard; i++) {
                        if (j > countTransaction) {
                            break;
                        }
                        var isConsig = transactionRecord.getLineItemValue('item', 'custcol_pe_aplicar_consignacion', j);
                        var averageCost = transactionRecord.getLineItemValue('item', 'custcol_pe_average_cost', j);
                        var quantityConsig = transactionRecord.getLineItemValue('item', 'custcol_pe_cantidad_consignada', j);
                        var amountConsig = parseFloat(averageCost) * parseInt(quantityConsig);
                        var sku = transactionRecord.getLineItemText('item', 'item', j);
                        var account = standardLines.getLine(i).getAccountId();
                        if (account == accountToDebit) {
                            if (isConsig == 'T') {
                                var newLine = customLines.addNewLine();
                                //newLine.setCreditAmount(standardLines.getLine(i).getDebitAmount());
                                newLine.setCreditAmount(amountConsig);
                                newLine.setAccountId(accountMatchConsig); //214 //2974
                                newLine.setEntityId(standardLines.getLine(i).getEntityId());
                                newLine.setDepartmentId(standardLines.getLine(i).getDepartmentId());
                                newLine.setClassId(standardLines.getLine(i).getClassId());
                                newLine.setLocationId(standardLines.getLine(i).getLocationId());
                                newLine.setMemo(sku);
                            }
                        } else if (account == accountToCredit) {
                            if (isConsig == 'T') {
                                var newLine = customLines.addNewLine();
                                // newLine.setDebitAmount(standardLines.getLine(i).getCreditAmount());
                                newLine.setDebitAmount(amountConsig);
                                newLine.setAccountId(accountToDebit);
                                newLine.setEntityId(standardLines.getLine(i).getEntityId());
                                newLine.setDepartmentId(standardLines.getLine(i).getDepartmentId());
                                newLine.setClassId(standardLines.getLine(i).getClassId());
                                newLine.setLocationId(standardLines.getLine(i).getLocationId());
                                newLine.setMemo(sku);
                                j++;
                                nlapiLogExecution("DEBUG", "ITEM", sku + ' - is consig');
                            } else {
                                j++;
                            }
                        }
                    }
                }
            } catch (error) {
                nlapiLogExecution('ERROR', 'ItemReceipt', error);
            }
            nlapiLogExecution("DEBUG", "Consignación", 'FINISH Item Receipt -------------------------------------------------');
        } else if (recordType == 'itemfulfillment') {
            nlapiLogExecution("DEBUG", "Consignación", 'INICIO Item Fulfillment -------------------------------------------------');
            try {
                if (typeCreatedFrom == 'salesorder') {
                    var countStandard = parseInt(standardLines.getCount());
                    var countTransaction = transactionRecord.getLineItemCount('item');
                    var j = 1
                    for (var i = 1; i < countStandard; i++) {
                        if (j > countTransaction) {
                            break;
                        }
                        var isConsig = transactionRecord.getLineItemValue('item', 'custcol_pe_aplicar_consignacion', j);
                        var averageCost = transactionRecord.getLineItemValue('item', 'custcol_pe_average_cost', j);
                        var quantityConsig = transactionRecord.getLineItemValue('item', 'custcol_pe_cantidad_consignada', j);
                        var amountConsig = parseFloat(averageCost) * parseInt(quantityConsig);
                        var sku = transactionRecord.getLineItemText('item', 'item', j);
                        var account = standardLines.getLine(i).getAccountId();
                        if (account == accountToCredit) {
                            if (isConsig == 'T') {
                                var newLine = customLines.addNewLine();
                                //newLine.setCreditAmount(standardLines.getLine(i).getDebitAmount());
                                newLine.setCreditAmount(amountConsig);
                                newLine.setAccountId(accountMatchConsig); //214 //2974
                                newLine.setEntityId(standardLines.getLine(i).getEntityId());
                                newLine.setDepartmentId(standardLines.getLine(i).getDepartmentId());
                                newLine.setClassId(standardLines.getLine(i).getClassId());
                                newLine.setLocationId(standardLines.getLine(i).getLocationId());
                                newLine.setMemo(sku);
                            }
                        } else if (account == accountToDebit) {
                            if (isConsig == 'T') {
                                var newLine = customLines.addNewLine();
                                // newLine.setDebitAmount(standardLines.getLine(i).getCreditAmount());
                                newLine.setDebitAmount(amountConsig);
                                newLine.setAccountId(accountToDebit);
                                newLine.setEntityId(standardLines.getLine(i).getEntityId());
                                newLine.setDepartmentId(standardLines.getLine(i).getDepartmentId());
                                newLine.setClassId(standardLines.getLine(i).getClassId());
                                newLine.setLocationId(standardLines.getLine(i).getLocationId());
                                newLine.setMemo(sku);
                                j++;
                                nlapiLogExecution("DEBUG", "ITEM", sku + ' - is consig');
                            } else {
                                j++;
                            }
                        }
                    }
                } else if (typeCreatedFrom == 'vendorreturnauthorization' && esconsignacion == 'T') {
                    var countStandard = parseInt(standardLines.getCount());
                    nlapiLogExecution("DEBUG", "LINES", countStandard);
                    var sku = '';
                    var entity = '';
                    var department = '';
                    var clase = '';
                    var location = '';
                    for (var i = 1; i < countStandard; i++) {
                        if (transactionRecord.getLineItemText('item', 'item', i) != null) {
                            sku = transactionRecord.getLineItemText('item', 'item', i);
                            entity = standardLines.getLine(i).getEntityId();
                            department = standardLines.getLine(i).getDepartmentId();
                            clase = standardLines.getLine(i).getClassId();
                            location = standardLines.getLine(i).getLocationId();
                        }
                        if (standardLines.getLine(i).getCreditAmount() != 0) {
                            var newLine = customLines.addNewLine();
                            newLine.setCreditAmount(standardLines.getLine(i).getCreditAmount());
                            newLine.setAccountId(122);
                            newLine.setEntityId(entity);
                            newLine.setDepartmentId(department);
                            newLine.setClassId(clase);
                            newLine.setLocationId(location);
                            newLine.setMemo(sku);
 
                            var newLine = customLines.addNewLine();
                            newLine.setDebitAmount(standardLines.getLine(i).getCreditAmount());
                            newLine.setAccountId(standardLines.getLine(i).getAccountId());
                            newLine.setEntityId(entity);
                            newLine.setDepartmentId(department);
                            newLine.setClassId(clase);
                            newLine.setLocationId(location);
                            newLine.setMemo(sku);
 
                            nlapiLogExecution("DEBUG", "ITEM", sku + ' - is consig');
                            // nlapiLogExecution("DEBUG", "DEBIT", 'line: ' + i + ' - amount: ' + standardLines.getLine(i).getDebitAmount());
                            nlapiLogExecution("DEBUG", "CREDIT", 'line: ' + i + ' - amount: ' + standardLines.getLine(i).getCreditAmount());
                        }
                        // nlapiLogExecution("DEBUG", "ITEM", sku + ' - is consig');
                        // nlapiLogExecution("DEBUG", "DEBIT", 'line: ' + i + ' - amount: ' + standardLines.getLine(i).getDebitAmount());
                        // nlapiLogExecution("DEBUG", "CREDIT", 'line: ' + i + ' - amount: ' + standardLines.getLine(i).getCreditAmount());
 
                    }
                } else if (typeCreatedFrom == 'transferorder') {
                    // var countStandard = parseInt(standardLines.getCount());
                    // nlapiLogExecution("DEBUG", "LINES", countStandard);
                    // var sku = '';
                    // var entity = '';
                    // var department = '';
                    // var clase = '';
                    // var location = '';
                    // for (var i = 1; i < countStandard; i++) {
                    //     var isConsig = transactionRecord.getLineItemValue('item', 'custcol_pe_aplicar_consignacion', j);
                    //     var averageCost = transactionRecord.getLineItemValue('item', 'custcol_pe_average_cost', j);
                    //     var quantityConsig = transactionRecord.getLineItemValue('item', 'custcol_pe_cantidad_consignada', j);
                    //     var amountConsig = parseFloat(averageCost) * parseInt(quantityConsig);
                    //     if (transactionRecord.getLineItemText('item', 'item', i) != null) {
                    //         sku = transactionRecord.getLineItemText('item', 'item', i);
                    //         entity = standardLines.getLine(i).getEntityId();
                    //         department = standardLines.getLine(i).getDepartmentId();
                    //         clase = standardLines.getLine(i).getClassId();
                    //         location = standardLines.getLine(i).getLocationId();
                    //     }
                    //     if (standardLines.getLine(i).getCreditAmount() != 0) {
                    //         var newLine = customLines.addNewLine();
                    //         newLine.setCreditAmount(standardLines.getLine(i).getCreditAmount());
                    //         newLine.setAccountId(122);
                    //         newLine.setEntityId(entity);
                    //         newLine.setDepartmentId(department);
                    //         newLine.setClassId(clase);
                    //         newLine.setLocationId(location);
                    //         newLine.setMemo(sku);
 
                    //         var newLine = customLines.addNewLine();
                    //         newLine.setDebitAmount(standardLines.getLine(i).getCreditAmount());
                    //         newLine.setAccountId(standardLines.getLine(i).getAccountId());
                    //         newLine.setEntityId(entity);
                    //         newLine.setDepartmentId(department);
                    //         newLine.setClassId(clase);
                    //         newLine.setLocationId(location);
                    //         newLine.setMemo(sku);
 
                    //         nlapiLogExecution("DEBUG", "ITEM", sku + ' - is consig');
                    //         // nlapiLogExecution("DEBUG", "DEBIT", 'line: ' + i + ' - amount: ' + standardLines.getLine(i).getDebitAmount());
                    //         nlapiLogExecution("DEBUG", "CREDIT", 'line: ' + i + ' - amount: ' + standardLines.getLine(i).getCreditAmount());
                    //     }
                    //     // nlapiLogExecution("DEBUG", "ITEM", sku + ' - is consig');
                    //     // nlapiLogExecution("DEBUG", "DEBIT", 'line: ' + i + ' - amount: ' + standardLines.getLine(i).getDebitAmount());
                    //     // nlapiLogExecution("DEBUG", "CREDIT", 'line: ' + i + ' - amount: ' + standardLines.getLine(i).getCreditAmount());
                    // }
 
                    var countStandard = parseInt(standardLines.getCount());
                    var countTransaction = transactionRecord.getLineItemCount('item');
                    var j = 1
                    for (var i = 1; i < countStandard; i++) {
                        if (j > countTransaction) {
                            break;
                        }
                        var isConsig = transactionRecord.getLineItemValue('item', 'custcol_pe_aplicar_consignacion', j);
                        var averageCost = transactionRecord.getLineItemValue('item', 'custcol_pe_average_cost', j);
                        var quantityConsig = transactionRecord.getLineItemValue('item', 'custcol_pe_cantidad_consignada', j);
                        var amountConsig = parseFloat(averageCost) * parseInt(quantityConsig);
                        var sku = transactionRecord.getLineItemText('item', 'item', j);
                        var account = standardLines.getLine(i).getAccountId();
                        if (account == accountToCredit) {
                            if (isConsig == 'T') {
                                var newLine = customLines.addNewLine();
                                //newLine.setCreditAmount(standardLines.getLine(i).getDebitAmount());
                                newLine.setCreditAmount(amountConsig);
                                newLine.setAccountId(accountMatchConsig); //214 //2974
                                newLine.setEntityId(standardLines.getLine(i).getEntityId());
                                newLine.setDepartmentId(standardLines.getLine(i).getDepartmentId());
                                newLine.setClassId(standardLines.getLine(i).getClassId());
                                newLine.setLocationId(standardLines.getLine(i).getLocationId());
                                newLine.setMemo(sku);
                            }
                        } else if (account == accountToDebit) {
                            if (isConsig == 'T') {
                                var newLine = customLines.addNewLine();
                                // newLine.setDebitAmount(standardLines.getLine(i).getCreditAmount());
                                newLine.setDebitAmount(amountConsig);
                                newLine.setAccountId(accountToDebit);
                                newLine.setEntityId(standardLines.getLine(i).getEntityId());
                                newLine.setDepartmentId(standardLines.getLine(i).getDepartmentId());
                                newLine.setClassId(standardLines.getLine(i).getClassId());
                                newLine.setLocationId(standardLines.getLine(i).getLocationId());
                                newLine.setMemo(sku);
                                j++;
                                nlapiLogExecution("DEBUG", "ITEM", sku + ' - is consig');
                            } else {
                                j++;
                            }
                        }
                    }
                }
            } catch (error) {
                nlapiLogExecution('ERROR', 'ItemFulfillment', error);
            }
            nlapiLogExecution("DEBUG", "Consignación", 'FIN Item Fulfillment -------------------------------------------------');
        } else if (recordType == 'cashsale') {
            nlapiLogExecution("DEBUG", "Consignación", 'INICIO Cash Sale -------------------------------------------------');
            try {
                var countStandard = parseInt(standardLines.getCount());
                var countTransaction = transactionRecord.getLineItemCount('item');
                var j = 1
                for (var i = 1; i < countStandard; i++) {
                    if (j > countTransaction) {
                        break;
                    }
                    //var invDetailOnLine = transactionRecord.viewLineItemSubrecord('item', 'inventorydetail', j);
 
                    var isConsig = transactionRecord.getLineItemValue('item', 'custcol_pe_aplicar_consignacion', j);
                    var averageCost = transactionRecord.getLineItemValue('item', 'averagecost', j);
                    var quantityConsig = transactionRecord.getLineItemValue('item', 'custcol_pe_cantidad_consignada', j);
                    var amountConsig = parseFloat(averageCost) * parseInt(quantityConsig);
                    var sku = transactionRecord.getLineItemText('item', 'item', j);
                    var account = standardLines.getLine(i).getAccountId();
                    if (account == 2975) { //ArtCondig : 2974 - OtherArt: 2975
                        if (isConsig == 'T') {
                            nlapiLogExecution("DEBUG", "SKU", sku);
                            var newLine = customLines.addNewLine();
                            //newLine.setCreditAmount(standardLines.getLine(i).getDebitAmount());
                            newLine.setCreditAmount(amountConsig);
                            newLine.setAccountId(123); //214 //2974
                            newLine.setEntityId(standardLines.getLine(i).getEntityId());
                            newLine.setDepartmentId(standardLines.getLine(i).getDepartmentId());
                            newLine.setClassId(standardLines.getLine(i).getClassId());
                            newLine.setLocationId(standardLines.getLine(i).getLocationId());
                            newLine.setMemo(sku);
                            // nlapiLogExecution("DEBUG", "ROWS", account + ' - ' + standardLines.getLine(i).getDebitAmount() + ' - ' + standardLines.getLine(i).getCreditAmount());
                        }
                    } else if (account == 669) { //ArtCondig : 669 - OtherArt: 671
                        if (isConsig == 'T') {
                            var newLine = customLines.addNewLine();
                            //newLine.setDebitAmount(standardLines.getLine(i).getCreditAmount());
                            newLine.setDebitAmount(amountConsig);
                            newLine.setAccountId(669);
                            newLine.setEntityId(standardLines.getLine(i).getEntityId());
                            newLine.setDepartmentId(standardLines.getLine(i).getDepartmentId());
                            newLine.setClassId(standardLines.getLine(i).getClassId());
                            newLine.setLocationId(standardLines.getLine(i).getLocationId());
                            newLine.setMemo(sku);
                            j++;
                            nlapiLogExecution("DEBUG", "ITEM", sku + ' - is consig');
                            // nlapiLogExecution("DEBUG", "SUCCESS", 'Es consig Line -' + sku);
                        } else {
                            j++;
                            // nlapiLogExecution("DEBUG", "FAIL", 'No es consig Line -' + j);
                        }
                    }
                    // var account = standardLines.getLine(i).getAccountId();
                    // var debit = standardLines.getLine(i).getDebitAmount();
                    // var credit = standardLines.getLine(i).getCreditAmount();
                    // nlapiLogExecution("DEBUG", "ROWS", account + ' - ' + debit + ' - ' + credit);
                }
            } catch (error) {
                nlapiLogExecution('ERROR', 'Cash Sale', error);
            }
            nlapiLogExecution("DEBUG", "Consignación", 'FIN Cash Sale -----------------------------------------------------');
        }
    }*/