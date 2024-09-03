<#assign data = input.data?eval >
<#assign company = data.company >
<#assign total = data.total >
<#assign movements = data.movements >
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
   <head>
      <meta name="title" value="Formato 3.10" />
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
         <tr>
            <td  align = "center" style= "border:1px solid black; font-weight:bold; padding: 5px; text-align:center;" colspan="2">CUENTA Y SUB CUENTA TRIBUTOS POR PAGAR</td>
            <td width="25%" align = "center" style= "border:1px solid black; font-weight:bold; padding: 5px; text-align:center; vertical-align: middle;" rowspan="2">SALDO FINAL</td>

         </tr>
         <tr>
            <td width="25%" align = "center" style= "border:1px solid black; font-weight:bold; padding: 5px; text-align:center;">CÓDIGO</td>
            <td width="50%" align = "center" style= "border:1px solid black; font-weight:bold; padding: 5px; text-align:center;">DENOMINACIÓN</td>
         </tr>
         <#list movements as key,mov>
            <tr>
               <td width="25%" align = "center">${mov.codigo}</td>
               <td width="50%" align = "left">${mov.denominacion}</td>
               <td width="25%" align = "right">${mov.saldoFinal}</td>
            </tr>
         </#list>
          <tr>
               <td width="25%" align = "center " style= "border-top:1px solid black"></td>
               <td width="50%" align = "right " style= "border-top:1px solid black; font-weight:bold;font-size: 11px;">TOTAL</td>
               <td width="25%" align = "right " style= "border:1px solid black; font-weight:bold;font-size: 11px">${total.total}</td>

            </tr>
      </table>  
  </body>
</pdf>