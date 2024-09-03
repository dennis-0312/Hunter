<#assign data = input.data?eval >
<#assign company = data.company >
<#assign total = data.total >
<#assign movements = data.movements >
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
   <head>
      <meta name="title" value="Formato 4.1" />
      <macrolist>
         <macro id = "cabecera">
            <table width="100%">
               <tr>
                  <td colspan="4" width="100%" align="center"><b>FORMATO 4.1: LIBRO DE RETENCIONES INCISOS E) Y F) DEL ART. 34° DE LA LEY DEL IMPUESTO A LA RENTA</b></td>
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
                <td width="50%" align="left"><b>APELLIDOS Y NOMBRES, DENOMINACIÓN O RAZÓN SOCIAL</b></td>
                <td width="5%" align="right"><b>:</b></td>
                <td width="30%" align="left">${company.fourthTitle}</td>
                <td width="15%" align="left"></td>
            </tr>
            </table>
         </macro>
      </macrolist>
   </head>
   <body background-color="white" font-size="8" size="A4-landscape" header = "cabecera" header-height="25mm" footer-height="10mm">
       <table style="font-family: Verdana, Arial, Helvetica, sans-serif; width:100%" >
         <tr>
            <td rowspan="2" align = "center " style= "border:1px solid black; font-weight:bold">
               <table>
                 <tr><td align="center" style="text-align:center;">FECHA DE</td></tr>
                 <tr><td align="center" style="text-align:center;">PAGO O</td></tr>
                 <tr><td align="center" style="text-align:center;">RETENCION</td></tr>
                 <tr><td align="center" style="text-align:center;">(dd/mm/aaaa)</td></tr>
               </table> 
             </td>
            <td colspan="3" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">PERSONA QUE BRINDÓ EL SERVICIO</td>
            <td colspan="3" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">MONTO DE LA RETRIBUCIÓN</td>
         </tr>
         <tr>
            <td align = "center " style= "border:1px solid black; font-weight:bold">
              <table>
                <tr><td align="center" style="text-align:center;">TIPO</td></tr>
                <tr><td align="center" style="text-align:center;">DE DOCUMENTO</td></tr>
                <tr><td align="center" style="text-align:center;">(TABLA 2)</td></tr>
              </table> 
            </td>
            <td align = "center " style= "border:1px solid black; font-weight:bold">
              <table>
                <tr><td align="center" style="text-align:center;">N° DE</td></tr>
                <tr><td align="center" style="text-align:center;">DE DOCUMENTO</td></tr>
                <tr><td align="center" style="text-align:center;">(TABLA 2)</td></tr>
              </table> 
            </td>
            <td align = "center " style= "border:1px solid black; font-weight:bold">
               <table>
                 <tr><td align="center" style="text-align:center; padding-top:15px;">APELLIDOS Y NOMBRES</td></tr>
               </table> 
             </td>
             <td align = "center " style= "border:1px solid black; font-weight:bold">
                <table>
                  <tr><td align="center" style="text-align:center; padding-top:10px;">MONTO</td></tr>
                  <tr><td align="center" style="text-align:center;">BRUTO</td></tr>
                </table> 
              </td>
              <td align = "center " style= "border:1px solid black; font-weight:bold">
                 <table>
                   <tr><td align="center" style="text-align:center; padding-top:10px;">RETENCIÓN</td></tr>
                   <tr><td align="center" style="text-align:center;">EFECTUADA</td></tr>
                 </table> 
               </td>
               <td align = "center " style= "border:1px solid black; font-weight:bold">
                  <table>
                    <tr><td align="center" style="text-align:center; padding-top:10px;">MONTO</td></tr>
                    <tr><td align="center" style="text-align:center;">NETO</td></tr>
                  </table> 
                </td>
         </tr>
         <#list movements as key,mov>
            <tr>
               <td align = "center">${mov.date}</td>
               <td align = "center">${mov.tipoDocumento}</td>
               <td align = "center">${mov.numberDoc}</td>
               <td align = "left">${mov.name}</td>
               <td align = "right">${mov.amount}</td>
               <td align = "right">${mov.amountRet}</td>
               <td align = "right">${mov.balance}</td>
            </tr>
         </#list>
          <tr>
               <td align = "center " style= "border-top:1px solid black"></td>
               <td align = "center " style= "border-top:1px solid black"></td>
               <td align = "center " style= "border-top:1px solid black"></td>
               <td align = "right " style= "border-top:1px solid black">TOTALES</td>
               <td align = "right " style= "border-top:1px solid black; padding-right:5px;">${total.total_amount}</td>
               <td align = "right " style= "border-top:1px solid black; padding-right:5px;">${total.total_amountRet}</td>
               <td align = "right " style= "border-top:1px solid black; padding-right:5px;">${total.total_balance}</td>
            </tr>
      </table>  
  </body>
</pdf>