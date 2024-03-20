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

        .tablacheque {
            width: 100%;
            border: 0px solid #333333;
            border-collapse: collapse;
            padding: 25mm 0mm 0mm 0mm;
        }

        .tablacheque td {
            border: 0.0mm solid #333333;
            padding: 1mm 0mm 0mm 0mm;
        }  
    </style>
</head>

<body padding="0in 0in 0in 0in" size="A4">
    
    <table class="tablacheque" >
        <thead>
            <tr>
                <td align="center"></td>
                <td align="center"></td>
                <td align="left"></td>
                <td align="left"></td>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td align="left" width="33.80%"></td>
                <td align="left" width="66.20%" colspan="4"></td>
            </tr>
            <tr>
                <td align="left" width="33.80%"></td>
                <td align="left" width="7.14%"></td>
                <td align="left" width="1.90%"></td>
                <td align="left" width="42.38%">${record.vendoPayment.beneficiario}</td>
                <td align="left" width="14.78%">${record.vendoPayment.montoTotal}</td>
            </tr>
            <tr>
                <td align="left" width="33.80%"></td>
                <td align="left" width="66.20%" colspan="4"></td>
            </tr>
            <tr>
                <td align="left" width="33.80%"></td>
                <td align="left" width="66.20%" colspan="4"></td>
            </tr>
            <tr>
                <td align="left" width="33.80%"></td>
                <td align="left" width="66.20%" colspan="4"></td>
            </tr>
            <tr>
                <td align="left" width="33.80%"></td>
                <td align="left" width="66.20%" colspan="4"></td>
            </tr>
            <tr>
                <td align="left" width="33.80%"></td>
                <td align="left" width="66.20%" colspan="4"></td>
            </tr>
            <tr>
                <td align="left" width="33.80%"></td>
                <td align="left" width="66.20%" colspan="4"></td>
            </tr>
            <tr>
                <td align="left" width="33.80%"></td>
                <td align="left" width="66.20%" colspan="4"></td>
            </tr>
            <tr>
                <td align="left" width="33.80%"></td>
                <td align="left" width="7.14%"></td>
                <td align="left" width="59.06%" colspan="3">${record.vendoPayment.total}</td>
            </tr>
            <tr>
                <td align="left" width="33.80%"></td>
                <td align="left" width="66.20%" colspan="4"></td>
            </tr>
            <tr>
                <td align="left" width="33.80%"></td>
                <td align="left" width="66.20%" colspan="4"></td>
            </tr>
            <tr>
                <td align="left" width="33.80%"></td>
                <td align="left" width="66.20%" colspan="4">${record.vendoPayment.fechaUbica}</td>
            </tr>
        </tbody>
    </table>

    <table class="tabla" padding="4in 1in 0.1in 1in">
        <thead>
        </thead>
        <tbody>
            <tr>
                <td width="37%" align="left" colspan="4"><p></p></td>
                <td width="63%" align="left" colspan="9">${record.vendoPayment.sucursal}</td>
            </tr>
            <tr>
                <td align="left" colspan="4">            </td>
                <td align="left" colspan="2">${record.vendoPayment.beneficiario}</td>
                <td align="left" colspan="1"></td>
                <td align="left" colspan="4">            </td>
                <td align="left" colspan="2">${record.vendoPayment.ruc}</td>
            </tr>
            <tr>
                <td align="left" colspan="4">            </td>
                <td align="left" colspan="9">${record.vendoPayment.fecha}</td>
            </tr>
            <tr>
                <td align="left" colspan="4">            </td>
                <td align="left" colspan="9">${record.vendoPayment.cheque}</td>
            </tr>
            <tr>
                <td align="left" colspan="4">            </td>
                <td align="left" colspan="9">${record.vendoPayment.nombreCredito}</td>
            </tr>
            <tr>
                <td align="left" colspan="4">            </td>
                <td align="left" colspan="9">${record.vendoPayment.numCuenta}</td>
            </tr>
            <tr>
                <td align="left" colspan="4">            </td>
                <td align="left" colspan="9">${record.vendoPayment.memo}</td>
            </tr>
            <tr>
            </tr>
        </tbody>
    </table>

    <table class="tabla" padding="0.1in 1in 0.1in 1in" >
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
    <table class="tabla" padding="0.1in 1in 0.1in 1in" >
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