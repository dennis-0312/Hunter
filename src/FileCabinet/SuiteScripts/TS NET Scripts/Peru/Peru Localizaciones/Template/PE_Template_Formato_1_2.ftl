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
                  <td colspan="3" align="center" style= "font-weight: bold;">FORMATO 1.2: LIBRO CAJA Y BANCOS - DETALLE DE LOS MOVIMIENTOS DE LA CUENTA CORRIENTE</td>
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
               <tr>
                  <td width="40%" align="left" style= "font-weight: bold;">ENTIDAD FINANCIERA</td>
                  <td width="5%" align="left" style= "font-weight: bold;">:</td>
                  <td width="55%" align="left">${cabecera.entidadFinanciera}</td>
               </tr>
               <tr>
                  <td width="40%" align="left" style= "font-weight: bold;">CÓDIGO DE LA CUENTA CORRIENTE</td>
                  <td width="5%" align="left" style= "font-weight: bold;">:</td>
                  <td width="55%" align="left">${cabecera.codigoCuentaCorriente}</td>
               </tr>
            </table>
         </macro>
      </macrolist>
   </head>
   <body background-color="white" font-size="6" size="A4" header="cabecera" header-height="30mm">
      <table style="font-family: Verdana, Arial, Helvetica, sans-serif; width:100%" writing-mode="lr">
         <thead>
         <tr>
            <td rowspan="2" style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold; vertical-align: middle; text-align: left;">
              <table>
                <tr>
                  <td align="center" style="text-align:center;">NÚMERO</td>
                </tr>
                <tr>
                  <td align="center" style="text-align:center;">&nbsp;&nbsp;&nbsp;CORRELATIVO&nbsp;&nbsp;&nbsp;</td>
                </tr>
                <tr>
                  <td align="center" style="text-align:center;">DEL REGISTRO</td>
                </tr>
                <tr>
                  <td align="center" style="text-align:center;">O CÓDIGO</td>
                </tr>
                <tr>
                  <td align="center" style="text-align:center;">ÚNICO DE LA</td>
                </tr>
                <tr> 
                  <td align="center" style="text-align:center;">OPERACIÓN</td>
                </tr>
              </table>  
            </td>
            <td rowspan="2" align = "center " style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; vertical-align: middle; font-weight:bold">
              <table>
                <tr>
                  <td align="center" style="text-align:center;">FECHA</td>
                </tr>
                <tr>
                  <td align="center" style="text-align:center;">DE LA</td>
                </tr>
                <tr> 
                  <td align="center" style="text-align:center;">OPERACIÓN</td>
                </tr>
              </table>  
            </td>
            <td colspan="4" align = "center " style= "border-left: 1px solid black; border-top: 1px solid black; font-weight:bold; vertical-align: middle;">OPERACIONES BANCARIAS</td>
            <td colspan="2" align = "center " style= "border-left: 1px solid black; border-top: 1px solid black; font-weight:bold; vertical-align: middle;">CUENTA CONTABLE ASOCIADA</td>
            <td colspan="2" align = "center " style= "border-left: 1px solid black; border-top: 1px solid black; border-right: 1px solid black; font-weight:bold;  vertical-align: middle;">
              <table>
                <tr>
                  <td align="center" style="text-align:center;">SALDOS Y</td>
                </tr>
                <tr>
                  <td align="center" style="text-align:center;">MOVIMIENTOS</td>
                </tr>
              </table>  
            </td>
         </tr>
         <tr>
            <td align = "center " style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold; vertical-align: middle;">
              <table>
                <tr>
                  <td align="center" style="text-align:center;">&nbsp;&nbsp;&nbsp;&nbsp;MEDIO&nbsp;&nbsp;&nbsp;&nbsp;</td>
                </tr>
                <tr>
                  <td align="center" style="text-align:center;">DE PAGO</td>
                </tr>
                <tr> 
                  <td align="center" style="text-align:center;">(TABLA 1)</td>
                </tr>
              </table>  
            </td>
            <td align = "center " style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold; vertical-align: middle;">
              <table>
                <tr>
                  <td align="center" style="text-align:center;">DESCRIPCIÓN</td>
                </tr>
                <tr>
                  <td align="center" style="text-align:center;">DE LA</td>
                </tr>
                <tr> 
                  <td align="center" style="text-align:center;">OPERACIÓN</td>
                </tr>
              </table>  
            </td>
            <td align = "center " style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold; vertical-align: middle;"> 
              <table>
                <tr>
                  <td align="center" style="text-align:center;">APELLIDOS Y</td>
                </tr>
                <tr>
                  <td align="center" style="text-align:center;">NOMBRES,</td>
                </tr>
                <tr> 
                  <td align="center" style="text-align:center;">DENOMINACIÓN</td>
                </tr>
                <tr> 
                  <td align="center" style="text-align:center;">O RAZÓN</td>
                </tr>
                <tr> 
                  <td align="center" style="text-align:center;">SOCIAL</td>
                </tr>
              </table>  
            </td>
            <td align = "center " style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold; vertical-align: middle;">   
              <table>
                <tr>
                  <td align="center" style="text-align:center;">NUMERO DE</td>
                </tr>
                <tr>
                  <td align="center" style="text-align:center;">TRANSACCIÓN</td>
                </tr>
                <tr>
                  <td align="center" style="text-align:center;">BANCARIA,</td>
                </tr>
                <tr>
                  <td align="center" style="text-align:center;">DE DOCUMENTO</td>
                </tr>
                <tr> 
                  <td align="center" style="text-align:center;">SUSTENTATORIO</td>
                </tr>
                <tr> 
                  <td align="center" style="text-align:center;">O DE CONTROL</td>
                </tr>
                <tr> 
                  <td align="center" style="text-align:center;">INTERNO DE LA</td>
                </tr>
                <tr> 
                  <td align="center" style="text-align:center;">OPERACIÓN</td>
                </tr>
              </table>  
            </td>
            <td align = "center " style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold; vertical-align: middle;">CÓDIGO</td>
            <td align = "center " style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold; vertical-align: middle;">DENOMINACIÓN</td>
            <td align = "center " style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold; vertical-align: middle;">DEUDOR</td>
            <td align = "center " style= "border: 1px solid black; font-weight:bold; vertical-align: middle;">ACREEDOR</td>
         </tr>
         </thead>
         <tbody>
         
         <#list movements as key,mov>
            <tr>
               <td align = "center ">${mov.codUniOperacion}</td>
               <td align = "center ">${mov.fechaOperacion}</td>
               <td align = "left ">${mov.medioPago}</td>
               <td align = "left "><p style="width:60px;margin-top: 0;margin-bottom: 0;hyphens: auto;word-wrap: break-word;word-break: break-all;">${mov.desOperacion}</p></td>
               <td align = "center "><p style="width:60px;margin-top: 0;margin-bottom: 0;hyphens: auto;word-wrap: break-word;word-break: break-all;">${mov.razonSocial}</p></td>
               <td align = "center ">${mov.numeroTransaccion}</td>
               <td align = "center ">${mov.codigoCuentaContable}</td>
               <td align = "left" ><p style="width:100px;margin-top: 0;margin-bottom: 0;hyphens: auto;word-wrap: break-word;word-break: break-all;">${mov.denominacionCuenta}</p></td>
               <td align = "right " >${mov.debito}</td>
               <td align = "right ">${mov.credito}</td>
            </tr>
            <#list jsonTransacionvine as item>
                   <#if mov.number == item.cantidadFor>
                     <tr >
                        <td align = "center "></td>
                        <td align = "center "></td>
                        <td align = "left "></td>
                        <td align = "left "></td>
                        <td align = "center "></td>
                        <td align = "center "></td>
                        <td align = "center "></td>
                        <td align = "left" >VAN</td>
                        <td align = "right " >${item.montovieneDebito}</td>
                        <td align = "right ">${item.montovieneCredito}</td>
                     </tr>
                  
                      <tr style="margin-top: 20px;">
                        <td align = "center "></td>
                        <td align = "center "></td>
                        <td align = "left "></td>
                        <td align = "left "></td>
                        <td align = "center "></td>
                        <td align = "center "></td>
                        <td align = "center "></td>
                        <td align = "left" >VIENE</td>
                        <td align = "right " >${item.montovieneDebito}</td>
                        <td align = "right ">${item.montovieneCredito}</td>
                     </tr>
                  </#if>
            </#list>
         </#list>
          <tr>
               <td colspan="7" align = "center" style= "border-top:1px solid black"></td>
               <td align = "right" style= "font-weight:bold; border-top:1px solid black">TOTALES</td>
               <td align = "right" style= "font-weight:bold; border-top:1px solid black">${total.totalDebito}</td>
               <td align = "right" style= "font-weight:bold; border-top:1px solid black">${total.totalCredito}</td>
            </tr>
            <tr>
               <td colspan="7"></td>
               <td align = "right" style= "font-weight:bold;">SALDO FINAL</td>
               <td align = "right" style= "font-weight:bold; border-top:1px solid black">${total.saldoDebito}</td>
               <td align = "right" style= "font-weight:bold; border-top:1px solid black">${total.saldoCredito}</td>
            </tr>
          
         </tbody>
      </table>  
  </body>
</pdf>