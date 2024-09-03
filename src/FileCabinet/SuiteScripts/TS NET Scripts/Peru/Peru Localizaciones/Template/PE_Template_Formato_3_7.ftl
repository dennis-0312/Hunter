<#setting locale="en_US">
<#assign data = input.data?eval >
<#assign cabecera = data.cabecera >
<#assign AgregarelVAN = data.AgregarelVAN >
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
   <head>

      <meta name="title" value="Formato 3.4" />
      <macrolist>
         <macro id = "cabecera">
            <table width="100%">
               <tr>
                  <td colspan="3" align="center" style= "font-weight: bold;">FORMATO 3.7: "LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 20 - MERCADERÍAS Y LA CUENTA 21 - PRODUCTOS TERMINADOS</td>
               </tr>
               <tr>
                  <td width="30%" align="left" style= "font-weight: bold;">EJERCICIO</td>
                  <td width="5%" align="left" style= "font-weight: bold;">:</td>
                  <td width="65%" align="left">${cabecera.Anio}</td>
               </tr>
               <tr>
                  <td width="30%" align="left" style= "font-weight: bold;">RUC</td>
                  <td width="5%" align="left" style= "font-weight: bold;">:</td>
                  <td width="65%" align="left">${cabecera.ruc}</td>
               </tr>
               <tr>
                  <td width="30%" align="left" style= "font-weight: bold;">RAZON SOCIAL</td>
                  <td width="5%" align="left" style= "font-weight: bold;">:</td>
                  <td width="65%" align="left">${cabecera.razonSocial}</td>
               </tr>
               <tr>
                  <td width="30%" align="left" style= "font-weight: bold;">MÉTODO DE EVALUACIÓN APLICADO</td>
                  <td width="5%" align="left" style= "font-weight: bold;">:</td>
                  <td width="65%" align="left">1 Promedio Ponderado</td>
               </tr>
            </table>
         </macro>
      </macrolist>
   </head>
   <body background-color="white" font-size="8" size="A4-landscape" header = "cabecera" header-height="30mm" footer-height="10mm">
     <div></div>
     ${AgregarelVAN}
  </body>
</pdf>