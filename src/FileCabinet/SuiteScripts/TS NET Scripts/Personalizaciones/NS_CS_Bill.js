/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/url', 'N/record', 'N/currentRecord', 'N/transaction', 'N/email', 'N/search'], function (url, record, currentRecord, transaction, email, search) {

    const pageInit = context => {
        const objRecord = context.currentRecord;
        const typeMode = context.mode;
        const typeTransaction = currentRecord.type;
        const APPROVED = 2;
        const DOCUMENT_TYPE_LIQUIDACION_COMPRA = 10;

        if (typeTransaction == 'vendorbill') {
            if (objRecord.getValue({ fieldId: 'approvalstatus' }) == APPROVED) {
                const field = currentRecord.getField({ fieldId: 'approvalstatus' });
                field.isDisabled = true;
            }
        }

        if (typeMode == 'copy') {
            objRecord.setValue({ fieldId: 'custbody_psg_ei_template', value: '' });
            objRecord.setValue({ fieldId: 'custbody_psg_ei_status', value: '' });
            objRecord.setValue({ fieldId: 'custbody_psg_ei_sending_method', value: '' });
        }

        if (typeMode == 'edit') {
            objRecord.setValue({ fieldId: 'custbody_ec_monto_iva', value: '' });
            if (objRecord.getValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal' }) != DOCUMENT_TYPE_LIQUIDACION_COMPRA /*&& (objRecord.getValue('custbody_psg_ei_status') != 1)*/) {
                // objRecord.setValue({ fieldId: 'custbody_psg_ei_template', value: '' });
                // objRecord.setValue({ fieldId: 'custbody_psg_ei_status', value: '' });
                // objRecord.setValue({ fieldId: 'custbody_psg_ei_sending_method', value: '' });
            }
        }
    }

    function lineInit(context) {
        const objRecord = context.currentRecord;
        let count = objRecord.getLineCount({ sublistId: 'item' });
        let expense = objRecord.getLineCount({ sublistId: 'expense' });
        objRecord.setValue({ fieldId: 'custbodyts_ec_base_rate0', value: 0 });
        objRecord.setValue({ fieldId: 'custbodyts_ec_base_rate12', value: 0 });
        objRecord.setValue({ fieldId: 'custbodyts_ec_base_rate14', value: 0 });
        objRecord.setValue({ fieldId: 'custbody_ec_importe_base_ir', value: 0 });
        objRecord.setValue({ fieldId: 'custbody_ec_impb_ir2', value: 0 });
        objRecord.setValue({ fieldId: 'custbody_ec_impb_ir3', value: 0 });
        objRecord.setValue({ fieldId: 'custbody_ec_monto_de_ret_ir', value: 0 });
        objRecord.setValue({ fieldId: 'custbody_ec_mont_ret_2', value: 0 });
        objRecord.setValue({ fieldId: 'custbody_ec_mont_ret_3', value: 0 });

        objRecord.setValue({ fieldId: 'custbody_ec_importe_base_iva', value: 0 });
        objRecord.setValue({ fieldId: 'custbody_ec_porcentaje_ret_10', value: 0 });
        objRecord.setValue({ fieldId: 'custbody_ec_porcentaje_ret_20', value: 0 });
        objRecord.setValue({ fieldId: 'custbody_ec_porcentaje_ret_30', value: 0 });
        objRecord.setValue({ fieldId: 'custbody_ec_porcentaje_ret_70', value: 0 });
        objRecord.setValue({ fieldId: 'custbody_ec_porcentaje_ret_100', value: 0 });
        objRecord.setValue({ fieldId: 'custbody_cod_ret_iva_10', value: '' });
        objRecord.setValue({ fieldId: 'custbody_cod_ret_iva_20', value: '' });
        objRecord.setValue({ fieldId: 'custbody_cod_ret_iva_30', value: '' });
        objRecord.setValue({ fieldId: 'custbody_cod_ret_iva_70', value: '' });
        objRecord.setValue({ fieldId: 'custbody_cod_ret_iva_100', value: '' });

        objRecord.setValue({ fieldId: 'custbody_ec_ret_ir', value: '' });
        objRecord.setValue({ fieldId: 'custbody_ec_porcentaje_ret_ir', value: '' });

        objRecord.setValue({ fieldId: 'custbody_ec_ret_por_ir2', value: '' });
        objRecord.setValue({ fieldId: 'custbody_ec_ret_ir2', value: '' });

        objRecord.setValue({ fieldId: 'custbody_ec_ret_por_ir3', value: '' });
        objRecord.setValue({ fieldId: 'custbody_ec_ret_ir3', value: '' });

        objRecord.setValue({ fieldId: 'custbody_ec_monto_iva', value: '' });


        // for (let j = 0; j < count; j++) {
        //     let taxrate = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxrate1', line: j });
        //     let rate = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: j });
        //     let valueImput = objRecord.getValue({ fieldId: 'custbodyts_ec_base_rate' + taxrate });
        //     objRecord.setValue({ fieldId: 'custbodyts_ec_base_rate' + taxrate, value: valueImput + rate });
        // }
        // for (let i = 0; i < expense; i++) {
        //     let taxrate = objRecord.getSublistValue({ sublistId: 'expense', fieldId: 'taxrate1', line: i });
        //     let rate = objRecord.getSublistValue({ sublistId: 'expense', fieldId: 'amount', line: i });
        //     let valueImput = objRecord.getValue({ fieldId: 'custbodyts_ec_base_rate' + taxrate });
        //     objRecord.setValue({ fieldId: 'custbodyts_ec_base_rate' + taxrate, value: valueImput + rate });
        // }
        return true;
    }


    return {
        pageInit: pageInit,
        lineInit: lineInit
    }
});
