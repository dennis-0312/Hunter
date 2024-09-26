/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */

define(['N/search'], function(search) {

    /**
     * 
     * @param {*} FormType 
     * @param {*} FormID 
     * @returns Lista correspondiente al impacto GL del registro coincidente (id - type)
     */
    function ExtraerImpactoGL(FormType, FormID){
        try{                
            var glImpactSearch = search.create({
                type: FormType,
                filters: [
                    ["internalid", "anyof", FormID],
                    /*"AND", 
                    ["posting", "is", "T"], // Solo transacciones que afectan el GL
                    //Deshabilitado - Requieren para archivos con aprovación pendiente
                    */
                ],
                columns: [
                    search.createColumn({name: 'account'}),
                    search.createColumn({name: 'debitamount'}),
                    search.createColumn({name: 'creditamount'}),
                    search.createColumn({name: 'memo'})
                ]
            });

            var searchResults = glImpactSearch.run().getRange({start: 0, end: 100});

            var responseData = searchResults.map(function(result) {
                var cuenta = CuentaNombreNumero(result.getValue({name: 'account'}))
                return {
                    name: EscapeXml(cuenta[0]),
                    account: cuenta[1] != "- None -" ? cuenta[1] : "",
                    debit: result.getValue({name: 'debitamount'}),
                    credit: result.getValue({name: 'creditamount'}),
                    memo: EscapeXml(result.getValue({name: 'memo'}))
                };
            });
            return responseData;
        }
        catch (errorGL) {
            log.error('extraerImpactoGL', errorGL);
        }
    }

    // Función para escapar caracteres especiales para XML
    function EscapeXml(texto) {
        return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
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


    function ObtNombreTransaccionIngEsp(texto) {
        const cuentas = {
            "inventoryadjustment": "Ajuste de Inventario",
            "depositapplication": "Aplicación de Depósito",
            "vendorprepaymentapplication": "Aplicación de Anticipo de Proveedor",
            "journalentry": "Asiento",
            "customtransaction_fam_leaseproposal": "Arrendamiento",
            "vendorreturnauthorization": "Autorización de Devolución de Proveedor",
            "inventorystatuschange": "Cambio de Estado de Inventario",
            "check": "Cheque",
            "vendorcredit": "Crédito de Factura",
            "deposit": "Depósito",
            "customerdeposit": "Depósito de Cliente",
            "assemblyunbuild": "Desensamblar",
            "itemfulfillment": "Ejecución de orden de artículo",
            "assemblybuild": "Ensamblar",
            "customtransaction_fam_depr_jrn": "Entrada de depreciación de activos fijos",
            "customtransaction_fam_disp_jrn": "Entrada de enajenación de activos fijos",
            "estimate": "Estimación",
            "vendorbill": "Factura",
            "invoice": "Factura de venta",
            "expensereport": "Informe de gastos",
            "creditmemo": "Nota de crédito",
            "opportunity": "Oportunidad",
            "purchaseorder": "Orden de compra",
            "customtransaction_orden_pago": "Orden de Pago",
            "salesorder": "Orden de Servicio",
            "workorder": "Orden de Trabajo",
            "transferorder": "Orden de Traslado",
            "vendorprepayment": "Pago Anticipado de Proveedor",
            "vendorpayment": "Pago de Factura",
            "itemreceipt": "Recibo de Artículo",
            "inventorycount": "Recuento de Inventario",
            "creditcardrefund": "Registro con tarjeta de crédito",
            "fxreval": "Revaluación de Moneda Extranjera",
            "purchaserequisition": "Solicitud",
            "vendorrequestforquote": "Respuesta de solicitud de cotización",
            "requestforquote": "Solicitud de cotización",
            "creditcardcharge": "Transacción con tarjeta de crédito",
            "transfer": "Transferencias",
            "bintransfer": "Traslado al depósito",
            "inventorytransfer": "Traslado de Inventario",
        };
        return cuentas[texto] || '';
    }

    /**
     * @param {Number} num 
     * @returns Numero en Letras para Cheques
     */
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

    return {
        NumeroALetras,
        EscapeXml,
        ExtraerImpactoGL,
        ObtNombreTransaccionIngEsp
    };
});