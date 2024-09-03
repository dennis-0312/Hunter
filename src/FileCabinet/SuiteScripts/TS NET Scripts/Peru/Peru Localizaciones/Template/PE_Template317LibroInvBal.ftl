<#assign company = input.company >
<#assign totals = input.totals >
<#assign resultado = input.resultado >
<#assign movements = input.movements >
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
   <head>
      <meta name="title" value="Formato 3.17" />
      <macrolist>
         <macro id = "cabecera">
            <table width="100%">
               <tr>
                  <td colspan="4" width="100%" align="center"><b>${company.firtsTitle}</b></td>
               </tr>
                <tr>
                    <td width="50%" align="left"><b>EJERCICIO O PERIODO</b></td>
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
                    <td width="50%" align="left"><b>APELLIDOS Y NOMBRES, DENOMINACIÓN O RAZÓN SOCIAL</b></td>
                    <td width="5%" align="right"><b>:</b></td>
                    <td width="30%" align="left">${company.fourthTitle}</td>
                    <td width="15%" align="left"></td>
               </tr>
            </table>
         </macro>
      </macrolist>
   </head>
    <body background-color="white" font-size="7" size="A4-landscape" header = "cabecera" header-height="25mm" footer-height="10mm">
       <table style="font-family: Verdana, Arial, Helvetica, sans-serif; width:100%" >
            <tr>
               <td width="25%" colspan="2" rowspan="2" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">
                <table>
                  <tr><td align="center" style="text-align:center;">CUENTA Y SUBCUENTA</td></tr>
                  <tr><td align="center" style="text-align:center;">CONTABLE</td></tr>
                </table>  
                
               </td>
               <td width="25%" colspan="2" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">SALDOS INICIALES</td>
               <td width="25%" colspan="2" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">MOVIMIENTOS</td>
               <td width="25%" colspan="2" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">SALDOS FINALES</td>
               <td width="25%" colspan="2" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">
                  <table>
                    <tr><td align="center" style="text-align:center;">SALDOS FINALES DEL</td></tr>
                    <tr><td align="center" style="text-align:center;">BALANCE GENERAL</td></tr>
                  </table>  
               </td>
               <td width="25%" colspan="2" align = "center " style= "border:1px solid black; font-weight:bold">
                  <table>
                    <tr><td align="center" style="text-align:center;">SALDOS FINALES DEL</td></tr>
                    <tr><td align="center" style="text-align:center;">ESTADO DE PERDIDAS</td></tr>
                    <tr><td align="center" style="text-align:center;">Y GANANCIAS POR</td></tr>
                    <tr><td align="center" style="text-align:center;">NATURALEZA</td></tr>
                  </table>  
                </td>
               <td width="25%" colspan="2" align = "center " style= "border:1px solid black; font-weight:bold">
                  <table>
                    <tr><td align="center" style="text-align:center;">SALDOS FINALES DEL</td></tr>
                    <tr><td align="center" style="text-align:center;">ESTADO DE PERDIDAS</td></tr>
                    <tr><td align="center" style="text-align:center;">Y GANANCIAS POR</td></tr>
                    <tr><td align="center" style="text-align:center;">FUNCION</td></tr>
                  </table> 
               </td>
            </tr>
            <tr>
               <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold">DEUDOR</td>
               <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold">ACREDOR</td>
               <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold">DEBE</td>
               <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold">HABER</td>
               <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold">DEUDOR</td>
               <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold">ACREDOR</td>
               <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold">ACTIVO</td>
               <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold">PASIVO</td>
               <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold">PERDIDA</td>
               <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold">GANANCIA</td>
               <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold">PERDIDA</td>
               <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold">GANANCIA</td>
            </tr>
            <#list movements as mov>
                <tr>
                    <td width="25%" style= "border-right:1px solid black" align = "left">${mov.col1}</td>
                    <td width="25%" style= "border-right:1px solid black" align = "center">${mov.col2}</td>
                    <td width="25%" style= "border-right:1px solid black" align = "right">${mov.col3}</td>
                    <td width="25%" style= "border-right:1px solid black" align = "right">${mov.col4}</td>
                    <td width="25%" style= "border-right:1px solid black" align = "right">${mov.col5}</td>
                    <td width="25%" style= "border-right:1px solid black" align = "right">${mov.col6}</td>
                    <td width="25%" style= "border-right:1px solid black" align = "right">${mov.col7}</td>
                    <td width="25%" style= "border-right:1px solid black" align = "right">${mov.col8}</td>
                    <td width="25%" style= "border-right:1px solid black" align = "right">${mov.col9}</td>
                    <td width="25%" style= "border-right:1px solid black" align = "right">${mov.col10}</td>
                    <td width="25%" style= "border-right:1px solid black" align = "right">${mov.col11}</td>
                    <td width="25%" style= "border-right:1px solid black" align = "right">${mov.col12}</td>
                    <td width="25%" style= "border-right:1px solid black" align = "right">${mov.col13}</td>
                    <td width="25%" style= "border-right:1px solid black" align = "right">${mov.col14}</td>
                </tr>
            </#list>
             <tr>
                  <td width="25%" align = "center">${totals.col1}</td>
                  <td width="25%" align = "center">${totals.col2}</td>
                  <td width="25%" style= "border:1px solid black; font-weight:bold" align = "right">${totals.col3}</td>
                  <td width="25%" style= "border:1px solid black; font-weight:bold" align = "right">${totals.col4}</td>
                  <td width="25%" style= "border:1px solid black; font-weight:bold" align = "right">${totals.col5}</td>
                  <td width="25%" style= "border:1px solid black; font-weight:bold" align = "right">${totals.col6}</td>
                  <td width="25%" style= "border:1px solid black; font-weight:bold" align = "right">${totals.col7}</td>
                  <td width="25%" style= "border:1px solid black; font-weight:bold" align = "right">${totals.col8}</td>
                  <td width="25%" style= "border:1px solid black; font-weight:bold" align = "right">${totals.col9}</td>
                  <td width="25%" style= "border:1px solid black; font-weight:bold" align = "right">${totals.col10}</td>
                  <td width="25%" style= "border:1px solid black; font-weight:bold" align = "right">${totals.col11}</td>
                  <td width="25%" style= "border:1px solid black; font-weight:bold" align = "right">${totals.col12}</td>
                  <td width="25%" style= "border:1px solid black; font-weight:bold" align = "right">${totals.col13}</td>
                  <td width="25%" style= "border:1px solid black; font-weight:bold" align = "right">${totals.col14}</td>
               </tr>
               <tr>
                <td width="25%" align = "center"></td>
                <td width="25%" align = "center"></td>
                <td width="25%" align = "center"></td>
                <td width="25%" align = "center"></td>
                <td width="25%" align = "center"></td>
                <td width="25%" align = "center"></td>
                <td width="25%" align = "center"></td>
                <td colspan="3" width="25%" align = "center">RESULTADO DEL EJERCICIO O PERIODO</td>
                <td width="25%" style= "border:1px solid black; font-weight:bold" align = "right">${resultado.naturalezaPerdida}</td>
                <td width="25%" style= "border:1px solid black; font-weight:bold" align = "right">${resultado.naturalezaGanancia}</td>
                <td width="25%" style= "border:1px solid black; font-weight:bold" align = "right">${resultado.funcionPerdida}</td>
                <td width="25%" style= "border:1px solid black; font-weight:bold" align = "right">${resultado.funcionGanancia}</td>
             </tr>
             <tr>
                <td width="25%" align = "center"></td>
                <td width="25%" align = "center"></td>
                <td width="25%" align = "center"></td>
                <td width="25%" align = "center"></td>
                <td width="25%" align = "center"></td>
                <td width="25%" align = "center"></td>
                <td width="25%" align = "center"></td>
                <td width="25%" align = "center"></td>
                <td width="25%" align = "center"></td>
                <td width="25%" align = "center">TOTALES</td>
                <td width="25%" style= "border:1px solid black; font-weight:bold" align = "right">${resultado.totalNaturaleza}</td>
                <td width="25%" style= "border:1px solid black; font-weight:bold" align = "right">${resultado.totalNaturaleza}</td>
                <td width="25%" style= "border:1px solid black; font-weight:bold" align = "right">${resultado.totalFuncion}</td>
                <td width="25%" style= "border:1px solid black; font-weight:bold" align = "right">${resultado.totalFuncion}</td>
             </tr>
        </table>
    </body>
</pdf>