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
      <meta name="title" value="Formato 3.13" />
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
      <table style="font-family: Verdana, Arial, Helvetica, sans-serif; width:100%;" >
        <thead>
         <tr>
            <th  align="center" style="border:1px solid black; font-weight:bold; padding: 5px; text-align:center;" colspan="3">
              <p style= "width: 100%; font-weight:bold; text-align: center; vertical-align: middle">INFORMACIÓN DE TERCEROS</p>
            </th>
            <th  align="center" style="border:1px solid black; font-weight:bold; padding: 5px; text-align:center; vertical-align: middle" rowspan="3">
              <p style= "width: 100%; font-weight:bold; text-align: center;">DESCRIPCIÓN DE LA OBLIGACIÓN</p>
            </th>
            <th  align="center" style="border:1px solid black; font-weight:bold; padding: 5px; text-align:center; vertical-align: middle" rowspan="3">
            <table>
              <tr><td><p style= "width: 100%; font-weight:bold; text-align: center; max-width:100px">FECHA DE</p></td></tr>
              <tr><td><p style= "width: 100%; font-weight:bold; text-align: center; max-width:100px">EMISIÓN DEL</p></td></tr>
              <tr><td><p style= "width: 100%; font-weight:bold; text-align: center; max-width:100px">COMPROBANTE</p></td></tr>
              <tr><td><p style= "width: 100%; font-weight:bold; text-align: center; max-width:100px"> DE PAGO</p></td></tr>
              <tr><td><p style= "width: 100%; font-weight:bold; text-align: center; max-width:100px">O FECHA</p></td></tr>
              <tr><td><p style= "width: 100%; font-weight:bold; text-align: center; max-width:100px">DE INICIO</p></td></tr>
              <tr><td><p style= "width: 100%; font-weight:bold; text-align: center; max-width:100px">DE LA</p></td></tr>
              <tr><td><p style= "width: 100%; font-weight:bold; text-align: center; max-width:100px"> OPERACIÓN</p></td></tr>
            </table>
            </th>
            <th   align="center" style="border:1px solid black; font-weight:bold; padding: 5px; text-align:center; vertical-align: middle" rowspan="3">
              <table>
                <tr><td><p style= "width: 100%; font-weight:bold; text-align: center;">MONTO</p></td></tr>
                <tr><td><p style= "width: 100%; font-weight:bold; text-align: center;">PENDIENTE</p></td></tr>
                <tr><td><p style= "width: 100%; font-weight:bold; text-align: center;">DE PAGO</p></td></tr>
              </table>
            </th>
         </tr>
          <tr>
            <th align="center" style="border:1px solid black; font-weight:bold; padding: 5px; text-align:center; ; vertical-align: middle" colspan="2">DOCUMENTO DE IDENTIDAD</th>
            <th align="center" style="border:1px solid black; font-weight:bold; padding: 10px; text-align:center; vertical-align: middle" rowspan="3">
              <p style= "width: 100%; font-weight:bold; text-align: center;">APELLIDOS Y NOMBRES, DENOMINACIÓN O RAZÓN SOCIAL</p>
            </th>
         </tr>
         <tr>
            <th  align="center" style="border:1px solid black; font-weight:bold; padding: 5px; text-align:center; vertical-align: middle" >
              <table>
                <tr><td><p style= "width: 100%; font-weight:bold; text-align: center;">TIPO</p></td></tr>
                <tr><td><p style= "width: 100%; font-weight:bold; text-align: center;">(TABLA 2)</p></td></tr>
              </table>             
            </th>
            <th  align="center" style="border:1px solid black; font-weight:bold; padding: 5px; text-align:center; vertical-align: middle" >NÚMERO</th>
         </tr>
        </thead>
         <#list movements as key,mov>
            <tr>
               <td width="8%" align="center">${mov.tipoDNITerceros}</td>
               <td width="8%" align="center">${mov.numDNITerceros}</td>
               <td align="left"><p style="width:370px;margin-top: 0;margin-bottom: 0;hyphens: auto;word-wrap: break-word;word-break: break-all;">${mov.nombresTerceros}</p></td>
               <td align="left"><p style="width:150px;margin-top: 0;margin-bottom: 0;hyphens: auto;word-wrap: break-word;word-break: break-all;">${mov.description}</p></td>
               <td width="10%" align="center">${mov.fechaEmision}</td>
               <td align="right"><#if mov.monto == 0>0.00<#else>${mov.monto?string["#,###.00"]}</#if></td>
            </tr>
            <#list jsonTransacionvine as item>
                   <#if mov.number == item.cantidadFor>
                     <tr >
                      
                        <td width="8%" align="center"></td>
                        <td width="8%" align="center"></td>
                        <td align="left"></td>
                        <td align="left">VAN</td>
                        <td width="10%" align="center"></td>
                        <td align="right">${item.montoviene}</td>
                     </tr>
                  
                      <tr style="margin-top: 20px;">
                     
                       <td width="8%" align="center"></td>
                        <td width="8%" align="center"></td>
                        <td align="left"></td>
                        <td align="left">VIENE</td>
                        <td width="10%" align="center"></td>
                        <td align="right">${item.montoviene}</td>
                     </tr>
                  </#if>
            </#list>
         </#list>
          <tr>
               <td  align="center" style="border-top:1px solid black"></td>
               <td align="center" style="border-top:1px solid black"></td>
               <td  align="center" style="border-top:1px solid black"></td>
               <td  align="center" style="border-top:1px solid black"></td>
               <td  align="center" style="border:1px solid black; font-weight:bold;font-size: 11px;">SALDO TOTAL</td>
               <td  align="right" style="border:1px solid black; font-weight:bold;font-size: 11px;"><#if total.total == 0>0.00<#else>${total.total?string["#,###.00"]}</#if></td>
          </tr>
      </table>  
  </body>
</pdf>