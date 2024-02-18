 <#setting locale="es">
<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
<head>
    <meta name="title" value="Impresion Certificado Instalacion"/>
    <macrolist>
        <macro id="nlheader">
            <table style="float: left; width: 50%; border: 0px">
                <tr>
                    <td style="border: 0px">
                        <img src="${record.imagen.R_General_cabecera}" style="float: left; width: 430px; height: 60px;" />
                        <!-- <img src="${record.imagen.R_General_cabecera}" style="float: left; width: 400px; height: 60px;" />  -->
                    </td>
                </tr>
            </table>
        </macro>
        <macro id="nlfooter">
            <table class="footer">
                <tr>
                    <td align="left"></td>
                    <td align="right"><b>Fecha Imp :    ${record.data.period}</b></td>
                </tr>
                <tr>
                    <td style="border: 0px" align="center" colspan="2">
                        <img src="${record.imagen.R_General_piePagina}" style="float: left; width: 430px; height: 20px;" />
                        <!-- <img src="${record.imagen.R_General_piePagina}" style="float: left; width: 400px; height: 60px;" />  -->
                    </td>
                </tr>
            </table>
        </macro>
    </macrolist>
    <style type="text/css">
        * {
            font-family: sans-serif;
        }

        p {
            font-size: 8px;
            text-align: center;
        }

        th, td {
            text-align: center;
            /*border: 1px solid #333333;*/
            font-size: 8px;
            padding: 5px;
        }

        .tabla {
            width: 100%;
            /*border: 1px solid #333333;*/
            border-collapse: collapse;
        }

        .tabla th {
            /*border: 1px solid #333333;*/
            font-size: 10px;
            padding: 5px;
        }

        .tabla td {
            /*border: 1px solid #333333;*/
            padding: 3px;
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

<body size="A5" header="nlheader" header-height="15%" footer="nlfooter" footer-height="10%" style="border: 4px double black;">
    <p align="right"><b> C.V. ${record.workOrder.custrecord_ht_ot_vehiculo}</b></p>   
    <p align="left">CONT. No.  ${record.workOrder.tranid}</p>       
    <p align="left">Certifica que el Sr.(a). <b>${record.customer.companyname}</b></p>
    <p align="left">Ha adquirido los siguientes sistemas:</p>

    <table class="tabla" style="border: 1px">
        <thead>
            <tr><td></td></tr>
            <tr>
                <td align="center"><b><u>PRODUCTO</u></b></td>
                <td align="center"><b><u>COBERTURA</u></b></td>
                <td align="center"><b><u>P.V.P + IVA</u></b></td>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td align="left">${record.workOrder.producto}</td>
                <td align="center">${record.cobertura.custrecord_ht_co_coberturafinal}</td>
                <td align="center">$ ${record.workOrder.total}</td>
            </tr>
            <tr><td></td></tr>
        </tbody>
    </table>

    <p align="left">Estos sistemas se encuentran instalados en el (Vehículo/Barco/Avión/Cajero) con las
        siguientes características :</p>

    <table class="tabla">
        <thead>
        </thead>
        <tbody>
            <tr><td></td></tr>
            <tr>
                <td align="left"><b>MARCA </b>: ${record.workOrder.custrecord_ht_ot_marca}</td>
                <td align="left"><b>AÑO  </b>: ${record.workOrder.anio}</td>
            </tr>
            <tr>
                <td align="left"><b>MODELO </b>: ${record.workOrder.custrecord_ht_ot_modelobien}</td>
                <td align="left"><b>PLACA </b>: ${record.workOrder.custrecord_ht_ot_placa}</td>
            </tr>
            <tr>
                <td align="left"><b>TIPO </b>: ${record.workOrder.custrecord_ht_ot_tipo}</td>
                <td align="left"><b>CHASIS </b>: ${record.workOrder.custrecord_ht_ot_chasis}</td>
            </tr>
            <tr>
                <td align="left"><b>COLOR </b>: ${record.workOrder.custrecord_ht_ot_color}</td>
                <td align="left"><b>MOTOR </b>: ${record.workOrder.custrecord_ht_ot_motor}</td>
            </tr>
            <tr><td></td></tr>
        </tbody>
    </table>

    <p><b>Funcionalidades disponibles en la aplicación</b></p>
</body>

</pdf>