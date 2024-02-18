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
            border: 1px solid #333333;
            font-size: 8px;
            padding: 5px;
        }

        .tabla {
            width: 100%;
            border: 1px solid #333333;
            border-collapse: collapse;
        }

        .tabla th {
            border: 1px solid #333333;
            font-size: 10px;
            padding: 5px;
        }

        .tabla td {
            border: 1px solid #333333;
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

<body header="nlheader"  footer="nlfooter" header-height="20%"  footer-height="6.5em" padding="1in 1in 1in 1in" size="A4">
    <h2 align="center" style="margin-bottom: 25px">CERTIFICADO DE INSTALACIÓN</h2>

    <p>La empresa ${record.subsidiary.legalname} certifica: </p>
    <p>Que el vehículo del propietario ${record.customer.companyname}, con la siguiente descripción:</p>

    <table class="tabla">
        <thead>
            <tr>
                <th align="center"><b>ITEM</b></th>
                <th align="center"><b>PLACA</b></th>
                <th align="center"><b>MARCA</b></th>
                <th align="center"><b>MODELO</b></th>
                <th align="center"><b>FECHA DE INSTALACIÓN</b></th>
                <th align="center"><b>FECHA DE CADUCIDAD</b></th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td align="center">1</td>
                <td align="center">${record.workOrder.custrecord_ht_ot_placa}</td>
                <td align="center">${record.workOrder.custrecord_ht_ot_marca}</td>
                <td align="center">${record.workOrder.custrecord_ht_ot_modelobien}</td>
                <td align="center">${record.cobertura.custrecord_ht_co_coberturainicialtext}</td>
                <td align="center">${record.cobertura.custrecord_ht_co_coberturafinaltext}</td>                    
            </tr>
        </tbody>
    </table>

    <p>Sírvase utilizar la presente para los fines que se crean pertinentes.</p>

    Atte.

    <p align="right">${record.location.name}, ${.now?string["dd"]} de ${.now?string["MMMM"]} del ${.now?string["yyyy"]}</p>
</body>

</pdf>