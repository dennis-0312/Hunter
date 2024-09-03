function customizeGlImpact(transactionRecord, standardLines, customLines, book) {
    nlapiLogExecution("DEBUG", "Inicio", 'INICIO-----------------------------');
    const FACTURA_COMPRA = 'vendorbill';
    const PAGO_PROVEEDOR = 'vendorpayment';
    const PAGO_ANTICIPADO = 'vendorprepayment';
    const MONEDA_SOLES = '1';
    const MONEDA_DOLARES = '2';
    const recType = transactionRecord.getRecordType();
    const currency = transactionRecord.getFieldValue('currency');  // 1: Soles, 2: US Dollar
    const exchangerate = transactionRecord.getFieldValue('exchangerate');


    nlapiLogExecution('DEBUG', 'recType', recType);

    if (recType === FACTURA_COMPRA) {

        var tipo_cambio = 1.00;
        var count_purchaseorders = transactionRecord.getLineItemCount('purchaseorders');//se setea al editar
        var podocnum = transactionRecord.getFieldValue('podocnum');//se setea al crear
        try {
            if (currency != 1) tipo_cambio = exchangerate;

            var count_transaction = transactionRecord.getLineItemCount('item');
            nlapiLogExecution('DEBUG', 'count_transaction', count_transaction);
            for (var i = 1; i <= count_transaction; i++) {

                var type_item = transactionRecord.getLineItemValue('item', 'itemtype', i);

                if (type_item == 'InvtPart') {

                    var id_item = transactionRecord.getLineItemValue('item', 'item', i);
                    var name_item = transactionRecord.getLineItemText('item', 'item', i);
                    var cogs_account = Number(nlapiLookupField('item', id_item, 'expenseaccount'));
                    var accountRecord = 0

                    nlapiLogExecution('DEBUG', 'count_purchaseorders = ', count_purchaseorders);
                    nlapiLogExecution('DEBUG', 'podocnum', podocnum);
                    if ((count_purchaseorders == "0" || count_purchaseorders == 0) //EDIT
                        || ((count_purchaseorders == "-1" || count_purchaseorders == -1) && (podocnum == null || podocnum == '')))//CREATE
                    {
                        nlapiLogExecution('DEBUG', 'Info', 'No tiene Orden de Compra');
                        nlapiLogExecution('DEBUG', 'Info', 'Recuperando cuenta de activo...');
                        var search = nlapiSearchRecord('inventoryitem', null, [
                            new nlobjSearchFilter('internalid', null, 'is', id_item)
                        ], [
                            new nlobjSearchColumn('assetaccount')
                        ]);

                        for (var j = 0; search != null && j < search.length; j++) {
                            var searchresult = search[j];
                            accountRecord = Number(searchresult.getValue('assetaccount'));
                        }
                        if (accountRecord == 0) {
                            accountRecord = Number(getAccountRecord(FACTURA_COMPRA));
                            nlapiLogExecution('DEBUG', 'Info', 'No se pudo recuperar cuenta de activo, se seteará Compras acumuladas: ' + accountRecord);
                        } else {
                            nlapiLogExecution('DEBUG', 'Info', 'Se recuperó cuenta de activo con éxito: ' + accountRecord);
                        }

                    }
                    else {
                        nlapiLogExecution('DEBUG', 'Info', 'Sí tiene Orden de Compra');
                        accountRecord = Number(getAccountRecord(FACTURA_COMPRA));
                    }

                    const val_department = Number(transactionRecord.getLineItemValue('item', 'department', i));
                    const val_class = Number(transactionRecord.getLineItemValue('item', 'class', i));
                    nlapiLogExecution('DEBUG', 'val_class', val_class);
                    nlapiLogExecution('DEBUG', 'val_department', val_department);

                    nlapiLogExecution('DEBUG', 'accountRecord', accountRecord);
                    nlapiLogExecution('DEBUG', 'cogs_account', cogs_account);
                    var monto = transactionRecord.getLineItemValue('item', 'amount', i) * tipo_cambio
                    nlapiLogExecution('DEBUG', 'monto', monto);

                    if (!accountRecord) return;
                    var newLine = customLines.addNewLine();
                    newLine.setCreditAmount(monto);
                    newLine.setAccountId(accountRecord);
                    newLine.setMemo(name_item);
                    if (val_class) newLine.setClassId(val_class);
                    if (val_department) newLine.setDepartmentId(val_department);

                    var newLine = customLines.addNewLine();
                    newLine.setDebitAmount(monto);
                    newLine.setAccountId(cogs_account);
                    newLine.setMemo(name_item);
                    if (val_class) newLine.setClassId(val_class);
                    if (val_department) newLine.setDepartmentId(val_department);
                }
            }
        } catch (e) {
            nlapiLogExecution('ERROR', FACTURA_COMPRA, e);
        }
    }
}

function getAccountRecord(transactionID) {
    try {
        var customSearch = nlapiSearchRecord("customrecord_pe_account_setup", null,
            [
                ["custrecord_pe_account_setup_id", "is", transactionID]
            ],
            [
                new nlobjSearchColumn("custrecord_pe_account_setup_account")
            ]
        );
        for (var i = 0; customSearch != null && i < customSearch.length; i++) {
            var searchresult = customSearch[i];
            var internalField = searchresult.getValue('custrecord_pe_account_setup_account');

        }

        return internalField;
    } catch (error) {
        nlapiLogExecution('ERROR obtenerCuentaAnticipo', PAGO_ANTICIPADO, e);
    }
}