 <#setting locale="es">
<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
<head>
    <meta name="title" value="Impresion Certificado Instalacion"/>
    <macrolist>
        <macro id="nlheader">
            <table>
                <tr>
                    <td style="border: 0px" align="center">
                        <img src="${record.imagen.R_Ambarca_cabecera}" style="float: left; width: 430px; height: 40px;" />
                    </td>
                </tr>
            </table>
        </macro>
        <macro id="nlfooter">
            <table class="footer">
                <tr>
                    <td align="right"><b>Info Emisión Docto :  ${.now?string["dd"]} de ${.now?string["MMMM"]} ${.now?string["yyyy"]}</b></td>
                </tr>
            </table>
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

<body size="A5" header="nlheader" header-height="10%" footer="nlfooter" footer-height="10%" style="border: 4px double black;">    <h2 align="center" style="font-size: 12px"><mark>CERTIFICADO DE VENTA</mark></h2>
    <p align="right"><b> C.V. ${record.workOrder.custrecord_ht_ot_vehiculo}</b></p>
    <p align="center">Certificamos que el Sr./Sra./Emp <b>${record.customer.companyname}</b></p>
    <p align="left">Ha adquirido los siguientes sistemas:</p>

    <table class="tabla">
        <thead>
            <tr><td></td></tr>
            <tr>
                <td align="center"><b><u>PRODUCTO</u></b></td>
                <td align="center"><b><u>COBERTURA</u></b></td>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td align="left">${record.workOrder.producto}</td>
                <td align="center">${record.cobertura.custrecord_ht_co_coberturafinal}</td>
            </tr>
            <tr><td></td></tr>
        </tbody>
    </table>

    <p align="left">En el vehículo con las siguientes características:</p>

    <table class="tabla">
        <thead>
        </thead>
        <tbody>
            <tr>
                <td align="left">PLACA : ${record.workOrder.custrecord_ht_ot_placa}</td>
                <td align="left">COLOR : ${record.workOrder.custrecord_ht_ot_color}</td>
            </tr>
            <tr>
                <td align="left">MARCA : ${record.workOrder.custrecord_ht_ot_marca}</td>
                <td align="left">AÑO  : ${record.workOrder.anio}</td>
            </tr>
            <tr>
                <td align="left">MODELO : ${record.workOrder.custrecord_ht_ot_modelobien}</td>
                <td align="left">MOTOR : ${record.workOrder.custrecord_ht_ot_motor}</td>
            </tr>
            <tr>
                <td align="left">TIPO : ${record.workOrder.custrecord_ht_ot_tipo}</td>
                <td align="left">CHASIS : ${record.workOrder.custrecord_ht_ot_chasis}</td>
            </tr>
        </tbody>
    </table>

</body>

</pdf>