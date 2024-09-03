<#assign data = input.data?eval>
<#assign company = data.company>
<#assign total = data.total>
<#assign movements = data.movements>
<#assign lastYear = data.lastYear>
<#assign account = data.account>
<#assign vTotals = data.vTotals>
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
   <head>
      <meta name="title" value="Formato 3.19" />
      <macrolist>
         <macro id = "cabecera">
            <table width="100%">
               <tr>
                  <td colspan="4" width="100%" align="center" style="font-size: 10px; font-family: Verdana, Arial, Helvetica, sans-serif; font-weight: bold;"><b>${company.firtsTitle}</b></td>
               </tr>
                <tr>
                    <td width="45%" align="left" style="font-size: 10px; font-family: Verdana, Arial, Helvetica, sans-serif; font-weight: bold;"><b>PERIODO</b></td>
                    <td width="5%" align="right"><b>:</b></td>
                    <td width="50%" align="left" style="font-size: 10px; font-family: Verdana, Arial, Helvetica, sans-serif; font-weight: bold;">${company.secondTitle}</td>
               </tr>
                <tr>
                    <td width="45%" align="left" style="font-size: 10px; font-family: Verdana, Arial, Helvetica, sans-serif; font-weight: bold;"><b>RUC</b></td>
                    <td width="5%" align="right"><b>:</b></td>
                    <td width="50%" align="left" style="font-size: 10px; font-family: Verdana, Arial, Helvetica, sans-serif; font-weight: bold;">${company.thirdTitle}</td>
               </tr>
                <tr>
                    <td width="45%" align="left" style="font-size: 10px; font-family: Verdana, Arial, Helvetica, sans-serif; font-weight: bold;"><b>APELLIDOS Y NOMBRES, DENOMINACIÓN O RAZÓN SOCIAL</b></td>
                    <td width="5%" align="right"><b>:</b></td>
                    <td width="50%" align="left" style="font-size: 10px; font-family: Verdana, Arial, Helvetica, sans-serif; font-weight: bold;">${company.fourthTitle?upper_case}</td>
               </tr>
            </table>
         </macro>
      </macrolist>
   </head>
    <body background-color="white" font-size="7" size="A4-landscape" header = "cabecera"  footer = "piepagina" header-height="25mm" footer-height="10mm">
        <table style="font-family: Verdana, Arial, Helvetica, sans-serif; width:100%; table-layout: fixed;">
          <thead>
              <tr>
                  <td width="52%" align="center" style= "border: 1px solid black; border-bottom: 0px; border-right: 0px; font-weight:bold; vertical-align: middle;">
                    <p style= "width: 100%; font-weight:bold; text-align: center;">CUENTAS PATRIMONIALES</p>
                  </td>
                  <td width="7%" align="center" style= "border: 1px solid black; border-bottom: 0px; border-right: 0px; font-weight:bold; vertical-align: middle;">
                    <p style= "width: 100%; font-weight:bold; text-align: center;">Capital</p>
                  </td>
                  <td width="7%" align="center" style= "border: 1px solid black; border-bottom: 0px; border-right: 0px; font-weight:bold; vertical-align: middle;">
                    <p style= "width: 100%; font-weight:bold; text-align: center;">Capital Adicional</p>
                  </td>
                  <td width="7%" align="center" style= "border: 1px solid black; border-bottom: 0px; border-right: 0px; font-weight:bold; vertical-align: middle;">
                    <p style= "width: 100%; font-weight:bold; text-align: center;">Acciones de Inversión</p>
                  </td>
                  <td width="7%" align="center" style= "border: 1px solid black; border-bottom: 0px; border-right: 0px; font-weight:bold; vertical-align: middle;">
                    <p style= "width: 100%; font-weight:bold; text-align: center; max-width:7%">Excedente de Revaluación</p>
                  </td>
                  <td width="7%" align="center" style= "border: 1px solid black; border-bottom: 0px; border-right: 0px; font-weight:bold; vertical-align: middle;">
                    <p style= "width: 100%; font-weight:bold; text-align: center;">Reserva Legal</p>
                  </td>
                  <td width="7%" align="center" style= "border: 1px solid black; border-bottom: 0px; border-right: 0px; font-weight:bold; vertical-align: middle;">
                    <p style= "width: 100%; font-weight:bold; text-align: center;">Otras Reservas</p>
                  </td>
                  <td width="7%" align="center" style= "border: 1px solid black; border-bottom:0px; border-right: 0px;  font-weight:bold; vertical-align: middle;">
                    <p style= "width: 100%; font-weight:bold; text-align: center;">Resultados Acumulados</p>
                  </td>
                  <td width="7%" align="center" style= "border: 1px solid black;  border-bottom:0px; font-weight:bold; vertical-align: middle;">
                    <p style= "width: 100%; font-weight:bold; text-align: center;">TOTAL</p>
                  </td>
              </tr>
          </thead>
          <tbody>
              <tr>
                  <td align = "center" style="border:1px solid black; border-bottom:0; border-right:0; text-align:center; font-weight:bold; vertical-align: middle">${account.title1}</td>
                  <td align = "center" style="border:1px solid black; border-bottom:0; border-right:0; text-align:center; font-weight:bold; vertical-align: middle">0.00</td>
                  <td align = "center" style="border:1px solid black; border-bottom:0; border-right:0; text-align:center; font-weight:bold; vertical-align: middle">0.00</td>
                  <td align = "center" style="border:1px solid black; border-bottom:0; border-right:0; text-align:center; font-weight:bold; vertical-align: middle">0.00</td>
                  <td align = "center" style="border:1px solid black; border-bottom:0; border-right:0; text-align:center; font-weight:bold; vertical-align: middle">0.00</td>
                  <td align = "center" style="border:1px solid black; border-bottom:0; border-right:0; text-align:center; font-weight:bold; vertical-align: middle">0.00</td>
                  <td align = "center" style="border:1px solid black; border-bottom:0; border-right:0; text-align:center; font-weight:bold; vertical-align: middle">0.00</td>
                  <td align = "center" style="border:1px solid black; border-bottom:0; border-right:0; text-align:center; font-weight:bold; vertical-align: middle">0.00</td>
                  <td align = "center" style="border:1px solid black; border-bottom:0; font-weight:bold; text-align:center; vertical-align: middle">0.00</td>
              </tr>
         <#list movements as key,mov>
              <tr>
                  <td align = "left" style="border:1px solid black; border-bottom:0; border-right:0; text-align:center; vertical-align: middle">${mov.desc}</td>
                  <td align = "center" style="border:1px solid black; border-bottom:0; border-right:0; text-align:center; vertical-align: middle">${mov.pos1}</td>
                  <td align = "center" style="border:1px solid black; border-bottom:0; border-right:0; text-align:center; vertical-align: middle">${mov.pos2}</td>
                  <td align = "center" style="border:1px solid black; border-bottom:0; border-right:0; text-align:center; vertical-align: middle">${mov.pos3}</td>
                  <td align = "center" style="border:1px solid black; border-bottom:0; border-right:0; text-align:center; vertical-align: middle">${mov.pos4}</td>
                  <td align = "center" style="border:1px solid black; border-bottom:0; border-right:0; text-align:center; vertical-align: middle">${mov.pos5}</td>
                  <td align = "center" style="border:1px solid black; border-bottom:0; border-right:0; text-align:center; vertical-align: middle">${mov.pos6}</td>
                  <td align = "center" style="border:1px solid black; border-bottom:0; border-right:0; text-align:center; vertical-align: middle">${mov.pos7}</td>
                  <td align = "center" style="border:1px solid black; font-weight:bold; border-bottom:0; text-align:center; vertical-align: middle">${mov.pos8}</td>
              </tr>
         </#list>
              <tr>
                  <td align="center" style="border:1px solid black; border-right:0; text-align:center;  font-weight:bold; font-weight:bold; vertical-align: middle">${account.title2}</td>
                  <td align = "center" style="border:1px solid black; border-right:0; text-align:center; font-weight:bold; font-weight:bold; vertical-align: middle">${vTotals.totalv1}</td>
                  <td align = "center" style="border:1px solid black; border-right:0; text-align:center; font-weight:bold; font-weight:bold; vertical-align: middle">${vTotals.totalv2}</td>
                  <td align = "center" style="border:1px solid black; border-right:0; text-align:center; font-weight:bold; font-weight:bold; vertical-align: middle">${vTotals.totalv3}</td>
                  <td align = "center" style="border:1px solid black; ; border-right:0; text-align:center; font-weight:bold; font-weight:bold; vertical-align: middle">${vTotals.totalv4}</td>
                  <td align = "center" style="border:1px solid black;  border-right:0; text-align:center; font-weight:bold; font-weight:bold; vertical-align: middle">${vTotals.totalv5}</td>
                  <td align = "center" style="border:1px solid black; border-right:0; text-align:center; font-weight:bold; font-weight:bold; vertical-align: middle">${vTotals.totalv6}</td>
                  <td align = "center" style="border:1px solid black;  border-right:0; text-align:center; font-weight:bold; font-weight:bold; vertical-align: middle">${vTotals.totalv7}</td>
                  <td align = "center" style="border:1px solid black;  text-align:center; vertical-align:middle; font-weight:bold; ">${vTotals.totalv8}</td>
              </tr>
          </tbody>
        </table>
    </body>

</pdf>

