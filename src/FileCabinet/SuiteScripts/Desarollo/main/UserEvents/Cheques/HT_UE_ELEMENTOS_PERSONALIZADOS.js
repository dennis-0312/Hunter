/********************************************************************************************************************************************************
This script for Invoice, Cash Sale, Credit Memo and Vendor Bill (Evento para generar serie, correlativo y seteo de campos obligatorios) 
/******************************************************************************************************************************************************** 
File Name: HT_UE_ELEMENTOS_PERSONALIZADOS.js                                                                        
Commit: 01                                                        
Version: 1.0                                                                     
Date: 06/03/2024
ApiVersion: Script 2.1
Enviroment: SANDBOX
Governance points: N/A
========================================================================================================================================================*/
/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/log',
    'N/search',
    'N/record',
    'N/runtime',
    'N/redirect',
    'N/url',
    'N/https',
    'N/task',
    'N/query',
    'N/error',
], (log, search, record, runtime, redirect, url, https, task, query, err) => {
    const INVOICE = 'invoice';
    const CREDIT_MEMO = 'creditmemo';
    const VENDOR_BILL = 'vendorbill';
    const BILL_CREDIT = 'vendorcredit';
    const EJECUCION_PEDIDO_ARTICULO = 'itemfulfillment';
    const SERVICE_ORDER = 'salesorder'
    const DOCUMENT_TYPE_FACTURA = 4; //Factura
    const DOCUMENT_TYPE_GUIA_REMISION = 3; //Factura
    const DOCUMENT_TYPE_LIQUIDACION_COMPRA = 10;
    const DOCUMENT_TYPE_COMPROBANTE_RETENCION = 11;
    const DOCUMENT_TYPE_CREDIT_MEMO = 1; // Nota de Crédito
    const PE_FEL_Sending_Method = 4; //SB: 5 / PR: 4
    const PE_FEL_Sending_Method_nc = 4; //SB: 6 / PR: 4
    const PE_Invoice_FEL_Template = 1;
    const PE_Credit_Memo_FEL_Template = 1;
    const PE_Liquidacion_Compra_FEL_Template = 1;
    const PE_Liquidacion_Compra_FEL_Sending = 4;
    const PE_Comprobante_Retencion_FEL_Template = 1;
    const PE_Comprobante_Retencion_FEL_Sending = 4;
    const PE_Guia_De_Remision_FEL_Template = 2;
    const PE_Guia_De_Remision_FEL_Sendings = 5;
    const For_Generation_Status = 1;
    const FORM_NOTA_CREDITO_COMPRA = 104;
    const ITEM = 'item';
    const DOCUMENT_TYPE_REEMBOLSO = 23; // Reembolso
    const DOCUMENT_TYPE_UNICO_EXPORTACION = 15;
    const DOCUMENT_TYPE_VENTA_EXTERIOR = 14;
    let doctype = 0;
    let prefix = '';

    
    let Transaction = {
        SALES_ORDER: 'salesorder',
        INVOICE: 'invoice',
        ASSEMBLY_ORDER: 'workorder',
        ASSEMBLY_BUILD: 'assemblybuild',
        BIN: 'bin',
        VENDOR_PAYMENT: 'vendorpayment',
        CHECK: 'check',
        VENDOR_BILL: 'vendorbill',
        TRANSFER_ORDER: 'transferorder',
        VENDOR_PRE_PAYMENT: 'vendorprepayment'
    }

    let _constant = {
        Transaction: Transaction
    }

    const beforeLoad = (context) => {
        const eventType = context.type;
        if (eventType === context.UserEventType.VIEW) {
            let objRecord = context.newRecord;
            let autorizacion = objRecord.getText({ fieldId: 'custbodyts_ec_num_autorizacion' });
            if (autorizacion) {
                var form = context.form;
                //form.removeButton('edit');
                //form.removeButton('custpage_generate_ei_button');
            }
            if (objRecord.type == _constant.Transaction.VENDOR_PAYMENT || objRecord.type == _constant.Transaction.CHECK || objRecord.type == _constant.Transaction.VENDOR_PRE_PAYMENT) {
                let forms = context.form;
                imprimirComprobante(forms, objRecord);
                forms.clientScriptModulePath = '/SuiteScripts/Desarollo/main/ClientScripts/Cheques/HT_CS_ImprimeComprobanteCheque.js'
            }

            try {
                if (!objRecord.getText({ fieldId: 'tranid' }) && objRecord.type == VENDOR_BILL) {
                    log.debug('SetTranid', 'Set');
                    objRecord = record.load({ type: VENDOR_BILL, id: objRecord.id, isDynamic: true });
                    setTranid(objRecord);
                    objRecord.save();
                }
            } catch (error) { }
        }
    }

    const beforeSubmit = (context) => { }

    const afterSubmit = (context) => { }

    const imprimirComprobante = (form, objRecord) => {
        var tipo = '';
        if (objRecord.type == _constant.Transaction.CHECK) {
            tipo = 'cheque';
        }

        var id = objRecord.id;
        const printPagotest = `printPagotest('${id}','${tipo}')`;
        form.addButton({ id: 'custpage_btn_print_pago_test', label: 'Impresion Comprobante', functionName: printPagotest });
    }

    //?BLOQUE DE CONVERSIÓN MONTO EN LETRAS================================================================================================================================================================================================
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


    function NumeroALetras(num, currency) {
        currency = currency || {};
        var data = {
            numero: num,
            enteros: Math.floor(num),
            centavos: (((Math.round(num * 100)) - (Math.floor(num) * 100))),
            letrasCentavos: '',
            letrasMonedaPlural: currency.plural || 'DOLARES',//'PESOS', 'Dólares', 'Bolívares', 'etcs'
            letrasMonedaSingular: currency.singular || 'DOLAR', //'PESO', 'Dólar', 'Bolivar', 'etc'
            letrasMonedaCentavoPlural: currency.centPlural || 'CENTAVOS',
            letrasMonedaCentavoSingular: currency.centSingular || 'CENTAVO'
        };

        if (data.centavos > 0) {
            data.letrasCentavos = 'CON ' + (function () {
                if (data.centavos == 1)
                    return Millones(data.centavos) + ' ' + data.letrasMonedaCentavoSingular;
                else
                    return Millones(data.centavos) + ' ' + data.letrasMonedaCentavoPlural;
            })();
        };

        if (data.enteros == 0)
            return 'CERO ' + data.letrasMonedaPlural + ' ' + data.letrasCentavos;
        if (data.enteros == 1)
            return Millones(data.enteros) + ' ' + data.letrasMonedaSingular + ' ' + data.letrasCentavos;
        else
            return Millones(data.enteros) + ' ' + data.letrasMonedaPlural + ' ' + data.letrasCentavos;
    }



    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
/***************************************************************************************************************
TRACKING
/***************************************************************************************************************
/* Commit:01
Version: 1.0
Date: 06/03/2024
Author: BL
Description: Creación del script para impresion personaliazada de cheques
*/
