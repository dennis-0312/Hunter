/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/record', 'N/https'], function (log, record, https) {
    function afterSubmit(context) {
        let objRecord = context.newRecord;
        let ordenId = objRecord.id;
        let idTelematic = objRecord.getValue({ fieldId: 'custentity_ht_customer_id_telematic' });
        if (context.type === 'create' || context.type === 'edit') {
            if (idTelematic.length == 0) {
                let telemat = {
                    customer: {
                        username: objRecord.getValue({ fieldId: 'entityid' }),
                        customer: {
                            identity_document_number: "0932677495",
                            company_code: "0991259546001",
                            identity_document_type: 3
                        },
                        first_name: objRecord.getValue({ fieldId: 'custentity_ht_cl_primernombre' }) + ' ' + objRecord.getValue({ fieldId: 'custentity_ht_cl_segundonombre' }),
                        last_name: objRecord.getValue({ fieldId: 'custentity_ht_cl_apellidopaterno' }) + ' ' + objRecord.getValue({ fieldId: 'custentity_ht_cl_apellidomaterno' }),
                        is_active: true,
                        email: objRecord.getValue({ fieldId: 'email' }),
                    }
                }
                let Telematic = envioTelematic(telemat);
                Telematic = JSON.parse(Telematic);
                if (Telematic.customer.id) {
                    let cliente = record.load({ type: 'customer', id: ordenId });
                    cliente.setValue({ fieldId: 'custentity_ht_customer_id_telematic', value: Telematic.customer.id })
                    cliente.save();
                }
            }
        }

    }
    const envioTelematic = (json) => {
        let myRestletHeaders = new Array();
        myRestletHeaders['Accept'] = '*/*';
        myRestletHeaders['Content-Type'] = 'application/json';
        let myRestletResponse = https.requestRestlet({
            body: JSON.stringify(json),
            deploymentId: 'customdeploy_ts_rs_newcustomer',
            scriptId: 'customscript_ts_rs_newcustomer',
            headers: myRestletHeaders,
        });
        let response = myRestletResponse.body;
        return response;
    }
    return {

        afterSubmit: afterSubmit
    }
});

