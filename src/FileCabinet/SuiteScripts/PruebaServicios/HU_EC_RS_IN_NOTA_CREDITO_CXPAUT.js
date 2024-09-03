/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/record', 'N/search'], function (log, record, search) {

    // Consuta del registro de NC
    function _get(context) {
        try {
            // vendorcredit
            let iddocument = context.iddocument;
            let objRecord = record.load({ type: record.Type.VENDOR_CREDIT, id: iddocument, isDynamic: true });

            log.debug('record.........', 'ok');

            return {
                vendorcredit: objRecord

            }
        } catch (error) {
            log.error('Error', error);
        }
    }

    // Genera registro de NC
    function _post(context) {
        try {

            // FIELDS
            let entity = context.entity; // codigo proveedor
            let trandate = context.trandate; // fecha de transacción
            let applied = Number.parseFloat(context.applied).toFixed(2);
            let custbodyts_ec_tipo_documento_fiscal = context.custbodyts_ec_tipo_documento_fiscal // tipo de doc. fiscal
            let custbody_ts_ec_serie_doc_cxp = context.custbody_ts_ec_serie_doc_cxp // Serie de NC
            let custbody_ts_ec_numero_preimpreso = context.custbody_ts_ec_numero_preimpreso // Numero de NC
            let custbodyts_ec_num_autorizacion = context.custbodyts_ec_num_autorizacion // Numero de autorizacion

            let custbodyts_ec_doc_serie_ref = context.custbodyts_ec_doc_serie_ref // Serie documento serie FAC
            let custbodyts_ec_doc_number_ref = context.custbodyts_ec_doc_number_ref // Numero documento referencia FAC
            let custbodyts_ec_doc_type_ref = context.custbodyts_ec_doc_type_ref // Serie tipo documento referencia FAC

            let custbody_ec_origen_ingreso = context.custbody_ec_origen_ingreso // Origen de imgreso
            let custbodyts_ec_tipo_trans = context.custbodyts_ec_tipo_trans //Tipo Transaccion
            let custbody_ts_ec_sustento_comprobante = context.custbody_ts_ec_sustento_comprobante // Sustento de comprobante
            let amount = Number.parseFloat(context.amount).toFixed(2);
            let ruta_documento_pdf = context.ruta_documento_pdf // Ruta del documento PDF


            var account = 1434;

            //log.debug('entity.........', entity);
            //log.debug('createdfrom.........', createdfrom);

            // Verificar que proveedor exista
            // Se toma el internal ID del proveedor
            // consulta de internalId de PROVEEDOR
            var busquedaVendor = search.create({
                type: search.Type.VENDOR,
                columns: ['entityid', 'altname', 'internalid'],
                filters: ['vatregnumber', search.Operator.STARTSWITH, entity]
            });
            var myResultSetVend = busquedaVendor.run().getRange({ start: 0, end: 1 });
            var theCountVend = busquedaVendor.runPaged().count;
            if (theCountVend != 1) {
                log.debug('Busqueda.Error no se encontró el Proveedor........', myResultSetVend);
            } else {
                //Obtiene el ID
                var internalidproveedor = myResultSetVend[0].getValue(busquedaVendor.columns[2]);
                var nombreproveedor = myResultSetVend[0].getValue(busquedaVendor.columns[1]);
            }

            log.debug('internalidproveedor.........', internalidproveedor);
            //log.debug('nombreproveedor.........', nombreproveedor);

            // Validar el codigo del proveedor
            if (internalidproveedor == 0) {
                return 'ERROR:' + '200'; //No se encontró el ID interno del proveedor
            }



            // Verificar que la Factura de CXP exista
            // Se toma el internal ID y la oficina de la factura
            var busquedaFactura = search.create({
                type: "vendorbill",
                filters:
                    [
                        ["type", "anyof", "VendBill"],
                        "AND",
                        ["voided", "is", "F"],
                        "AND",
                        ["mainline", "is", "T"],
                        "AND",
                        ["custbody_ts_ec_serie_doc_cxp", "is", custbodyts_ec_doc_serie_ref],
                        "AND",
                        ["custbody_ts_ec_numero_preimpreso", "is", custbodyts_ec_doc_number_ref],
                        "AND",
                        ["vendor.internalid", "anyof", internalidproveedor]

                    ],
                columns:
                    [
                        search.createColumn({ name: "trandate", label: "Fecha" }),
                        search.createColumn({ name: "statusref", label: "Estado" }),
                        search.createColumn({
                            name: "internalid",
                            sort: search.Sort.DESC,
                            label: "ID interno Fac"
                        }),
                        search.createColumn({
                            name: "internalid",
                            join: "location",
                            label: "ID interno Ofi"
                        }),
                        search.createColumn({ name: "amount", label: "Importe" }),
                        search.createColumn({ name: "amountpaid", label: "Importe pagado" }),
                        search.createColumn({ name: "amountremaining", label: "Importe restante" })
                    ]
            });

            var myResultSetFactura = busquedaFactura.run().getRange({ start: 0, end: 1 });
            var theCountFac = busquedaFactura.runPaged().count;
            log.debug('theCountFac.........', theCountFac);
            if (theCountFac != 1) {
                log.debug('Busqueda.Error no se encontró la Factura de compra........', myResultSetFactura);
            } else {
                //Obtiene datos de factura
                var fechafactura = myResultSetFactura[0].getValue(busquedaFactura.columns[0]);
                var estadofactura = myResultSetFactura[0].getValue(busquedaFactura.columns[1]);
                var internalidfactura = myResultSetFactura[0].getValue(busquedaFactura.columns[2]);
                var internalidoficinafactura = myResultSetFactura[0].getValue(busquedaFactura.columns[3]);
                var saldofactura = Number.parseFloat(myResultSetFactura[0].getValue(busquedaFactura.columns[6])).toFixed(2);
                var importefactura = Number.parseFloat(myResultSetFactura[0].getValue(busquedaFactura.columns[4])).toFixed(2);
            }

            log.debug('fechafactura.........', fechafactura);
            log.debug('estadofactura.........', estadofactura);
            log.debug('internalidfactura.........', internalidfactura);
            log.debug('internalidoficinafactura.........', internalidoficinafactura);
            log.debug('saldofactura.........', saldofactura);
            log.debug('importefactura.........', importefactura);

            // Validar el codigo de la factura
            if (internalidfactura == 0) {
                return 'ERROR:' + '300'; //No se encontró el ID interno de la factura
            }

            // Validar el estado de la factura
            if (estadofactura != 'open') {
                return 'ERROR:' + '400'; //La factura no se encuentra con estado abierta
            }

            if (saldofactura < applied) {
                return 'ERROR:' + '500'; //La factura no tiene saldo
            }


            // Valores que se obtinen de la busqueda de factura
            var subsidiary = 2;
            var location = internalidoficinafactura;
            var department = 10;
            var customform = 109;
            var createdfrom = internalidfactura;
            var internalid = internalidfactura;
            var comentario = 'NC CXP AUT. PROV. ' + entity + '-' + nombreproveedor + ' FAC. ' + custbodyts_ec_doc_serie_ref + '-' + custbodyts_ec_doc_number_ref;

            //log.debug('location.........', location);
            //log.debug('createdfrom.........', createdfrom);
            //log.debug('internalid.........', internalid);
            //log.debug('comentario.........', comentario);


            //CREATE RECORD
            let objRecord = record.create({ type: record.Type.VENDOR_CREDIT, isDynamic: true });
            objRecord.setValue({ fieldId: 'entity', value: internalidproveedor });// internal ID del cliente
            objRecord.setValue({ fieldId: 'trandate', value: new Date(context.trandate) }); // Fecha de la transaccion
            objRecord.setValue({ fieldId: 'memo', value: comentario }); // Comentario de la transaccion
            objRecord.setValue({ fieldId: 'applied', value: applied }); // valor aplicado
            objRecord.setValue({ fieldId: 'customform', value: customform }); // numero del formulario
            objRecord.setValue({ fieldId: 'createdfrom', value: createdfrom }); // internal id de factura
            objRecord.setValue({ fieldId: 'subsidiary', value: subsidiary }); // Empresa - pais
            objRecord.setValue({ fieldId: 'department', value: department }); // Departamento
            objRecord.setValue({ fieldId: 'location', value: internalidoficinafactura }); // Oficina del registro
            objRecord.setValue({ fieldId: 'account', value: account }); // Oficina del registro

            // Informacion de la NC
            objRecord.setValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal', value: custbodyts_ec_tipo_documento_fiscal });// Tipo de documento 1 NC
            objRecord.setValue({ fieldId: 'custbody_ts_ec_serie_doc_cxp', value: custbody_ts_ec_serie_doc_cxp }); // Serie de la NC
            objRecord.setValue({ fieldId: 'custbody_ts_ec_numero_preimpreso', value: custbody_ts_ec_numero_preimpreso });// Numero de la NC
            objRecord.setValue({ fieldId: 'custbodyts_ec_num_autorizacion', value: custbodyts_ec_num_autorizacion });// numero de autorizacion
            objRecord.setValue({ fieldId: 'custbodyts_ec_tipo_trans', value: custbodyts_ec_tipo_trans });// tipo transaccion
            objRecord.setValue({ fieldId: 'custbody_ts_ec_sustento_comprobante', value: custbody_ts_ec_sustento_comprobante });// Sus. de Comprobante

            // Informacion de la factura referencia
            objRecord.setValue({ fieldId: 'custbodyts_ec_doc_serie_ref', value: custbodyts_ec_doc_serie_ref }); // Serie de la factura
            objRecord.setValue({ fieldId: 'custbodyts_ec_doc_number_ref', value: custbodyts_ec_doc_number_ref }); // Referencia de la factura
            objRecord.setValue({ fieldId: 'custbodyts_ec_doc_type_ref', value: custbodyts_ec_doc_type_ref }); // Tipo de docuemnto 4 FAC
            //objRecord.setValue({ fieldId: 'custbodyts_ec_doc_fecha_ref',  value: new Date(fechafactura) }); // Fecha de la factura

            objRecord.setValue({ fieldId: 'custbody_ec_origen_ingreso', value: custbody_ec_origen_ingreso });// origen de ingreso HT - Hunter
            objRecord.setValue({ fieldId: 'custbody_ec_comentario', value: comentario });// comentario


            //Object el detalle de los Gastos registrados en la factura
            let objRecordFactura = record.load({ type: record.Type.VENDOR_BILL, id: internalidfactura, isDynamic: true });
            let objExpense = objRecordFactura.getLineCount({ sublistId: "expense" });

            const itemLine = objRecord.selectNewLine({ sublistId: 'expense' });

            log.debug('objExpense.........', objExpense);
            log.debug('importefactura.........', importefactura);
            log.debug('applied.........', applied);

            var objSublistExpense = objRecord.getSublist({
                sublistId: 'expense'
            });

            log.debug('sublistIdExpense.........', objSublistExpense);


            // Aplicacion total de factura
            if (objExpense > 0 && importefactura == applied) {
                for (let i = 0; i < objExpense; i++) {

                    categoryexp = objRecordFactura.getSublistValue({ sublistId: 'expense', fieldId: 'category', line: i }); // TIPO GASTO
                    amountexp = objRecordFactura.getSublistValue({ sublistId: 'expense', fieldId: 'amount', line: i }); // BASE IMPONIBLE
                    locationexp = objRecordFactura.getSublistValue({ sublistId: 'expense', fieldId: 'location', line: i }); // CIUDAD
                    tax1amtexp = objRecordFactura.getSublistValue({ sublistId: 'expense', fieldId: 'tax1amt', line: i }); // MONTO IVA
                    taxcodeexp = objRecordFactura.getSublistValue({ sublistId: 'expense', fieldId: 'taxcode', line: i });  // CODIGO TASA IVA
                    taxrate1 = objRecordFactura.getSublistValue({ sublistId: 'expense', fieldId: 'taxrate1', line: i });  // TASA IVA

                    // Solo aplicar para items de Gastos
                    if (categoryexp.length != 0) {

                        itemLine.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'category', value: categoryexp });  // TIPO GASTO
                        itemLine.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'amount', value: amountexp }); // BASE IMPONIBLE
                        itemLine.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'location', value: locationexp }); // CIUDAD
                        itemLine.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'tax1amt', value: tax1amtexp });  // MONTO IVA
                        itemLine.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'taxcode', value: taxcodeexp });   // CODIGO TASA IVA

                        objRecord.commitLine({ sublistId: 'expense' });

                    }


                }
            }


            //El valor a aplicar es menor al valor de la NC
            //Valor parcial
            if (objExpense > 0 && importefactura !== applied) {
                log.debug('amount2.........', amount);

                for (let i = 0; i < objExpense; i++) {

                    categoryexp = objRecordFactura.getSublistValue({ sublistId: 'expense', fieldId: 'category', line: i }); // TIPO GASTO
                    amountexp = objRecordFactura.getSublistValue({ sublistId: 'expense', fieldId: 'amount', line: i }); // BASE IMPONIBLE
                    locationexp = objRecordFactura.getSublistValue({ sublistId: 'expense', fieldId: 'location', line: i }); // CIUDAD
                    tax1amtexp = objRecordFactura.getSublistValue({ sublistId: 'expense', fieldId: 'tax1amt', line: i }); // MONTO IVA
                    taxcodeexp = objRecordFactura.getSublistValue({ sublistId: 'expense', fieldId: 'taxcode', line: i });  // CODIGO TASA IVA
                    taxrate1exp = objRecordFactura.getSublistValue({ sublistId: 'expense', fieldId: 'taxrate1', line: i });  // TASA IVA
                    grossamtexp = objRecordFactura.getSublistValue({ sublistId: 'expense', fieldId: 'grossamt', line: i });  // TOTAL
                    account = objRecordFactura.getSublistValue({ sublistId: 'expense', fieldId: 'account', line: i });  // ACCOUNT


                    log.debug('categoryexp.........', categoryexp);
                    log.debug('categoryexplength.........', categoryexp.length);
                    log.debug('amountexp.........', amountexp);
                    log.debug('locationexp.........', locationexp);
                    log.debug('tax1amtexp.........', tax1amtexp);
                    log.debug('taxcodeexp.........', taxcodeexp);
                    log.debug('taxrate1exp.........', taxrate1exp);
                    log.debug('grossamtexp.........', grossamtexp);
                    log.debug('account.........', account);


                    // Solo aplicar para items de Gastos
                    if (categoryexp.length != 0) {

                        log.debug('categoryexp.........', categoryexp);

                        // Distribuir valor 
                        valorParcial = ((grossamtexp / importefactura) * applied)

                        itemLine.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'category', value: categoryexp });  // TIPO GASTO
                        itemLine.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'location', value: locationexp }); // CIUDAD
                        if (tax1amtexp > 0) {
                            valorBase = valorParcial / (1 + (taxrate1exp / 100));
                            valorIVA = valorBase * (taxrate1exp / 100)
                            log.debug('valorBase.........', valorBase);
                            log.debug('valorIVA.........', valorIVA);
                            itemLine.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'amount', value: valorBase }); // BASE IMPONIBLE
                        }
                        else {
                            valorIVA = 0;
                            itemLine.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'amount', value: valorParcial }); // BASE IMPONIBLE
                        }

                        itemLine.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'tax1amt', value: valorIVA });  // MONTO IVA
                        itemLine.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'taxcode', value: taxcodeexp });   // CODIGO TASA IVA

                        objRecord.commitLine({ sublistId: 'expense' });

                    }

                }

            }


            // SECCION APPLY
            // Apply : documento a aplicar
            //if (saldofactura >= amount)
            //{

            var apLine = objRecord.getLineCount({
                sublistId: "apply",
            });

            //log.debug('apLine.........', apLine);
            //log.debug('internalid.........', internalid);

            if (apLine > 0) {
                for (var i = 0; i < apLine; i++) {

                    var refnum = objRecord.getSublistValue({

                        sublistId: 'apply',

                        fieldId: 'internalid',

                        line: i

                    });

                    var saldofact = objRecord.getSublistValue({

                        sublistId: 'apply',

                        fieldId: 'due',

                        line: i

                    });

                    //  Validar saldo de factura
                    if (refnum == internalid && saldofact < amount) {
                        log.error({
                            title: 'Error: Documento no tiene saldo para aplicar el valor de la NC',
                            details: 'Documento: ' + internalid
                        });
                        return
                    }

                    // Aplicar documento de la lista
                    // si el código de factura es igual al internalId del documento
                    // si el documento tiene saldo
                    if (refnum == internalid && saldofact >= amount) {

                        //log.debug("factura", internalid)
                        //log.debug("total", amount)
                        //log.debug("saldo factura", saldofact)


                        var lnNum = objRecord.selectLine({

                            sublistId: 'apply',

                            line: i

                        });

                        // Aplicar documento
                        objRecord.setCurrentSublistValue({

                            sublistId: 'apply',

                            fieldId: 'apply',

                            value: true

                        });

                        // Valor de aplicación
                        objRecord.setCurrentSublistValue({

                            sublistId: 'apply',

                            fieldId: 'amount',

                            value: amount

                        });


                        objRecord.commitLine({

                            sublistId: 'apply'

                        });


                    }

                }
            }

            //}

            let recordId = objRecord.save({ enableSourcing: false, ignoreMandatoryFields: false });
            log.debug('Result', recordId);
            return recordId;

        } catch (error) {
            log.error('Error', error);

        }
    }

    return {
        get: _get,
        post: _post

    }
});