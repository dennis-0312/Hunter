//https://7451241-sb1.app.netsuite.com/app/common/scripting/plugin.nl?id=818&id=818&whence=
function customizeGlImpact(transactionRecord, standardLines, customLines, book) {
    var recordType = transactionRecord.getRecordType();
    var id = transactionRecord.getId();

    if (recordType == 'itemfulfillment') {
        nlapiLogExecution("DEBUG", "Provisión", 'INICIO Item Fulfillment: ' + id + ' ------------------------------------------------------------------------------------------------'); 
        try {
            var countStandard = parseInt(standardLines.getCount());
            //nlapiLogExecution("DEBUG", "LINES", countStandard);
            var countTransaction = transactionRecord.getLineItemCount('item');
            //nlapiLogExecution("DEBUG", "LINES2", countTransaction);
            var j = 1
            for (var i = 2; i < countStandard; i++) {
                var esAlquiler = transactionRecord.getLineItemValue('item', 'custcol_ht_ep_productoalquiler', j);
                var ubicacionComercial = transactionRecord.getLineItemValue('item', 'custcol_ht_af_ubicacion_comercial', j);
                var sku = transactionRecord.getLineItemText('item', 'item', j);
                //nlapiLogExecution("DEBUG", "ES ALQUILER", esAlquiler);
                // var averageCost = transactionRecord.getLineItemValue('item', 'custcol_pe_average_cost', j);
                // var quantityConsig = transactionRecord.getLineItemValue('item', 'custcol_pe_cantidad_consignada', j);
                //var amountConsig = parseFloat(averageCost) * parseInt(quantityConsig);

                // var account = standardLines.getLine(i).getAccountId();
                // nlapiLogExecution("DEBUG", "ACCOUNT", account);
                // nlapiLogExecution("DEBUG", "AMOUNT", standardLines.getLine(i).getDebitAmount() + ' - ' + standardLines.getLine(i).getCreditAmount());

                if (esAlquiler == 'T' && ubicacionComercial == 'T') {
                    var newLine = customLines.addNewLine();
                    newLine.setCreditAmount(standardLines.getLine(i).getCreditAmount());
                    //newLine.setCreditAmount(amountConsig);
                    newLine.setAccountId(standardLines.getLine(1).getAccountId());
                    newLine.setEntityId(standardLines.getLine(i).getEntityId());
                    newLine.setDepartmentId(standardLines.getLine(i).getDepartmentId());
                    newLine.setClassId(standardLines.getLine(i).getClassId());
                    newLine.setLocationId(standardLines.getLine(i).getLocationId());
                    newLine.setMemo(sku);

                    var newLine = customLines.addNewLine();
                    newLine.setDebitAmount(standardLines.getLine(i).getCreditAmount());
                    //newLine.setDebitAmount(amountConsig);
                    newLine.setAccountId(standardLines.getLine(i).getAccountId());
                    newLine.setEntityId(standardLines.getLine(i).getEntityId());
                    newLine.setDepartmentId(standardLines.getLine(i).getDepartmentId());
                    newLine.setClassId(standardLines.getLine(i).getClassId());
                    newLine.setLocationId(standardLines.getLine(i).getLocationId());
                    newLine.setMemo(sku);
                    j++;
                    nlapiLogExecution("DEBUG", "ITEM", sku + ' - es alquiler');
                } else {
                    j++;
                }
            }
        } catch (error) {
            nlapiLogExecution('ERROR', 'ItemFulfillment', error);
        }
        nlapiLogExecution("DEBUG", "Consignación", 'FIN Item Fulfillment: ' + id + ' ----------------------------------------------------------------------------------------------------');
    }
}