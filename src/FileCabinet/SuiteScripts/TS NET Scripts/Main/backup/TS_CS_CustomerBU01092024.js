/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/search', 'N/currentRecord', 'N/ui/message', 'N/url', 'N/runtime', 'N/https'], (search, currentRecord, message, url, runtime, https) => {
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
        console.log('entra saveRecord');
        try {
            const objRecord = currentRecord.get();
            var isperson = objRecord.getText('isperson');
            var vatregnumber = objRecord.getText('vatregnumber');
            var tipoDoc = objRecord.getValue('custentity_ec_document_type');
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
                    if (nombre.length == 0) {
                        alert('Introduzca valores para: Primer Nombr.');
                        return false;
                    }
                    if (apellido.length == 0) {
                        alert('Introduzca valores para: Apellido Paterno.');
                        return false;
                    }

                    let customerNatural = search.create({
                        type: "customer",
                        filters:
                            [
                                ["custentity_ht_cl_primernombre", "is", "JORGE"],
                                "AND",
                                ["custentity_ht_cl_segundonombre", "is", "JORGE"],
                                "AND",
                                ["custentity_ht_cl_apellidopaterno", "is", "QUIMI"],
                                "AND",
                                ["custentity_ht_cl_apellidomaterno", "is", "ESPINOZA"]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "internalid", label: "ID" })
                            ]
                    });
                    let searchResultCountcustomerNatural = customerNatural.runPaged().count;
                    log.debug("searchResultCountcustomerNatural", searchResultCountcustomerNatural);
                    if (searchResultCountcustomerNatural > 0) {
                        alert("El Nombre del Cliente ya se encuentra registrado en otro registro.");
                        return false;
                    }

                    // if (segundonombre) {
                    //     var nombrecompleto = nombre + ' ' + segundonombre;
                    // } else {
                    //     var nombrecompleto = nombre;
                    // }
                    // if (segundoapellido) {
                    //     var apellidocompleto = apellido + ' ' + segundoapellido;
                    // } else {
                    //     var apellidocompleto = apellido;
                    // }
                    // var nombreapellido = nombrecompleto + ' ' + apellidocompleto;
                    // if (nombre == '' || nombre == null) {
                    //     alert('Introduzca valores para: Primer Nombre');
                    //     return false;
                    // }
                    // if (apellido == '' || apellido == null) {
                    //     alert('Introduzca valores para: Apellido Paterno');
                    //     return false;
                    // }
                    // for (let i = 0; i < idCustomer.length; i++) {
                    //     if (nombreapellido == idCustomer[i][0]) {
                    //         alert("El Nombre del Cliente ya se encuentra registrado en otro registro");
                    //         return false;
                    //     }
                    //     if (vatregnumber == idCustomer[i][1]) {
                    //         alert("El Número de documento ya se encuentra registrado en otro registro");
                    //         return false;
                    //     }
                    // }
                } else {
                    let customerCompany = search.create({
                        type: "customer",
                        filters:
                            [
                                ["companyname", "is", "EVOL(Tsnet)"]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "internalid", label: "ID" })
                            ]
                    });
                    let searchResultCountcustomerCompany = customerCompany.runPaged().count;
                    log.debug("searchResultCountcustomerCompany", searchResultCountcustomerCompany);
                    if (searchResultCountcustomerCompany > 0) {
                        alert("El Nombre del Cliente ya se encuentra registrado en otro registro.");
                        return false;
                    }





                    // for (let i = 0; i < idCustomer.length; i++) {
                    //     console.log('entra saveRecord 1', + i);
                    //     if (companyName == idCustomer[i][0]) {
                    //         alert(
                    //             "El Nombre del Cliente ya se encuentra registrado en otro registro"
                    //         );
                    //         return false;
                    //     }
                    //     if (vatregnumber == idCustomer[i][1]) {
                    //         alert(
                    //             "El Número de documento ya se encuentra registrado en otro registro"
                    //         );
                    //         return false;
                    //     }
                    // }
                }

                let customerDocumento = search.create({
                    type: "customer",
                    filters:
                        [
                            ["formulatext: {vatregnumber}", "is", "922719422"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", label: "ID" })
                        ]
                });
                let searchResultCountcustomerDocumento = customerDocumento.runPaged().count;
                log.debug("searchResultCountcustomerDocumento", searchResultCountcustomerDocumento);
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
                        console.log('entra saveRecord 2', + i);
                        if (nombreapellido == idCustomer[i][0]) {
                            alert("El Nombre del Cliente ya se encuentra registrado en otro registro");
                            return false;
                        }
                        if (vatregnumber == idCustomer[i][1]) {
                            alert("El Número de documento ya se encuentra registrado en otro registro");
                            return false;
                        }
                    }
                } else {
                    for (let i = 0; i < idCustomer.length; i++) {
                        console.log('entra saveRecord 3', + i);
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
            }
            if (tipoDoc == '1' || tipoDoc == '2') {
                if (typeMode != 'delete') {
                    let numeroDocumento = objRecord.getValue('vatregnumber');
                    var digitoVerificador = getDigitoVerificador(numeroDocumento);
                    const regex = /^\d$/;
                    if (!regex.test(digitoVerificador)) {
                        alert('El número de cédula es incorrecto');
                        return false;
                    }
                }
            }
            return true;
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
                filters: [],
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

            var searchResultCount = busqueda.runPaged().count;
            console.log("customrecord_registro_chequeSearchObj result count", searchResultCount);
            var pageData = busqueda.runPaged({ pageSize: 1000 });
            pageData.pageRanges.forEach(function (pageRange) {
                page = pageData.fetch({ index: pageRange.index });
                page.data.forEach(function (result) {
                    var columns = result.columns;
                    var arrCustomer = new Array();
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
            //return searchResultCount;
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

    function getDigitoVerificador(numeroDocumento) {
        try {
            if (!numeroDocumento) return;
            var headers = new Array();
            headers['Content-type'] = 'application/json';

            var restUrl = url.resolveScript({
                scriptId: 'customscript_ts_rs_verification_code',
                deploymentId: 'customdeploy_ts_rs_verification_code'
            });

            restUrl += `&numero=${numeroDocumento}`;
            var response = https.get({
                url: restUrl,
                headers: headers
            })

            return response.body
        } catch (error) {
            return null;
        }
    }

    return {
        pageInit: pageInit,
        saveRecord: saveRecord,
        //fieldChanged: fieldChanged,
        //sublistChanged: sublistChanged
    }
});