/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
 define(['N/log', 'N/record', 'N/search','N/ui/serverWidget'], (log, record, search, serverWidget) => {
    const beforeSubmit = (context) => {

        if (context.type === context.UserEventType.EDIT || context.type === context.UserEventType.CREATE) {
            const objRecord = context.newRecord;
            try {
                var idPayment = getIdPayment(objRecord.id);
                var nroCuotasDefault = idPayment.cuota;
                var cuentasDefault = idPayment.cuenta;
                log.debug('context form',context.form);
                let form = context.form;
                let field = form.addField({
                    id: 'custpage_textfield',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Nro de Cuotas'
                });
                field.defaultValue = nroCuotasDefault;
                //field.isMandatory = true;
                field.layoutType = serverWidget.FieldLayoutType.NORMAL;
                field.updateBreakType({
                    breakType: serverWidget.FieldBreakType.STARTCOL
                });

                let select = form.addField({
                    id: 'custpage_selectfield',
                    type: serverWidget.FieldType.SELECT,
                    source: 'account',
                    label: 'Cuenta'
                });
                select.defaultValue = cuentasDefault;
                //select.isMandatory = true;
                form.insertField({
                    field: select,
                    nextfield: 'isinactive'
                });
                form.insertField({
                    field: field,
                    nextfield: 'custpage_selectfield'
                });
    
                
            } catch (error) {
                log.error('Error', error);
            }
        }
    }
    return {
        //beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        // afterSubmit: afterSubmit
    }
});