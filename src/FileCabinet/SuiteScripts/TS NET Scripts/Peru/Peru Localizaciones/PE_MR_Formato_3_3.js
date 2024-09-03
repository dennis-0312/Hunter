/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * Task          Date            Author                                         Remarks
 * 3.3           28 Ago 2023     Ivan Morales <imorales@myevol.biz>             - Creación del reporte 3.3
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
    var hasInfo = "";

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
          let dataMap4 = dataMap[4];
          let dataMap5 = dataMap[5];
          //remove spaces
          dataMap4 = dataMap4.replace(/\s/g, '');
          dataMap5 = dataMap5.replace(/-/g, '');
            var resultTransactions = {
                idInterno: dataMap[11],
                periodoTexto: dataMap[0],
                cuo: dataMap[1],
                correlativo: dataMap[2],
                tipoDocumento: dataMap[3],
                numeroDocumento: (dataMap4=="-None-"?"":dataMap[4]),
                razonSocial: (dataMap5=="-None-"?"":dataMap[5]).toUpperCase().replace(/&/g, '&amp;'),
                fechaEmision: dataMap[6],
                monto: dataMap[7],
                indicadorEstado: dataMap[8],
                anio: dataMap[9],
                factura: dataMap[10]
            };

            context.write({
                key: key,
                value: resultTransactions
            });

        } catch (e) {
            log.error('ERROR', 'map - Error:' + e);
        }
    }

    const summarize = (context) => {
        getParameters();
        getSubdiary();
        var periodId = getPeriodId();
        
        pGloblas['pRecordID'] = libPe.createLog(pGloblas.pSubsidiary, periodId, "Inventario y Balance 3.3")

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
        // log.debug('transactionJSON', transactionJSON["transactions"]);

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

            /**** */
            stringXML2 = renderer.renderAsString();

            // var FolderId = FOLDER_ID;

            // if (FolderId != '' && FolderId != null) {
            //     // Crea el archivo
            //     var fileAux = file.create({
            //         name: 'AuxiiliarPaPa',
            //         fileType: file.Type.PLAINTEXT,
            //         contents: stringXML2,
            //         encoding: file.Encoding.UTF8,
            //         folder: FolderId
            //     });


            //     var idfile = fileAux.save(); // Termina de grabar el archivo

            //     log.debug({
            //         title: 'URL ARCHIVO TEMP',
            //         details: idfile
            //     });

            // }

            /*** */
            stringXML = renderer.renderAsPdf();
            saveFile(stringXML);


            /**** */
            log.debug('Termino');
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
       
        var cantidadLinea = 0 ;
        var montoviene = 0 ;
        var cantidadFor = 0;
        var cantidadAnterio=0;
     
        for (var k in transactions) {
            let IDD = transactions[k].idInterno;           
            
          cantidadLinea = cantidadLinea + (1 * 4.5) + 1;   
          
            if (!jsonTransacion[IDD]) {
                jsonTransacion[IDD] = {
                    number :cantidadFor,
                    idInterno: transactions[k].idInterno,
                    periodoTexto: transactions[k].periodoTexto,
                    cuo: transactions[k].cuo,
                    correlativo: transactions[k].correlativo,
                    tipoDocumento: transactions[k].tipoDocumento,
                    numeroDocumento: transactions[k].numeroDocumento,
                    razonSocial: transactions[k].razonSocial,                   
                    fechaEmision: transactions[k].fechaEmision,
                    monto:formatearNumeroConComas( Number(transactions[k].monto).toFixed(2)),
                    indicadorEstado: transactions[k].indicadorEstado,
                    anio: transactions[k].anio,
                    factura: transactions[k].factura,
                }
                cantidadFor = cantidadFor+1;
                totalMonto = totalMonto + Number(transactions[k].monto);

            }
            if(cantidadLinea <= 121){
                montoviene = Number(montoviene) +Number(transactions[k].monto);
                cantidadAnterio = cantidadLinea;
            }else{
                jsonTransacionvine.push({
                    montoviene : formatearNumeroConComas(montoviene.toFixed(2)),
                    cantidadFor :cantidadFor-1
                });                
                
                cantidadLinea = 0;
                cantidadLinea = cantidadLinea +(1*4.5) + 1;
                montoviene = Number(montoviene) +Number(transactions[k].monto);
            }
        }

        let jsonAxiliar = {
            "company": {
                "firtTitle": companyName.replace(/&/g, '&amp;'),
                "secondTitle": 'Expresado en Moneda Nacional',
                "thirdTitle": 'FORMATO 3.3 - ' + pGloblas.Anio,
            },
            "cabecera": {
                "Anio": pGloblas.pAnio,
                "ruc": companyRuc,
                "razonSocial": companyName.replace(/&/g, '&amp;').toUpperCase(),
            },
            "total": {
                "totalMonto":  formatearNumeroConComas(totalMonto.toFixed(2))
            },
            "movements": jsonTransacion,
            "jsonTransacionvine": jsonTransacionvine

        };
        
        return jsonAxiliar;
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
  
    const getRUC = (filterSubsidiary) => {
        try {
            const subLookup = search.lookupFields({
                type: search.Type.SUBSIDIARY,
                id: filterSubsidiary,
                columns: ['taxidnum']
            });
            const ruc = subLookup.taxidnum;
            return ruc;
        } catch (e) {
            log.error({ title: 'getRUC', details: e });
        }
    }
 
    const getFileName = () => {
        return `LE${companyRuc}${pGloblas.pAnio}1231030300071${hasInfo}11_${pGloblas.pRecordID}.pdf`;
    }

    const getPeriodId = (textAnio) => {
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

    const saveFile = (stringValue) => {
       
        var getruc = getRUC(pGloblas.pSubsidiary)
        fedIdNumb = getruc;
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
        log.debug('Execution Complete', auxFile)
        urlfile += auxFile.url;
        libPe.loadLog(pGloblas.pRecordID, nameReport, urlfile)
    }

    const getTemplate = () => {
        
        var aux = file.load("./Template/PE_Template_Formato_3_3.ftl");
       
        return aux.getContents();
    }

    const getTransactions = () => {
     
        var arrResult = [];
        var _cont = 0;

        // FORMATO 3.3: "LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 12 - CLIENTES"
        var savedSearch = search.load({
            id: 'customsearch_pe_detalle_12_3_3'
        });

        if (featSubsidiary) {
            savedSearch.filters.push(search.createFilter({
                name: 'subsidiary',
                operator: search.Operator.IS,
                values: pGloblas.pSubsidiary
            }));
        }

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

                // 0. PERIODO TEXTO
                arrAux[0] = result.getValue(columns[0]);

                // 1. CUO
                arrAux[1] = result.getValue(columns[1]);

                // 2. CORRELATIVO
                arrAux[2] = result.getValue(columns[2]);

                // 3. TIPO DE DOCUMENTO DE IDENTIDAD DEL CLIENTE
                arrAux[3] = result.getValue(columns[3]);

                // 4. NÚMERO DE DOCUMENTO DE IDENTIDAD DEL CLIENTE
                arrAux[4] = result.getValue(columns[4]);

                // 5. APELLIDOS Y NOMBRES, DENOMINACIÓN O RAZÓN SOCIAL DEL CLIENTE
                arrAux[5] = result.getValue(columns[5]);

                // 6. FECHA EMISIÓN
                arrAux[6] = result.getValue(columns[6]);

                // 7. MONTO
                arrAux[7] = result.getValue(columns[7]);

                // 8. INDICADOR ESTADO
                arrAux[8] = result.getValue(columns[8]);

                // 9. AÑO
                arrAux[9] = result.getValue(columns[9]);

                // 10. Factura
                arrAux[10] = result.getValue(columns[10]);

                // 11. ID
                arrAux[11] = result.getValue(columns[11]);

                let column13 = result.getValue(columns[12]);
                let column14 = result.getValue(columns[13]);
                let column15 = result.getValue(columns[14]);

                let nombre = column15;
                let numTrabajador = column14;
                let codigoTipoDocumento = '0';

                if(column13 != '0'){
                    let entidad = getCustomer(column13);
                    if (entidad[0] == null) {
                        entidad = getProveedor(column13);
                    }
                    if (entidad[0] == null) {
                        entidad = getemployee(column13);
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
          
                arrAux[3] = codigoTipoDocumento;
                arrAux[4] = numTrabajador;
                arrAux[5] = nombre;
                if (arrAux[0].indexOf(pGloblas.pAnio) !== -1) {
                    arrResult.push(arrAux);
                }

            });
        });

        return arrResult;
    }

    const getSubdiary = () => {
     
        if (featSubsidiary) {
            var dataSubsidiary = record.load({
                type: 'subsidiary',
                id: pGloblas.pSubsidiary
            });
            companyName = dataSubsidiary.getValue('legalname');
            companyRuc = dataSubsidiary.getValue('federalidnumber');
        } else {
            companyName = config.getFieldValue('legalname');
        }
  ;
    }

    const getParameters = () => {
        pGloblas = objContext.getParameter('custscript_pe_formato_3_3_params');
        pGloblas = JSON.parse(pGloblas);
        pGloblas = {
            pRecordID: pGloblas.recordID,
            pFeature: pGloblas.reportID,
            pSubsidiary: pGloblas.subsidiary,
            pAnio: pGloblas.anioCon
        };      
        // pGloblas = {
        //   pRecordID: 0,
        //   pFeature: 113,
        //   pSubsidiary: 3,
        //   periodCon: 114,
        //   pAnio:"2023"
        // }
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