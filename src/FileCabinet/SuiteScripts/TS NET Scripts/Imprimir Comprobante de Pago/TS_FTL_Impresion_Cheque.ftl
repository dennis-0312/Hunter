<#setting locale="es">
<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
<head>
    <meta name="title" value="Impresion Comprobante de Pago"/>
    <macrolist>
        <macro id="nlheader">

        </macro>
    </macrolist>
    <style type="text/css">
        * {
            font-family: sans-serif;
        }

        p {
            font-size: 10px;
            text-align: center;
        }

        th, td {
            text-align: center;
            border: 0px solid #333333;
            font-size: 5px;
            padding: 5px;
        }

        .tabla {
            width: 100%;
            border: 0px solid #333333;
            border-collapse: collapse;
        }

        .tabla th {
            border: 0px solid #333333;
            font-size: 10px;
            padding: 5px;
        }

        .tabla td {
            border: 0px solid #333333;
            padding: 5px;
        }    

        .miTabla {
            border: 1px solid #333333;
            width: 100%;
            font-size: 9pt;
            table-layout: fixed;
            margin-bottom: 20px;
        }

    </style>
</head>

<body header="nlheader" header-height="10%"  padding="1in 1in 1in 1in" size="A4">
    
    <table class="tabla" >
        <thead>
            <tr>
                <td align="left" rowspan="2" colspan="2"></td>
            </tr>
            <tr>
                <td align="center"></td>
                <td align="center"></td>
                <td align="right"></td>
                <td align="left" colspan="2"></td>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td align="left"></td>
                <td align="center" colspan="4"></td>
                <td align="right"></td>
                <td align="right">${record.vendoPayment.montoTotal}</td>
            </tr>
            <tr>
                <td align="left"></td>
                <td align="center" colspan="4"></td>
                <td align="right"></td>
                <td align="right"></td>
            </tr>
            <tr>
                <td align="left"></td>
                <td align="center" colspan="4"></td>
                <td align="right"></td>
                <td align="right"></td>
            </tr>
            <tr>
                <td align="left"></td>
                <td align="center" colspan="4">${record.vendoPayment.beneficiario}</td>
                <td align="right"></td>
                <td align="right"></td>
            </tr>
            <tr>
                <td align="left"></td>
                <td align="center" colspan="5">${record.vendoPayment.total}</td>
                <td align="right"></td>
            </tr>
            <tr>
                <td align="center" colspan="7"></td>
            </tr>
            <tr>
                <td align="center" colspan="7"></td>
            </tr>
            <tr>
                <td align="center" colspan="3">
                    ${record.vendoPayment.fechaUbica}
                </td>
                <td align="center"></td>
                <td align="center" colspan="3"></td>
            </tr>
            <tr>
                <td align="center" colspan="3"></td>
                <td align="center"></td>
                <td align="center" colspan="3"></td>
            </tr>
            <tr>
                <td align="center" colspan="3"></td>
                <td align="center"></td>
                <td align="center" colspan="3"></td>
            </tr>
            <tr>
                <td align="center" colspan="3"></td>
                <td align="center"></td>
                <td align="center" colspan="3"></td>
            </tr>
            <tr>
                <td align="center" colspan="3"></td>
                <td align="center"></td>
                <td align="center" colspan="3"></td>
            </tr>
            <tr>
                <td align="center" colspan="3"></td>
                <td align="center"></td>
                <td align="center" colspan="3"></td>
            </tr>
            <tr>
                <td align="center" colspan="3"></td>
                <td align="center"></td>
                <td align="center" colspan="3"></td>
            </tr>
            <tr>
                <td align="center" colspan="3"></td>
                <td align="center"></td>
                <td align="center" colspan="3"></td>
            </tr>
            <tr>
                <td align="center" colspan="3"></td>
                <td align="center"></td>
                <td align="center" colspan="3"></td>
            </tr>
            <tr>
                <td align="center" colspan="3"></td>
                <td align="center"></td>
                <td align="center" colspan="3"></td>
            </tr>
            <tr>
                <td align="center" colspan="3"></td>
                <td align="center"></td>
                <td align="center" colspan="3"></td>
            </tr>
            <tr>
                <td align="center" colspan="3"></td>
                <td align="center"></td>
                <td align="center" colspan="3"></td>
            </tr>
            <tr>
                <td align="center" colspan="3"></td>
                <td align="center"></td>
                <td align="center" colspan="3"></td>
            </tr>
            <tr>
                <td align="center" colspan="3"></td>
                <td align="center"></td>
                <td align="center" colspan="3"></td>
            </tr>
            <tr>
                <td align="center" colspan="3"></td>
                <td align="center"></td>
                <td align="center" colspan="3"></td>
            </tr>
            <tr>
                <td align="center" colspan="3"></td>
                <td align="center"></td>
                <td align="center" colspan="3"></td>
            </tr>
            <tr>
                <td align="center" colspan="3"></td>
                <td align="center"></td>
                <td align="center" colspan="3"></td>
            </tr>
            <tr>
                <td align="center" colspan="3"></td>
                <td align="center"></td>
                <td align="center" colspan="3"></td>
            </tr>
            <tr>
                <td align="center" colspan="3"></td>
                <td align="center"></td>
                <td align="center" colspan="3"></td>
            </tr>
            <tr>
                <td align="center" colspan="3"></td>
                <td align="center"></td>
                <td align="center" colspan="3"></td>
            </tr>
            <tr>
                <td align="center" colspan="3"></td>
                <td align="center"></td>
                <td align="center" colspan="3"></td>
            </tr>
            <tr>
                <td align="center" colspan="3"></td>
                <td align="center"></td>
                <td align="center" colspan="3"></td>
            </tr>
            <tr>
                <td align="center" colspan="3"></td>
                <td align="center"></td>
                <td align="center" colspan="3"></td>
            </tr>
            <tr>
                <td align="center" colspan="3"></td>
                <td align="center"></td>
                <td align="center" colspan="3"></td>
            </tr>
            <tr>
                <td align="center" colspan="3"></td>
                <td align="center"></td>
                <td align="center" colspan="3"></td>
            </tr>
            <tr>
                <td align="center" colspan="3"></td>
                <td align="center"></td>
                <td align="center" colspan="3"></td>
            </tr>
        </tbody>
    </table>

    <table class="tabla" >
        <thead>
        </thead>
        <tbody>
            <tr>
                <td align="left" colspan="1"> SUCURSAL:</td>
                <td align="left" colspan="4">${record.vendoPayment.sucursal}</td>
            </tr>
            <tr>
                <td align="left" colspan="1">BENEFICIARIO:</td>
                <td align="left" colspan="4">${record.vendoPayment.beneficiario}</td>
            </tr>
            <tr>
                <td align="left" colspan="1">RUC:</td>
                <td align="left" colspan="4">${record.vendoPayment.ruc}</td>
            </tr>
            <tr>
                <td align="left" colspan="1">FECHA:</td>
                <td align="left" colspan="4">${record.vendoPayment.fecha}</td>
            </tr>
            <tr>
                <td align="left" colspan="1">CHEQUE Nro.:</td>
                <td align="left" colspan="4">${record.vendoPayment.cheque}</td>
            </tr>
            <tr>
                <td align="left" colspan="1">CONCEPTO:</td>
                <td align="left" colspan="4">${record.vendoPayment.memo}</td>
            </tr>
        </tbody>
    </table>

    <table class="tabla" >
        <thead>
            <tr style="border: 1px;">
                <td align="left" colspan="1"> Codigo </td>
                <td align="center" colspan="2"> Descripcion </td>
                <td align="center" colspan="2"></td>
                <td align="center" colspan="1"> Debe </td>
                <td align="center" colspan="1"> Haber </td>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td align="left" colspan="1">${record.vendoPayment.numeroCredito}</td>
                <td align="left" colspan="2">${record.vendoPayment.nombreCredito}</td>
                <td align="center" colspan="2"></td>
                <td align="center" colspan="1"></td>
                <td align="center" colspan="1">${record.vendoPayment.montoImpacto}</td>
            </tr>
            <tr>
                <td align="left" colspan="1">${record.vendoPayment.numeroDebito}</td>
                <td align="left" colspan="2">${record.vendoPayment.nombreDebito}</td>
                <td align="center" colspan="2"></td>
                <td align="center" colspan="1">${record.vendoPayment.montoImpacto}</td>
                <td align="center" colspan="1"></td>
            </tr>
            <tr>
                <td align="center" colspan="7"></td>
            </tr><tr>
                <td align="center" colspan="7"></td>
            </tr><tr>
                <td align="center" colspan="7"></td>
            </tr><tr>
                <td align="center" colspan="7"></td>
            </tr><tr>
                <td align="center" colspan="7"></td>
            </tr><tr>
                <td align="center" colspan="7"></td>
            </tr><tr>
                <td align="center" colspan="5"></td>
                <td align="center" colspan="1">${record.vendoPayment.montoImpacto}</td>
                <td align="center" colspan="1">${record.vendoPayment.montoImpacto}</td>
            </tr>
        </tbody>
    </table>
    <table class="tabla" >
        <thead>
        </thead>
        <tbody>
            <tr>
                <td align="center" colspan="8"></td>
            </tr>
            <tr>
                <td align="center" colspan="8"></td>
            </tr>
            <tr>
                <td align="center" colspan="8"></td>
            </tr>
            <tr>
                <td align="center" colspan="2"></td>
                <td align="center" colspan="1"></td>
                <td align="center" colspan="2"></td>
                <td align="center" colspan="1"></td>
                <td align="center" colspan="2">${record.vendoPayment.beneficiario}</td>
            </tr>
            <tr>
                <td align="center" style="border-bottom: solid;" colspan="2"></td>
                <td align="center" colspan="1"></td>
                <td align="center" style="border-bottom: solid;" colspan="2"></td>
                <td align="center" colspan="1"></td>
                <td align="center" style="border-bottom: solid;" colspan="2"></td>
            </tr>
            <tr>
                <td align="center" colspan="2">ELABORADO POR:</td>
                <td align="center" colspan="1"></td>
                <td align="center" colspan="2">APROBADO POR:</td>
                <td align="center" colspan="1"></td>
                <td align="center" colspan="2">BENEFICIARIO:</td>
            </tr>
        </tbody>
    </table>
</body>

</pdf>