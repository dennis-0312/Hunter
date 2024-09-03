function customizeGlImpact(transactionRecord, standardLines, customLines, book) {
    nlapiLogExecution("ERROR", "Inicio", 'INICIO-----------------------------');
    const ITEMRECEIPT = 'itemreceipt';
    const ITEMFULFILLMENT = 'itemfulfillment';
    const recType = transactionRecord.getRecordType();
    const currency = transactionRecord.getFieldValue('currency');  // 5: Soles, 1: US Dollar
    const entitycurrency = transactionRecord.getFieldValue('entitycurrency');  // 5: Soles, 1: US Dollar
    const exchangerate = transactionRecord.getFieldValue('exchangerate');
    const subsidiaria = transactionRecord.getFieldValue('subsidiary');
    var typeCreatedFrom = transactionRecord.getFieldValue('custbody_pe_flag_created_from');
    const MONEDA_SOLES = '1';
    const MONEDA_DOLARES = '2';
    var account_to_credit = 0;
    var account_to_debit = 0;

    nlapiLogExecution('ERROR', 'recType', recType);

    if (recType === ITEMRECEIPT || recType === ITEMFULFILLMENT) {
        nlapiLogExecution('DEBUG', 'MSK', 'Sí aplica');
        try {
            //! Validación de Subsidiaria
            var custrecord_pe_suiteglcompras = false
            var search = nlapiSearchRecord('subsidiary', null, [
                new nlobjSearchFilter('internalid', null, 'is', subsidiaria)
            ], [
                new nlobjSearchColumn('custrecord_pe_suiteglcompras')
            ]);
            for (var j = 0; search != null && j < search.length; j++) {
                var searchresult = search[j];
                custrecord_pe_suiteglcompras = searchresult.getValue('custrecord_pe_suiteglcompras');
            }

            nlapiLogExecution('DEBUG', 'MSK', 'custrecord_pe_suiteglcompras=' + custrecord_pe_suiteglcompras);
            if (custrecord_pe_suiteglcompras == true || custrecord_pe_suiteglcompras == "T" || custrecord_pe_suiteglcompras == "F") {
                var paraCuentas20 = []
                nlapiLogExecution('DEBUG', 'MSK', 'Sí aplica');
                var count_transaction = transactionRecord.getLineItemCount('item');
                nlapiLogExecution('DEBUG', 'count_transaction', count_transaction);
                if (currency == 5 || entitycurrency == 5) {
                    tipo_cambio = 1
                } else if(currency == 1 || entitycurrency == 1) {
                    tipo_cambio = exchangerate;
                };
                for (var i = 1; i <= count_transaction; i++) {
                    var id_item = transactionRecord.getLineItemValue('item', 'item', i);
                    //! Validación Articulo de Inventario
                    var type_item = transactionRecord.getLineItemValue('item', 'itemtype', i);
                    if (type_item == 'InvtPart') {
                        nlapiLogExecution('DEBUG', 'MSK', 'Artículo[' + i + '] es inventariable, sí aplica');

                        //!Validación Cuentas
                        var cuenta_60 = ""
                        var cuenta_61 = ""
                        var ItemidName = ""
                        var search2 = nlapiSearchRecord('inventoryitem', null, [
                            new nlobjSearchFilter('internalid', null, 'is', id_item)
                        ], [
                            new nlobjSearchColumn('custitem_pe_purchase_account'),
                            new nlobjSearchColumn('custitem_pe_variation_account'),
                            new nlobjSearchColumn('itemid')
                        ]);
                        for (var j = 0; search2 != null && j < search2.length; j++) {
                            var searchresult2 = search2[j];
                            cuenta_60 = searchresult2.getValue('custitem_pe_purchase_account');
                            cuenta_61 = searchresult2.getValue('custitem_pe_variation_account');
                            ItemidName = searchresult2.getValue('itemid'); 
                        }

                        if (cuenta_60 && cuenta_60 != "" && cuenta_61 && cuenta_61 != "") {
                            nlapiLogExecution('DEBUG', 'MSK', 'Artículo[' + i + '] tiene cuentas C60=' + cuenta_60 + ' y C61=' + cuenta_61 + ', sí aplica');
                            if (recType === ITEMRECEIPT) {
                                var quantity = transactionRecord.getLineItemValue('item', 'quantity', i)
                                var rate = transactionRecord.getLineItemValue('item', 'rate', i)
                                var monto = quantity * rate * tipo_cambio
                                var name_item = transactionRecord.getLineItemText('item', 'item', i);
                                var val_department = Number(transactionRecord.getLineItemValue('item', 'department', i));
                                var val_class = Number(transactionRecord.getLineItemValue('item', 'class', i));
                                nlapiLogExecution('DEBUG', 'MSK', 'quantity=' + quantity);
                                nlapiLogExecution('DEBUG', 'MSK', 'rate=' + rate);
                                nlapiLogExecution('DEBUG', 'MSK', 'monto=' + monto);
                                nlapiLogExecution('DEBUG', 'MSK', 'val_class=' + val_class);
                                nlapiLogExecution('DEBUG', 'MSK', 'val_department=' + val_department);

                                if (monto && monto != 0 && monto != undefined) {
                                    var newLine = customLines.addNewLine();
                                    newLine.setCreditAmount(monto);
                                    newLine.setAccountId(Number(cuenta_61));
                                    newLine.setMemo(name_item);
                                    newLine.setClassId(val_class);
                                    newLine.setDepartmentId(val_department);

                                    var newLine2 = customLines.addNewLine();
                                    newLine2.setDebitAmount(monto);
                                    newLine2.setAccountId(Number(cuenta_60));
                                    newLine2.setMemo(name_item);
                                    newLine2.setClassId(val_class);
                                    newLine2.setDepartmentId(val_department);
                                }
                                var arr = [ItemidName,cuenta_60,cuenta_61,val_class,val_department];
                                paraCuentas20.push(arr);
                            }
                            if (recType === ITEMFULFILLMENT) {
                                var ordertype = transactionRecord.getFieldValue('ordertype');
                                if (ordertype == "VendAuth") {
                                    var quantity = transactionRecord.getLineItemValue('item', 'quantity', i)
                                    var rate = transactionRecord.getLineItemValue('item', 'rate', i)
                                    var monto = quantity * rate * tipo_cambio
                                    var name_item = transactionRecord.getLineItemText('item', 'item', i);
                                    var val_department = Number(transactionRecord.getLineItemValue('item', 'department', i));
                                    var val_class = Number(transactionRecord.getLineItemValue('item', 'class', i));
                                    var val_location = Number(transactionRecord.getLineItemValue('item', 'location', i));
                                    nlapiLogExecution('DEBUG', 'MSK', 'quantity=' + quantity);
                                    nlapiLogExecution('DEBUG', 'MSK', 'rate=' + rate);
                                    nlapiLogExecution('DEBUG', 'MSK', 'monto=' + monto);
                                    nlapiLogExecution('DEBUG', 'MSK', 'name_item=' + name_item);
                                    nlapiLogExecution('DEBUG', 'MSK', 'val_class=' + val_class);
                                    nlapiLogExecution('DEBUG', 'MSK', 'val_department=' + val_department);
                                    nlapiLogExecution('DEBUG', 'MSK', 'val_location=' + val_location);

                                    var newLine = customLines.addNewLine();
                                    newLine.setCreditAmount(monto);
                                    newLine.setAccountId(Number(cuenta_60));
                                    newLine.setMemo(name_item);
                                    newLine.setClassId(val_class);
                                    newLine.setDepartmentId(val_department);
                                    newLine.setLocationId(val_location);

                                    var newLine2 = customLines.addNewLine();
                                    newLine2.setDebitAmount(monto);
                                    newLine2.setAccountId(Number(cuenta_61));
                                    newLine2.setMemo(name_item);
                                    newLine2.setClassId(val_class);
                                    newLine2.setDepartmentId(val_department);
                                    newLine2.setLocationId(val_location);
                                }
                            }

                        } else {
                            nlapiLogExecution('DEBUG', 'MSK', 'Artículo[' + i + '] tiene cuentas C60=' + cuenta_60 + ' y C61=' + cuenta_61 + ', no aplica');
                        }

                    } else {
                        nlapiLogExecution('DEBUG', 'MSK', 'Artículo[' + i + '] no es inventariable, no aplica');
                    }
                }

                if (recType == ITEMRECEIPT) {
                    var idTransaccion = transactionRecord.getFieldValue('id');
                    var flete = transactionRecord.getFieldValue('landedcostamount1');
                    var handling = transactionRecord.getFieldValue('landedcostamount2');
                    var transporteLocal = transactionRecord.getFieldValue('landedcostamount3');
                    var comisiónAduanas = transactionRecord.getFieldValue('landedcostamount4');
                    var vistoBueno = transactionRecord.getFieldValue('landedcostamount5');
                    var almacenaje = transactionRecord.getFieldValue('landedcostamount6');
                    var desconsolidación = transactionRecord.getFieldValue('landedcostamount7');
                    var gastosOrigen = transactionRecord.getFieldValue('landedcostamount8');
                    var gateIn = transactionRecord.getFieldValue('landedcostamount9');
                    var servicioCarga = transactionRecord.getFieldValue('landedcostamount10');
                    var otros = transactionRecord.getFieldValue('landedcostamount11');
                    var seguro = transactionRecord.getFieldValue('landedcostamount12');
    
                    nlapiLogExecution('DEBUG', 'MSK', 'idTransaccion=' + idTransaccion);

                    var itemreceiptSearch = nlapiSearchRecord("itemreceipt", null,
                        [
                            ["type", "anyof", "ItemRcpt"],
                            "AND",
                            ["internalid", "anyof", idTransaccion],
                            "AND",
                            ["mainline", "any", ""],
                            "AND",
                            ["formulanumeric: CASE WHEN substr({account.number},1,2) = '20' THEN 1 ELSE 0 END", "equalto", "1"],
                            "AND",
                            [["memo", "contains", "Flete"], "OR", ["memo", "contains", "Handling"], "OR", ["memo", "contains", "Transporte local"], "OR", ["memo", "contains", "Comisión Aduanas"], "OR", ["memo", "contains", "Visto bueno"], "OR", ["memo", "contains", "Almacenaje"], "OR", ["memo", "contains", "Desconsolidación"], "OR", ["memo", "contains", "Gastos en origen"], "OR", ["memo", "contains", "Gate in"], "OR", ["memo", "contains", "Servicio de carga"], "OR", ["memo", "contains", "Otros"], "OR", ["memo", "contains", "Seguro"]]
                        ],
                        [
                            new nlobjSearchColumn("account"),
                            new nlobjSearchColumn("debitamount"),
                            new nlobjSearchColumn("creditamount"),
                            new nlobjSearchColumn("memo"),
                            new nlobjSearchColumn("subsidiary"),
                            new nlobjSearchColumn("department"),
                            new nlobjSearchColumn("class"),
                            new nlobjSearchColumn("location")
                        ]
                    );
    
                    for (var j = 0; itemreceiptSearch != null && j < itemreceiptSearch.length; j++) {
                        var searchresult2 = itemreceiptSearch[j];
                        var newMonto = searchresult2.getValue('debitamount');
                        var val_memo = searchresult2.getValue('memo');
    
                        if (newMonto < 0) {
                            newMonto = newMonto * (-1);
                        }

                        nlapiLogExecution('DEBUG', 'MSK', 'newMonto=' + newMonto);
                        nlapiLogExecution('DEBUG', 'MSK', 'val_memo=' + val_memo);
                        nlapiLogExecution('DEBUG', 'MSK', 'paraCuentas20=' + paraCuentas20);

                        for(var x = 0; x < paraCuentas20.length; x++){
                            if(val_memo.indexOf(paraCuentas20[x][0]) != -1){

                                var newLine = customLines.addNewLine();
                                newLine.setCreditAmount(newMonto);
                                newLine.setAccountId(Number(paraCuentas20[x][2]));
                                //newLine.setMemo(name_item);
                                newLine.setClassId(Number(paraCuentas20[x][3]));
                                newLine.setDepartmentId(Number(paraCuentas20[x][4]));
            
                                var newLine2 = customLines.addNewLine();
                                newLine2.setDebitAmount(newMonto);
                                newLine2.setAccountId(Number(paraCuentas20[x][1]));
                                //newLine2.setMemo(name_item);
                                newLine2.setClassId(Number(paraCuentas20[x][3]));
                                newLine2.setDepartmentId(Number(paraCuentas20[x][4]));
                                
                            }
                        }
    
                    }
                }

            }

            /*
            if (recType == ITEMFULFILLMENT) {
                
                var count_transaction = transactionRecord.getLineItemCount('item');

                var idTransaccion = transactionRecord.getFieldValue('id');
                var ordertype = transactionRecord.getFieldValue('ordertype');
                var formulario = transactionRecord.getFieldValue('customform');
                var estado = transactionRecord.getFieldValue('shipstatus');
                var cuentaAjuste = transactionRecord.getFieldValue('custbody_pe_cuenta_ajuste_consumo');
                nlapiLogExecution('ERROR', 'MSK', 'ordertype=' + ordertype);
                nlapiLogExecution('ERROR', 'MSK', 'estado=' + estado);
                nlapiLogExecution('ERROR', 'MSK', 'cuentaAjuste=' + cuentaAjuste);
                nlapiLogExecution('ERROR', 'MSK', 'idTransaccion=' + idTransaccion);
                nlapiLogExecution('ERROR', 'MSK', 'formulario=' + formulario);

                if (ordertype == "SalesOrd" && formulario == '125' && estado == 'C') {
                    nlapiLogExecution('ERROR', 'MSK', 'count_transaction=' + count_transaction);

                    for (var i = 1; i <= count_transaction; i++){
                        var id_item = transactionRecord.getLineItemValue('item', 'item', i);
                        
                        var val_department = Number(transactionRecord.getLineItemValue('item', 'department', i));
                        var val_class = Number(transactionRecord.getLineItemValue('item', 'class', i));
                        var val_location = Number(transactionRecord.getLineItemValue('item', 'location', i));

                        var type_item = transactionRecord.getLineItemValue('item', 'itemtype', i);

                        nlapiLogExecution('ERROR', 'MSK', 'id_item=' + id_item);
                        nlapiLogExecution('ERROR', 'MSK', 'type_item=' + type_item);
                        if (type_item == 'InvtPart') {
                            var cuenta_costo = "";
                            var costo_unitario = "";
                            
                            nlapiLogExecution('ERROR', 'MSK', 'id_item=' + id_item);
                            nlapiLogExecution('ERROR', 'MSK', 'Number(id_item)=' + Number(id_item));
                            var search2 = nlapiSearchRecord('inventoryitem', null, [
                                new nlobjSearchFilter('internalid', null, 'is', Number(id_item)),
                                new nlobjSearchFilter('inventorylocation', null, 'anyof', val_location)
                            ], [
                                new nlobjSearchColumn('internalid'),
                                new nlobjSearchColumn('expenseaccount'),
                                new nlobjSearchColumn('locationaveragecost')
                            ]);

                            for (var j = 0; search2 != null && j < search2.length; j++) {
                                
                                var searchresult2 = search2[j];
                                cuenta_costo = searchresult2.getValue('expenseaccount');
                                costo_unitario = searchresult2.getValue('locationaveragecost');
                            }

                            nlapiLogExecution('ERROR', 'MSK', 'cuenta_costo=' + cuenta_costo);
                            nlapiLogExecution('ERROR', 'MSK', 'costo_unitario=' + costo_unitario);

                            var quantity = transactionRecord.getLineItemValue('item', 'quantity', i)
                            nlapiLogExecution('ERROR', 'MSK', 'quantity=' + quantity);
                            var monto = 0
                            nlapiLogExecution('ERROR', 'MSK', 'Number(quantity)=' + Number(quantity));
                            if(Number(quantity) == 0){
                                monto = 0
                            } else {
                                monto = quantity * costo_unitario * tipo_cambio
                            }

                            nlapiLogExecution('ERROR', 'MSK', 'monto=' + monto);
                            nlapiLogExecution('ERROR', 'MSK', 'val_class=' + val_class);
                            nlapiLogExecution('ERROR', 'MSK', 'val_department=' + val_department);
                            nlapiLogExecution('ERROR', 'MSK', 'cuenta_costo=' + cuenta_costo);

                            if (monto < 0) {
                                monto = monto * (-1);
                            }

                            if(monto != 0){
                                var newLine = customLines.addNewLine();
                                newLine.setCreditAmount(monto);
                                newLine.setAccountId(Number(cuenta_costo));
                                //newLine.setMemo(name_item);
                                newLine.setClassId(Number(val_class));
                                newLine.setDepartmentId(Number(val_department));
                                newLine.setLocationId(Number(val_location));
        
                                var newLine2 = customLines.addNewLine();
                                newLine2.setDebitAmount(monto);
                                newLine2.setAccountId(Number(cuentaAjuste));
                                //newLine2.setMemo(name_item);
                                newLine2.setClassId(Number(val_class));
                                newLine2.setDepartmentId(Number(val_department));
                                newLine2.setLocationId(Number(val_location));
                            }
                            
                        }

                    }
                    
                }

                if(formulario == '115' && typeCreatedFrom == 'salesorder'){
                    var countTransaction = transactionRecord.getLineItemCount('item');
                    nlapiLogExecution('ERROR', 'countTransaction', countTransaction);
                    
                    for (var i = 1; i <= countTransaction; i++){
                        var sku = transactionRecord.getLineItemText('item', 'item', i);
                        var articulo = transactionRecord.getLineItemValue('item', 'item', i);
                        var cantidad = transactionRecord.getLineItemValue('item', 'quantity', i);
                        var location = Number(transactionRecord.getLineItemValue('item', 'location', i));
                        var precio_prom = parseFloat(transactionRecord.getLineItemValue('item', 'custcol_pe_average_cost', i));
    
                        nlapiLogExecution('ERROR', 'location', location);
                        
                        if(Number(cantidad) != 0){
                            var inventoryitemSearch = nlapiSearchRecord("inventoryitem",null,
                                [
                                    ["type","anyof","InvtPart"], 
                                    "AND", 
                                    ["internalidnumber","equalto",articulo], 
                                    "AND", 
                                    ["inventorylocation","anyof",location]
                                ], 
                                [ 
                                    new nlobjSearchColumn("assetaccount"), 
                                    new nlobjSearchColumn("expenseaccount"),
                                ]
                            );
                            
                            if (inventoryitemSearch){
                                var cuenta_activo = inventoryitemSearch[0].getValue("assetaccount");
                                var cuenta_costo =  inventoryitemSearch[0].getValue("expenseaccount");
    
                                var field_cuenta = ['type','number'];
                                var cuentaFields = nlapiLookupField('account', cuenta_activo, field_cuenta);
    
                                var tipo_cuenta = cuentaFields.type;
                                var numero_cuenta = cuentaFields.number;
                                nlapiLogExecution('ERROR', 'tipo_cuenta', tipo_cuenta);
    
                                if(tipo_cuenta == 'FixedAsset'){
                                    var num_ini = numero_cuenta.substr(0, 2)
                                    if(num_ini == '33'){
                                        var monto = cantidad * precio_prom;
                                        monto = monto.toFixed(2);
                                        var newLine = customLines.addNewLine();
                                        newLine.setDebitAmount(monto);
                                        newLine.setAccountId(Number(cuenta_activo));
                                        newLine.setEntityId(standardLines.getLine(0).getEntityId());
                                        newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
                                        newLine.setClassId(standardLines.getLine(0).getClassId());
                                        newLine.setLocationId(location);
                                        newLine.setMemo(sku);
                                        var newLine = customLines.addNewLine();
                                        newLine.setCreditAmount(monto);
                                        newLine.setAccountId(Number(cuenta_costo));
                                        newLine.setEntityId(standardLines.getLine(0).getEntityId());
                                        newLine.setDepartmentId(standardLines.getLine(0).getDepartmentId());
                                        newLine.setClassId(standardLines.getLine(0).getClassId());
                                        newLine.setLocationId(location);
                                        newLine.setMemo(sku);
                                    }
                                }
    
                            }
                        }
    
                        
                    }
                }
            }
            */
            

        } catch (e) {
            nlapiLogExecution('ERROR', recType, e);
        }

    } else {
        nlapiLogExecution('DEBUG', 'MSK', 'No aplica');
    }
}