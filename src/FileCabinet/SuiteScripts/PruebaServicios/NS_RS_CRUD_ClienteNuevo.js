/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/record', 'N/file'], function(log, record, file) {

    function _get(context) {
        try {
           // log.debug('Result', 'Hola Mundo..GET.');
          //	return 'prueba Maritza';
           let fileObj = file.create({
                name: 'PruebaConexion.txt',
                fileType: file.Type.PLAINTEXT,
                contents: 'Bienvenido a NetSuite'
            })

            fileObj.encoding=file.Encoding.UTF8
            fileObj.folder = 813

            let idfile = fileObj.save();
          
            return "Archivo creado......";
        } catch (error) {
            log.error('Error-GET', error)
          
        }

    }

    function _post(context) {
        try {
                     
             log.debug('Request', context);
          
          
           //let customerform = '67';
            //let customer = '171596';
            //let payment = '100';
            let currency = '1'
            let exchangerate='1';
            //const start = Date.now();
            //let postingperiod='117';
            //let meno='Prueba de recibo';
            //let paymentoption='1';
            let undepfunds='T';
            //let trandate ='12/06/2022'; //mes-dia-año
            let customerform = context.customerform;
            let customer = context.customer;
            let payment = context.payment;
           
            //const start = Date.now();
            //let postingperiod='117';
            let meno=context.meno;
            let paymentoption=context.paymentoption;
            //let undepfunds='T';
            //let trandate ='12/06/2022'; //mes-dia-año

          
            //let trandate = format.format({value: new Date(), type: format.Type.DATETIMETZ})

            // CREATION ORDER RECORD
            let objRecord = record.create({ type: record.Type.CUSTOMER_DEPOSIT, isDynamic: true });

            //PRIMARY INFORMATION
            objRecord.setValue({ fieldId: 'customform', value: customerform });
            objRecord.setValue({ fieldId: 'customer', value: customer });
            objRecord.setValue({ fieldId: 'payment', value: payment });
            objRecord.setValue({ fieldId: 'currency', value: currency });
            objRecord.setValue({ fieldId: 'exchangerate', value: exchangerate });
            // objRecord.setValue({ fieldId: 'trandate', value:  });
            //objRecord.setValue({ fieldId: 'trandate', value: new Date(trandate) });
            objRecord.setValue({ fieldId: 'trandate', value: new Date(context.date) })
            // objRecord.setValue({ fieldId: 'postingperiod', value: postingperiod });
            objRecord.setValue({ fieldId: 'memo', value: meno });
            objRecord.setValue({ fieldId: 'paymentoption', value: paymentoption });
            objRecord.setValue({ fieldId: 'undepfunds', value: undepfunds });

            let recordId = objRecord.save({ enableSourcing: false, ignoreMandatoryFields: false });
            log.debug('Result', recordId);

            log.debug('Result', 'Hola Mundo..post.');
          
            return "Grabado..........";
        } catch (error) {
            log.error('Error', error);
           return "error";
        }
    }

    function _put(context) {
       try {
            //REQUEST
            let idsalesorder = context.idsalesorder;
            let trandate = context.trandate;

            //UPDATE RECORD
            let objRecord = record.load({ type: record.Type.salesorder, id: idsalesorder, isDynamic: true });
           objRecord.setValue({ fieldId: 'trandate', value: trandate, ignoreFieldChange: true });
            let recordId = objRecord.save({ enableSourcing: false, ignoreMandatoryFields: false });
            
            return {
                id: recordId,
                success: 1
            }
        } catch (error) {
            log.error('Error', error);
        }


    }

    function _delete(context) {
        try {
            log.debug('Result', 'Hola Mundo..delete.');
          
        } catch (error) {
            log.error('Error', error);
        }

    }

    return {
        get: _get,
        post: _post,
        put: _put,
        delete: _delete
    }
});