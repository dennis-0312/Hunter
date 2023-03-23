/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/search', 'N/currentRecord', 'N/ui/message', 'N/url', 'N/runtime'], (search, currentRecord, message, url, runtime) => {
    let typeMode = '';
    const pageInit = (context) => {
        typeMode = context.mode; //!Importante, no borrar.
        const objRecord = currentRecord.get();
        var isperson = objRecord.getText('isperson');
        if (isperson == 'T' || isperson == true) {
            context.currentRecord.getField({
                fieldId: 'custentity_ht_cl_primernombre'
            }).isDisplay = true;
            context.currentRecord.getField({
                fieldId: 'custentity_ht_cl_segundonombre'
            }).isDisplay = true;
            context.currentRecord.getField({
                fieldId: 'custentity_ht_cl_apellidopaterno'
            }).isDisplay = true;
            context.currentRecord.getField({
                fieldId: 'custentity_ht_cl_apellidomaterno'
            }).isDisplay = true;
        } else {
            context.currentRecord.getField({
                fieldId: 'custentity_ht_cl_primernombre'
            }).isDisplay = false;
            context.currentRecord.getField({
                fieldId: 'custentity_ht_cl_segundonombre'
            }).isDisplay = false;
            context.currentRecord.getField({
                fieldId: 'custentity_ht_cl_apellidopaterno'
            }).isDisplay = false;
            context.currentRecord.getField({
                fieldId: 'custentity_ht_cl_apellidomaterno'
            }).isDisplay = false;
        }
    }

    const saveRecord = (context) => {
        try {
            const objRecord = currentRecord.get();
            var isperson = objRecord.getText('isperson');
            var vatregnumber = objRecord.getText('vatregnumber');
            var nombre = objRecord.getValue('custentity_ht_cl_primernombre');
            var segundonombre = objRecord.getValue('custentity_ht_cl_segundonombre');
            var apellido = objRecord.getText('custentity_ht_cl_apellidopaterno');
            var segundoapellido = objRecord.getText('custentity_ht_cl_apellidomaterno');
            var companyName = objRecord.getText('companyname');
            
            if (typeMode == 'create' || typeMode == 'copy') {
                var id = '';
                var flag = false;
                var idCustomer = getCustomer(id, flag);
                if (isperson == 'T' || isperson == true) {
                    if (segundonombre) {
                        var nombrecompleto = nombre + ' ' + segundonombre;
                    } else {
                        var nombrecompleto = nombre;
                    }
                    if (segundoapellido) {
                        var apellidocompleto = apellido + ' ' + segundoapellido;
                    } else {
                        var apellidocompleto = apellido;
                    }
                    var nombreapellido = nombrecompleto + ' ' + apellidocompleto;
                    if (nombre == '' || nombre == null) {
                        alert('Introduzca valores para: Primer Nombre');
                        return false;
                    }
                    if (apellido == '' || apellido == null) {
                        alert('Introduzca valores para: Apellido Paterno');
                        return false;
                    }
                    for (let i = 0; i < idCustomer.length; i++) {
                        if (nombreapellido == idCustomer[i][0]) {
                            alert(
                                "El Nombre del Cliente ya se encuentra registrado en otro registro"
                            );
                            return false;
                        }
                        if (vatregnumber == idCustomer[i][1]) {
                            alert(
                                "El Número de documento ya se encuentra registrado en otro registro"
                            );
                            return false;
                        }
                    }
                } else {
                    for (let i = 0; i < idCustomer.length; i++) {
                        if (companyName == idCustomer[i][0]) {
                            alert(
                                "El Nombre del Cliente ya se encuentra registrado en otro registro"
                            );
                            return false;
                        }
                        if (vatregnumber == idCustomer[i][1]) {
                            alert(
                                "El Número de documento ya se encuentra registrado en otro registro"
                            );
                            return false;
                        }
                    }
                }
                return true;
            } else if (typeMode == 'edit') {
                var id = objRecord.id;
                var flag = true;
                var idCustomer = getCustomer(id, flag);
                if (isperson == 'T' || isperson == true) {
                    if (segundonombre) {
                        var nombrecompleto = nombre + ' ' + segundonombre;
                    } else {
                        var nombrecompleto = nombre;
                    }
                    if (segundoapellido) {
                        var apellidocompleto = apellido + ' ' + segundoapellido;
                    } else {
                        var apellidocompleto = apellido;
                    }
                    var nombreapellido = nombrecompleto + ' ' + apellidocompleto;
                    if (nombre == '' || nombre == null) {
                        alert('Introduzca valores para: Primer Nombre');
                        return false;
                    }
                    if (apellido == '' || apellido == null) {
                        alert('Introduzca valores para: Apellido Paterno');
                        return false;
                    }
                    for (let i = 0; i < idCustomer.length; i++) {
                        if (nombreapellido == idCustomer[i][0]) {
                            alert(
                                "El Nombre del Cliente ya se encuentra registrado en otro registro"
                            );
                            return false;
                        }
                        if (vatregnumber == idCustomer[i][1]) {
                            alert(
                                "El Número de documento ya se encuentra registrado en otro registro"
                            );
                            return false;
                        }
                    }
                } else {
                    for (let i = 0; i < idCustomer.length; i++) {
                        if (companyName == idCustomer[i][0]) {
                            alert(
                                "El Nombre del Cliente ya se encuentra registrado en otro registro"
                            );
                            return false;
                        }
                        if (vatregnumber == idCustomer[i][1]) {
                            alert(
                                "El Número de documento ya se encuentra registrado en otro registro"
                            );
                            return false;
                        }
                    }
                }
                return true;
            }
        } catch (e) {
            log.error('Error en el saveRecord', e);
            return false;
        }
    }

    const fieldChanged = (context) => {
        console.log('entra');
        const objRecord = currentRecord.get();
        console.log('objRecord', objRecord);
        console.log('typeMode', typeMode);

        if (typeMode == 'create' || typeMode == 'copy' || typeMode == 'edit') {
            var isperson = objRecord.getText('isperson');
            var altname = objRecord.getText('altname');
            console.log('isperson', isperson);
            console.log('altname', altname);
            if (isperson == 'T' || isperson == true) {
                context.currentRecord.getField({
                    fieldId: 'custentity_ht_cl_primernombre'
                }).isDisplay = true;
                context.currentRecord.getField({
                    fieldId: 'custentity_ht_cl_segundonombre'
                }).isDisplay = true;
                context.currentRecord.getField({
                    fieldId: 'custentity_ht_cl_apellidopaterno'
                }).isDisplay = true;
                context.currentRecord.getField({
                    fieldId: 'custentity_ht_cl_apellidomaterno'
                }).isDisplay = true;
                var firstname = objRecord.getText('custentity_ht_cl_primernombre');
                var secondname = objRecord.getText('custentity_ht_cl_segundonombre');
                if (secondname) {
                    var completename = firstname + ' ' + secondname;
                } else {
                    var completename = firstname
                }
                var firstlastname = objRecord.getText('custentity_ht_cl_apellidopaterno');
                var secondlastname = objRecord.getText('custentity_ht_cl_apellidomaterno');
                if (secondlastname) {
                    var completelastname = firstlastname + ' ' + secondlastname;
                } else {
                    var completelastname = firstlastname;
                }

                objRecord.setText({
                    fieldId: 'firstname',
                    text: completename,
                    ignoreFieldChange: true
                });
                objRecord.setText({
                    fieldId: 'lastname',
                    text: completelastname,
                    ignoreFieldChange: true
                });
            } else {
                context.currentRecord.getField({
                    fieldId: 'custentity_ht_cl_primernombre'
                }).isDisplay = false;
                context.currentRecord.getField({
                    fieldId: 'custentity_ht_cl_segundonombre'
                }).isDisplay = false;
                context.currentRecord.getField({
                    fieldId: 'custentity_ht_cl_apellidopaterno'
                }).isDisplay = false;
                context.currentRecord.getField({
                    fieldId: 'custentity_ht_cl_apellidomaterno'
                }).isDisplay = false;
            }
        }
    }
    function getCustomer(internalId, flag) {
        try {
            var arrCustomerId = new Array();
            var busqueda = search.create({
                type: "customer",
                filters:
                    [
                    ],
                columns:
                    [
                        search.createColumn({ name: "altname", label: "Nombre" }),
                        search.createColumn({ name: "vatregnumber", label: "Número de impuesto" })
                    ]
            })
            if (flag == true) {
                console.log('internalId', internalId);
                let filters = busqueda.filters;
                const filterOne = search.createFilter({ name: 'internalid', operator: search.Operator.NONEOF, values: internalId });
                filters.push(filterOne);
            }
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
                        arrCustomer[0] = result.getValue(columns[0]);
                    } else {
                        arrCustomer[0] = '';
                    }
                    if (result.getValue(columns[1]) != null) {
                        arrCustomer[1] = result.getValue(columns[1]);
                    } else {
                        arrCustomer[1] = '';
                    }
                    arrCustomerId.push(arrCustomer);
                });

            });
            return arrCustomerId;
        } catch (e) {
            log.error('Error en getCustomer', e);
        }
    }
    function getGlobalLabels() {
        var labels = {
            "Alerta1": {
                "es": "Introduzca valores para: Primer Nombre",
                "en": "Please enter value(s) for: Primer Nombre",
            },
            "Alerta2": {
                "es": "Introduzca valores para: Apellido Paterno",
                "en": "Please enter value(s) for: Apellido Paterno",
            }
        };

        return labels;
    }
    return {
        pageInit: pageInit,
        saveRecord: saveRecord,
        fieldChanged: fieldChanged,
        //sublistChanged: sublistChanged
    }
});
