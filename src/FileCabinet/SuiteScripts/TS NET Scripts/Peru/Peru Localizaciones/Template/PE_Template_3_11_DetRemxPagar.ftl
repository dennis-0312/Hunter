<#setting locale="en_US">
<#assign data = input.data?eval >
<#assign company = data.company >
<#assign total = data.total >
<#assign movements = data.movements >
<#assign jsonTransacionvine = data.jsonTransacionvine >
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
   <head>
      <meta name="title" value="Formato 3.11" />
      <macrolist>
         <macro id = "cabecera">
            <table width="100%">
                <tr>
                  <td align="center" style="font-size: 12px; font-family: Verdana, Arial, Helvetica, sans-serif; font-weight: bold; text-align:center;">${company.formato}</td>
               </tr>
               <tr>
                  <td align="left" height="10px"> </td>
               </tr>
               <tr>
                  <td align="left" style="font-size: 12px; font-family: Verdana, Arial, Helvetica, sans-serif; font-weight: bold;">${company.ejercicio}</td>
               </tr>
               <tr>
                  <td align="left" style="font-size: 12px; font-family: Verdana, Arial, Helvetica, sans-serif; font-weight: bold;">${company.ruc}</td>
               </tr>
               <tr>
                  <td align="left" style="font-size: 12px; font-family: Verdana, Arial, Helvetica, sans-serif; font-weight: bold;">${company.name}</td>
               </tr>
               <tr>
                  <td align="left" height="10px"> </td>
               </tr>
            </table>
         </macro>
      </macrolist>
   </head>
   <body background-color="white" font-size="8" size="A4-landscape" header = "cabecera" header-height="30mm" footer-height="10mm">
      <table style="font-family: Verdana, Arial, Helvetica, sans-serif; width:100%" >
         <thead>
         <tr>
            <td  align="center" style= "border:1px solid black; border-bottom: 0; border-right: 0; font-weight:bold; padding: 5px; text-align:center;" colspan="2">CUENTA Y SUBCUENTA : REMUNERACIONES POR PAGAR</td>
            <td  align="center" style= "border:1px solid black; border-bottom: 0; border-right: 0; font-weight:bold; padding: 5px; text-align:center;" colspan="4">TRABAJADOR</td>            
            <td width="10%" align = "center" style= "border:1px solid black; font-weight:bold; padding: 5px; text-align:center; vertical-align: middle;" rowspan="3">SALDO FINAL</td>

         </tr>
         <tr>
            <td width="10%" align="center" style= "border:1px solid black;  border-right: 0; font-weight:bold; padding: 5px; text-align:center; vertical-align: middle;" rowspan="2">CÓDIGO</td>
            <td width="25%" align="center" style= "border:1px solid black; border-right: 0; font-weight:bold; padding: 5px; text-align:center; vertical-align: middle;" rowspan="2">DENOMINACIÓN</td>
            <td width="10%" align="center" style= "border:1px solid black; border-right: 0; font-weight:bold; padding: 5px; text-align:center; vertical-align: middle;" rowspan="2">CÓDIGO</td>
            <td width="25%" align="center" style= "border:1px solid black; border-right: 0; font-weight:bold; padding: 5px; text-align:center; vertical-align: middle;" rowspan="2">APELLIDOS Y NOMBRES</td>
            <td width="20%" align="center" style= "border:1px solid black; border-bottom: 0; border-right: 0; font-weight:bold; padding: 5px; text-align:center;" colspan="2">DOCUMENTO DE IDENTIDAD</td>
         </tr>
         <tr>
            <td align="center" style= "border:1px solid black; border-right: 0; font-weight:bold; padding: 5px; text-align:center;">
              <table>
                <tr>
                  <td align="center" style="text-align:center;">TIPO</td>
                </tr>
                <tr> 
                  <td align="center" style="text-align:center;">(TABLA 2)</td>
                </tr>
              </table> 
            </td>
            <td align="center" style= "border:1px solid black; border-right: 0; font-weight:bold; padding: 5px; text-align:center; vertical-align: middle;">NÚMERO</td>
         </tr>
         </thead>

         <tbody>

         <#list movements as key,mov>
            <tr>
               <td width="10%" align="center">${mov.codigo}</td>
               <td width="25%" align="left"><p style="width:220px;margin-top: 0;margin-bottom: 0;hyphens: auto;word-wrap: break-word;word-break: break-all;">${mov.denominacion}</p></td>
               <td width="10%" align="center">${mov.codigoTrabajador}</td>
               <td width="25%" align="left"><p style="width:220px;margin-top: 0;margin-bottom: 0;hyphens: auto;word-wrap: break-word;word-break: break-all;">${mov.apellidosNombresTrabajador}</p></td>
               <td width="10%" align="center">${mov.tipoDNITrabajador}</td>
               <td width="10%" align="center">${mov.numeroDNITrabajador}</td>
               <td width="10%" align="right"><#if mov.saldoFinal == 0>0.00<#else>${mov.saldoFinal?string["#,###.00"]}</#if></td>

            </tr>
             <#list jsonTransacionvine as item>
                   <#if mov.number == item.cantidadFor>
                     <tr >
                      
                        <td align = "left "></td>
                        <td align = "center "></td>
                        <td align = "center "></td>
                        <td align = "center "></td>
                        <td align = "left" >VAN</td>
                        <td align = "right " ></td>
                        <td align = "right ">${item.montoviene}</td>
                     </tr>
                  
                      <tr style="margin-top: 20px;">
                     
                        <td align = "left "></td>
                        <td align = "center "></td>
                        <td align = "center "></td>
                        <td align = "center "></td>
                        <td align = "left" >VIENE</td>
                        <td align = "right " ></td>
                        <td align = "right ">${item.montoviene}</td>
                     </tr>
                  </#if>
            </#list>
         </#list>
            <tr>
               <td width="10%" align="center" style= "border-top:1px solid black"></td>
               <td width="25%" align="center" style= "border-top:1px solid black"></td>
               <td width="10%" align="center" style= "border-top:1px solid black"></td>
               <td width="25%" align="center" style= "border-top:1px solid black"></td>
               <td width="10%" align="center" style= "border-top:1px solid black"></td>
               <td width="10%" align="right" style="border-top:1px solid black; font-weight:bold;font-size: 11px;">TOTAL</td>
               <td width="10%" align="right" style="border:1px solid black; font-weight:bold;font-size: 11px"><#if total.total == 0>0.00<#else>${total.total?string["#,###.00"]}</#if></td>
            </tr>
         </tbody>
      </table>  
  </body>
</pdf>