/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/search', 'N/record'], function (log, search, record) {

    function _get(context) {
        return 'Oracle Netsuite Connected - Release 2024.1';
    }

    function _put() {
        //put
    }
    function _delete() {
        //delete
    }

    function _post(context) {
        const customerform = '146';
        const currency = '1';
        const exchangerate = '1';
        const start = Date.now();
        const generatetranidonsave = 'T';
        try {

            //INFORMACION PRINCIPAL

            let depositdate = start;
            let memo = context.memo;
            let customer = context.idCliente;
            let deposit = context.idDepositoCliente;

            //CLASIFICACION
            let subsidiary = context.subsidiary;
            let department = context.department;
            let location = context.location;
            //let aracct= context.cuenta
            let usuario = context.usuario;

            //APPLY
            let idFactura = context.idFactura;


            //CUSTOM

            // CREATION ORDER RECORD
            let objRecord = record.create({ type: record.Type.DEPOSIT_APPLICATION, isDynamic: true });

            //INFORMACION PRINCIPAL
            objRecord.setValue({ fieldId: 'customform', value: customerform });
            objRecord.setValue({ fieldId: 'trandate', value: new Date(start) }) // FECHA DE LA TRANSACCION
            objRecord.setValue({ fieldId: 'customer', value: customer }); // CLIENTE 
            objRecord.setValue({ fieldId: 'currency', value: currency }); // TIPO DE MONEDA
            objRecord.setValue({ fieldId: 'exchangerate', value: exchangerate }); // TIPO DE CAMBIO DE MONEDA
            objRecord.setValue({ fieldId: 'memo', value: memo }); // NOTA PARA IDENTIFICAR TRANSACCION DE APLICACION DE DEPOSITO

            //LOCALIZACION
            objRecord.setValue({ fieldId: 'subsidiary', value: subsidiary }); // EMPRESA
            objRecord.setValue({ fieldId: 'department', value: department }); // DEPARTAMENTO
            objRecord.setValue({ fieldId: 'location', value: location }); // OFICINA


            var numLines = objRecord.getLineCount({ sublistId: 'apply' });
            log.debug('apLine....', numLines);
            if (numLines > 0) {
                for (var i = 0; i < numLines; i++) {
                    var refnum = objRecord.getSublistValue({ sublistId: 'apply', fieldId: 'internalid', line: i });
                    log.debug('refnum....', refnum);
                    var saldofact = objRecord.getSublistValue({ sublistId: 'apply', fieldId: 'due', line: i });
                    log.debug('saldofact....', saldofact);
                    if (refnum == idFactura) {
                        objRecord.selectLine({ sublistId: 'apply', line: i });
                        objRecord.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: true });
                        objRecord.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'total', value: saldofact });
                        break;
                    }
                }
                // GUARDAR EL REGISTRO
                let recordId = objRecord.save({ enableSourcing: true, ignoreMandatoryFields: true });
                log.debug('AplicacionDepisito', recordId);
                return recordId;
            }




        } catch (error) {
            log.error('Error', error);
        }
    }

    return {
        get: _get,
        post: _post,
        put: _put

    }
});