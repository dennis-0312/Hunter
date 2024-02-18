/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/record'], function (log, record) {

    function _get(context) {
        try {
            let idcustomer = context.idcustomer;
            let objRecord = record.load({ type: record.Type.CUSTOMER, id: idcustomer, isDynamic: true });

            let companyname = objRecord.getValue({ fieldId: 'companyname' });
            let email = objRecord.getValue({ fieldId: 'email' });
            let phone = objRecord.getValue({ fieldId: 'phone' });
            let subsidiary = objRecord.getText({ fieldId: 'subsidiary' });

            return {
                companyname: companyname,
                email: email,
                phone: phone,
                subsidiary: subsidiary
            }
        } catch (error) {
            log.error('Error', error);
        }
    }

    function _post(context) {
        try {
            //REQUEST
            let isperson = context.isperson;
            let companyname = context.companyname;
            let email = context.email;
            let phone = context.phone;
            let subsidiary = context.principalsubsidiary;

            //CREATE RECORD
            let objRecord = record.create({ type: record.Type.CUSTOMER, isDynamic: true });
            objRecord.setValue({ fieldId: 'isperson', value: isperson, ignoreFieldChange: true });
            objRecord.setValue({ fieldId: 'companyname', value: companyname, ignoreFieldChange: true });
            objRecord.setValue({ fieldId: 'email', value: email, ignoreFieldChange: true });
            objRecord.setValue({ fieldId: 'phone', value: phone, ignoreFieldChange: true });
            objRecord.setValue({ fieldId: 'subsidiary', value: subsidiary, ignoreFieldChange: true });
            let recordId = objRecord.save({ enableSourcing: false, ignoreMandatoryFields: false });
            log.debug('Result', recordId);
            return recordId;
        } catch (error) {
            log.error('Error', error);
        }
    }

    function _put(context) {
        try {
            //REQUEST
            let idcustomer = context.idcustomer;
            let companyname = context.companyname;
            let phone = context.phone;

            //UPDATE RECORD
            let objRecord = record.load({ type: record.Type.CUSTOMER, id: idcustomer, isDynamic: true });
            objRecord.setValue({ fieldId: 'companyname', value: companyname, ignoreFieldChange: true });
            objRecord.setValue({ fieldId: 'phone', value: phone, ignoreFieldChange: true });
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
            let idcustomer = context.idcustomer;
            record.delete({ type: record.Type.CUSTOMER, id: idcustomer });
            return 'Registro Eliminado';
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
