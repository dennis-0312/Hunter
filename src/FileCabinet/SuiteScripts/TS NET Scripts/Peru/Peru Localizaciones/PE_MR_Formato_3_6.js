/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * Task          Date            Author                                         Remarks
 * 3.6           28 Ago 2023     Ivan Morales <imorales@myevol.biz>             - Creación del reporte 3.6
 *
 */

define(['N/runtime', 'N/search', 'N/config', 'N/render', 'N/record', 'N/file', './PE_LIB_Libros.js', 'N/format'], (runtime, search, config, render, record, file, libPe, format) => {

    var objContext = runtime.getCurrentScript();

    /** PARAMETROS */
    var pGloblas = {};

    /** REPORTE */
    var formatReport = 'pdf';
    var nameReport = '';
    var transactionFile = null;

    /** DATOS DE LA SUBSIDIARIA */
    var companyName = '';
    var companyRuc = '';
    var companyLogo = '';
    var companyDV = '';
    var hasInfo  = '';

    var featureSTXT = null;
    var featMultibook = null;
    var featSubsidiary = null;

    const getInputData = () => {
        try {
            getParameters();
            return getTransactions();
        } catch (e) {
            log.error('ERROR', 'getInputData - Error:' + e);
        }

    }

    const map = (context) => {
        try {
            var key = context.key;
            var dataMap = JSON.parse(context.value);
            var resultTransactions = {
                idInterno: dataMap[0],
                tipoDocumento: dataMap[1],
                numeroDocumento: dataMap[2],
                razonSocial: (dataMap[3]=="- None -"?"":dataMap[3]),
                factura: dataMap[4],
                fechaInicio: dataMap[5],
                montoCtaCobrar: dataMap[6]
            };

            context.write({
                key: key,
                value: resultTransactions
            });

        } catch (e) {
            log.error('ERROR', 'map - Error:' + e);
        }
    }

    const getFileName = () => {
        return `LE${companyRuc}${pGloblas.pAnio}1231030600071${hasInfo}11_${pGloblas.pRecordID}.pdf`;
    }

    const getPeriodId = () => {
        let startDate = new Date();
        let firstDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        firstDate = format.format({
            value: firstDate,
            type: format.Type.DATE
        });

        let resultSearch = search.create({
            type: "accountingperiod",
            filters: [
                ["isadjust", "is", "F"],
                "AND",
                ["isquarter", "is", "F"],
                "AND",
                ["isyear", "is", "F"],
                "AND",
                ["startdate", "on", firstDate]
            ],
            columns: [
                search.createColumn({
                    name: "internalid"
                })
            ]
        }).run().getRange(0, 1);
        if (resultSearch.length) return resultSearch[0].id;
        return "";
    }
    function formatearNumeroConComas(numero) {
        // Convierte el número a una cadena
        const numeroString = numero.toString();
      
        // Divide la cadena en parte entera y parte decimal (si existe)
        const partes = numeroString.split('.');
        const parteEntera = partes[0];
        const parteDecimal = partes.length > 1 ? '.' + partes[1] : '';
      
        // Agrega comas para separar los miles en la parte entera
        const parteEnteraFormateada = parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      
        // Combina la parte entera formateada y la parte decimal (si existe)
        const numeroFormateado = parteEnteraFormateada + parteDecimal;
      
        return numeroFormateado;
      }
    const summarize = (context) => {
        getParameters();
        getSubdiary();
        var periodId = getPeriodId(pGloblas.pAnio);

        pGloblas['pRecordID'] = libPe.createLog(pGloblas.pSubsidiary, periodId, "Inventario y Balance 3.6")

        var transactionJSON = {};

        transactionJSON["parametros"] = pGloblas

        transactionJSON["transactions"] = {
        };
        hasInfo = 0;
        context.output.iterator().each(function (key, value) {
            hasInfo = 1;
            value = JSON.parse(value);

            transactionJSON["transactions"][value.idInterno] = value;
            return true;

        });

        var jsonAxiliar = getJsonData(transactionJSON["transactions"]);

        //Validamos que TrnsactionJSON.accounts no este vacio para todos los ambientes
        if (!isObjEmpty(transactionJSON["transactions"])) {

            var renderer = render.create();

            renderer.templateContent = getTemplate();

            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "input",
                data: {
                    data: JSON.stringify(jsonAxiliar)
                }
            });

            /**** *
            stringXML2 = renderer.renderAsString();

            var FolderId = FOLDER_ID;

            if (FolderId != '' && FolderId != null) {
                // Crea el archivo
                var fileAux = file.create({
                    name: 'AuxiiliarPaPa',
                    fileType: file.Type.PLAINTEXT,
                    contents: stringXML2,
                    encoding: file.Encoding.UTF8,
                    folder: FolderId
                });


                var idfile = fileAux.save(); // Termina de grabar el archivo

                log.debug({
                    title: 'URL ARCHIVO TEMP',
                    details: idfile
                });

            }

            *** */
            stringXML = renderer.renderAsPdf();
            saveFile(stringXML);


            /**** */
            return true;

        } else {
            log.debug('ERROR', 'No data');
            libPe.noData(pGloblas.pRecordID);
        }
    }

    const getJsonData = (transactions) => {
        let userTemp = runtime.getCurrentUser(),
            useID = userTemp.id,
            jsonTransacion = {},
            jsonTransacionvine = new Array(),
            totalMonto = 0;

        var employeeName = search.lookupFields({
            type: search.Type.EMPLOYEE,
            id: useID,
            columns: ['firstname', 'lastname']
        });
        var userName = employeeName.firstname + ' ' + employeeName.lastname;
        var cantidadLinea = 0 ;
        var montoviene = 0 ;
        var cantidadFor = 0;
        var cantidadAnterio=0;

        for (var k in transactions) {
            let IDD = transactions[k].idInterno;
            cantidadLinea = cantidadLinea + 1;
            if (!jsonTransacion[IDD]) {
                jsonTransacion[IDD] = {
                    number :cantidadFor,
                    idInterno: transactions[k].idInterno,
                    tipoDocumento: transactions[k].tipoDocumento,
                    numeroDocumento: transactions[k].numeroDocumento,
                    razonSocial: transactions[k].razonSocial,
                    factura: transactions[k].factura,
                    fechaInicio: transactions[k].fechaInicio,
                    montoCtaCobrar: Number(transactions[k].montoCtaCobrar),
                }
                cantidadFor = cantidadFor+1;
                totalMonto = totalMonto + Number(transactions[k].montoCtaCobrar);
            }
            if(cantidadLinea <= 26){
                montoviene = Number(montoviene) +Number(transactions[k].montoCtaCobrar);
                cantidadAnterio = cantidadLinea;
            }else{
                jsonTransacionvine.push({
                    montoviene : formatearNumeroConComas(montoviene.toFixed(2)),
                    cantidadFor :cantidadFor-1
                });
                
                
                cantidadLinea = 0;
                cantidadLinea = cantidadLinea + 1;
                montoviene = Number(montoviene) +Number(transactions[k].montoCtaCobrar);
            }
        }
        let jsonAxiliar = {
            "company": {
                "firtTitle": companyName.replace(/&/g, '&amp;'),
                "secondTitle": 'Expresado en Moneda Nacional',
                "thirdTitle": 'FORMATO 3.6 - ' + pGloblas.Anio,
            },
            "cabecera": {
                "Anio": pGloblas.pAnio,
                "ruc": companyRuc,
                "razonSocial": companyName.replace(/&/g, '&amp;').toUpperCase(),
            },
            "total": {
                "totalMonto": roundTwoDecimal(totalMonto)
            },
            "movements": jsonTransacion,
            "jsonTransacionvine": jsonTransacionvine

        };

        return jsonAxiliar;
    }

    const roundTwoDecimal = (value) => {
        return Math.round(Number(value) * 100) / 100;
    }

    const saveFile = (stringValue) => {
        var fileAuxliar = stringValue;
        var urlfile = '';
        nameReport = getFileName();

        var folderID = libPe.callFolder();

        fileAuxliar.name = nameReport;
        fileAuxliar.folder = folderID;

        var fileID = fileAuxliar.save();

        let auxFile = file.load({
            id: fileID
        });
        log.debug('EXECUTION COMPLETE', auxFile)
        urlfile += auxFile.url;

        log.debug('pGloblas.pRecordID', pGloblas.pRecordID)

        libPe.loadLog(pGloblas.pRecordID, nameReport, urlfile)
    }

    const getTemplate = () => {
        var aux = file.load("./Template/PE_Template_Formato_3_6.ftl");
        return aux.getContents();
    }

    const getTransactions = () => {
        var arrResult = [];
        var _cont = 0;

        // FORMATO 3.6: "LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 19"
        var savedSearch = search.load({
            id: 'customsearch_pe_libro_impreso_3_6'
        });

        if (featSubsidiary) {
            savedSearch.filters.push(search.createFilter({
                name: 'subsidiary',
                operator: search.Operator.IS,
                values: pGloblas.pSubsidiary
            }));
        }

        var startdate = format.format({
            value: new Date(pGloblas.pAnio, 0, 1),
            type: format.Type.DATE
        });
        var enddate = format.format({
            value: new Date(pGloblas.pAnio, 12, 0),
            type: format.Type.DATE
        });

        savedSearch.filters.push(search.createFilter({
            name: 'trandate',
            operator: search.Operator.WITHIN,
            values: [startdate, enddate]
        }));

        var pagedData = savedSearch.runPaged({
            pageSize: 1000
        });

        var page, columns;

        pagedData.pageRanges.forEach(function (pageRange) {
            page = pagedData.fetch({
                index: pageRange.index
            });

            page.data.forEach(function (result) {
                columns = result.columns;
                arrAux = new Array();

                // 0. ID INTERNO
                arrAux[0] = result.getValue(columns[0]);

                // 1. TIPO DOCUMENTO DE IDENTIDAD
                arrAux[1] = result.getValue(columns[1]);

                // 2. NÚMERO DOCUMENTO DE IDENTIDAD
                arrAux[2] = result.getValue(columns[2]);

                // 3. APELLIDOS Y NOMBRES, DENOMINACIÓN O RAZÓN SOCIAL
                arrAux[3] = result.getValue(columns[3]);

                // 4. FACTURA
                arrAux[4] = result.getValue(columns[4]);

                // 5. FECHA DE INICIO DE LA OPERACIÓN
                arrAux[5] = result.getValue(columns[5]);

                // 6. MONTO
                arrAux[6] = result.getValue(columns[6]);

                // 7. PERIODO
                arrAux[7] = result.getValue(columns[7]);

                // 8. PERIODO nombre
                arrAux[8] = result.getValue(columns[8]);

                let IDEntidad = result.getValue(columns[9]);
                let CuentaNombre = result.getValue(columns[10]);
                let NumeroCuenta = result.getValue(columns[11]);

                let nombre = CuentaNombre;
                let numTrabajador = NumeroCuenta;
                let codigoTipoDocumento = '0';

                if(IDEntidad != '0'){

                    let entidad = getCustomer(IDEntidad);
                    if (entidad[0] == null) {
                        entidad = getProveedor(IDEntidad);
                    }
                    if (entidad[0] == null) {
                        entidad = getemployee(IDEntidad);
                    }

                    let company = entidad[0];
                    numTrabajador = entidad[1];
                    let isPerson = entidad[2];
                    let altname = entidad[3];
                    codigoTipoDocumento = entidad[4];

                    if (company == null) company = '';
                    if (numTrabajador == null) numTrabajador = '';
                    if (isPerson == null) isPerson = '';
                    if (altname == null) altname = '';
                    if (codigoTipoDocumento == null) codigoTipoDocumento = '';

                    if (isPerson == false) {
                        nombre = company;
                    } else if (isPerson == true) {
                        nombre = altname;
                    }
                }
                nombre = nombre.replace(/(\r\n|\n|\r)/gm, "");
                nombre = nombre.replace(/[\/\\|]/g, "");

                arrAux[1] = codigoTipoDocumento;
                arrAux[2] = numTrabajador;
                arrAux[3] = nombre;

                //Temporal
                if(arrAux[8].indexOf(pGloblas.pAnio) !== -1)
                {
                    arrResult.push(arrAux);
                }

            });
        });

        // !DATA PRUEBA - Inicio
        //for(var i=0;i<10;i++){
        //    arrAux = new Array();
        //    arrAux[0] = (123+i)
        //    arrAux[1] = '6'
        //    arrAux[2] = '20100102413'
        //    arrAux[3] = 'PEDRO MATEO JUAN S.A.C'
        //    arrAux[4] = 'ND-F002-00000009'
        //    arrAux[5] = '27/07/2023'
        //    arrAux[6] = '2160.99'
        //    arrAux[7] = 'Jul 2023'
        //    arrAux[8] = 'Jul 2023'
        //    arrResult.push(arrAux);
        //}
        // !DATA PRUEBA - Fin

        return arrResult;
    }

    const getSubdiary = () => {

        if (featSubsidiary) {
            log.debug(pGloblas.pSubsidiary, pGloblas.pSubsidiary)
            var dataSubsidiary = record.load({
                type: 'subsidiary',
                id: pGloblas.pSubsidiary
            });
            companyName = dataSubsidiary.getValue('legalname');
            companyRuc = dataSubsidiary.getValue('federalidnumber');
        } else {
            companyName = config.getFieldValue('legalname');
        }
    }

    const getParameters = () => {
        pGloblas = objContext.getParameter('custscript_pe_formato_3_6_params');
        pGloblas = JSON.parse(pGloblas);

        pGloblas = {
            pRecordID: pGloblas.recordID,
            pFeature: pGloblas.reportID,
            pSubsidiary: pGloblas.subsidiary,
            pAnio: pGloblas.anioCon
        }

        featSubsidiary = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
    }

    const isObjEmpty = (obj) => {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }

        return true;
    }
    
    function CompletarCero(tamano, valor) {
        var strValor = valor + '';
        var lengthStrValor = strValor.length;
        var nuevoValor = valor + '';

        if (lengthStrValor <= tamano) {
            if (tamano != lengthStrValor) {
                for (var i = lengthStrValor; i < tamano; i++){
                    nuevoValor = '0' + nuevoValor;
                }
            }
            return nuevoValor;
        } else {
            return nuevoValor.substring(0,tamano);
        }
    }

    const getProveedor = (id) => {
        id = Number(id);
        try {
            var arr = [];
            let vendor = search.lookupFields({
                type: "vendor",
                id: id,
                columns: [
                    "companyname", 'vatregnumber', 'isperson', 'altname', 'custentity_pe_code_document_type',
                ]
            });
            arr[0] = vendor.companyname;
            arr[1] = vendor.vatregnumber;
            arr[2] = vendor.isperson;
            arr[3] = vendor.altname;
            arr[4] = vendor.custentity_pe_code_document_type;
            return arr;
        } catch (error) {
            log.error('error-getProveedor', error);
        }
    }

    const getCustomer = (id) => {
        id = Number(id);
        try {
            var arr = [];
            let customer = search.lookupFields({
                type: "customer",
                id: id,
                columns: [
                    "companyname", 'vatregnumber', 'isperson', 'altname', 'custentity_pe_code_document_type'
                ]
            });
            arr[0] = customer.companyname;
            arr[1] = customer.vatregnumber;
            arr[2] = customer.isperson;
            arr[3] = customer.altname;
            arr[4] = customer.custentity_pe_code_document_type;
            return arr;
        } catch (error) {
            log.error('error-getCustomer', error);
        }
    }

    const getemployee = (id) => {
        id = Number(id);
        try {
            var arr = [];
            let employee = search.lookupFields({
                type: "employee",
                id: id,
                columns: [
                    "altname", 'custentity_pe_document_number', 'custentity_pe_code_document_type'
                ]
            });
            arr[0] = '';
            arr[1] = employee.custentity_pe_document_number;
            arr[2] = true;
            arr[3] = employee.altname;
            arr[4] = employee.custentity_pe_code_document_type;
            return arr;
        } catch (error) {
            log.error('error-getemployee', error);
        }
    }

    return {
        getInputData: getInputData,
        map: map,
        // reduce: reduce,
        summarize: summarize
    };

});