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
            // debitAccount = transactionRecord.getFieldValue('account')
            // creditAccount = transactionRecord.getFieldValue('account')
            nlapiLogExecution("DEBUG", "debitAccount", debitAccount);
            nlapiLogExecution("DEBUG", "creditAccount", creditAccount);

            var countStandard = parseInt(standardLines.getCount());

            //JCEC logica nueva para el calculo de debito y credito
            var newDebitTotal = 0;
            var newCreditTotal = 0;
            for (var i = 1; i < countStandard; i++) {
                var itemID = standardLines.getLine(i).getAccountId();
                if (itemID == account) {
                    if (Number(standardLines.getLine(i).getCreditAmount()) > 1 || Number(standardLines.getLine(i).getDebitAmount()) > 1) {
                        flag = i;
                    }

                    var total_debit = Math.round(Math.abs(standardLines.getLine(i).getDebitAmount())) * -1;
                    var debit = total_debit + Math.abs(standardLines.getLine(i).getDebitAmount()) || 0;

                    var total_credit = Math.round(Math.abs(standardLines.getLine(i).getCreditAmount())) * -1;
                    var credit = total_credit + Math.abs(standardLines.getLine(i).getCreditAmount()) || 0;

                    nlapiLogExecution("ERROR", "MONTO parseados", debit + '- >> ' + credit);
                    nlapiLogExecution("ERROR", "Motitos credit", credit + '- >> ' + standardLines.getLine(i).getCreditAmount() + '- >> ' + ((standardLines.getLine(i).getCreditAmount()).toString()).split('.'));
                    debitTotal = debitTotal + debit;
                    creditTotal = creditTotal + credit;
                    nlapiLogExecution("ERROR", "MONTO", debitTotal + '- >> ' + creditTotal);

                    // JCEC logica nueva para el calculo de debito y credito
                    newDebitTotal += Number(standardLines.getLine(i).getDebitAmount());
                    newCreditTotal += Number(standardLines.getLine(i).getCreditAmount());
                }
            }

            //INCIO JCEC logica nueva para el calculo de debito y credito
            //extraemos los decimales de los montos
            nlapiLogExecution("ERROR", "REDONDEO Total", "newDebitTotal -> " + newDebitTotal + " - newCreditTotal -> " + newCreditTotal);
            var newRedondeo = (newDebitTotal - newCreditTotal).toString().split('.')[1] || 0;
            newRedondeo = '0.' + newRedondeo;
            newRedondeo = Number(newRedondeo);
            nlapiLogExecution("ERROR", "newRedondeo", newRedondeo);
            newRedondeo = Math.abs(newRedondeo);

            // redondeo = debitTotal - creditTotal;
            redondeo = newRedondeo;

            //FIN JCEC logica nueva para el calculo de debito y credito
            nlapiLogExecution("ERROR", "redondeo", redondeo);
            if (redondeo != 0) {
                nlapiLogExecution("ERROR", "Condición GL", Math.abs(redondeo) + ' > 0.49');
                if (Math.abs(redondeo) > 0.49) {
                    var montoRedondo = 1 - Math.abs(redondeo);
                    nlapiLogExecution("ERROR", "montoRedondo", montoRedondo);
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
                        nlapiLogExecution("ERROR", "HERE", 'Aplica la creación de las líneas');
                        var newLine = customLines.addNewLine();
                        newLine.setCreditAmount(Math.abs(redondeo));
                        newLine.setAccountId(Number(creditAccount));
                        newLine.setDepartmentId(standardLines.getLine(flag).getDepartmentId());
                        newLine.setClassId(standardLines.getLine(flag).getClassId());
                        newLine.setLocationId(standardLines.getLine(flag).getLocationId());

                        var newLine = customLines.addNewLine();
                        newLine.setDebitAmount(Math.abs(redondeo));
                        newLine.setAccountId(Number(account));
                        newLine.setDepartmentId(standardLines.getLine(flag).getDepartmentId());
                        newLine.setClassId(standardLines.getLine(flag).getClassId());
                        newLine.setLocationId(standardLines.getLine(flag).getLocationId());

                    }
                    nlapiLogExecution("ERROR", "REDONDEO", redondeo.toFixed(2));
                }
            }
        } 
        // else {
        //     //*================================================================================
        //     var countStandard = parseInt(standardLines.getCount());
        //     try {
        //         for (var i = 1; i < countStandard; i++) {
        //             // var book_dev = standardLines.getLine(i).isBookSpecific();
        //             var account_dev = standardLines.getLine(i).getAccountId();
        //             var debit_dev = standardLines.getLine(i).getDebitAmount();
        //             var credit_dev = standardLines.getLine(i).getCreditAmount();
        //             var entity_dev = standardLines.getLine(i).getEntityId();
        //             var entity_dev2 = "";
        //             // if (entity_dev != null) {
        //             //     entity_dev2 = standardLines.getLine(i).getEntityId();
        //             // }

        //             if (entity_dev == null) {
        //                 nlapiLogExecution("DEBUG", "DEV", "entity_dev2: " + 35030);
        //                 standardLines.setEntityId(i, 35030);
        //             }
        //             nlapiLogExecution("DEBUG", "creditAccount", "account_dev: " + account_dev + " - " + "debit_dev: " + debit_dev + " - " + "credit_dev: " + credit_dev + " - " + "entity_dev: " + entity_dev);
        //         }
        //     } catch (error) {
        //         nlapiLogExecution('ERROR', 'Error', error);
        //     }


        //     //*================================================================================
        // }
    }
}