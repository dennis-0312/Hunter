/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
 define(['N/log', 'N/record', 'N/search'], function(log, record, search) {

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
            let trandate  = context.trandate; // fecha de transacción
            //let postingperiod  = context.postingperiod; // periodo contable
            let custbodyts_ec_tipo_documento_fiscal = context.custbodyts_ec_tipo_documento_fiscal; // tipo de docuento - FACTURA
            let custbody_ts_ec_serie_doc_cxp = context.custbody_ts_ec_serie_doc_cxp; // serie
            let custbody_ts_ec_numero_preimpreso = context.custbody_ts_ec_numero_preimpreso; // número documento
            let custbody_ts_ec_folio_fiscal = context.custbody_ts_ec_folio_fiscal; // Folio fiscal
            let location = context.location; // Ciudad
            //let usertotal = context.usertotal; // monto total
            //let taxtotal  = context.taxtotal; // monto IVA
            let exchangeRate  = context.exchangeRate; // campos de Netsuite
            let landedCostMethod  = context.landedCostMethod;// campos de Netsuite
            let custbodyts_ec_num_autorizacion = context.custbodyts_ec_num_autorizacion; // numero de autorizacion
            let duedate = context.duedate; // fecha de vencimiento
            let custbody_ec_fecha_autorizacion = context.custbody_ec_fecha_autorizacion// fecha de autorizacion del documento
            let custbody_ec_origen_ingreso = context.custbody_ec_origen_ingreso // origen de ingreso HT - HUNTER
            let custbody_ec_comentario = context.custbody_ec_comentario // comentario

            // sublists
            // expense : GASTO
            let category   = context.expenses[0].category; // TIPO GASTO
            let amount = context.expenses[0].amount; // BASE IMPONIBLE
            let grossamt = Number.parseFloat( context.expenses[0].grossamt).toFixed(2); // TOTAL DETALLE
            //let line   = context.line;   // LINEA DETALLE
            //let location = context.expenses[0].location;    // CIUDAD
            let tax1amt  = context.expenses[0].tax1amt;    // MONTO IVA
            let taxcode   =  context.expenses[0].taxcode;  // CODIGO TASA IVA
            //let taxrate1    = context.taxrate1;  // PORCENTAJE IVA


            log.debug('Dato provedor........', entity);
            log.debug('Dato fecha........', trandate);
            log.debug('Dato tipo doc........', custbodyts_ec_tipo_documento_fiscal);
            log.debug('Dato serie........', custbody_ts_ec_serie_doc_cxp);
            log.debug('Dato numero doc........', custbody_ts_ec_numero_preimpreso);
            log.debug('Dato exchangeRate........', exchangeRate);
            log.debug('Dato landedCostMethod........', landedCostMethod);
            log.debug('Dato custbodyts_ec_num_autorizacion........', custbodyts_ec_num_autorizacion);
            log.debug('Dato duedate........', duedate);
            log.debug('Dato custbody_ec_fecha_autorizacion........', custbody_ec_fecha_autorizacion);
            log.debug('Dato custbody_ec_origen_ingreso........', custbody_ec_origen_ingreso);
            log.debug('Dato custbody_ec_comentario........', custbody_ec_comentario);
            
            //log.debug('Dato categoria........', category);
            //log.debug('Dato base imponible........', amount);
            //log.debug('Dato total detalle........', grossamt);
            //log.debug('Dato ciudad........', location);
            //log.debug('Dato monto IVA........', tax1amt);
            //log.debug('Dato codigo tasa........', taxcode);


            //CREATE RECORD
            let objRecord = record.create({ type: record.Type.VENDOR_BILL, isDynamic: true });
            objRecord.setValue({ fieldId: 'entity', value: entity });
            objRecord.setValue({ fieldId: 'trandate', value: new Date(context.trandate) });
            //objRecord.setValue({ fieldId: 'postingperiod',  value: postingperiod });
            objRecord.setValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal', value: custbodyts_ec_tipo_documento_fiscal });
            objRecord.setValue({ fieldId: 'custbody_ts_ec_serie_doc_cxp', value: custbody_ts_ec_serie_doc_cxp });
            objRecord.setValue({ fieldId: 'custbody_ts_ec_numero_preimpreso', value: custbody_ts_ec_numero_preimpreso });
            objRecord.setValue({ fieldId: 'custbody_ts_ec_folio_fiscal', value: custbody_ts_ec_folio_fiscal });
            objRecord.setValue({ fieldId: 'location', value: location });
            objRecord.setValue({ fieldId: 'exchangeRate', value: exchangeRate });// campos de Netsuite
            objRecord.setValue({ fieldId: 'landedCostMethod', value: landedCostMethod });// campos de Netsuite
            objRecord.setValue({ fieldId: 'custbodyts_ec_num_autorizacion', value: custbodyts_ec_num_autorizacion });// numero de autorizacion
            objRecord.setValue({ fieldId: 'duedate', value: new Date(context.duedate) });// fecha de vencimiento del documento
            objRecord.setValue({ fieldId: 'custbody_ec_fecha_autorizacion', value: new Date(context.custbody_ec_fecha_autorizacion) });// fecha de autorizacion del documento
            objRecord.setValue({ fieldId: 'custbody_ec_origen_ingreso', value: custbody_ec_origen_ingreso });// origen de ingreso HT - Hunter
            objRecord.setValue({ fieldId: 'custbody_ec_comentario', value: custbody_ec_comentario });// comentario
            

            //DETALLE DE GASTOS
            const itemLine = objRecord.selectNewLine({ sublistId: 'expense' });
            let items = context.expenses; // declaracion del arreglo del for
            for (let i in items) {
                log.debug('items.........', items);
                let mul = 0;
                let itemid = '';
                let subTotal = -2;
                let taxrate = '';
                let lookUpTaxCode = '';
                // log.debug('SKU', items[i].sku);
                //itemid = items[i].itemid;
                   
                //itemLine.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'category', value: category });  // TIPO GASTO
                //itemLine.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'amount', value: amount }); // BASE IMPONIBLE
                //itemLine.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'grossamt', value: grossamt }); // TOTAL DETALLE
                //itemLine.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'location', value: location }); // CIUDAD
                //itemLine.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'tax1amt', value: tax1amt });  // MONTO IVA
                //itemLine.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'taxcode', value: taxcode });   // CODIGO TASA IVA

                itemLine.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'category', value: items[i].category });  // TIPO GASTO
                itemLine.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'amount', value: items[i].amount }); // BASE IMPONIBLE
                itemLine.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'grossamt', value: items[i].grossamt }); // TOTAL DETALLE
                itemLine.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'location',  value: location }); // CIUDAD
                itemLine.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'tax1amt', value: items[i].tax1amt });  // MONTO IVA
                itemLine.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'taxcode', value: items[i].taxcode });   // CODIGO TASA IVA


                //log.debug('Busqueda.customer........', customer);

                objRecord.commitLine({ sublistId: 'expense' });
            }
                
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