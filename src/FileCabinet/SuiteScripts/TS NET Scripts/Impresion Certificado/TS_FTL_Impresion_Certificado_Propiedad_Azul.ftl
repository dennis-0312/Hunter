 <#setting locale="es">
<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
<head>
    <meta name="title" value="Impresion Certificado Instalacion"/>
    <macrolist>
        <macro id="nlheader">
            <table style=" width: 100%; border: 0px">
                <tr>
                    <td style="border: 0px" align="left">
                        <img src="${record.imagen.A_Carsec}" style=" width: 122.5px; height: 50px;" />
                    </td>
                    <td style="border: 0px" align="center">
                       
                    </td>
                    <td style="border: 0px" align="right">
                        <img src="${record.imagen.A_Hunter_Monitoreo}" style=" width: 122.5px; height: 50px;" />
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

<body size="A5" header="nlheader" header-height="10%" style="border: 4px double black;">
    <p align="left">N° Orden: <b>${record.workOrder.tranid}</b></p>
    <h2 align="center">Certificado de propiedad</h2>
    <p align="center" style="margin-bottom: 25px">Negociable</p>
    <p align="center"><em>Certifica que el Sr.(a). <b>${record.customer.companyname}</b></em></p>
    <p align="left"><em>Es propietario del sistema monitoreo Hunter, el mismo que se encuentra instalado en el vehículo de las siguientes características</em></p>
    <table class="tabla">
        <thead>
        </thead>
        <tbody>
            <tr>
                <td></td>
                <td align="left"><b>VEHICULO</b></td>
                <td align="center">:</td>
                <td align="left">${record.workOrder.custrecord_ht_ot_vehiculo}</td>
                <td></td>
            </tr>
            <tr>
                <td></td>
                <td align="left"><b>MARCA</b></td>
                <td align="center">:</td>
                <td align="left">${record.workOrder.custrecord_ht_ot_marca}</td>
                <td></td>
            </tr>
            <tr>
                <td></td>
                <td align="left"><b>MODELO</b></td>
                <td align="center">:</td>
                <td align="left">${record.workOrder.custrecord_ht_ot_modelobien}</td>
                <td></td>
            </tr>
            <tr>
                <td></td>
                <td align="left"><b>TIPO</b></td>
                <td align="center">:</td>
                <td align="left">${record.workOrder.custrecord_ht_ot_tipo}</td>
                <td></td>
            </tr>
            <tr>
                <td></td>
                <td align="left"><b>AÑO</b></td>
                <td align="center">:</td>
                <td align="left">${record.workOrder.anio}</td>
                <td></td>
            </tr>
            <tr>
                <td></td>
                <td align="left"><b>COLOR</b></td>
                <td align="center">:</td>
                <td align="left">${record.workOrder.custrecord_ht_ot_color}</td>
                <td></td>
            </tr>
            <tr>
                <td></td>
                <td align="left"><b>MOTOR</b></td>
                <td align="center">:</td>
                <td align="left">${record.workOrder.custrecord_ht_ot_motor}</td>
                <td></td>
            </tr>
            <tr>
                <td></td>
                <td align="left"><b>SERIE</b></td>
                <td align="center">:</td>
                <td align="left">${record.workOrder.custrecord_ht_ot_serieproductoasignacion}</td>
                <td></td>
            </tr>
            <tr>
                <td></td>
                <td align="left"><b>PLACA</b></td>
                <td align="center">:</td>
                <td align="left">${record.workOrder.custrecord_ht_ot_placa}</td>
                <td></td>
            </tr>
            <tr>
                <td></td>
                <td align="left"><b>COBERTURA</b></td>
                <td align="center">:</td>
                <td align="left">${record.cobertura.custrecord_ht_co_coberturainicial} AL ${record.cobertura.custrecord_ht_co_coberturafinal}</td>
                <td></td>
            </tr>
            
        </tbody>
    </table>

</body>

</pdf>