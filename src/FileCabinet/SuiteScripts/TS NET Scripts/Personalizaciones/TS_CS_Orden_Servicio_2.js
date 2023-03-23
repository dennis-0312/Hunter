/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/search', 'N/currentRecord', 'N/ui/message', 'N/runtime', 'N/record'], (search, currentRecord, message, runtime, record) => {
    let typeMode = '';
    const SALES_ORDER = 'salesorder';
    const pageInit = (context) => {
        var currentRecord = context.currentRecord;
        typeMode = context.mode; //!Importante, no borrar.
        var field = currentRecord.getField('location');
        field.isDisabled = true;

    }
    const saveRecord = (context) => {
        var currentRecord = context.currentRecord;
        var sublistName = context.sublistId;
        var sublistFieldName = context.fieldId;
        let numLines = currentRecord.getLineCount({ sublistId: 'item' });
        console.log('numLines saveRecord', numLines);
        var flag = 0;
        var flag2 = 0;
        for (let i = 0; i < numLines; i++) {
            let items = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
            console.log('items', items);
            var idAssembly = getAssemblyItem(items);
            console.log('idAssembly saveRecord', idAssembly);
            var idMonitoreo = getMonitoreo(items);
            console.log('idMonitoreo idAssembly', idMonitoreo);
            if (idAssembly == 1 && idMonitoreo == 1) {
                flag += 1;
            }
            if (flag > 0) {
                var idService = getServiceItem(items);
                console.log('idService saveRecord', idService);
                var idMonitoreo = getMonitoreo(items);
                console.log('idMonitoreo idService', idMonitoreo)
                if (idService == 1 && idMonitoreo == 1) {
                    flag2 += 1;
                }
            }

        }
        if (flag2 > 0) {
            return true
        } else if (flag == 0 && flag2 == 0) {
            return true
        } else {
            alert('Parametrización de Producto Comercial y Servicio no coindicen. Por favor valide parametrización');
            return false
        }

    }
    const validateField = (context) => {
        try {
            //const objRecord = currentRecord.get();
            var currentRecord = context.currentRecord;
            var sublistName = context.sublistId;
            var typeTransaction = currentRecord.type;
            var sublistFieldName = context.fieldId;
            var userObj = runtime.getCurrentUser()
            var userId = userObj.id
            let numLines = currentRecord.getLineCount({ sublistId: 'item' });
            if (typeMode == 'create' || typeMode == 'copy' || typeMode == 'edit') {
                if (typeTransaction == SALES_ORDER) {
                    console.log('sublistName  item', sublistFieldName);
                    var userObj = runtime.getCurrentUser()
                    if (sublistName == 'item') {
                        console.log('sublistFieldName item', sublistFieldName);
                        if (sublistFieldName == 'item') {
                            //console.log('sublistFieldName',sublistFieldName);
                            let idItem = currentRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'item' });
                            console.log('idItem', idItem);
                            var internalid = getServiceSale(idItem);
                            console.log('internalid', internalid);
                            var employee = search.lookupFields({
                                type: 'employee',
                                id: userObj.id,
                                columns: ['location']
                            });
                            var test = employee.location;

                            if (internalid) {
                                currentRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: '12' });
                                if (test != '') {
                                    test = test[0].value;
                                    console.log('location', test);
                                    currentRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: test });
                                }
                                //currentRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: internalid });
                            } else {
                                currentRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: '1' });
                                if (test != '') {
                                    test = test[0].value;
                                    console.log('location', test);
                                    currentRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: test });
                                }
                            }

                        }

                    } /* else if (sublistFieldName == 'custbody_ht_so_bien') {
                        currentRecord.setValue({
                            fieldId: 'custbody_ht_facturar_a',
                            value: currentRecord.getValue('entity')
                        });
                    } */ /* else if (sublistFieldName == 'salesrep') {
                        currentRecord.setValue({
                            fieldId: 'custbody_ht_os_ejecutivareferencia',
                            value: currentRecord.getValue('salesrep')
                        });
                    } */
                }
                return true
            }

        } catch (e) {
            console.log('errror en field change', e);
        }
    }
    const postSourcing = (context) => {
        var currentRecord = context.currentRecord;
        const sublistFieldName = context.fieldId;
        var userObj = runtime.getCurrentUser()
        var userId = userObj.id
        if (typeMode == 'create' || typeMode == 'copy' || typeMode == 'edit') {
            var employee = search.lookupFields({
                type: 'employee',
                id: userId,
                columns: ['department', 'class']
            });
            var departamento = employee.department;
            var departamentovalue = ''
            if (departamento != '') {
                departamentovalue = departamento[0].value;
            }
            var clase = employee.class;
            var clasevalue = '';
            if (clase != '') {
                clasevalue = clase[0].value;
            }
            //var salesrep = currentRecord.getValue('salesrep');
            currentRecord.setValue({
                fieldId: 'custbody_ht_os_ejecutivareferencia',
                value: currentRecord.getValue('salesrep')
            });
            currentRecord.setValue({
                fieldId: 'custbody_ht_facturar_a',
                value: currentRecord.getValue('entity')
            });

            currentRecord.setValue({
                fieldId: 'department',
                value: departamentovalue
            });

            currentRecord.setValue({
                fieldId: 'class',
                value: clasevalue
            });
        }
    }
    function getMonitoreo(id) {
        try {
            var busqueda = search.create({
                type: "customrecord_ht_pp_main_param_prod",
                filters:
                    [
                        ["custrecord_ht_pp_parametrizacion_rela", "anyof", "77"],
                        "AND",
                        ["custrecord_ht_pp_parametrizacionid", "anyof", id],
                        "AND",
                        ["custrecord_ht_pp_parametrizacion_valor", "anyof", "7"],
                        "AND",
                        ["custrecord_ht_pp_aplicacion", "is", "T"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "custrecord_ht_pp_parametrizacionid", label: "Param. Prod." })
                    ]
            });
            var savedsearch = busqueda.run().getRange(0, 1);
            var internalid = '';
            if (savedsearch.length > 0) {
                busqueda.run().each(function (result) {
                    internalid = 1;
                    return true;
                });
            }
            return internalid;
        } catch (e) {
            log.error('Error en getCustomer', e);
        }
    }
    /*     function getTurno(id) {
            try {
                var busqueda = search.create({
                    type: "salesorder",
                    filters:
                        [
                            ["type", "anyof", "SalesOrd"],
                            "AND",
                            ["internalid", "anyof", id],
                            "AND",
                            ["line", "equalto", "1"]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "internalid",
                                join: "event",
                                label: "ID interno"
                            })
                        ]
                });
                var savedsearch = busqueda.run().getRange(0, 1);
                var turno = '';
                if (savedsearch.length > 0) {
                    busqueda.run().each(function (result) {
                        turno = result.getValue(busqueda.columns[0]);
                        return true;
                    });
                }
                return turno;
            } catch (e) {
                log.error('Error en getTurno', e);
            }
        } */
    function getAssemblyItem(idItem) {
        try {
            var busqueda = search.create({
                type: "assemblyitem",
                filters:
                    [
                        ["type", "anyof", "Assembly"],
                        "AND",
                        ["internalid", "anyof", idItem]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "Internal ID" })
                    ]
            });
            var savedsearch = busqueda.run().getRange(0, 1);
            var internalid = '';
            if (savedsearch.length > 0) {
                busqueda.run().each(function (result) {
                    internalid = 1;
                    return true;
                });
            }
            return internalid;
        } catch (e) {
            log.error('Error en getDescription', e);
        }
    }
    function getServiceItem(idItem) {
        try {
            var busqueda = search.create({
                type: "serviceitem",
                filters:
                    [
                        ["type", "anyof", "Service"],
                        "AND",
                        ["internalid", "anyof", idItem]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "Internal ID" })
                    ]
            });
            var savedsearch = busqueda.run().getRange(0, 1);
            var internalid = '';
            if (savedsearch.length > 0) {
                busqueda.run().each(function (result) {
                    internalid = 1;
                    return true;
                });
            }
            return internalid;
        } catch (e) {
            log.error('Error en getDescription', e);
        }
    }
    function getServiceSale(idItem) {
        try {
            var busqueda = search.create({
                type: "serviceitem",
                filters:
                    [
                        ["type", "anyof", "Service"],
                        "AND",
                        ["unitstype", "anyof", "6"],
                        "AND",
                        ["internalid", "anyof", idItem]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "Internal ID" })
                    ]
            });
            var savedsearch = busqueda.run().getRange(0, 1);
            var internalid = '';
            if (savedsearch.length > 0) {
                busqueda.run().each(function (result) {
                    internalid = result.getValue(busqueda.columns[0]);
                    return true;
                });
            }
            return internalid;
        } catch (e) {
            log.error('Error en getDescription', e);
        }
    }
    /*     function sublistChanged(){
            var currentRecord = context.currentRecord;
            var sublistName = context.sublistId;
            var op = op.context.oper
        } */
    /*     const sublistChanged = (context) => {
            const objRecord = currentRecord.get();
            var sublistName = context.sublistId;
            var op = context.operation;
            if (sublistName === 'item')
                objRecord.setValue({
                    fieldId: 'memo',
                    value: 'Total has changed to ' + op
                });
        } */

    return {
        pageInit: pageInit,
        saveRecord: saveRecord,
        validateField: validateField,
        postSourcing: postSourcing,
        //sublistChanged: sublistChanged
    }
});
