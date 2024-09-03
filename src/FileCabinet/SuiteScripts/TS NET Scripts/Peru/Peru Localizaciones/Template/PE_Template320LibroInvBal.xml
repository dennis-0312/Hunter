<#assign data = input.data?eval >
<#assign company = data.company >
<#assign totals = data.totals >
<#assign totales = data.totales >
<#assign movements = data.movements >
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
   <head>
      <meta name="title" value="Formato 3.20" />
      <macrolist>
         <macro id = "cabecera">
            <table width="100%">
               <tr>
                  <td colspan="4" width="100%" align="center"><b>FORMATO 3.20: "LIBRO DE INVENTARIOS Y BALANCES - ESTADO DE GANANCIAS Y PÉRDIDAS POR FUNCIÓN DEL 01.01 AL 31.12"</b></td>
               </tr>
                <tr>
                    <td width="50%" align="left"><b>EJERCICIO</b></td>
                    <td width="5%" align="right"><b>:</b></td>
                    <td width="30%" align="left">${company.secondTitle}</td>
                    <td width="15%" align="left"></td>
               </tr>
                <tr>
                    <td width="50%" align="left"><b>RUC</b></td>
                    <td width="5%" align="right"><b>:</b></td>
                    <td width="30%" align="left">${company.thirdTitle}</td>
                    <td width="15%" align="left"></td>
               </tr>
                <tr>
                    <td width="50%" align="left"><b>RAZON SOCIAL</b></td>
                    <td width="5%" align="right"><b>:</b></td>
                    <td width="30%" align="left">${company.fourthTitle}</td>
                    <td width="15%" align="left"></td>
               </tr>
            </table>
         </macro>
      </macrolist>
   </head>
    <body background-color="white" font-size="8" size="A4" header="cabecera" header-height="25mm" footer-height="10mm">
       <table style="font-family: Verdana, Arial, Helvetica, sans-serif; width:100%" >
            <tr>
               <td width="70%" align = "center " style= "border:1px solid black; font-weight:bold; padding-top:15px;">DESCRIPCIÓN</td>
               <td width="30%" align = "center " style= "border:1px solid black; font-weight:bold">
                  <table>
                     <tr><td align="center" style="text-align:center;">EJERCICIO O</td></tr>
                     <tr><td align="center" style="text-align:center;">PERIODO</td></tr>
                   </table>
               </td>
            </tr>
            <tr>
               <td></td>
               <td></td>
            </tr>
            <tr>
               <td style="border-left: 1px solid black; border-top: 1px solid black;">Ventas Netas (ingresos operacionales)</td>
               <td align="right" style="border-left: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;">${totales.ventas_netas_ingresos_operacionales}</td>
            </tr>
            <tr>
               <td style="border-left: 1px solid black; border-top: 1px solid black;">Otros Ingresos Operacionales</td>
               <td align="right"  style="border-left: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;">${totales.otros_ingresos_operacionales}</td>
            </tr>
            <tr>
               <td align="center" style="border-left: 1px solid black; border-top: 1px solid black;"><b>Total de Ingresos Brutos</b></td>
               <td align="right"  style="border-left: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;"><b>${totales.total_ingresos_brutos}</b></td>
            </tr>
            <tr>
               <td style="border-top: 1px solid black;"></td>
               <td style="border-top: 1px solid black;"></td>
            </tr>
            <tr>
               <td style="border-left: 1px solid black; border-top: 1px solid black;">Costo de ventas</td>
               <td align="right"  style="border-left: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;">${totales.costo_de_ventas}</td>
            </tr>
            <tr>
               <td align="center" style="border-left: 1px solid black; border-top: 1px solid black;"><b>Utilidad Bruta</b></td>
               <td align="right"  style="border-left: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;"><b>${totales.utilidad_bruta}</b></td>
            </tr>
            <tr>
               <td style="border-top: 1px solid black;"></td>
               <td style="border-top: 1px solid black;"></td>
            </tr>
            <tr>
               <td style="border-left: 1px solid black; border-top: 1px solid black;"><b>Gastos Operacionales</b></td>
               <td align="right"  style="border-left: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;"></td>
            </tr>
            <tr>
               <td style="border-left: 1px solid black; border-top: 1px solid black;">Gastos de Administración</td>
               <td align="right"  style="border-left: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;">${totales.gastos_de_administracion}</td>
            </tr>
            <tr>
               <td style="border-left: 1px solid black; border-top: 1px solid black;">Gastos de Venta</td>
               <td align="right"  style="border-left: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;">${totales.gastos_de_venta}</td>
            </tr>
            <tr>
               <td style="border-left: 1px solid black; border-top: 1px solid black;">Depreciación y Amortización</td>
               <td align="right"  style="border-left: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;">${totales.depreciacion_y_amortizacion}</td>
            </tr>
            <tr>
               <td align="center" style="border-left: 1px solid black; border-top: 1px solid black;"><b>Utilidad Operativa</b></td>
               <td align="right"  style="border-left: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;"><b>${totales.utilidad_operativa}</b></td>
            </tr>
            <tr>
               <td style="border-top: 1px solid black;"></td>
               <td style="border-top: 1px solid black;"></td>
            </tr>
            <tr>
               <td style="border-left: 1px solid black; border-top: 1px solid black;"><b>Otros Ingresos (gastos)</b></td>
               <td align="right"  style="border-left: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;"></td>
            </tr>
            <tr>
               <td style="border-left: 1px solid black; border-top: 1px solid black;">Ingresos Financieros</td>
               <td align="right"  style="border-left: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;">${totales.ingresos_financieros}</td>
            </tr>
            <tr>
               <td style="border-left: 1px solid black; border-top: 1px solid black;">Gastos Financieros</td>
               <td align="right"  style="border-left: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;">${totales.gastos_financieros}</td>
            </tr>
            <tr>
               <td style="border-left: 1px solid black; border-top: 1px solid black;">Otros ingresos de gestión</td>
               <td align="right"  style="border-left: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;">${totales.otros_ingresos_de_gestion}</td>
            </tr>
            <tr>
               <td style="border-left: 1px solid black; border-top: 1px solid black;">Perdida por Diferencia de Cambio</td>
               <td align="right"  style="border-left: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;">${totales.perdida_por_diferencia_de_cambio}</td>
            </tr>
            <tr>
               <td style="border-left: 1px solid black; border-top: 1px solid black;">Ganancia por Diferencia de Cambio</td>
               <td align="right"  style="border-left: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;">${totales.ganancia_por_diferencia_de_cambio}</td>
            </tr>
            <tr>
               <td style="border-left: 1px solid black; border-top: 1px solid black;">Otros Gastos</td>
               <td align="right"  style="border-left: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;">${totales.otros_gastos}</td>
            </tr>
            <tr>
               <td style="border-left: 1px solid black; border-top: 1px solid black;">Resultados por Exposición a la Inflación</td>
               <td align="right"  style="border-left: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;">${totales.resultados_por_exposicion_a_la_inflacion}</td>
            </tr>
            <tr>
               <td style="border-top: 1px solid black;"></td>
               <td style="border-top: 1px solid black;"></td>
            </tr>
            <tr>
               <td align="center" style="border-left: 1px solid black; border-top: 1px solid black;"><b>Resultados antes de Participaciones</b></td>
               <td align="right"  style="border-left: 1px solid black;"></td>
            </tr>
            <tr>
               <td align="center" style="border-left: 1px solid black; border-top: 1px solid black;"><b>Impuesto a la Renta y Partidas Extraordinarias</b></td>
               <td align="right"  style="border-left: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;"><b>${totales.impuesto_a_la_renta_y_partidas_extraordinaria}</b></td>
            </tr>
            <tr>
               <td style="border-left: 1px solid black; border-top: 1px solid black;">Participaciones</td>
               <td align="right"  style="border-left: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;">${totales.participaciones}</td>
            </tr>
            <tr>
               <td style="border-left: 1px solid black; border-top: 1px solid black;">Impuesto a la Renta</td>
               <td align="right"  style="border-left: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;">${totales.impuesto_a_la_renta}</td>
            </tr>
            <tr>
               <td style="border-top: 1px solid black;"></td>
               <td style="border-top: 1px solid black;"></td>
            </tr>
            <tr>
               <td align="center" style="border-left: 1px solid black; border-top: 1px solid black;"><b>Resultados antes de Partidas Extraordinarias</b></td>
               <td align="right"  style="border-left: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;"><b>${totales.resultados_antes_de_partidas_extraordinarias}</b></td>
            </tr>
            <tr>
               <td style="border-left: 1px solid black; border-top: 1px solid black;">Ingresos Extraordinarios</td>
               <td align="right"  style="border-left: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;">${totales.ingresos_extraordinarios}</td>
            </tr>
            <tr>
               <td style="border-left: 1px solid black; border-top: 1px solid black;">Gastos Extraordinarios</td>
               <td align="right"  style="border-left: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;">${totales.gastos_extraordinarios}</td>
            </tr>
            <tr>
               <td style="border-top: 1px solid black;"></td>
               <td style="border-top: 1px solid black;"></td>
            </tr>
            <tr>
               <td align="center" style="border-left: 1px solid black; border-top: 1px solid black;"><b>Resultado Antes de Interés Minoritario</b></td>
               <td align="right"  style="border-left: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;"><b>${totales.resultado_antes_de_interes_minoritario}</b></td>
            </tr>
            <tr>
               <td style="border-left: 1px solid black; border-top: 1px solid black;">Interés Minoritario</td>
               <td align="right"  style="border-left: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;">${totales.interes_minoritario}</td>
            </tr>
            <tr>
               <td style="border-top: 1px solid black;"></td>
               <td style="border-top: 1px solid black;"></td>
            </tr>
            <tr>
               <td align="center" style="border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black;"><b>Utilidad (Pérdida) Neta del Ejercicio</b></td>
               <td align="right"  style="border: 1px solid black;"><b>${totales.utilidad_perdida_neta_del_ejercicio}</b></td>
            </tr>
        </table>
    </body>
</pdf>