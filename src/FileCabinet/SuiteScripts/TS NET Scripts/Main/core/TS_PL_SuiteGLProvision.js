//https://7451241-sb1.app.netsuite.com/app/common/scripting/plugin.nl?id=818&id=818&whence=
function customizeGlImpact(transactionRecord, standardLines, customLines, book) {
    var recordType = transactionRecord.getRecordType();
    var id = transactionRecord.getId();

    if (recordType == 'itemfulfillment') {
        nlapiLogExecution("DEBUG", "Provisión", 'INICIO Item Fulfillment: ' + id + ' ------------------------------------------------------------------------------------------------');
        var i = 1;
        try {
            var createdFrom = transactionRecord.getFieldValue('createdfrom');
            nlapiLogExecution("DEBUG", "CREATEDFROM", createdFrom);
            var s = nlapiSearchRecord("customrecord_ht_dp_detalle_provision", null,
                [
                    ["custrecord_ht_dp_transaccion_prov", "anyof", createdFrom]
                ],
                [
                    // new nlobjSearchColumn("custrecord_ht_dp_asiento_provision"),
                    // new nlobjSearchColumn("custrecord_ht_dp_transaccion_prov"),
                    // new nlobjSearchColumn("custrecord_ht_dp_item"),
                    new nlobjSearchColumn("custrecord_ht_dp_provision")
                ]
            );
            nlapiLogExecution("DEBUG", "COUNT", s.length);
            if (s.length > 0) {
                for (var j = 0; s != null && j < s.length; j++) {
                    var provision = parseFloat(s[j].getValue('custrecord_ht_dp_provision'));
                    nlapiLogExecution('DEBUG', "PROVISION", provision);
                    var newLine = customLines.addNewLine();
                    newLine.setDebitAmount(provision);
                    newLine.setAccountId(standardLines.getLine(i).getAccountId());
                    newLine.setEntityId(standardLines.getLine(i).getEntityId());
                    newLine.setDepartmentId(standardLines.getLine(i).getDepartmentId());
                    newLine.setClassId(standardLines.getLine(i).getClassId());
                    newLine.setLocationId(standardLines.getLine(i).getLocationId());
                    // newLine.setMemo(sku);

                    var newLine = customLines.addNewLine();
                    newLine.setCreditAmount(provision);
                    newLine.setAccountId(standardLines.getLine(i).getAccountId());
                    newLine.setEntityId(standardLines.getLine(i).getEntityId());
                    newLine.setDepartmentId(standardLines.getLine(i).getDepartmentId());
                    newLine.setClassId(standardLines.getLine(i).getClassId());
                    newLine.setLocationId(standardLines.getLine(i).getLocationId());
                    // newLine.setMemo(sku);
                }
            }
        } catch (error) {
            nlapiLogExecution('ERROR', 'ItemFulfillment', error);
        }
        nlapiLogExecution("DEBUG", "Consignación", 'FIN Item Fulfillment: ' + id + ' ----------------------------------------------------------------------------------------------------');
    }
}