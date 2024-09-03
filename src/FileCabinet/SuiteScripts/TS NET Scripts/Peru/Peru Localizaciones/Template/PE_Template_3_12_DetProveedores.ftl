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
      <meta name="title" value="Formato 3.12" />
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
            <th align="center" style="border:1px solid black; border-bottom: 0; border-right: 0; font-weight:bold; padding: 5px; text-align:center;" colspan="3">INFORMACIÓN DEL PROVEEDOR</th>
            <th  align="center" style="border:1px solid black; border-right: 0; font-weight:bold; padding: 5px; text-align:center; vertical-align: middle" rowspan="3">
              <p style= "width: 100%; font-weight:bold; text-align: center;">FECHA DE EMISIÓN DEL COMPROBANTE DE PAGO</p>
            </th>
            <th align="center" style="border:1px solid black; border-right: 0; font-weight:bold; padding: 5px; text-align:center; vertical-align: middle" rowspan="3"><p style= "width: 100%; font-weight:bold; text-align: center;">NRO. DE COMPROBANTE</p></th>
            <th  align="center" style="border:1px solid black; font-weight:bold; padding: 5px; text-align:center; vertical-align: middle" rowspan="3">
              <p style= "width: 100%; font-weight:bold; text-align: center;">MONTO DE LA CUENTA POR PAGAR</p>
            </th>
         </tr>
          <tr>
            <th align="center" style="border:1px solid black; border-bottom: 0; border-right: 0; font-weight:bold; padding: 5px; text-align:center;" colspan="2">DOCUMENTO DE IDENTIDAD</th>
            <th align="center" style="border:1px solid black; font-weight:bold; border-right: 0; padding: 10px; text-align:center; vertical-align: middle" rowspan="3">
              <table>
                <tr>
                  <td align="center" style="text-align:center;">APELLIDOS Y NOMBRES, DENOMINACIÓN</td>
                </tr>
                <tr> 
                  <td align="center" style="text-align:center;">O RAZÓN SOCIAL</td>
                </tr>
              </table>               
            </th>
         </tr>
         <tr>
            <th align="center" style="border:1px solid black;  border-right: 0; font-weight:bold; padding: 5px; text-align:center;" ><p style= "width: 100%; font-weight:bold; text-align: center;">TIPO (TABLA 2)</p></th>
            <th align="center" style="border:1px solid black;  border-right: 0; font-weight:bold; padding: 5px; text-align:center;" >NÚMERO</th>
         </tr>
        </thead>
         <#list movements as key,mov>
            <tr>
               <td align="center">${mov.tipoDNIProveedor}</td>
               <td align="center">${mov.numDNIProveedor}</td>
               <td align="left" style="white-space:nowrap;">${mov.nombresProveedor}</td>
               <td align="center">${mov.fechaEmision}</td>
               <td align="center">${mov.nroComprobante}</td>
               <td align="right">${mov.monto}</td>
               <#--  <td align="right"><#if mov.monto == 0>0.00<#else>${mov.monto?string["#,###.00"]}</#if></td>  -->
            </tr>
            <#list jsonTransacionvine as item>
                   <#if mov.number == item.cantidadFor>
                     <tr>
                        <td align = "center "></td>
                        <td align = "center "></td>
                           <td align = "center "></td>
                           <td align = "center ">VAN</td>
                        <td align = "center "></td>
                        <td align = "center ">${item.montoviene}</td>
                     </tr>
                  
                     <tr>
                        <td align = "center "></td>
                        <td align = "center "></td>
                                <td align = "center "></td>
                                <td align = "center ">VIENE</td>
                        <td align = "center "></td>
                        <td align = "center ">${item.montoviene}</td>
                     </tr>
                  </#if>
            </#list>
         </#list>
          <tr>
               <td align="center" style="border-top:1px solid black"></td>
               <td align="center" style="border-top:1px solid black"></td>
               <td align="center" style="border-top:1px solid black"></td>
               <td align="center" style="border-top:1px solid black"></td>
               <td align="right" style="border:1px solid black; font-weight:bold;font-size: 11px;">SALDO TOTAL</td>
               <td align="right" style="border:1px solid black; font-weight:bold;font-size: 11px;"><#if total.total == 0>0.00<#else>${total.total?string["#,###.00"]}</#if></td>
          </tr>
      </table>  
  </body>
</pdf>