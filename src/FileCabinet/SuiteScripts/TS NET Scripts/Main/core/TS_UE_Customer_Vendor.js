/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = == = = = = = = = = = = =\
||                                                                                                                  
||   This script for Customer (Generación de identificador para cliente)                                            
||                                                                                                                  
||   File Name: TS_UE_Customer_Vendor.js                                                                            
||                                                                                                                  
||   Commit      Version     Date            ApiVersion         Enviroment       Governance points                  
||   01          1.0         26/12/2022      Script 2.1         SB               N/A                                
||                                                                                                                  
\  = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = == = = = = = = = = = = = */
/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/log',
    'N/search',
    'N/record',
    'N/redirect',
    'N/ui/serverWidget',
    '../controller/TS_CM_Controller',
    '../constant/TS_CM_Constant',
    '../error/TS_CM_ErrorMessages',
], (log, search, record, redirect, serverWidget, _controller, _constant, _error) => {
    const CUSTOMER = 'customer';
    const VENDOR = 'vendor';
    const LEAD = 'lead';
    const PROSPECT = 'prospect';

    const beforeLoad = (context) => {
        try {
            var form = context.form;
            var objRecord = context.newRecord;
            const idRecord = objRecord.id;
            var type_event = context.type;
            if (type_event === context.UserEventType.VIEW && (objRecord.type == CUSTOMER || objRecord.type == LEAD || objRecord.type == PROSPECT)) {
                //let objRecord = record.load({ type: 'customer', id: idRecord, isDynamic: true });
                //let altname = objRecord.getValue('altname');
                log.debug('idRecord', idRecord);
                var addressCustomer = getCustomer(idRecord);
                log.debug('addressCustomer', addressCustomer);
                var sublist = form.getSublist({
                    id: 'addressbook'
                });
                var provincia = sublist.addField({
                    id: 'custpage_provincia',
                    label: 'Provincia',
                    type: serverWidget.FieldType.TEXT,
                });
                //provincia.defaultValue = 'TEST';
                var canton = sublist.addField({
                    id: 'custpage_canton',
                    label: 'Canton',
                    type: serverWidget.FieldType.TEXT,
                });
                var parroquia = sublist.addField({
                    id: 'custpage_parroquia',
                    label: 'Parroquia',
                    type: serverWidget.FieldType.TEXT,
                });
                var tipo = sublist.addField({
                    id: 'custpage_direccion',
                    label: 'Tipo de direccion',
                    type: serverWidget.FieldType.TEXT,
                });

                var numLines = objRecord.getLineCount({ sublistId: 'addressbook' });
                log.debug('numLines', numLines);
                for (let i = 0; i < numLines; i++) {
                    let idAddress = objRecord.getSublistValue({
                        sublistId: 'addressbook',
                        fieldId: 'id',
                        line: i
                    });
                    for (let j = 0; j < addressCustomer.length; j++) {
                        if (idAddress == addressCustomer[j][4]) {
                            objRecord.setSublistValue({
                                sublistId: 'addressbook',
                                fieldId: 'custpage_provincia',
                                line: i,
                                value: addressCustomer[j][0]
                            });
                            objRecord.setSublistValue({
                                sublistId: 'addressbook',
                                fieldId: 'custpage_canton',
                                line: i,
                                value: addressCustomer[j][1]
                            });
                            objRecord.setSublistValue({
                                sublistId: 'addressbook',
                                fieldId: 'custpage_parroquia',
                                line: i,
                                value: addressCustomer[j][2]
                            });
                            objRecord.setSublistValue({
                                sublistId: 'addressbook',
                                fieldId: 'custpage_direccion',
                                line: i,
                                value: addressCustomer[j][3]
                            });
                        }
                    }
                }
            }
        } catch (e) {
            log.error('Error en beforeLoad', e);
        }
    }

    const afterSubmit = (context) => {
        const objRecord = context.newRecord;
        const recordId = objRecord.id;
        let identifier = '';
        //let altname = '';
        if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.COPY || context.type === context.UserEventType.EDIT) {
            try {
                let vatregnumber = objRecord.getValue('vatregnumber');
                // let isperson = objRecord.getValue('isperson');
                // log.debug('isperson', isperson);

                // if (isperson == 'F') {
                //     altname = objRecord.getValue('companyname');
                // } else {
                //     altname = objRecord.getValue('firstname') + ' ' + objRecord.getValue('lastname');
                // }

                if (context.newRecord.type == _constant.Entity.CUSTOMER || context.newRecord.type == _constant.Entity.LEAD || context.newRecord.type == _constant.Entity.PROSPECT) {
                    identifier = 'C-EC-' + vatregnumber;

                    record.submitFields({
                        type: record.Type.CUSTOMER,
                        id: recordId,
                        values: {
                            'entityid': identifier,
                            custentity_psg_ei_entity_edoc_standard: 2,
                            custentity_psg_ei_auto_select_temp_sm: true,
                            custentity_edoc_gen_trans_pdf: true

                        }
                    });
                }

                if (context.newRecord.type == _constant.Entity.VENDOR) {
                    identifier = 'P-EC-' + vatregnumber;
                    record.submitFields({
                        type: record.Type.VENDOR,
                        id: recordId,
                        values: {
                            'entityid': identifier,
                            custentity_psg_ei_entity_edoc_standard: 2,
                            custentity_psg_ei_auto_select_temp_sm: true,
                            custentity_edoc_gen_trans_pdf: true
                        }
                    });
                }
                log.debug('DEBUG', identifier);



            } catch (error) {
                log.error('Error-beforeLoad', error);
            }
        }
    }

    const getCustomer = (id) => {
        var arrCustomerId = new Array();
        var busqueda = search.create({
            type: "customer",
            filters:
                [
                    ["internalid", "anyof", id]
                ],
            columns:
                [
                    search.createColumn({
                        name: "custrecord_ec_provincia",
                        join: "Address",
                        label: "EC Provincia"
                    }),
                    search.createColumn({
                        name: "custrecord_ec_canton",
                        join: "Address",
                        label: "EC Cantón"
                    }),
                    search.createColumn({
                        name: "custrecord_ec_parroquia",
                        join: "Address",
                        label: "EC Parroquia"
                    }),
                    search.createColumn({
                        name: "custrecord_ht_direccion_tipo",
                        join: "Address",
                        label: "HT Tipo de dirección"
                    }),
                    search.createColumn({
                        name: "addressinternalid",
                        join: "Address",
                        label: "Address Internal ID"
                    })
                ]
        });

        var pageData = busqueda.runPaged({
            pageSize: 1000
        });

        pageData.pageRanges.forEach(function (pageRange) {
            page = pageData.fetch({
                index: pageRange.index
            });
            page.data.forEach(function (result) {
                var columns = result.columns;
                var arrCustomer = new Array();
                //0. Internal id match
                if (result.getValue(columns[0]) != null) {
                    arrCustomer[0] = result.getText(columns[0]);
                } else {
                    arrCustomer[0] = '';
                }
                if (result.getValue(columns[1]) != null) {
                    arrCustomer[1] = result.getText(columns[1]);
                } else {
                    arrCustomer[1] = '';
                }
                if (result.getValue(columns[2]) != null) {
                    arrCustomer[2] = result.getText(columns[2]);
                } else {
                    arrCustomer[2] = '';
                }
                if (result.getValue(columns[3]) != null) {
                    arrCustomer[3] = result.getText(columns[3]);
                } else {
                    arrCustomer[3] = '';
                }
                if (result.getValue(columns[0]) != null) {
                    arrCustomer[4] = result.getValue(columns[4]);
                } else {
                    arrCustomer[4] = '';
                }
                arrCustomerId.push(arrCustomer);
            });
        });
        return arrCustomerId;
    }

    return {
        beforeLoad: beforeLoad,
        afterSubmit: afterSubmit
    }
});
/********************************************************************************************************************
TRACKING
/********************************************************************************************************************
/* Commit:01
Version: 1.0
Date: 16/03/2021
Author: Dennis Fernández
Description: Creación del script.
===================================================================================================================*/