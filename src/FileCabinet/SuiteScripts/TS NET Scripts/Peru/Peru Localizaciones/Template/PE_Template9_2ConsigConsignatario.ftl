<#assign data = input.data?eval >
<#assign company = data.company >
<#assign total = data.total >
<#assign movements = data.movements >
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
   <head>
      <meta name="title" value="Formato 9.2" />
      <macrolist>
         <macro id = "cabecera">
            <table width="100%" font-size="8">
               <tr>
                  <td colspan="4" width="100%" align="center"><b>FORMATO 9.2: "REGISTRO DE CONSIGNACIONES - PARA EL CONSIGNATARIO"</b></td>
               </tr>
               <tr>
                  <td colspan="4" width="100%" align="center">CONTROL DE BIENES RECIBIDOS EN CONSIGNACIÓN</td>
               </tr>
               <tr>
                  <td colspan="4" width="100%" align="center"></td>
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
                  <td colspan="4" width="100%" align="center"></td>
               </tr>
                <tr>
                    <td width="50%" align="left"><b>&nbsp;&nbsp;NOMBRE DEL BIEN</b></td>
                    <td width="5%" align="right"><b>:</b></td>
                    <td width="30%" align="left"></td>
                    <td width="15%" align="left"></td>
               </tr>
                <tr>
                    <td width="50%" align="left"><b>&nbsp;&nbsp;DESCRIPCIÓN</b></td>
                    <td width="5%" align="right"><b>:</b></td>
                    <td width="30%" align="left"></td>
                    <td width="15%" align="left"></td>
               </tr>
                <tr>
                    <td width="50%" align="left"><b>&nbsp;&nbsp;CÓDIGO</b></td>
                    <td width="5%" align="right"><b>:</b></td>
                    <td width="30%" align="left"></td>
                    <td width="15%" align="left"></td>
               </tr>
                <tr>
                    <td width="50%" align="left"><b>&nbsp;&nbsp;UNIDAD DE MEDIDA (Según Tabla 6)</b></td>
                    <td width="5%" align="right"><b>:</b></td>
                    <td width="30%" align="left"></td>
                    <td width="15%" align="left"></td>
               </tr>
            </table>
         </macro>
      </macrolist>
   </head>
   <body background-color="white" font-size="5" size="A4-landscape" header = "cabecera" header-height="50mm" footer-height="10mm">
       <table style="font-family: Verdana, Arial, Helvetica, sans-serif; width:100%" >
            <tr>
				<td rowspan="2" align = "center " style= "border:1px solid black; font-weight:bold">
				   <table>
					 <tr><td align="center" style="text-align:center;">FECHA DE</td></tr>
					 <tr><td align="center" style="text-align:center;">RECEPCIÓN,</td></tr>
					 <tr><td align="center" style="text-align:center;">DEVOLUCIÓN O</td></tr>
					 <tr><td align="center" style="text-align:center;">VENTA DEL BIEN</td></tr>
				   </table> 
				 </td>
				<td rowspan="2" align = "center " style= "border:1px solid black; font-weight:bold">
				   <table>
					 <tr><td align="center" style="text-align:center;">FECHA DE EMISIÓN</td></tr>
					 <tr><td align="center" style="text-align:center;">DE LA GUÍA DE REMISIÓN</td></tr>
					 <tr><td align="center" style="text-align:center;">O COMPROBANTE</td></tr>
					 <tr><td align="center" style="text-align:center;">DE PAGO</td></tr>
				   </table> 
				 </td>
				<td rowspan="2" align = "center " style= "border:1px solid black; font-weight:bold">
				   <table>
					 <tr><td align="center" style="text-align:center;"></td></tr>
					 <tr><td align="center" style="text-align:center;">TIPO</td></tr>
					 <tr><td align="center" style="text-align:center;">(TABLA 10)</td></tr>
					 <tr><td align="center" style="text-align:center;"></td></tr>
				   </table> 
				 </td>
				<td colspan="2" align = "center " style= "border:1px solid black; font-weight:bold">
				   <table>
					 <tr><td align="center" style="text-align:center;">GUÍA DE REMISIÓN</td></tr>
					 <tr><td align="center" style="text-align:center;">EMITIDO POR EL CONSIGNADOR</td></tr>
				   </table> 
				 </td>
				<td colspan="2" align = "center " style= "border:1px solid black; font-weight:bold">
				   <table>
					 <tr><td align="center" style="text-align:center;">COMPROBANTE DE PAGO</td></tr>
					 <tr><td align="center" style="text-align:center;">EMITIDO POR EL CONSIGNATARIO</td></tr>
				   </table> 
				 </td>
				<td colspan="2" align = "center " style= "border:1px solid black; font-weight:bold">
				   <table>
					 <tr><td align="center" style="text-align:center;">INFORMACIÓN DEL CONSIGNADOR</td></tr>
				   </table> 
				 </td>
				<td colspan="4" align = "center " style= "border:1px solid black; font-weight:bold">
				   <table>
					 <tr><td align="center" style="text-align:center;">MOVIMIENTO DE BIENES RECIBIDOS EN CONSIGNACIÓN</td></tr>
				   </table> 
				 </td>
			 </tr>
            <tr>
				<td align = "center " style= "border:1px solid black; font-weight:bold">
				   <table>
					 <tr><td align="center" style="text-align:center;">SERIE</td></tr>
				   </table> 
				 </td>
				<td align = "center " style= "border:1px solid black; font-weight:bold">
				   <table>
					 <tr><td align="center" style="text-align:center;">NÚMERO</td></tr>
				   </table> 
				 </td>
				<td align = "center " style= "border:1px solid black; font-weight:bold">
				   <table>
					 <tr><td align="center" style="text-align:center;">SERIE</td></tr>
				   </table> 
				 </td>
				<td align = "center " style= "border:1px solid black; font-weight:bold">
				   <table>
					 <tr><td align="center" style="text-align:center;">NÚMERO</td></tr>
				   </table> 
				 </td>
				<td align = "center " style= "border:1px solid black; font-weight:bold">
				   <table>
					 <tr><td align="center" style="text-align:center;">NÚMERO</td></tr>
					 <tr><td align="center" style="text-align:center;">DE RUC</td></tr>
				   </table> 
				 </td>
				<td align = "center " style= "border:1px solid black; font-weight:bold">
				   <table>
					 <tr><td align="center" style="text-align:center;">APELLIDOS Y NOMBRES,</td></tr>
					 <tr><td align="center" style="text-align:center;">DENOMINACIÓN O RAZÓN SOCIAL</td></tr>
				   </table> 
				 </td>
				<td align = "center " style= "border:1px solid black; font-weight:bold">
				   <table>
					 <tr><td align="center" style="text-align:center;">CANTIDAD</td></tr>
					 <tr><td align="center" style="text-align:center;">RECIBIDA</td></tr>
				   </table> 
				 </td>
				<td align = "center " style= "border:1px solid black; font-weight:bold">
				   <table>
					 <tr><td align="center" style="text-align:center;">CANTIDAD</td></tr>
					 <tr><td align="center" style="text-align:center;">DEVUELTA</td></tr>
				   </table> 
				 </td>
				<td align = "center " style= "border:1px solid black; font-weight:bold">
				   <table>
					 <tr><td align="center" style="text-align:center;">CANTIDAD</td></tr>
					 <tr><td align="center" style="text-align:center;">VENDIDA</td></tr>
				   </table> 
				 </td>
				<td align = "center " style= "border:1px solid black; font-weight:bold">
				   <table>
					 <tr><td align="center" style="text-align:center;">SALDO DE LOS BIENES</td></tr>
					 <tr><td align="center" style="text-align:center;">EN CONSIGNACIÓN</td></tr>
				   </table> 
				 </td>
			 </tr>
            <#list movements as key,mov>
                <tr>
                    <td align = "center">${mov.fechaRecepcion}</td>
                    <td align = "center">${mov.fecha}</td>
                    <td align = "center">${mov.tipoExistencia}</td>
                    <td align = "center">${mov.serieGuia}</td>
                    <td align = "center">${mov.nroGuia}</td>
                    <td align = "center">${mov.serieComprobante}</td>
                    <td align = "center">${mov.nroComprobante}</td>
                    <td align = "center">${mov.ruc}</td>
                    <td align = "center">${mov.razonSocial}</td>
                    <td align = "center">${mov.sumEntregada}</td>
                    <td align = "center">${mov.sumDevuelta}</td>
                    <td align = "center">${mov.sumVendida}</td>
                    <td align = "center">${mov.sumSaldo}</td>
                </tr>
            </#list>
                <!-- <tr> -->
                    <!-- <td width="25%" align = "center"></td> -->
                    <!-- <td width="25%" align = "center"></td> -->
                    <!-- <td width="25%" align = "center"></td> -->
                    <!-- <td width="25%" align = "center"></td> -->
                    <!-- <td width="25%" align = "center"></td> -->
                    <!-- <td width="25%" align = "center"></td> -->
                    <!-- <td width="25%" align = "center"></td> -->
                    <!-- <td width="25%" align = "center"></td> -->
                    <!-- <td width="25%" align = "center" style= "border-top:1px solid black"><b>TOTAL GENERAL</b></td> -->
                    <!-- <td width="25%" align = "center" style= "border-top:1px solid black">${total.sumEntregada}</td> -->
                    <!-- <td width="25%" align = "center" style= "border-top:1px solid black">${total.sumDevuelta}</td> -->
                    <!-- <td width="25%" align = "center" style= "border-top:1px solid black">${total.sumVendida}</td> -->
                    <!-- <td width="25%" align = "center" style= "border-top:1px solid black">${total.sumSaldo}</td> -->
                <!-- </tr> -->
        </table>
    </body>
</pdf>