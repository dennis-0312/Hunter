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
      <meta name="title" value="Formato 3.15" />
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
            <th width="60%" align="center" style="border:1px solid black; font-weight:bold; padding: 5px; text-align:center; vertical-align: middle">CONCEPTO</th>
            <th width="20%" align="center" style="border:1px solid black; font-weight:bold; padding: 5px; text-align:center; vertical-align: middle">
              <table>
                <tr><td align="center" style="text-align:center;">NÚMERO DE COMPROBANTE</td></tr>
                <tr><td align="center" style="text-align:center;">DE PAGO RELACIONADO</td></tr>
              </table>               
            </th>
            <th width="20%" align="center" style="border:1px solid black; font-weight:bold; padding: 5px; text-align:center; vertical-align: middle">SALDO FINAL</th>
         </tr>
        </thead>
         <#list movements as key,mov>
            <tr>
               <td width="60%" style=" max-width: 20px;white-space: nowrap;" align="center">${mov.concepto}</td>
               <td width="20%" align="center">${mov.numComprobantes}</td>
               <td width="20%" align="right"><#if mov.saldoFinal == 0>0.00<#else>${mov.saldoFinal?string["#,###.00"]}</#if></td>
            </tr>
            <#list jsonTransacionvine as item>
                   <#if mov.number == item.cantidadFor>
                     <tr>
                        <td align = "center ">VAN</td>
                        <td align = "center "></td>
                        <td align = "center ">${item.montoviene}</td>
                          
                     </tr>
                  
                     <tr>
                        <td align = "center ">VIENE</td>
                        <td align = "center "></td>
                        <td align = "center ">${item.montoviene}</td>
                     </tr>
                  </#if>
            </#list>
         </#list>
          <tr>
               <td  align="center" style="border-top:1px solid black"></td>
               <td  align="center" style="border-top:1px solid black; font-weight:bold;font-size: 11px;">TOTAL</td>
               <td  align="right" style="border:1px solid black; font-weight:bold;font-size: 11px;"><#if total.total == 0>0.00<#else>${total.total?string["#,###.00"]}</#if></td>
          </tr>
      </table>  
  </body>
</pdf>