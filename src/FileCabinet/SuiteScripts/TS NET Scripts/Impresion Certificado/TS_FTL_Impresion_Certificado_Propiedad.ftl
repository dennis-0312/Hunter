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
                        <img src="${companyInformation.logoUrl}" style="float: left; width: 122.5px; height: 50px;" />
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
            font-size: 12px;
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

<body size="A5" header="nlheader" header-height="15%" style="border: 4px double black;">
    <p align="left">N° Orden: ${record.workOrder.tranid}</p>
    <h2 align="center">CERTIFICADO DE PROPIEDAD</h2>
    <p align="center" style="margin-bottom: 25px">Negociable</p>
    <p align="center">Certifica que el Sr.(a). <b>${record.customer.companyname}</b></p>
    <p align="left">Es propietario del sistema monitoreo Hunter, el mismo que se encuentra instalado en el vehículo de las siguientes características</p>
    <table class="tabla">
        <thead>
        </thead>
        <tbody>
            <tr>
                <td align="center">VEHICULO : ${record.workOrder.custrecord_ht_ot_vehiculo}</td>
            </tr>
            <tr>
                <td align="center">MARCA : ${record.workOrder.custrecord_ht_ot_marca}</td>
            </tr>
            <tr>
                <td align="center">MODELO : ${record.workOrder.custrecord_ht_ot_modelobien}</td>
            </tr>
            <tr>
                <td align="center">TIPO : ${record.workOrder.custrecord_ht_ot_tipo}</td>
            </tr>
            <tr>
                <td align="center">AÑO  : ${record.workOrder.anio}</td>
            </tr>
            <tr>
                <td align="center">COLOR : ${record.workOrder.custrecord_ht_ot_color}</td>
            </tr>
            <tr>
                <td align="center">MOTOR : ${record.workOrder.custrecord_ht_ot_motor}</td>
            </tr>
            <tr>
                <td align="center">SERIE : ${record.workOrder.custrecord_ht_ot_serieproductoasignacion}</td>
            </tr>
            <tr>
                <td align="center">CHASIS : ${record.workOrder.custrecord_ht_ot_chasis}</td>
            </tr>
            <tr>
                <td align="center">PLACA : ${record.workOrder.custrecord_ht_ot_placa}</td>
            </tr>
            <tr>
                <td align="center">COBERTURA : ${record.cobertura.custrecord_ht_co_coberturainicial} AL ${record.cobertura.custrecord_ht_co_coberturafinal}</td>
            </tr>
            
        </tbody>
    </table>

    <p>Sírvase utilizar la presente para los fines que se crean pertinentes.</p>
    <p align="right">${record.location.name}, ${.now?string["dd"]} de ${.now?string["MMMM"]} del ${.now?string["yyyy"]}</p>

</body>

</pdf>