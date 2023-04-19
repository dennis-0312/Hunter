/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/record', 'N/file', 'N/search'], function(log, record, file, search) {

    function _get(busqueda) {
        try {
          
   log.debug('Request', busqueda);
           // let customer = "12881";
          // let objRecord = record.load({ type: record.Type.CUSTOMER_DEPOSIT, customer: customer, isDynamic: true });
          
            let objRecord = record.load({ type: record.Type.CUSTOMER_DEPOSIT, id: busqueda.busqueda});
            log.debug('Busqueda.........', objRecord);
            //let objRecord = record.load({ type: record.Type.CUSTOMER, id: idcustomer, isDynamic: true });
           let payment = objRecord.getValue({ fieldId: 'payment' });
            let trandate = objRecord.getValue({ fieldId: 'trandate' });
            let memo = objRecord.getValue({ fieldId: 'memo' });
            let customer = objRecord.getValue({ fieldId: 'customer' });
            let internalid = objRecord.getValue({ fieldId: 'internalid' });
            let customerdeposit = objRecord.getValue({ fieldId: 'customerdeposit' });
            return {
               objRecord:objRecord
              
            }
        } catch (error) {
            log.error('Error-GET', error)
        }

    }

    function _post(context) {
        try {


            //REQUEST
            log.debug('Request', context);
            //let customerform = '67';
            //let customer = '171596';
            //let payment = '100';
            let currency = '1'
            let exchangerate = '1';
          let subsidiary='2';
            //const start = Date.now();
            //let postingperiod='117';
            //let meno='Prueba de recibo';
            //let paymentoption='1';
            let undepfunds = 'T';
            //let trandate ='12/06/2022'; //mes-dia-año
            let customerform = context.customerform;
            //let customer = context.customer;
           let vatregnumber = context.customer;
            let payment = context.payment;
let checknumber = context.checknumber
            //const start = Date.now();
            //let postingperiod='117';
            let meno = context.meno;
            let paymentoption = context.paymentoption;
            let department = context.department
            let clases = context.clase
            let location = context.location
            let usuario = context.usuario
            //let undepfunds='T';
            //let trandate ='12/06/2022'; //mes-dia-año

           // consulta de internalId
            var busquedaCustomer = search.create({
                type: search.Type.CUSTOMER,
                columns: ['entityid', 'altname','internalid'],
                 filters: ['vatregnumber', search.Operator.STARTSWITH, vatregnumber]
            });
           var myResultSet = busquedaCustomer.run().getRange({start: 0, end: 1});;
  	  log.debug('Busqueda.........', myResultSet);     
          log.debug('Usuario Ingreso.........', usuario);      
        var theCount = busquedaCustomer.runPaged().count;
            if (theCount != 1) {
                log.debug('Busqueda.Error........', myResultSet);    
            } else {
                 //consulta de customer el id
                var customer = myResultSet[0].getValue(busquedaCustomer.columns[2]);
                log.debug('customer........', customer);
 // CREATION ORDER RECORD
            let objRecord = record.create({ type: record.Type.CUSTOMER_DEPOSIT});

            //PRIMARY INFORMATION
            objRecord.setValue({ fieldId: 'customform', value: customerform });
            objRecord.setValue({ fieldId: 'customer', value: customer });
            objRecord.setValue({ fieldId: 'payment', value: payment });
            objRecord.setValue({ fieldId: 'currency', value: currency });
            objRecord.setValue({ fieldId: 'exchangerate', value: exchangerate });
            objRecord.setValue({ fieldId: 'trandate', value: new Date(context.fecha) })
                // objRecord.setValue({ fieldId: 'postingperiod', value: postingperiod });
             objRecord.setValue({ fieldId: 'memo', value: meno });
            objRecord.setValue({ fieldId: 'paymentoption', value: paymentoption });
            //objRecord.setValue({ fieldId: 'paymentinstrumenttype', value: paymentoption });
            //objRecord.setValue({ fieldId: 'paymentmethodtypeid', value: paymentoption });
            objRecord.setValue({ fieldId: 'undepfunds', value: undepfunds });

            objRecord.setValue({ fieldId: 'subsidiary', value: subsidiary });
            objRecord.setValue({ fieldId: 'department', value: department });
            objRecord.setValue({ fieldId: 'class', value: clases });
            objRecord.setValue({ fieldId: 'location', value: location });
               if (paymentoption=='2'){
                    
                    objRecord.setValue({ fieldId: 'checknumber', value: checknumber });
                }
            let recordId = objRecord.save({ ignoreMandatoryFields: false });
              log.debug('paymentoption', paymentoption);
            log.debug('Recibo', recordId);
         
            }
           

           
            return "Grabado..........";

        } catch (error) {
            log.error('Error', error);
        }
    }

    function _put(context) {
        try {
            log.debug('Result', 'Hola Mundo..put.');
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