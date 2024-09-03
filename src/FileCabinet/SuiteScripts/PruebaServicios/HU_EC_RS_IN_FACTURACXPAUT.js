/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/record', 'N/search'], function (log, record, search) {

    function _get(context) {
        try {
            let iddocument = context.iddocument;
            let objRecord = record.load({ type: record.Type.VENDOR_BILL, id: iddocument, isDynamic: true });
            //let objRecord = record.load({ type: record.Type.VENDOR, id: iddocument, isDynamic: true });

            //let companyname = objRecord.getValue({ fieldId: 'entityid' });

            return {
                vendorbill: objRecord

            }
        } catch (error) {
            log.error('Error', error);
        }
    }

    function _post(context) {
        try {
            //REQUEST

            // FIELDS
            let entity = context.entity; // codigo proveedor
            let trandate = context.trandate; // fecha de transacción
            //let postingperiod  = context.postingperiod; // periodo contable
            let custbodyts_ec_tipo_documento_fiscal = context.custbodyts_ec_tipo_documento_fiscal; // tipo de docuento - FACTURA
            let custbody_ts_ec_serie_doc_cxp = context.custbody_ts_ec_serie_doc_cxp; // serie
            let custbody_ts_ec_numero_preimpreso = context.custbody_ts_ec_numero_preimpreso; // número documento
            let custbody_ts_ec_folio_fiscal = context.custbody_ts_ec_folio_fiscal; // Folio fiscal
            let location = context.location; // Ciudad
            //let usertotal = context.usertotal; // monto total
            //let taxtotal  = context.taxtotal; // monto IVA
            let exchangeRate = context.exchangeRate; // campos de Netsuite
            let landedCostMethod = context.landedCostMethod;// campos de Netsuite
            let custbodyts_ec_num_autorizacion = context.custbodyts_ec_num_autorizacion; // numero de autorizacion
            let duedate = context.duedate; // fecha de vencimiento
            let custbody_ec_fecha_autorizacion = context.custbody_ec_fecha_autorizacion// fecha de autorizacion del documento
            let custbody_ec_origen_ingreso = context.custbody_ec_origen_ingreso // origen de ingreso HT - HUNTER
            let custbody_ec_comentario = context.custbody_ec_comentario // comentario
            let custbodyts_ec_tipo_trans = context.custbodyts_ec_tipo_trans // tipo de transaccion
            let custbody_ts_ec_sustento_comprobante = context.custbody_ts_ec_sustento_comprobante // Sust. de comprobante
            let department = context.department // Departamento
            //let custbody_ei_doc_pdf_trans = context.custbody_ei_doc_pdf_trans // Ruta del archivo PDF
            //let custbody_ei_doc_xml_trans = context.custbody_ei_doc_xml_trans // Ruta del archivo XML

            // sublists
            // expense : GASTO
            let category = context.expenses[0].category; // TIPO GASTO
            let amount = context.expenses[0].amount; // BASE IMPONIBLE
            let grossamt = Number.parseFloat(context.expenses[0].grossamt).toFixed(2); // TOTAL DETALLE
            //let line   = context.line;   // LINEA DETALLE
            //let location = context.expenses[0].location;    // CIUDAD
            let tax1amt = context.expenses[0].tax1amt;    // MONTO IVA
            let taxcode = context.expenses[0].taxcode;  // CODIGO TASA IVA
            //let taxrate1    = context.taxrate1;  // PORCENTAJE IVA


            log.debug('Dato provedor........', entity);
            log.debug('Dato serie........', custbody_ts_ec_serie_doc_cxp);
            log.debug('Dato numero doc........', custbody_ts_ec_numero_preimpreso);

            /*
            log.debug('Dato tipo doc........', custbodyts_ec_tipo_documento_fiscal);
            log.debug('Dato trandate........', trandate);
            log.debug('Dato exchangeRate........', exchangeRate);
            log.debug('Dato landedCostMethod........', landedCostMethod);
            log.debug('Dato custbodyts_ec_num_autorizacion........', custbodyts_ec_num_autorizacion);
            log.debug('Dato duedate........', duedate);
            log.debug('Dato custbody_ec_fecha_autorizacion........', custbody_ec_fecha_autorizacion);
            log.debug('Dato custbody_ec_origen_ingreso........', custbody_ec_origen_ingreso);
            log.debug('Dato custbody_ec_comentario........', custbody_ec_comentario);

            */

            //log.debug('Dato categoria........', category);
            //log.debug('Dato base imponible........', amount);
            //log.debug('Dato total detalle........', grossamt);
            //log.debug('Dato ciudad........', location);
            //log.debug('Dato monto IVA........', tax1amt);
            //log.debug('Dato codigo tasa........', taxcode);


            // consulta de internalId de PROVEEDOR
            var busquedaVendor = search.create({
                type: search.Type.VENDOR,
                columns: ['entityid', 'altname', 'internalid', 'terms'],
                filters: ['vatregnumber', search.Operator.STARTSWITH, entity]
            });
            var myResultSetVend = busquedaVendor.run().getRange({ start: 0, end: 1 });
            var theCountVend = busquedaVendor.runPaged().count;
            if (theCountVend != 1) {
                log.debug('Busqueda.Error 200 no se encontró el Proveedor........', myResultSetVend);
                return 'ERROR:' + '200'; //No se encontró el Proveedor
            } else {
                //Obtiene el ID
                var vendorId = myResultSetVend[0].getValue(busquedaVendor.columns[2]);
                var nombreproveedor = myResultSetVend[0].getValue(busquedaVendor.columns[1]);
                var terms = myResultSetVend[0].getValue(busquedaVendor.columns[3]);
            }

            //log.debug('terms........', terms);
            log.debug('myResultSetVend........', myResultSetVend);
            log.debug('vendorId........', vendorId);
            log.debug('nombreproveedor........', nombreproveedor);



            //https://invoice.hunter.com.ec:2250/XMLProv/2202202401099118943200120011000002121130021211319.xml
            //https://invoice.hunter.com.ec:2250/PDFProv/ComprobanteElectronico0101201601179089978000120010160001182700011827019.pdf

            var comentario = 'FAC.CXP.AUT. PROVEEDOR. ' + entity + '-' + nombreproveedor + ' FAC. ' + custbody_ts_ec_serie_doc_cxp + '-' + custbody_ts_ec_numero_preimpreso;
            var rutapdf = 'https://invoice.hunter.com.ec:2250/PDFProv/' + 'comprobanteElectronico' + custbody_ec_comentario + '.PDF';
            var rutaxml = 'https://invoice.hunter.com.ec:2250/XMLProv/' + custbody_ec_comentario + '.XML';

            var subsidiary = 2; // CARSEG
            var customform = 152; // Formulario de compra

            log.debug('subsidiary........', subsidiary);
            log.debug('customform........', customform);

            // VERIFICAR FACTURA NO REGISTRADA 

            //log.debug('SERIE........', custbody_ts_ec_serie_doc_cxp);
            //log.debug('PREIMPRESO........', custbody_ts_ec_numero_preimpreso);

            // FA041001000039379
            var referenciafac = 'FA' + custbody_ts_ec_serie_doc_cxp + custbody_ts_ec_numero_preimpreso;
            var custbody_ec_desc_tip_iva = 7;
            log.debug('FACTURA........', referenciafac);

            // Verificar factura registrada
            if (vendorId > 0) {
                var busquedaFac = search.create({
                    type: search.Type.VENDOR_BILL,
                    columns: ['internalid'],
                    filters:
                        [
                            ["tranid", search.Operator.STARTSWITH, referenciafac],
                            "AND",
                            ["vendor.internalid", search.Operator.ANYOF, vendorId],
                            "AND",
                            ["subsidiary", "anyof", "2"],
                            "AND",
                            ["customform", "anyof", "152"]
                        ]
                });
                var myResultSetFac = busquedaFac.run().getRange({ start: 0, end: 1 });
                var theCountFac = busquedaFac.runPaged().count;
                if (theCountFac > 0) {
                    var facturaId = myResultSetFac[0].getValue(busquedaFac.columns[0]);
                    log.debug('Busqueda.Error 300 la factura ya se encuentra registrada........', myResultSetFac);
                    return 'ERROR:' + '300'; //Factura ya se encuentra registrada
                }
            }


            var custbody_ts_ec_metodo_pago = 4;  // EC - OTROS CON UTILIZACIÓN DEL SISTEMA FINANCIERO
            var custbody_ts_pago_residente = '01'; // 01 - Pago a residente / Establecimiento permanente

            //CREATE RECORD
            let objRecord = record.create({ type: record.Type.VENDOR_BILL, isDynamic: true });

            objRecord.setValue({ fieldId: 'customform', value: customform });
            objRecord.setValue({ fieldId: 'subsidiary', value: subsidiary });
            objRecord.setValue({ fieldId: 'entity', value: vendorId });
            objRecord.setValue({ fieldId: 'trandate', value: new Date(trandate) });
            //objRecord.setValue({ fieldId: 'postingperiod',  value: postingperiod });

            //19 - CHEQUE A VISTA - si el campo terminos del proveedor registra este valor o no tiene valor
            //Se chequea con valor TRUE campo Retencion pago de la factura
            /*if (terms == '19' || terms == '') { 
                objRecord.setValue({ fieldId: 'paymenthold', value: true });
            }
            */

            objRecord.setValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal', value: custbodyts_ec_tipo_documento_fiscal });
            objRecord.setValue({ fieldId: 'custbody_ts_ec_serie_doc_cxp', value: custbody_ts_ec_serie_doc_cxp });
            objRecord.setValue({ fieldId: 'custbody_ts_ec_numero_preimpreso', value: custbody_ts_ec_numero_preimpreso });
            objRecord.setValue({ fieldId: 'custbody_ts_ec_folio_fiscal', value: custbody_ts_ec_folio_fiscal });
            objRecord.setValue({ fieldId: 'location', value: location });
            objRecord.setValue({ fieldId: 'exchangeRate', value: exchangeRate });// campos de Netsuite
            objRecord.setValue({ fieldId: 'landedCostMethod', value: landedCostMethod });// campos de Netsuite
            objRecord.setValue({ fieldId: 'memo', value: comentario });// memo
            objRecord.setValue({ fieldId: 'custbodyts_ec_num_autorizacion', value: custbodyts_ec_num_autorizacion });// numero de autorizacion
            objRecord.setValue({ fieldId: 'custbody_ts_ec_metodo_pago', value: custbody_ts_ec_metodo_pago });// metodo de pago
            objRecord.setValue({ fieldId: 'duedate', value: new Date(duedate) });// fecha de vencimiento del documento
            objRecord.setValue({ fieldId: 'custbody_ec_fecha_autorizacion', value: new Date(custbody_ec_fecha_autorizacion) });// fecha de autorizacion del documento
            objRecord.setValue({ fieldId: 'custbody_ec_origen_ingreso', value: custbody_ec_origen_ingreso });// origen de ingreso HT - Hunter
            objRecord.setValue({ fieldId: 'custbody_ec_comentario', value: comentario });// comentario
            objRecord.setValue({ fieldId: 'custbodyts_ec_tipo_trans', value: custbodyts_ec_tipo_trans });// tipo transaccion
            objRecord.setValue({ fieldId: 'custbody_ts_ec_sustento_comprobante', value: custbody_ts_ec_sustento_comprobante });// Sus. de Comprobante
            objRecord.setValue({ fieldId: 'department', value: department });// Department
            objRecord.setValue({ fieldId: 'custbody_ei_doc_pdf_trans', value: rutapdf });// Ruta del archivo PDF
            objRecord.setValue({ fieldId: 'custbody_ei_doc_xml_trans', value: rutaxml });// Ruta del archivo XML
            objRecord.setValue({ fieldId: 'custbody_ts_pago_residente', value: custbody_ts_pago_residente });// campo pago residente
            objRecord.setValue({ fieldId: 'custbody_ec_desc_tip_iva', value: custbody_ec_desc_tip_iva });// Tipo de IVA



            //DETALLE DE GASTOS
            const itemLine = objRecord.selectNewLine({ sublistId: 'expense' });
            let items = context.expenses; // declaracion del arreglo del for
            for (let i in items) {
                log.debug('items.........', items);

                itemLine.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'category', value: items[i].category });  // TIPO GASTO
                itemLine.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'amount', value: items[i].amount }); // BASE IMPONIBLE
                //itemLine.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'grossamt', value: items[i].grossamt }); // TOTAL DETALLE
                itemLine.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'location', value: location }); // CIUDAD
                itemLine.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'tax1amt', value: items[i].tax1amt });  // MONTO IVA
                itemLine.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'taxcode', value: items[i].taxcode });   // CODIGO TASA IVA


                //log.debug('Busqueda.customer........', customer);

                objRecord.commitLine({ sublistId: 'expense' });
            }
            //TODO 

            let recordId = objRecord.save({ enableSourcing: false, ignoreMandatoryFields: false });
            log.debug('Result', recordId);
            return recordId;
        } catch (error) {
            log.error('Error', error);

        }
    }

    const getItemID = (sku) => {
        let result = 0;
        const searchLoad = search.create({
            type: "item",
            filters: [
                ["type", "anyof", "InvtPart", "Discount", "Service"],
                "AND", ["upccode", "startswith", sku]
            ],
            columns: [
                search.createColumn({
                    name: "itemid",
                    sort: search.Sort.ASC,
                    label: "Name"
                }),
                'internalid'
            ]
        });
        let searchResultCount = searchLoad.runPaged().count;
        if (searchResultCount != 0) {
            let searchResult = searchLoad.run().getRange({ start: 0, end: 1 });
            let column01 = searchResult[0].getValue(searchLoad.columns[1]);
            result = column01;
        }
        return result;
    }

    return {
        get: _get,
        post: _post
        //put: _put,
        //delete: _delete
    }
});