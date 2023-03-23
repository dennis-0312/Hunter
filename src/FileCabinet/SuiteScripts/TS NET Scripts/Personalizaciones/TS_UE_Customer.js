/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/search', 'N/record', 'N/redirect', 'N/ui/serverWidget', 'N/runtime'], (log, search, record, redirect, serverWidget, runtime) => {

    const beforeLoad = (context) => {
        try {
            var form = context.form;
            var objRecord = context.newRecord;
            const idRecord = objRecord.id;
            var type_event = context.type;
            if (type_event === context.UserEventType.VIEW) {
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
    function getCustomer(id) {
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
        beforeLoad: beforeLoad
    }
});
/********************************************************************************************************************
TRACKING
/********************************************************************************************************************
/* Commit:01
Version: 1.0
Date: 26/01/2023
Author: Jeferson Mejia
Description: Creación del script.
===================================================================================================================*/