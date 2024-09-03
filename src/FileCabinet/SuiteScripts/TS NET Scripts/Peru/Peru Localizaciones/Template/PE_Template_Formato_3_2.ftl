<#setting locale="en_US">
<#assign data = input.data?eval >
<#assign company = data.company >
<#assign cabecera = data.cabecera >
<#assign total = data.total >
<#assign movements = data.movements >
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
   <head>
      <meta name="title" value="Formato 1.2" />
      <macrolist>
         <macro id = "cabecera">
            <table width="100%"  style= "font-size: 8px;">
               <tr>
                  <td colspan="3" align="center" style= "font-weight: bold;">FORMATO 3.2: "LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 10 - EFECTIVO Y EQUIVALENTES DE EFECTIVO"</td>
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
                  <td width="40%" align="left" style= "font-weight: bold;">RAZÓN SOCIAL</td>
                  <td width="5%" align="left" style= "font-weight: bold;">:</td>
                  <td width="55%" align="left">${cabecera.razonSocial}</td>
               </tr>
            </table>
         </macro>
      </macrolist>
   </head>
   <body background-color="white" font-size="6" size="A4" header="cabecera" header-height="30mm">
      <table style="font-family: Verdana, Arial, Helvetica, sans-serif; width:100%" >
         <thead>
            <tr>
            <td colspan="2" align = "center " style= "border-left: 1px solid black; border-top: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">CUENTA CONTABLE DIVISIONARIA</td>
            <td colspan="3" align = "center " style= "border-left: 1px solid black; border-top: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">REFERENCIA DE LA CUENTA</td>
            <td colspan="2" align = "center " style= "border-left: 1px solid black; border-right: 1px solid black; border-top: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">SALDO CONTABLE FINAL</td>
         </tr>
         <tr>
            <td align = "center " style= "border-left: 1px solid black; border-bottom: 1px solid black; border-top: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">CÓDIGO</td>
            <td align = "center " style= "border-left: 1px solid black; border-bottom: 1px solid black; border-top: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">DENOMINACIÓN</td>
            <td align = "center " style= "border-left: 1px solid black; border-bottom: 1px solid black; border-top: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;"><p style= "width: 100%; font-weight:bold; text-align: center;">ENTIDAD FINANCIERA (TABLA 3)</p></td>
            <td align = "center " style= "border-left: 1px solid black; border-bottom: 1px solid black; border-top: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;"><p style= "width: 100%; font-weight:bold; text-align: center;">NÚMERO DE LA CUENTA</p></td>
            <td align = "center " style= "border-left: 1px solid black; border-bottom: 1px solid black; border-top: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;"><p style= "width: 100%; font-weight:bold; text-align: center;">TIPO DE MONEDA (TABLA 4)</p></td>
            <td align = "center " style= "border-left: 1px solid black; border-bottom: 1px solid black; border-top: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">DEUDOR</td>
            <td align = "center " style= "border-left: 1px solid black; border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">ACREEDOR</td>
          </tr>
         </thead>
         <tbody>
         <#list movements as key,mov>
            <tr>
               <td align = "center">${mov.codigo}</td>
               <td align = "left">${mov.denominacion}</td>
               <td align = "center">${mov.entidadFinanciera}</td>
               <td align = "center">${mov.numeroCuenta}</td>
               <td align = "center">${mov.tipoMoneda}</td>

               <td align = "right"><#if mov.deudor == 0>0.00<#else>${mov.deudor?string["#,###.00"]}</#if></td>
               <td align = "right"><#if mov.acreedor == 0>0.00<#else>${mov.acreedor?string["#,###.00"]}</#if></td>

            </tr>
         </#list>
            <tr>
               <td colspan="4" align = "center " style= "border-top:1px solid black"></td>
               <td align = "right " style= "font-weight:bold; border-top:1px solid black">TOTALES</td>
               <td align = "right " style= "font-weight:bold; border-top:1px solid black"><#if total.totalDebito == 0>0.00<#else>${total.totalDebito?string["#,###.00"]}</#if></td>
               <td align = "right " style= "font-weight:bold; border-top:1px solid black"><#if total.totalCredito == 0>0.00<#else>${total.totalCredito?string["#,###.00"]}</#if></td>
            </tr>
         </tbody>
      </table>  
      
  </body>
</pdf>