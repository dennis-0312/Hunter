/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/search', 'N/currentRecord', 'N/ui/message', 'N/url', 'N/runtime', 'N/https', 'N/ui/dialog'], (search, currentRecord, message, url, runtime, https, dialog) => {
    let typeMode = '';
    let nombreOld = '';
    let segundonombreOld = '';
    let apellidoOld = '';
    let segundoapellidoOld = '';
    let companyNameOld = '';
    let nombreCompletoOld = '';
    let vatregnumberOld = '';
    const pageInit = (context) => {
        typeMode = context.mode; //!Importante, no borrar.
        const objRecord = currentRecord.get();
        var isperson = objRecord.getText('isperson');
        if (isperson == 'T' || isperson == true) {
            context.currentRecord.getField({ fieldId: 'custentity_ht_cl_primernombre' }).isDisplay = true;
            context.currentRecord.getField({ fieldId: 'custentity_ht_cl_segundonombre' }).isDisplay = true;
            context.currentRecord.getField({ fieldId: 'custentity_ht_cl_apellidopaterno' }).isDisplay = true;
            context.currentRecord.getField({ fieldId: 'custentity_ht_cl_apellidomaterno' }).isDisplay = true;
        } else {
            context.currentRecord.getField({ fieldId: 'custentity_ht_cl_primernombre' }).isDisplay = false;
            context.currentRecord.getField({ fieldId: 'custentity_ht_cl_segundonombre' }).isDisplay = false;
            context.currentRecord.getField({ fieldId: 'custentity_ht_cl_apellidopaterno' }).isDisplay = false;
            context.currentRecord.getField({ fieldId: 'custentity_ht_cl_apellidomaterno' }).isDisplay = false;
        }
        if (typeMode == 'edit') {
            nombreOld = objRecord.getValue('custentity_ht_cl_primernombre');
            segundonombreOld = objRecord.getValue('custentity_ht_cl_segundonombre');
            apellidoOld = objRecord.getText('custentity_ht_cl_apellidopaterno');
            segundoapellidoOld = objRecord.getText('custentity_ht_cl_apellidomaterno');
            companyNameOld = objRecord.getText('companyname');
            nombreCompletoOld = `${nombreOld} ${segundonombreOld} ${apellidoOld} ${segundoapellidoOld}`
            vatregnumberOld = objRecord.getText('vatregnumber');
        }
    }

    const saveRecord = (context) => {
        //console.log('entra saveRecord');
        //let userObj = runtime.getCurrentUser().id;
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
            let nombreCompleto = `${nombre} ${segundonombre} ${apellido} ${segundoapellido}`

            if (typeMode == 'create' || typeMode == 'copy') {
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
                                ["custentity_ht_cl_primernombre", "is", nombre],
                                "AND",
                                ["custentity_ht_cl_segundonombre", "is", segundonombre],
                                "AND",
                                ["custentity_ht_cl_apellidopaterno", "is", apellido],
                                "AND",
                                ["custentity_ht_cl_apellidomaterno", "is", segundoapellido]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "internalid", label: "ID" })
                            ]
                    });
                    let searchResultCountcustomerNatural = customerNatural.runPaged().count;
                    console.log("searchResultCountcustomerNatural", searchResultCountcustomerNatural);
                    if (searchResultCountcustomerNatural > 0) {
                        alert("El Nombre del Cliente ya se encuentra registrado en otro registro.");
                        return false;
                    }
                } else {
                    let customerCompany = search.create({
                        type: "customer",
                        filters:
                            [
                                ["companyname", "is", companyName]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "internalid", label: "ID" })
                            ]
                    });
                    let searchResultCountcustomerCompany = customerCompany.runPaged().count;
                    console.log("searchResultCountcustomerCompany", searchResultCountcustomerCompany);
                    if (searchResultCountcustomerCompany > 0) {
                        alert("El Nombre del Cliente ya se encuentra registrado en otro registro.");
                        return false;
                    }
                }

                //* Nro Documento.
                let customerDocumento = search.create({
                    type: "customer",
                    filters:
                        [
                            ["formulatext: {vatregnumber}", "is", vatregnumber]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", label: "ID" }),
                            search.createColumn({ name: "formulatext", formula: "{vatregnumber}", label: "Formula (Text)" })
                        ]
                });
                let searchResultCountcustomerDocumento = customerDocumento.runPaged().count;
                console.log("searchResultCountcustomerDocumento", searchResultCountcustomerDocumento);
                if (searchResultCountcustomerDocumento > 0) {
                    alert("El Número de documento ya se encuentra registrado en otro registro.");
                    return false;
                }
            } else if (typeMode == 'edit') {
                if (isperson == 'T' || isperson == true) {
                    if (nombre.length == 0) {
                        alert('Introduzca valores para: Primer Nombre.');
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
                                ["custentity_ht_cl_primernombre", "is", nombre],
                                "AND",
                                ["custentity_ht_cl_segundonombre", "is", segundonombre],
                                "AND",
                                ["custentity_ht_cl_apellidopaterno", "is", apellido],
                                "AND",
                                ["custentity_ht_cl_apellidomaterno", "is", segundoapellido]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "internalid", label: "ID" }),
                            ]
                    });
                    let searchResultCountcustomerNatural = customerNatural.runPaged().count;
                    console.log("searchResultCountcustomerNatural", searchResultCountcustomerNatural);
                    if (searchResultCountcustomerNatural > 0) {
                        console.log('validateDuplicateName', `${nombreCompletoOld} - ${nombreCompleto}`)
                        if (nombreCompleto != nombreCompletoOld) {
                            alert("El Nombre del Cliente ya se encuentra registrado en otro registro.");
                            return false;
                        }
                    }
                } else {
                    let customerCompany = search.create({
                        type: "customer",
                        filters:
                            [
                                ["companyname", "is", companyName]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "internalid", label: "ID" }),
                                'companyname'
                            ]
                    });
                    let searchResultCountcustomerCompany = customerCompany.runPaged().count;
                    console.log("searchResultCountcustomerCompany", searchResultCountcustomerCompany);
                    if (searchResultCountcustomerCompany > 0) {
                        console.log('validateDuplicateName', `${companyNameOld} - ${companyName}`)
                        if (companyNameOld != companyName) {
                            alert("El Nombre del Cliente ya se encuentra registrado en otro registro.");
                            return false;
                        }
                    }
                }

                //* Nro Documento.
                let customerDocumento = search.create({
                    type: "customer",
                    filters:
                        [
                            ["formulatext: {vatregnumber}", "is", vatregnumber]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", label: "ID" }),
                            search.createColumn({ name: "formulatext", formula: "{vatregnumber}", label: "Formula (Text)" })
                        ]
                });
                let searchResultCountcustomerDocumento = customerDocumento.runPaged().count;
                console.log("searchResultCountcustomerDocumento", searchResultCountcustomerDocumento);
                if (searchResultCountcustomerDocumento > 0) {
                    console.log('validateDuplicateVatregnumber', `${vatregnumberOld} - ${vatregnumber}`)
                    if (vatregnumberOld != vatregnumber) {
                        alert("El Número de documento ya se encuentra registrado en otro registro.");
                        return false;
                    }
                }
            }

            //*TEMPORAL
            console.log('Entry-tipoDoc', tipoDoc)
            // if (tipoDoc == '1' || tipoDoc == '2') {
            //     if (typeMode != 'delete') {
            //         console.log('Entry-typeMode')
            //         let numeroDocumento = objRecord.getValue('vatregnumber');
            //         var digitoVerificador = getDigitoVerificador(numeroDocumento, tipoDoc);
            //         console.log('digitoVerificador', digitoVerificador)
            //         if (!digitoVerificador) { dialog.alert({ title: 'Información', message: 'El número de cédula es incorrecto.' }) }
            //         return digitoVerificador
            //         // const regex = /^\d$/;
            //         // if (!regex.test(digitoVerificador)) {
            //         //     alert('El número de cédula es incorrecto');
            //         //     return false;
            //         // }
            //     }
            // }
            return true;
        } catch (e) {
            console.log('Error en el saveRecord', e);
            return false;
        }
    }

    const fieldChanged = (context) => {
        console.log('entra');
        const objRecord = currentRecord.get();
        console.log('objRecord', objRecord);
        console.log('typeMode', typeMode);
        var isperson = context.fieldId;
        if (typeMode == 'create' || typeMode == 'copy' || typeMode == 'edit') {
            var isperson = objRecord.getText('isperson');
            var altname = objRecord.getText('altname');
            console.log('isperson', isperson);
            console.log('altname', altname);
            if (isperson == 'T' || isperson == true) {
                context.currentRecord.getField({ fieldId: 'custentity_ht_cl_primernombre' }).isDisplay = true;
                context.currentRecord.getField({ fieldId: 'custentity_ht_cl_segundonombre' }).isDisplay = true;
                context.currentRecord.getField({ fieldId: 'custentity_ht_cl_apellidopaterno' }).isDisplay = true;
                context.currentRecord.getField({ fieldId: 'custentity_ht_cl_apellidomaterno' }).isDisplay = true;
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
                objRecord.setText({ fieldId: 'firstname', text: completename, ignoreFieldChange: true });
                objRecord.setText({ fieldId: 'lastname', text: completelastname, ignoreFieldChange: true });
            } else {
                context.currentRecord.getField({ fieldId: 'custentity_ht_cl_primernombre' }).isDisplay = false;
                context.currentRecord.getField({ fieldId: 'custentity_ht_cl_segundonombre' }).isDisplay = false;
                context.currentRecord.getField({ fieldId: 'custentity_ht_cl_apellidopaterno' }).isDisplay = false;
                context.currentRecord.getField({ fieldId: 'custentity_ht_cl_apellidomaterno' }).isDisplay = false;
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

    function getDigitoVerificador(numeroDocumento, tipo) {
        console.log('numeroDocumento', numeroDocumento)
        try {
            // if (!numeroDocumento) return;
            // var headers = new Array();
            // headers['Content-type'] = 'application/json';
            // var restUrl = url.resolveScript({
            //     scriptId: 'customscript_ts_rs_verification_code',
            //     deploymentId: 'customdeploy_ts_rs_verification_code'
            // });
            // restUrl += `&numero=${numeroDocumento}&tipo=${tipoDoc}`;
            // var response = https.get({ url: restUrl, headers: headers })
            // console.log('response', response)
            // return response.body

            let RUC = 1
            let CEDULA = 2
            let numero = numeroDocumento;
            let tipoDoc = parseInt(tipo)
            var numeroProvincias = 22;
            let message = '';
            let retorno = true;
            /* Verifico que el campo no contenga letras */
            var ok = 1;
            for (i = 0; i < numero.length && ok == 1; i++) {
                var n = parseInt(numero.charAt(i));
                if (isNaN(n)) ok = 0;
            }
            if (ok == 0) {
                message = 'No puede ingresar caracteres en el número.';
                log.debug('Debug1', message);
                return message;
            }

            if (numero.length < 10) {
                message = 'El número ingresado no es válido.';
                log.debug('Debug2', message);
                return message;
            }

            /* Los primeros dos digitos corresponden al codigo de la provincia */
            provincia = numero.substr(0, 2);
            if (provincia < 1 || provincia > numeroProvincias) {
                message = 'El código de la provincia (dos primeros dígitos) es inválido.';
                return message;
            }

            switch (tipoDoc) {
                case RUC:
                    retorno = validarRucPublico(numero)
                    break;
                case CEDULA:
                    retorno = validarCedulaEcuador(numero)
                    break;
                default:
                    break;
            }
            return retorno;
        } catch (error) {
            console.log('error', error)
            return null;
        }
    }

    const validarRucPublico = (ruc) => {
        // Verificamos que el RUC tenga 13 dígitos
        if (ruc.length !== 13) {
            return false;
        }

        // El tercer dígito debe ser siempre 6
        if (ruc[2] !== '6') {
            return false;
        }

        // Coeficientes para la validación
        const coeficientes = [3, 2, 7, 6, 5, 4, 3, 2];
        let suma = 0;

        // Calculamos el total de la suma multiplicando dígitos por sus coeficientes
        for (let i = 0; i < coeficientes.length; i++) {
            suma += parseInt(ruc[i]) * coeficientes[i];
        }
        log.debug('suma', suma)
        // Aplicamos el módulo 11
        const modulo = suma % 11;
        log.debug('modulo', modulo)
        // Obtenemos el dígito verificador (novena posición, índice 8)
        const digitoVerificador = parseInt(ruc[8]);

        // Si el resultado del módulo es 0, comparamos con el dígito verificador
        log.debug('digitoVerificador', digitoVerificador)
        if (modulo === 0) {
            return digitoVerificador === 0;
        } else {
            // Caso contrario, restamos el resultado del módulo a 11 y comparamos
            const resultado = 11 - modulo;
            return digitoVerificador === resultado;
        }
    }

    const validarCedulaEcuador = (cedula) => {
        // Verificar si la cédula tiene 10 dígitos
        if (cedula.length !== 10) {
            return false;
        }

        // Los dos primeros dígitos deben corresponder a una provincia válida (01-24)
        const provincia = parseInt(cedula.substring(0, 2), 10);
        if (provincia < 1 || provincia > 24) {
            return false;
        }

        // El tercer dígito debe ser menor que 6 para personas naturales
        const tercerDigito = parseInt(cedula[2], 10);
        if (tercerDigito > 6) {
            return false;
        }

        // Coeficientes alternados para los primeros 9 dígitos
        const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
        let suma = 0;

        // Realizar las multiplicaciones y sumas según los coeficientes
        for (let i = 0; i < 9; i++) {
            let producto = parseInt(cedula[i]) * coeficientes[i];
            if (producto >= 10) {
                producto -= 9; // Si el producto es mayor que 9, restamos 9
            }
            suma += producto;
        }

        // Obtener el dígito verificador (décimo dígito)
        const digitoVerificador = parseInt(cedula[9], 10);

        // Aplicar la regla para obtener el valor de verificación
        const residuo = suma % 10;
        const valorVerificador = residuo === 0 ? 0 : 10 - residuo;

        // Comparar con el dígito verificador
        return valorVerificador === digitoVerificador;
    }

    return {
        pageInit: pageInit,
        //saveRecord: saveRecord,
        fieldChanged: fieldChanged
    }
});