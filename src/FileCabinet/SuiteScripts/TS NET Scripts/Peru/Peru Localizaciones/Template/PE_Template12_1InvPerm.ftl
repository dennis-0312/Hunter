<#assign data = input.data?eval >
<#assign company = data.company >
<#assign total = data.total >
<#assign movements = data.movements >
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
   <head>
      <meta name="title" value="Formato 12.1" />
      <macrolist>
         <macro id = "cabecera">
            <table width="100%">
               <tr>
                  <td colspan="4" width="100%" align="center"><b>FORMATO 12.1: "REGISTRO DEL INVENTARIO PERMANENTE EN UNIDADES FÍSICAS- DETALLE DEL INVENTARIO PERMANENTE EN UNIDADES FÍSICAS"</b></td>
               </tr>
                <tr>
                    <td width="50%" align="left"><b>PERIODO</b></td>
                    <td width="5%" align="right"><b>:</b></td>
                    <td width="30%" align="left">${company.secondTitle}</td>
                    <td width="15%" align="left"></td>
               </tr>
                <tr>
                    <td width="50%" align="left"><b>RUC</b></td>
                    <td width="5%" align="right"><b>:</b></td>
                    <td width="30%" align="left">${company.thirdTitle}</td>
                    <td width="15%" align="left"></td>
               </tr>
                <tr>
                    <td width="50%" align="left"><b>APELLIDOS Y NOMBRES, DENOMINACION O RAZON SOCIAL</b></td>
                    <td width="5%" align="right"><b>:</b></td>
                    <td width="30%" align="left">${company.fourthTitle}</td>
                    <td width="15%" align="left"></td>
               </tr>
                <tr>
                    <td width="50%" align="left"><b>ESTABLECIMIENTO (1)</b></td>
                    <td width="5%" align="right"><b>:</b></td>
                    <td width="30%" align="left">9999</td>
                    <td width="15%" align="left"></td>
               </tr>
                <tr>
                    <td width="50%" align="left"><b>CÓDIGO DE LA EXISTENCIA</b></td>
                    <td width="5%" align="right"><b>:</b></td>
                    <td width="30%" align="left">01</td>
                    <td width="15%" align="left"></td>
               </tr>
                <tr>
                    <td width="50%" align="left"><b>TIPO (TABLA 5)</b></td>
                    <td width="5%" align="right"><b>:</b></td>
                    <td width="30%" align="left">MERCADERÍAS</td>
                    <td width="15%" align="left"></td>
               </tr>
                <tr>
                    <td width="50%" align="left"><b>DESCRIPCIÓN</b></td>
                    <td width="5%" align="right"><b>:</b></td>
                    <td width="30%" align="left">MERCADERÍAS</td>
                    <td width="15%" align="left"></td>
               </tr>
                <tr>
                    <td width="50%" align="left"><b>CÓDIGO DE LA UNIDAD DE MEDIDA (TABLA 6)</b></td>
                    <td width="5%" align="right"><b>:</b></td>
                    <td width="30%" align="left"></td>
                    <td width="15%" align="left"></td>
               </tr>
            </table>
         </macro>
      </macrolist>
   </head>
    <body background-color="white" font-size="8" size="A4-landscape" header = "cabecera" header-height="50mm" footer-height="10mm">
        <table style="font-family: Verdana, Arial, Helvetica, sans-serif; width:100%" >
            <tr>
                <td colspan="4" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">DOCUMENTO DE TRASLADO, COMPROBANTE DE PAGO, DOCUMENTO INTERNO O SIMILAR</td>
                <td rowspan="2" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">
                    <table>
					 <tr><td align="center" style="text-align:center;">TIPO DE OPERACIÓN</td></tr>
					 <tr><td align="center" style="text-align:center;">(TABLA 12)</td></tr>
				   </table>
                </td>
                <td rowspan="2" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">ENTRADAS</td>
                <td rowspan="2" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">SALIDAS</td>
                <td rowspan="2" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">SALDO  FINAL</td>
            </tr>
            <tr>
                <td align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">FECHA</td>
                <td align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">TIPO (TABLA 10)</td>
                <td align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">SERIE</td>
                <td align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">NÚMERO</td>
            </tr>
            <#list movements as key,mov>
                <tr>
                    <td width="25%" align = "center">${mov.fechaEmision}</td>
                    <td width="25%" align = "center">${mov.tipoDocumento}</td>
                    <td width="25%" align = "center">${mov.serieDocumento}</td>
                    <td width="25%" align = "center">${mov.nroDocumento}</td>
                    <td width="25%" align = "center">${mov.codOperacion}</td>
                    <td width="25%" align = "right" style= "padding-right:2px;">${mov.entradasUnidFisicas}</td>
                    <td width="25%" align = "right" style= "padding-right:2px;">${mov.salidaUnidFisicas}</td>
                    <td width="25%" align = "right" style= "padding-right:2px;">${mov.saldoFinal}</td>

                </tr>
            </#list>
                <tr>
                    <td width="25%" align = "center"></td>
                    <td width="25%" align = "center"></td>
                    <td width="25%" align = "center"></td>
                    <td width="25%" align = "center"></td>
                    <td width="25%" align = "center"><b>TOTALES</b></td>
                    <td width="25%" align = "right" style= "border:1px solid black; padding-right:2px;">${total.entradasUnidFisicas}</td>
                    <td width="25%" align = "right" style= "border:1px solid black; padding-right:2px;">${total.salidaUnidFisicas}</td>
                    <td width="25%" align = "right" style= "border:1px solid black; padding-right:2px;">${total.TotalSaldoFinal}</td>
                </tr>
        </table>
    </body>
</pdf>