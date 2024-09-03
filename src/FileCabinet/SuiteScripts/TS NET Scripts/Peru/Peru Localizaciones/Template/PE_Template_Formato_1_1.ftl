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

      <meta name="title" value="Formato 1.1" />
      <macrolist>
         <macro id = "cabecera">
            <table width="100%">
               <tr>
                  <td colspan="3" align="center" style= "font-weight: bold;">FORMATO 1.1: LIBRO CAJA Y BANCOS - DETALLE DE LOS MOVIMIENTOS DEL EFECTIVO</td>
               </tr>
               <tr>
                  <td width="40%" align="left" style= "font-weight: bold;">PERIODO</td>
                  <td width="5%" align="left" style= "font-weight: bold;">:</td>
                  <td width="55%" align="left">${cabecera.periodo}</td>
               </tr>
               <tr>
                  <td width="40%" align="left" style= "font-weight: bold;">RUC</td>
                  <td width="5%" align="left" style= "font-weight: bold;">:</td>
                  <td width="55%" align="left">${cabecera.ruc}</td>
               </tr>
               <tr>
                  <td width="40%" align="left" style= "font-weight: bold;">APELLIDOS Y NOMBRES, DENOMINACIÓN O RAZON SOCIAL</td>
                  <td width="5%" align="left" style= "font-weight: bold;">:</td>
                  <td width="55%" align="left">${cabecera.razonSocial}</td>
               </tr>
            </table>
         </macro>
      </macrolist>
   </head>
   <body background-color="white" font-size="8" size="A4-landscape" header = "cabecera" header-height="22mm" footer-height="10mm">
      <table style="font-family: Verdana, Arial, Helvetica, sans-serif; width:100%" >
         <thead>
            <tr>
               <td rowspan="2" style= "border: 1px solid black; border-right: 0px; font-weight:bold; vertical-align: middle;"><p style= "width: 100%; font-weight:bold; text-align: center;">NÚMERO CORRELATIVO DEL REGISTRO O CÓDIGO ÚNICO DE LA OPERACIÓN</p></td>
               <td rowspan="2" style= "border: 1px solid black; border-right: 0px; font-weight:bold; vertical-align: middle; text-align: center;"><p style= "width: 100%; font-weight:bold; text-align: center;">FECHA DE LA OPERACIÓN</p></td>
               <td rowspan="2" style= "border: 1px solid black; border-right: 0px; font-weight:bold; vertical-align: middle; text-align: center;"><p style= "width: 100%; font-weight:bold; text-align: center;">DESCRIPCIÓN DE LA OPERACIÓN</p></td>
               <td colspan="2" style= "border: 1px solid black; border-right: 0px; font-weight:bold; vertical-align: middle; text-align: center;"><p style= "width: 100%; font-weight:bold; text-align: center;">CUENTA CONTABLE ASOCIADA</p></td>
               <td colspan="2" style= "border: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;"><p style= "width: 100%; font-weight:bold; text-align: center;">SALDO Y MOVIMIENTOS</p></td>
            </tr>
            <tr>
               <td align="center" style= "border: 1px solid black; border-right: 0px; border-top: 0px; font-weight:bold; vertical-align: middle; text-align: center;">CÓDIGO</td>
               <td align="center" style= "border: 1px solid black; border-right: 0px; border-top: 0px; font-weight:bold; vertical-align: middle; text-align: center;">DENOMINACIÓN</td>
               <td align="center" style= "border: 1px solid black; border-right: 0px; border-top: 0px; font-weight:bold; vertical-align: middle; text-align: center;">DEUDOR</td>
               <td align="center" style= "border: 1px solid black; border-top: 0px; font-weight:bold; vertical-align: middle; text-align: center;">ACREEDOR</td>
            </tr>
            <!--
            <tr>
               <td rowspan="2" align = "center " style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold">
                  <table>
                     <tr>
                        <td align = "center " style="text-align: center;">NÚMERO CORRELATIVO DEL REGISTRO</td>
                     </tr>
                     <tr>
                        <td align = "center " style="text-align: center;">O CÓDIGO ÚNICO DE LA OPERACIÓN</td>
                     </tr>
                  </table>
               </td>
               <td rowspan="2" align = "center " style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold">
                  <table>
                     <tr>
                        <td align = "center " style="text-align: center;">FECHA DE LA</td>
                     </tr>
                     <tr>
                        <td align = "center " style="text-align: center;">OPERACIÓN</td>
                     </tr>
                  </table>
               </td>
               <td rowspan="2" align = "center " style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold">
                  <table>
                     <tr>
                        <td align = "center " style="text-align: center;">DESCRIPCION DE</td>
                     </tr>
                     <tr>
                        <td align = "center " style="text-align: center;">LA OPERACIÓN</td>
                     </tr>
                  </table>
               </td>
               <td colspan="2" align = "center " style= "border-left: 1px solid black; border-top: 1px solid black; font-weight:bold">CUENTA CONTABLE ASOCIADA</td>
               <td width="25%" colspan="2" align = "center " style= "border-left: 1px solid black; border-top: 1px solid black; border-right: 1px solid black; font-weight:bold">SALDOS Y MOVIMIENTOS</td>
            </tr>
            <tr>
               <td align = "center " style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold">CÓDIGO</td>
               <td align = "center " style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold">DENOMINACIÓN</td>
               <td align = "center " style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold">DEUDOR</td>
               <td align = "center " style= "border: 1px solid black; font-weight:bold">ACREEDOR</td>
            </tr>
            -->
         </thead>
         <tbody>
         <#list movements as key,mov>
            <tr>
               <td align = "center ">${mov.codUniOperacion}</td>
               <td align = "center ">${mov.fechaOperacion}</td>
               <td align = "left " style="white-space: nowrap;">${mov.desOperacion}</td>
               <td align = "center ">${mov.numeroCuenta}</td>
               <td align = "center "  style=" white-space: nowrap;">${mov.denominacion}</td>
               <td align = "right " >${mov.debito}</td>
               <td align = "right ">${mov.credito}</td>
            </tr>
            <#list jsonTransacionvine as item>
                   <#if mov.number == item.cantidadFor>
                     <tr>
                        <td align = "center "></td>
                        <td align = "center "></td>
                        <td align = "left "></td>
                        <td align = "center "></td>
                        <td align = "center "  >VAN</td>
                        <td align = "right " >${item.montovienedebito}</td>
                        <td align = "right ">${item.montovieneCredito}</td>
                        
                     </tr>
                  
                     <tr>
                        <td align = "center "></td>
                        <td align = "center "></td>
                        <td align = "left "></td>
                        <td align = "center "></td>
                        <td align = "center "  >VIENE</td>
                        <td align = "right " >${item.montovienedebito}</td>
                        <td align = "right ">${item.montovieneCredito}</td>
                     </tr>
                  </#if>
            </#list>
         </#list>
            <tr>
               <td colspan="4" align = "center" style= "border-top:1px solid black"></td>
               <td align = "right" style= "font-weight:bold; border-top:1px solid black">TOTALES</td>
               <td align = "right" style= "font-weight:bold; border-top:1px solid black">${total.totalDebito}</td>
               <td align = "right" style= "font-weight:bold; border-top:1px solid black">${total.totalCredito}</td>
            </tr>
            <tr>
               <td colspan="4"></td>
               <td align = "right" style= "font-weight:bold;">SALDO FINAL</td>
               <td align = "right" style= "font-weight:bold; border-top:1px solid black">${total.saldoDebito}</td>
               <td align = "right" style= "font-weight:bold; border-top:1px solid black">${total.saldoCredito}</td>
            </tr>
         </tbody>
      </table>  
  </body>
</pdf>