/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
*/
define(['N/ui/serverWidget', 'N/record', 'N/render', 'N/file', 'N/search', 'N/runtime', 'N/format', 'N/email', 'N/url'],

    function (serverWidget, record, render, file, search, runtime, format, email, url) {

        //ftl
        const TEMPLATE_CHEQUE = "/SuiteScripts/Desarollo/main/Templates/Cheques/HU_FTL_Impresion_ImpactoLibroMayor.ftl";

        const onRequest = (context) => {
            try {
                log.error("onRequest", "onRequest");

                if (context.request.method == 'GET') {
                    let jsonTemplate = {};
                    let { vendoPayment, tipo } = context.request.parameters;
                    jsonTemplate = getDataForTemplate(vendoPayment, tipo);
                    log.error("jsonTemplate", jsonTemplate);

                    let ChequeBeneficiario = TEMPLATE_CHEQUE;

                    renderPDF(ChequeBeneficiario, jsonTemplate, context);
                }
            } catch (e) {
                log.error("Error", "[ onRequest ] " + e);
            }
        }

        const getDataForTemplate = (ID, tipo) => {
            let vendoPayment;
            log.error('tipo', tipo);
            log.error('ID', ID);
            if (tipo == 'cheque') {
                vendoPayment = getCheque(ID);
            }
          
            return {
                vendoPayment
            }
        }

        
        const getCheque = (chequeID) => {
            try {
                let cuentaDebito = ObtenerCuentaGastos(chequeID);

                log.error('cuentaDebito', cuentaDebito);
                let searchCheque = search.lookupFields({
                    type: "check",
                    id: chequeID,
                    columns: [
                        'total',
                        'tranid',
                        'trandate',
                        'location',
                        'entity',
                        'account',
                        'memo'
                    ]
                });
                let result = {};

                let cuentaCredito = searchCheque.account.length ? searchCheque.account[0].value : "";
                log.debug('cuentaCredito', cuentaCredito);

                //var esBolivariano = BuscarCuentaBolivariana(cuentaCredito)
                
              /*let TipoBanco = '';
                if (esBolivariano == true) {
                    TipoBanco = 'BOLIVARIANO'
                } else {
                    TipoBanco = 'OTROS'
                }*/

                let fecha = getFecha(searchCheque.trandate);
                let location = searchCheque.location.length ? searchCheque.location[0].value : "";
                let idEntidad = searchCheque.entity.length ? searchCheque.entity[0].value : "";

                let ubicacion = getLocation(location);
                ubicacion = ubicacion.toUpperCase();

                log.error('idEntidad ', idEntidad);
                let beneficiario = getCustomer(idEntidad);
                if (beneficiario[0] == null) {
                    beneficiario = getProveedor(idEntidad);
                }
                if (beneficiario[0] == null) {
                    beneficiario = getemployee(idEntidad);
                }

                let nombreBeneficiario = '';
                let companyBeneficiario = beneficiario[0];
                let RUCBeneficiario = beneficiario[1];
                let isPerson = beneficiario[2];
                let altnameBeneficiario = beneficiario[3];

                if (companyBeneficiario == null) companyBeneficiario = '';
                if (RUCBeneficiario == null) RUCBeneficiario = '';
                if (isPerson == null) isPerson = '';
                if (altnameBeneficiario == null) altnameBeneficiario = '';

                if (isPerson == false) {
                    nombreBeneficiario = companyBeneficiario;
                } else if (isPerson == true) {
                    nombreBeneficiario = altnameBeneficiario;
                }

                let monto = searchCheque.total;
                if (Number(monto) < 0) {
                    monto = Number(monto) * (-1);
                }
                monto = monto.toFixed(2);

                let credito = CuentaNombreNumero(Number(cuentaCredito));
                let debito = CuentaNombreNumero(Number(cuentaDebito));

                result.montoTotal = ponerDecimales(monto) + ' ***';
                result.montoImpacto = ponerDecimales(monto);
                result.total = NumeroALetras(monto);
                result.cheque = searchCheque.tranid;
                result.fechaUbica = ubicacion + ', ' + fecha;
                result.beneficiario = nombreBeneficiario;
                result.ruc = RUCBeneficiario;
                result.nombreCredito = credito[0];
                result.numeroCredito = credito[1];
                result.numCuenta = credito[2];
                result.nombreDebito = debito[0];
                result.numeroDebito = debito[1];
                result.sucursal = ubicacion;
                result.fecha = searchCheque.trandate;
                result.memo = searchCheque.memo;
                //result.TipoBanco = TipoBanco;
                return result;

            } catch (error) {
                log.error('error-getCheque', error);
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
                        "companyname", 'vatregnumber', 'isperson', 'altname'
                    ]
                });
                arr[0] = vendor.companyname;
                arr[1] = vendor.vatregnumber;
                arr[2] = vendor.isperson;
                arr[3] = vendor.altname;
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
                        "companyname", 'vatregnumber', 'isperson', 'altname'
                    ]
                });
                arr[0] = customer.companyname;
                arr[1] = customer.vatregnumber;
                arr[2] = customer.isperson;
                arr[3] = customer.altname;
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
                        "altname", 'custentity_ec_numero_registro'
                    ]
                });
                arr[0] = '';
                arr[1] = employee.custentity_ec_numero_registro;
                arr[2] = true;
                arr[3] = employee.altname;
                return arr;
            } catch (error) {
                log.error('error-getemployee', error);
            }
        }

        const getLocation = (id) => {
            id = Number(id);
            try {
                let location = search.lookupFields({
                    type: "location",
                    id: id,
                    columns: [
                        "custrecord_5826_loc_branch_id"
                    ]
                });
                let ubicacion = location.custrecord_5826_loc_branch_id;
                return ubicacion;
            } catch (error) {
                log.error('error-getLocation', error);
            }
        }

        const getFecha = (fecha) => {
            fecha = fecha.split('/');
            try {
                var mes = getMes(fecha[1]);
                var textoFecha = fecha[0] + ' de ' + mes + ' de ' + fecha[2];
                return textoFecha;
            } catch (error) {
                log.error('error-getFecha', error);
            }
        }

        const renderPDF = (templateId, json, context) => {
            let fileContents = file.load({ id: templateId }).getContents();

            let renderer = render.create();
            renderer.templateContent = fileContents;
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'record',
                data: json
            });
            result = renderer.renderAsString();
            result.replace(/&/g, '&amp;');
            let myFileObj = render.xmlToPdf({
                xmlString: result
            });

            var pdfContent = myFileObj.getContents();

            context.response.renderPdf(result);
        }

        function ponerDecimales(num) {
            num = num + '';
            try {
                var splitStr = num.split('.');
                let splitLeft = splitStr[0];
                let splitRight = splitStr.length > 1 ? '.' + splitStr[1] : '';
                let regx = /(\d+)(\d{3})/;
                while (regx.test(splitLeft)) {
                    splitLeft = splitLeft.replace(regx, '$1' + ',' + '$2');
                }
                return splitLeft + splitRight;
            } catch (error) {
                log.error('error', error);
            }
        }//Unidades()

        function getMes(num) {
            num = Number(num);
            switch (num) {
                case 1: return 'enero';
                case 2: return 'febrero';
                case 3: return 'marzo';
                case 4: return 'abril';
                case 5: return 'mayo';
                case 6: return 'junio';
                case 7: return 'julio';
                case 8: return 'agosto';
                case 9: return 'septiembre';
                case 10: return 'octubre';
                case 11: return 'noviembre';
                case 12: return 'diciembre';
            }

            return '';
        }//Unidades()

        //BLOQUE DE CONVERSIÓN MONTO EN LETRAS
        function Unidades(num) {
            switch (num) {
                case 1: return 'UN';
                case 2: return 'DOS';
                case 3: return 'TRES';
                case 4: return 'CUATRO';
                case 5: return 'CINCO';
                case 6: return 'SEIS';
                case 7: return 'SIETE';
                case 8: return 'OCHO';
                case 9: return 'NUEVE';
            }

            return '';
        }//Unidades()

        function Decenas(num) {
            var decena = Math.floor(num / 10);
            var unidad = num - (decena * 10);

            switch (decena) {
                case 1:
                    switch (unidad) {
                        case 0: return 'DIEZ';
                        case 1: return 'ONCE';
                        case 2: return 'DOCE';
                        case 3: return 'TRECE';
                        case 4: return 'CATORCE';
                        case 5: return 'QUINCE';
                        default: return 'DIECI' + Unidades(unidad);
                    }
                case 2:
                    switch (unidad) {
                        case 0: return 'VEINTE';
                        default: return 'VEINTI' + Unidades(unidad);
                    }
                case 3: return DecenasY('TREINTA', unidad);
                case 4: return DecenasY('CUARENTA', unidad);
                case 5: return DecenasY('CINCUENTA', unidad);
                case 6: return DecenasY('SESENTA', unidad);
                case 7: return DecenasY('SETENTA', unidad);
                case 8: return DecenasY('OCHENTA', unidad);
                case 9: return DecenasY('NOVENTA', unidad);
                case 0: return Unidades(unidad);
            }
        }//Unidades()

        function DecenasY(strSin, numUnidades) {
            if (numUnidades > 0) {
                return strSin + ' Y ' + Unidades(numUnidades)
            }
            return strSin;
        }//DecenasY()

        function Centenas(num) {
            var centenas = Math.floor(num / 100);
            var decenas = num - (centenas * 100);
            switch (centenas) {
                case 1:
                    if (decenas > 0) {
                        return 'CIENTO ' + Decenas(decenas);
                    }
                    return 'CIEN';
                case 2: return 'DOSCIENTOS ' + Decenas(decenas);
                case 3: return 'TRESCIENTOS ' + Decenas(decenas);
                case 4: return 'CUATROCIENTOS ' + Decenas(decenas);
                case 5: return 'QUINIENTOS ' + Decenas(decenas);
                case 6: return 'SEISCIENTOS ' + Decenas(decenas);
                case 7: return 'SETECIENTOS ' + Decenas(decenas);
                case 8: return 'OCHOCIENTOS ' + Decenas(decenas);
                case 9: return 'NOVECIENTOS ' + Decenas(decenas);
            }
            return Decenas(decenas);
        }//Centenas()

        function Seccion(num, divisor, strSingular, strPlural) {
            var cientos = Math.floor(num / divisor)
            var resto = num - (cientos * divisor)
            var letras = '';

            if (cientos > 0) {
                if (cientos > 1) {
                    letras = Centenas(cientos) + ' ' + strPlural;
                } else {
                    letras = strSingular;
                }
            }

            if (resto > 0) {
                letras += '';
            }
            return letras;
        }//Seccion()

        function Miles(num) {
            var divisor = 1000;
            var cientos = Math.floor(num / divisor)
            var resto = num - (cientos * divisor)

            var strMiles = Seccion(num, divisor, 'UN MIL', 'MIL');
            var strCentenas = Centenas(resto);

            if (strMiles == '') {
                return strCentenas;
            }
            return strMiles + ' ' + strCentenas;
        }//Miles()

        function Millones(num) {
            var divisor = 1000000;
            var cientos = Math.floor(num / divisor)
            var resto = num - (cientos * divisor)

            // var strMillones = Seccion(num, divisor, 'UN MILLON DE', 'MILLONES DE');
            var strMillones = Seccion(num, divisor, 'UN MILLON', 'MILLONES');
            var strMiles = Miles(resto);

            if (strMillones == '') {
                return strMiles;
            }
            return strMillones + ' ' + strMiles;
        }//Millones()

        function NumeroALetras(num) {
            var data = {
                numero: num,
                enteros: Math.floor(num),
                centavos: (((Math.round(num * 100)) - (Math.floor(num) * 100))),
                porcentaje: (((Math.round(num * 100)) - (Math.floor(num) * 100))) == 0 ? '0/100 ' : '/100 ',
                letrasCentavos: '',
            };

            if (data.enteros == 0) {
                return 'CERO ' + ' CON ' + data.centavos + data.porcentaje;
            } else {
                return Millones(data.enteros) + ' CON ' + data.centavos + data.porcentaje;
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
                            search.createColumn({
                                name: "custrecord_ht_ec_cuentabancaria",
                                summary: "GROUP",
                                label: "cuentabancaria"
                            }),

                        ]
                });

                var savedsearch = accountSearchObj.run().getRange(0, 1);
                if (savedsearch.length > 0) {
                    accountSearchObj.run().each(function (result) {
                        arr[0] = result.getValue(accountSearchObj.columns[0]);
                        arr[1] = result.getValue(accountSearchObj.columns[1]);
                        arr[2] = result.getValue(accountSearchObj.columns[2]);
                        return true;
                    });
                }
                return arr;
            } catch (error) {
                log.error('error', error);
            }
        }

        function ObtenerCuentaGastos(idCheque) {
            try {
                var recordLoad = record.load({ type: 'check', id: idCheque, isDynamic: false });
                let cuenta = recordLoad.getSublistValue({ sublistId: "expense", fieldId: "account", line: 0 });

                return cuenta;
            } catch (error) {
                log.error('error', error);
            }
        }

        function BuscarCuentaBolivariana(codigo) {
            try {
                var customrecord_for_bolSearchObj = search.create({
                    type: "customrecord_for_bol",
                    filters:
                        [
                            ["custrecord_cuenta_ban", "anyof", codigo]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", label: "ID interno" }),
                            search.createColumn({
                                name: "name",
                                sort: search.Sort.ASC,
                                label: "Nombre"
                            })
                        ]
                });

                var savedsearch = customrecord_for_bolSearchObj.run().getRange(0, 1);
                if (savedsearch.length > 0) {
                    return true;
                } else {
                    return false;
                }
            } catch (error) {
                log.error('error', error);
            }
        }

        return {
            onRequest
        };
    });