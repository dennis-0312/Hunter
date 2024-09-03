<#setting locale="en_US">
<#assign data = input.data?eval >
<#assign company = data.company >
<#assign cabecera = data.cabecera >
<#assign total = data.total >
<#assign movements = data.movements >
<#assign jsonTransacionvine = data.jsonTransacionvine >
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
   <head>
      <meta name="title" value="Formato 1.2" />
      <macrolist>
         <macro id = "cabecera">
            <table width="100%"  style= "font-size: 8px;">
               <tr>
                  <td colspan="3" align="center" style= "font-weight: bold;">FORMATO 3.9: "LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 34 - INTANGIBLES"</td>
               </tr>
               <tr>
                  <td width="40%" align="left" style= "font-weight: bold;">EJERCICIO</td>
                  <td width="5%" align="left" style= "font-weight: bold;">:</td>
                  <td width="55%" align="left">${cabecera.periodo}</td>
               </tr>
               <tr>
                  <td width="40%" align="left" style= "font-weight: bold;">RUC</td>
                  <td width="5%" align="left" style= "font-weight: bold;">:</td>
                  <td width="55%" align="left">${cabecera.ruc}</td>
               </tr>
               <tr>
                  <td width="40%" align="left" style= "font-weight: bold;">RAZON SOCIAL</td>
                  <td width="5%" align="left" style= "font-weight: bold;">:</td>
                  <td width="55%" align="left">${cabecera.razonSocial}</td>
               </tr>
               <#--  <tr>
                  <td width="40%" align="left" style= "font-weight: bold;">ENTIDAD FINANCIERA</td>
                  <td width="5%" align="left" style= "font-weight: bold;">:</td>
                  <td width="55%" align="left">${cabecera.entidadFinanciera}</td>
               </tr>  -->
               <#--  <tr>
                  <td width="40%" align="left" style= "font-weight: bold;">CÓDIGO DE LA CUENTA CORRIENTE</td>
                  <td width="5%" align="left" style= "font-weight: bold;">:</td>
                  <td width="55%" align="left">${cabecera.codigoCuentaCorriente}</td>
               </tr>  -->
            </table>
         </macro>
      </macrolist>
   </head>
   <body background-color="white" font-size="6" size="A4" header="cabecera" header-height="30mm">
      <table style="font-family: Verdana, Arial, Helvetica, sans-serif; width:100%" >
         <thead>
         <tr>
            <td align = "center" style= "border-left: 1px solid black; border-bottom: 1px solid black; border-top: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;"><p style= "width: 100%; font-weight:bold; text-align: center;">FECHA DE INICIO DE LA OPERACIÓN</p></td>
            <td align = "center" style= "border-left: 1px solid black; border-bottom: 1px solid black; border-top: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">DESCRIPCIÓN DEL INTAGIBLE</td>
            <td align = "center" style= "border-left: 1px solid black; border-bottom: 1px solid black; border-top: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;"><p style= "width: 100%; font-weight:bold; text-align: center;">TIPO DE INTANGIBLE (TABLA 7)</p></td>
            <td align = "center" style= "border-left: 1px solid black; border-bottom: 1px solid black; border-top: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;"><p style= "width: 100%; font-weight:bold; text-align: center;">VALOR CONTABLE DEL INTANGIBLE</p></td>
            <td align = "center" style= "border-left: 1px solid black; border-bottom: 1px solid black; border-top: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;"><p style= "width: 100%; font-weight:bold; text-align: center;">AMORTIZACIÓN CONTABLE ACUMULADA</p></td>
            <td align = "center" style= "border-left: 1px solid black; border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;"><p style= "width: 100%; font-weight:bold; text-align: center;">VALOR NETO CONTABLE DEL INTANGIBLE</p></td>
          </tr>
         </thead>
         <tbody>
         <#list movements as key,mov>
            <tr>
               <td align = "center">${mov.inicioOperacion}</td>
               <td align = "left"><p>${mov.descripcion}</p></td>
               <!--      <td align = "left"><p style="width:180px;margin-left: 0;margin-top: 0;margin-bottom: 0;margin-right: 0;hyphens: auto;word-wrap: break-word;word-break: break-all;">${mov.descripcion}</p></td> -->
               <td align = "center">${mov.tipo}</td>
               <td align = "right"><#if mov.valorContable == 0>0.00<#else>${mov.valorContable?string["#,###.00"]}</#if></td>
               <td align = "right"><#if mov.amortizacion == 0>0.00<#else>${mov.amortizacion?string["#,###.00"]}</#if></td>
               <td align = "right"><#if mov.valorNeto == 0>0.00<#else>${mov.valorNeto?string["#,###.00"]}</#if></td>

            </tr>
            <#list jsonTransacionvine as item>
                   <#if mov.number == item.cantidadFor>
                     <tr >
                      
                        
                        <td align = "center "></td>
                        <td align = "center "></td>
                        <td align = "center ">VAN</td>
                        <td align = "right" >${item.montovienevalorContable}</td>
                        <td align = "right " >${item.montovieneamortizacion}</td>
                        <td align = "right ">${item.montovienevalorNeto}</td>
                     </tr>
                  
                      <tr style="margin-top: 8px;">
                     
                      
                        <td align = "center "></td>
                        <td align = "center "></td>
                        <td align = "center ">VIENE</td>
                        <td align = "right" >${item.montovienevalorContable}</td>
                        <td align = "right " >${item.montovieneamortizacion}</td>
                        <td align = "right ">${item.montovienevalorNeto}</td>
                     </tr>
                  </#if>
            </#list>
         </#list>
            <tr>
               <td colspan="2" align = "center " style= "border-top:1px solid black"></td>
               <td align = "right " style= "font-weight:bold; border-top:1px solid black">TOTALES</td>
               <td align = "right " style= "font-weight:bold; border-top:1px solid black"><#if total.totalContable == 0>0.00<#else>${total.totalContable?string["#,###.00"]}</#if></td>
               <td align = "right " style= "font-weight:bold; border-top:1px solid black"><#if total.totalAmortizacion == 0>0.00<#else>${total.totalAmortizacion?string["#,###.00"]}</#if></td>
               <td align = "right " style= "font-weight:bold; border-top:1px solid black"><#if total.totalNeto == 0>0.00<#else>${total.totalNeto?string["#,###.00"]}</#if></td>
            </tr>
         </tbody>
      </table> 
  </body>
</pdf>