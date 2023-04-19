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
            let custbodyts_ec_tipo_documento_fiscal = context.custbodyts_ec_tipo_documento_fiscal; // tipo de docuento - FACTURA
            let custbody_ts_ec_serie_doc_cxp = context.custbody_ts_ec_serie_doc_cxp; // serie
            let custbody_ts_ec_numero_preimpreso = context.custbody_ts_ec_numero_preimpreso; // número documento
            //let usertotal = context.usertotal; // monto total
            //let taxtotal  = context.taxtotal; // monto IVA
            let exchangeRate  = context.exchangeRate; // campos de Netsuite
            let landedCostMethod  = context.landedCostMethod;// campos de Netsuite
            let generarasientp = false;

            // sublists
            // expense : GASTO
            let category   = context.category; // TIPO GASTO
            let amount = context.amount; // BASE IMPONIBLE
            let grossamt = Number.parseFloat(context.grossamt).toFixed(2); // TOTAL DETALLE
            //let line   = context.line;   // LINEA DETALLE
            let location = context.location;    // CIUDAD
            let tax1amt  = context.tax1amt;    // MONTO IVA
            let taxcode   = context.taxcode;  // CODIGO TASA IVA
            //let taxrate1    = context.taxrate1;  // PORCENTAJE IVA



            log.debug('Dato proveddor........', entity);
            log.debug('Dato fecha........', trandate);
            log.debug('Dato tipo doc........', custbodyts_ec_tipo_documento_fiscal);
            log.debug('Dato serie........', custbody_ts_ec_serie_doc_cxp);
            log.debug('Dato numero doc........', custbody_ts_ec_numero_preimpreso);
            log.debug('Dato exchangeRate........', exchangeRate);
            log.debug('Dato landedCostMethod........', landedCostMethod);


            log.debug('Dato categoria........', category);
            log.debug('Dato base imponible........', amount);
            log.debug('Dato total detalle........', grossamt);
            log.debug('Dato ciudad........', location);
            log.debug('Dato monto IVA........', tax1amt);
            log.debug('Dato codigo tasa........', taxcode);
          
            //CREATE RECORD
            let objRecord = record.create({ type: record.Type.VENDOR_BILL, isDynamic: true });
            objRecord.setValue({ fieldId: 'entity', value: entity });
            objRecord.setValue({ fieldId: 'trandate', value: new Date(context.trandate) });
            objRecord.setValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal', value: custbodyts_ec_tipo_documento_fiscal });
            objRecord.setValue({ fieldId: 'custbody_ts_ec_serie_doc_cxp', value: custbody_ts_ec_serie_doc_cxp });
            objRecord.setValue({ fieldId: 'custbody_ts_ec_numero_preimpreso', value: custbody_ts_ec_numero_preimpreso });
            //objRecord.setValue({ fieldId: 'usertotal', value: usertotal });
            //bjRecord.setValue({ fieldId: 'taxtotal', value: taxtotal });
            objRecord.setValue({ fieldId: 'exchangeRate', value: exchangeRate });// campos de Netsuite
            objRecord.setValue({ fieldId: 'landedCostMethod', value: landedCostMethod });// campos de Netsuite

            //DETALLE DE GASTOS
            // NO SE INSERTA PRODUCTOS SOLO GASTOS
            // SOLO INSERTO UNA LINEA EN ESTE CASO: GASTO DE COMBUSTIBLE
            const itemLine = objRecord.selectNewLine({ sublistId: 'expense' });
            itemLine.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'category', value: category });  // TIPO GASTO
            itemLine.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'amount', value: amount }); // BASE IMPONIBLE
            itemLine.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'grossamt', value: grossamt }); // TOTAL DETALLE
            itemLine.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'location', value: location }); // CIUDAD
            itemLine.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'tax1amt', value: tax1amt });  // MONTO IVA
            itemLine.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'taxcode', value: taxcode });   // CODIGO TASA IVA
            //itemLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'taxrate1', value: taxrate1}); // PORCENTAJE IVA
            //itemLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'line', value: line}); // LINEA DETALLE
            objRecord.commitLine({ sublistId: 'expense' });

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
        //put: _put,
        //delete: _delete
    }
});