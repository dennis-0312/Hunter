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
            log.debug('Request', context);
            let isperson = context.isperson;
            let primernombre = context.primernombre;
            let segundonombre = context.segundonombre;
            let primerapellido = context.primerapellido;
            let segundoapellido = context.segundoapellido;
            // let companyname = context.companyname;
            // let email = context.email;
            // let phone = context.phone;
            // let subsidiary = context.principalsubsidiary;

            //CREATE RECORD
            let objRecord = record.create({ type: record.Type.CUSTOMER, isDynamic: true });
            objRecord.setValue({ fieldId: 'isperson', value: isperson, ignoreFieldChange: true });
            if (isperson == "T") {
                objRecord.setValue({ fieldId: 'custentity_ht_cl_primernombre', value: primernombre });
                objRecord.setValue({ fieldId: 'custentity_ht_cl_segundonombre', value: segundonombre });
                objRecord.setValue({ fieldId: 'custentity_ht_cl_apellidopaterno', value: primerapellido });
                objRecord.setValue({ fieldId: 'custentity_ht_cl_apellidomaterno', value: segundoapellido });
                objRecord.setValue({ fieldId: 'lastname', value: context.lastname });
                objRecord.setValue({ fieldId: 'firstname', value: context.firstname });
                objRecord.setValue({ fieldId: 'altname', value: context.altname });
                objRecord.setValue({ fieldId: 'companyname', value: "xx " });
            } else {
                objRecord.setValue({ fieldId: 'companyname', value: context.companyname });
                objRecord.setValue({ fieldId: 'altname', value: context.companyname });
                objRecord.setValue({ fieldId: 'firstname', value: context.companyname });
            }

            objRecord.setValue({ fieldId: 'category', value: context.category });
            objRecord.setValue({ fieldId: 'entitystatus', value: context.entitystatus });
            //objRecord.setValue({ fieldId: 'email', value: context.email  });
            //objRecord.setValue({ fieldId: 'phone', value: context.phone  });
            objRecord.setValue({ fieldId: 'subsidiary', value: context.subsidiary });
            objRecord.setValue({ fieldId: 'custentity_ht_cl_oficinacliente', value: context.oficinacliente });
            objRecord.setValue({ fieldId: 'custentity_ec_document_type', value: context.document_type });
            objRecord.setValue({ fieldId: 'custentity_ts_ec_tipo_persona', value: context.tipo_persona });
            objRecord.setValue({ fieldId: 'vatregnumber', value: context.vatregnumber });
            objRecord.setValue({ fieldId: 'custentityts_ec_pais_entidad', value: context.pais_entidad });
            //let recordId = objRecord.save({ enableSourcing: false, ignoreMandatoryFields: false });

            // let items = context.addressbook;
            // log.debug('sublists.........', objRecord.getSublists());
            // const itemLine = objRecord.selectNewLine({ sublistId: 'addressbook' });
            // for (let i in items) {
            //     log.debug('items....direc.....', items);
            //     let direccion = context.altname + ' ' + items[i].addr1 + ' Guayaquil' + ' Ecuador'
            //     itemLine.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'addr1', value: items[i].addr1}); //* //REQUEST
            //     itemLine.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'addressee', value: context.altname}); //* //REQUEST
            //     itemLine.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'country', value: items[i].country }); //* //REQUEST
            //     itemLine.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'custrecord_direccion_zonaciudadela', value: items[i].custrecord_direccion_zonaciudadela }); //* //REQUEST
            //     itemLine.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'custrecord_ec_canton', value: items[i].custrecord_ec_canton}); //* //REQUEST
            //     itemLine.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'custrecord_ec_parroquia', value: items[i].custrecord_ec_parroquia }); //* //REQUEST
            //     itemLine.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'custrecord_ec_provincia', value: items[i].custrecord_ec_provincia}); //* //REQUEST
            //     itemLine.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'custrecord_ht_direccion_tipo', value: items[i].custrecord_ht_direccion_tipo}); //* //REQUEST
            //     itemLine.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'addressbookaddress_text', value: direccion}); //* //REQUEST

            //     objRecord.commitLine({ sublistId: 'addressbook' });

            // }



            let items = context.addressbook;
            // const itemLine = objRecord.selectNewLine({ sublistId: 'addressbook' });
            for (let i in items) {
                /*Ajuste para el codigo del script */
                objRecord.setCurrentSublistValue({
                    sublistId: 'addressbook',
                    fieldId: 'defaultshipping',
                    value: true
                });

                objRecord.setCurrentSublistValue({
                    sublistId: 'addressbook',
                    fieldId: 'defaultbilling',
                    value: true
                });

                objRecord.setCurrentSublistValue({
                    sublistId: 'addressbook',
                    fieldId: 'label',
                    value: items[i].addr1
                });

                let dire = objRecord.getCurrentSublistSubrecord({
                    sublistId: 'addressbook',
                    fieldId: 'addressbookaddress'
                })
                log.debug('items....direc.....', items);
                let direccion = context.altname + ' ' + items[i].addr1 + ' Guayaquil' + ' Ecuador'
                dire.setValue({ fieldId: 'addr1', value: items[i].addr1, ignoreFieldChange: true }); //* //REQUEST
                dire.setValue({ fieldId: 'addressee', value: context.altname, ignoreFieldChange: true }); //* //REQUEST
                dire.setValue({ fieldId: 'country', value: items[i].country, ignoreFieldChange: true }); //* //REQUEST
                dire.setValue({ fieldId: 'custrecord_ec_provincia', value: items[i].custrecord_ec_provincia, ignoreFieldChange: false }); //* //REQUEST
                dire.setValue({ fieldId: 'custrecord_ec_canton', value: items[i].custrecord_ec_canton, ignoreFieldChange: false }); //* //REQUEST
                dire.setValue({ fieldId: 'custrecord_ec_parroquia', value: items[i].custrecord_ec_parroquia, ignoreFieldChange: false }); //* //REQUEST
                dire.setValue({ fieldId: 'custrecord_ht_direccion_tipo', value: items[i].custrecord_ht_direccion_tipo, ignoreFieldChange: true }); //* //REQUEST
                dire.setValue({ fieldId: 'addressbookaddress_text', value: direccion, ignoreFieldChange: true }); //* //REQUEST
                dire.setValue({ fieldId: 'custrecord_direccion_zonaciudadela', value: items[i].custrecord_direccion_zonaciudadela, ignoreFieldChange: true }); //* //REQUEST

                objRecord.commitLine({ sublistId: 'addressbook' });

            }
            //MAIL
            let itemsMail = context.correo;
            //let objRecordEmail = record.create({ type: "customrecord_ht_record_correoelectronico", isDynamic: true });
            //log.debug('items....mail.....', objRecord.getSublists());
            log.debug('items....mail.....', itemsMail);
            const itemLineEmail = objRecord.selectNewLine({ sublistId: 'recmachcustrecord_ht_ce_enlace' });
            for (let i in itemsMail) {
                if (itemsMail[i].principal) {
                    objRecord.setValue({ fieldId: 'email', value: itemsMail[i].email });
                }
                //itemLineEmail.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ht_ce_enlace', fieldId: 'custrecord_ht_ce_enlace', value: recordId}); //* //REQUEST
                itemLineEmail.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ht_ce_enlace', fieldId: 'custrecord_ht_email_email', value: itemsMail[i].email }); //* //REQUEST
                itemLineEmail.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ht_ce_enlace', fieldId: 'custrecord_ht_email_emailprincipal', value: itemsMail[i].principal }); //* //REQUEST
                itemLineEmail.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ht_ce_enlace', fieldId: 'custrecord_ht_email_tipoemail', value: itemsMail[i].tipo }); //* //REQUEST
                objRecord.commitLine({ sublistId: 'recmachcustrecord_ht_ce_enlace' });
            }
            //telefono
            let itemsTelefono = context.Telefono;
            // let objRecordTelefono = record.create({ type: "customrecord_ht_registro_telefono", isDynamic: true });
            log.debug('items....Telefono.....', itemsTelefono);

            const itemLineTelefono = objRecord.selectNewLine({ sublistId: 'recmachcustrecord_ht_campo_lbl_entidad_telefono' });
            for (let i in itemsTelefono) {
                if (itemsTelefono[i].principal) {
                    objRecord.setValue({ fieldId: 'phone', value: itemsMail[i].telefono });
                }
                // itemLineTelefono.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ht_campo_lbl_entidad_telefono', fieldId: 'custrecord_ht_campo_lbl_entidad_telefono', value: recordId}); //* //REQUEST
                itemLineTelefono.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ht_campo_lbl_entidad_telefono', fieldId: 'custrecord_ht_campo_list_tipo_telefono', value: itemsTelefono[i].tipo }); //* //REQUEST
                itemLineTelefono.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ht_campo_lbl_entidad_telefono', fieldId: 'custrecord_ht_campo_txt_principal', value: itemsTelefono[i].principal }); //* //REQUEST
                itemLineTelefono.setCurrentSublistValue({ sublistId: 'recmachcustrecord_ht_campo_lbl_entidad_telefono', fieldId: 'custrecord_ht_campo_txt_telefono', value: itemsTelefono[i].telefono }); //* //REQUEST
                objRecord.commitLine({ sublistId: 'recmachcustrecord_ht_campo_lbl_entidad_telefono' });
            }
            //["recmachcustrecord_ht_da_enlace","addressbook","recmachcustrecord_ht_ce_enlace","recmachcustrecord_ht_campo_lbl_entidad_telefono","contact"
            //,"recmachcustrecord_ht_rc_empresa","calls","usernotes","mediaitem","activities","events","tasks"
            //,"currency","paymentinstruments","grouppricing","itempricing","qualification","recmachcustrecord_ht_garante_cliente"
            //,"recmachcustrecord_psg_ei_email_recipient_cust","subscriptionmsgmach"]
            let recordId = objRecord.save({ ignoreMandatoryFields: false });

            //log           
            log.debug('Result', recordId);

            //retorno         
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
