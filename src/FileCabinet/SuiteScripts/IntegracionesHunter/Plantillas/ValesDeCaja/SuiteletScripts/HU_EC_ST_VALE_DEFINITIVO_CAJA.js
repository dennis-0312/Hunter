/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
*/
define(['N/record', 'N/render', 'N/file', 'N/search', '../Librerias/Libreria'],

    function (record, render, file, search, libreria) {

        //ftl
        const TEMPLATE_PDF_EXPENSE_REPORT = "../Templates/HU_EC_PLANTILLA_VALE_DEFINITIVO_CAJA.ftl";
        const onRequest = (context) => {
            try {
                if (context.request.method == 'GET') {
                    var jsonTemplate = {};
                    var { type, id } = context.request.parameters;
                    jsonTemplate = getDataForTemplate(type, id);

                    renderPDF(id, jsonTemplate, context);
                }
            } catch (e) {
                log.error("Error", "[ onRequest ] " + e);
            }
        }

        const getDataForTemplate = (type, id) => {
            var formInfo;
            if (type == 'expensereport') {
                formInfo = getInfo(id);
            }
            return {
                formInfo
            }
        }

        const getInfo = (formId) => {
            try {
                
                var searchCheque = search.lookupFields({
                    type: "expensereport",
                    id: formId,
                    columns: [
                        'account',
                        'total'
                    ]
                });

                var cuentaCredito = searchCheque.account?.length ? searchCheque.account[0].value : "";
                var listadoCuentas = ObtenerCuentaGastos(formId);
                var cuentasDebito = listadoCuentas[0];
                var valoresDebito = listadoCuentas[1];
                var notasDebito = listadoCuentas[2];
                var codigosIva = listadoCuentas[3];
                var valoresIva = listadoCuentas[4];

                var credito = CuentaNombreNumero(Number(cuentaCredito));
                var debitos = [];
                for(var i=0; i<cuentasDebito.length; i++){
                    var debito = CuentaNombreNumero(Number(cuentasDebito[i]));
                    debitos = [...debitos, debito];
                }

                var monto = searchCheque.total;
                if (Number(monto) < 0) {
                    monto = Number(monto) * (-1);
                }
                
                var result = {};
                result.nombreCredito = credito[0];
                result.numeroCredito = credito[1];
                result.letrasMontoTotal = libreria.NumeroALetras(monto);

                var expenseList = [];
                var impuestosList = [];
                var vatIvaList = [];
                for (var i = 0; i < debitos.length; i++) {

                    if(codigosIva[i] != 5){ //taxcode = 5 es indefinido y no se muestra en impuestos
                        var searchIdIva = search.lookupFields({
                            type: "salestaxitem",
                            id: codigosIva[i],
                            columns: [
                                'purchaseaccount'
                            ]
                        });
                        var idRegistroIva = searchIdIva.purchaseaccount?.length ? searchIdIva.purchaseaccount[0].value : "";;
                        var ivaNombreCuenta = CuentaNombreNumero(idRegistroIva);
                        if(duplicidadCuentaImpuestos(vatIvaList, ivaNombreCuenta[1])){
                            incrementarImpuestoDuplicado(vatIvaList, ivaNombreCuenta[1], valoresIva[i], false)
                        }else{
                            var vatIva = {
                                nombreCuenta: ivaNombreCuenta[0],
                                numeroCuenta: ivaNombreCuenta[1],
                                debitoCuenta: formatearNumero(Number(valoresIva[i])) || "",
                                creditoCuenta: "",
                                notaCuenta: "VAT"
                            };
                            vatIvaList = [...vatIvaList, vatIva]
                        }                                                    
                    }

                    var debito = 0;
                    var credito = 0;
                    var tupla = debitos[i];
                    if(/^-/.test(valoresDebito[i])){
                        credito = Number(valoresDebito[i])*(-1);
                        if(duplicidadCuentaImpuestos(impuestosList, tupla[1])){
                            incrementarImpuestoDuplicado(impuestosList, tupla[1], credito, true)
                        }else{
                            var impuesto = {
                                nombreCuenta: tupla[0],
                                numeroCuenta: tupla[1],
                                debitoCuenta: formatearNumero(debito) || "",
                                creditoCuenta: formatearNumero(credito) || "",
                                notaCuenta: notasDebito[i]
                            };
                            impuestosList = [...impuestosList, impuesto]
                        }                        
                        continue;
                    }else{
                        debito = Number(valoresDebito[i]);
                    }                    
                    var expense = {
                        nombreCuenta: tupla[0],
                        numeroCuenta: tupla[1],
                        debitoCuenta: formatearNumero(debito) || "",
                        creditoCuenta: formatearNumero(credito) || "",
                        notaCuenta: notasDebito[i]
                    };
                    expenseList = [...expenseList, expense]                    
                }
                expenseList = [...expenseList, ...impuestosList]
                expenseList = [...expenseList, ...vatIvaList]
                result.expense = expenseList

                return result;

            } catch (error) {
                log.error('error-getCheque', error);
            }

        }

        function duplicidadCuentaImpuestos(lista, cuenta){
            for (var i = 0; i < lista.length; i++) {
                if (lista[i].numeroCuenta == cuenta) {
                    return true;
                }
            }
            return false;
        }

        function incrementarImpuestoDuplicado(lista, cuenta, valor, esCredito){
            for (var i = 0; i < lista.length; i++) {                
                if (lista[i].numeroCuenta == cuenta) {
                    if(esCredito){
                        lista[i].creditoCuenta = formatearNumero(Number(lista[i].creditoCuenta) + valor)
                    }else{
                        lista[i].debitoCuenta = formatearNumero(Number(lista[i].debitoCuenta) + valor)
                    }                    
                }
            }
        }

        function ObtenerCuentaGastos(formId) {
            try {
                var recordLoad = record.load({ type: 'expensereport', id: formId });
                var cuentas = [];
                var valores = [];
                var notas = [];
                var codigosIva = []
                var valoresIva = []
                var numLines = recordLoad.getLineCount({ sublistId: 'expense' });
                for (var i = 0; i < numLines; i++) {
                    var cuenta = recordLoad.getSublistValue({
                        sublistId: 'expense',
                        fieldId: 'expenseaccount',
                        line: i
                    });
                    var valor = recordLoad.getSublistValue({
                        sublistId: 'expense',
                        fieldId: 'amount',
                        line: i
                    });
                    var nota = recordLoad.getSublistValue({
                        sublistId: 'expense',
                        fieldId: 'memo',
                        line: i
                    });
                    var codigoIva = recordLoad.getSublistValue({
                        sublistId: 'expense',
                        fieldId: 'taxcode',
                        line: i
                    });
                    var valorIva = recordLoad.getSublistValue({
                        sublistId: 'expense',
                        fieldId: 'tax1amt',
                        line: i
                    });                    
                    cuentas = [...cuentas, cuenta];
                    valores = [...valores, valor];
                    notas = [...notas, nota];
                    codigosIva = [...codigosIva, codigoIva];
                    valoresIva = [...valoresIva, valorIva];
                }
                return [cuentas, valores, notas, codigosIva, valoresIva];
            } catch (error) {
                log.error('error', error);
            }
        }

        function CuentaNombreNumero(idcuenta) {
            try {
                var arr = [];
                var accountSearchObj = search.create({
                    type: "account",
                    filters:
                        [
                            ["internalid", "anyof", idcuenta]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "localizedname",
                                summary: "GROUP",
                                label: "Nombre localizado"
                            }),
                            search.createColumn({
                                name: "number",
                                summary: "GROUP",
                                label: "Número"
                            }),
                        ]
                });

                var savedsearch = accountSearchObj.run().getRange(0, 1);
                if (savedsearch.length > 0) {
                    accountSearchObj.run().each(function (result) {
                        arr[0] = result.getValue(accountSearchObj.columns[0]);
                        arr[1] = result.getValue(accountSearchObj.columns[1]);
                        return true;
                    });
                }
                return arr;
            } catch (error) {
                log.error('error', error);
            }
        }

        const renderPDF = (id, json, context) => {
            var fileContents = file.load({ id: TEMPLATE_PDF_EXPENSE_REPORT }).getContents();

            var renderer = render.create();
            renderer.templateContent = fileContents;
            renderer.addRecord({
                templateName: 'record',
                record: record.load({
                    type: 'expensereport', // Tipo de registro
                    id: id
                })
            });

            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'extra',
                data: json
            });
            result = renderer.renderAsString();
            context.response.renderPdf(result);
        }

        function formatearNumero(numero) {
            if(!numero){
                return numero
            }else{
                return (numero % 1 === 0 || numero.toString().split('.')[1].length > 1) ? numero.toFixed(2) : numero.toString() + "0";
            }
        }

        return {
            onRequest
        };
    });