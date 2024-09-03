    function customizeGlImpact(transactionRecord, standardLines, customLines, book) {
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
    }