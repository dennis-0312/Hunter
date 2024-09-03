<#assign data = input.data?eval >
<#assign company = data.company >
<#assign total = data.total >
<#assign movements = data.movements >
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
   <head>
      <meta name="title" value="Formato 13.1" />
      <macrolist>
         <macro id = "cabecera">
            <table width="100%">
               <tr>
                  <td colspan="4" width="100%" align="center"><b>${company.firtsTitle}</b></td>
               </tr>
                <tr>
                    <td width="50%" align="left"><b>PERIODO</b></td>
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
               <tr>
                    <td width="50%" align="left"><b>ESTABLECIMIENTO (1):</b></td>
                    <td width="5%" align="right"><b>:</b></td>
                    <td width="30%" align="left">9999</td>
                    <td width="15%" align="left"></td>
               </tr>
               <tr>
                    <td width="50%" align="left"><b>CÓDIGO DE LA EXISTENCIA:</b></td>
                    <td width="5%" align="right"><b>:</b></td>
                    <td width="30%" align="left">01</td>
                    <td width="15%" align="left"></td>
               </tr>
               <tr>
                    <td width="50%" align="left"><b>TIPO (TABLA 5):</b></td>
                    <td width="5%" align="right"><b>:</b></td>
                    <td width="30%" align="left">MERCADERÍAS</td>
                    <td width="15%" align="left"></td>
               </tr>
               <tr>
                    <td width="50%" align="left"><b>DESCRIPCIÓN:</b></td>
                    <td width="5%" align="right"><b>:</b></td>
                    <td width="30%" align="left">MERCADERÍAS</td>
                    <td width="15%" align="left"></td>
               </tr>
               <tr>
                    <td width="50%" align="left"><b>CÓDIGO DE LA UNIDAD DE MEDIDA (TABLA 6):</b></td>
                    <td width="5%" align="right"><b>:</b></td>
                    <td width="30%" align="left"></td>
                    <td width="15%" align="left"></td>
               </tr>
               <tr>
                    <td width="50%" align="left"><b>MÉTODO DE VALUACIÓN:</b></td>
                    <td width="5%" align="right"><b>:</b></td>
                    <td width="30%" align="left">PROMEDIO PONDERADO</td>
                    <td width="15%" align="left"></td>
               </tr>
            </table>
         </macro>
          <macro id = "piepagina">
            <table width="100%">
                <tr>
                  <td colspan="4" width="100%" align="left"><b>(1) Dirección del Establecimiento o Código según el Registro Único de Contribuyentes.</b></td>
                </tr>
            </table>
          </macro>
      </macrolist>
   </head>
    <body background-color="white" font-size="7" size="A4-landscape" header = "cabecera"  footer = "piepagina" header-height="45mm" footer-height="10mm">
        <table style="font-family: Verdana, Arial, Helvetica, sans-serif; width:100%">
          <thead>
              <tr>
                  <td colspan="4" align="center" style= "border: 1px solid black; border-bottom: 0px; border-right: 0px; font-weight:bold; vertical-align: middle;">
                    <table>
                        <tr>
                            <td align="center"><b>DOCUMENTO DE TRASLADO, COMPROBANTE DE PAGO,</b></td>
                        </tr>
                        <tr>
                            <td align="center"><b>DOCUMENTO INTERNO O SIMILAR</b></td>
                        </tr>
                    </table>
                  </td>
                  <td rowspan="2" align="center" style= "border: 1px solid black; border-right: 0px; font-weight:bold; vertical-align: middle;">
                      <table>
                          <tr>
                              <td align="center"><b>TIPO DE </b></td>
                          </tr>
                          <tr>
                              <td align="center"><b>OPERACIÓN</b></td>
                          </tr>
                          <tr>
                              <td align="center"><b>(TABLA 12)</b></td>
                          </tr>
                      </table>
                  </td>
                  <td colspan="3" align="center" style= "border: 1px solid black; border-bottom: 0px; border-right: 0px; font-weight:bold; vertical-align: middle;"><b>ENTRADAS</b></td>
                  <td colspan="3" align="center" style= "border: 1px solid black; border-bottom: 0px; border-right: 0px; font-weight:bold; vertical-align: middle;"><b>SALIDAS</b></td>
                  <td colspan="3" align="center" style= "border: 1px solid black; border-bottom: 0px; font-weight:bold; vertical-align: middle;"><b>SALDO FINAL</b></td>
              </tr>
              <tr>
                  <td align="center" style= "border: 1px solid black; border-right: 0px; font-weight:bold; vertical-align: middle;"><b>FECHA</b></td>
                  <td align="center" style= "border: 1px solid black; border-right: 0px; font-weight:bold; vertical-align: middle;">
                      <table>
                          <tr>
                              <td align="center"><b>TIPO</b></td>
                          </tr>
                          <tr>
                              <td align="center"><b>(TABLA 10)</b></td>
                          </tr>
                      </table>
                  </td>
                  <td align="center" style= "border: 1px solid black; border-right: 0px; font-weight:bold; vertical-align: middle;"><b>SERIE</b></td>
                  <td align="center" style= "border: 1px solid black; border-right: 0px; font-weight:bold; vertical-align: middle;"><b>NÚMERO</b></td>
                  <td align="center" style= "border: 1px solid black; border-right: 0px; font-weight:bold; vertical-align: middle;"><b>CANTIDAD</b></td>
                  <td align="center" style= "border: 1px solid black; border-right: 0px; font-weight:bold; vertical-align: middle;">
                      <table>
                          <tr>
                              <td align="center"><b>COSTO</b></td>
                          </tr>
                          <tr>
                              <td align="center"><b>UNITARIO</b></td>
                          </tr>
                      </table>
                  </td>
                  <td align="center" style= "border: 1px solid black; border-right: 0px; font-weight:bold; vertical-align: middle;"><b>COSTO TOTAL</b></td>
                  <td align="center" style= "border: 1px solid black; border-right: 0px; font-weight:bold; vertical-align: middle;"><b>CANTIDAD</b></td>
                  <td align="center" style= "border: 1px solid black; border-right: 0px; font-weight:bold; vertical-align: middle;">
                      <table>
                          <tr>
                              <td align="center"><b>COSTO</b></td>
                          </tr>
                          <tr>
                              <td align="center"><b>UNITARIO</b></td>
                          </tr>
                      </table>
                  </td>
                  <td align="center" style= "border: 1px solid black; border-right: 0px; font-weight:bold; vertical-align: middle;"><b>COSTO TOTAL</b></td>  
                  <td align="center" style= "border: 1px solid black; border-right: 0px; font-weight:bold; vertical-align: middle;"><b>CANTIDAD</b></td>
                  <td align="center" style= "border: 1px solid black; border-right: 0px; font-weight:bold; vertical-align: middle;">
                      <table>
                          <tr>
                              <td align="center"><b>COSTO</b></td>
                          </tr>
                          <tr>
                              <td align="center"><b>UNITARIO</b></td>
                          </tr>
                      </table>
                  </td>
                  <td align="center" style= "border: 1px solid black; font-weight:bold; vertical-align: middle;"><b>COSTO TOTAL</b></td>                
              </tr>
          </thead>
          <tbody>
              <#list movements as key,mov>
                  <tr>
                      <td align = "center">${mov.columna01}</td>
                      <td align = "center">${mov.columna02}</td>
                      <td align = "center">${mov.columna03}</td>
                      <td align = "center">${mov.columna04}</td>
                      <td align = "center">${mov.columna05}</td>
                      <td align = "center">${mov.columna06}</td>
                      <td align = "center">${mov.columna07}</td>
                      <td align = "center">${mov.columna08}</td>
                      <td align = "center">${mov.columna09}</td>
                      <td align = "center">${mov.columna10}</td>
                      <td align = "center">${mov.columna11}</td>
                      <td align = "center">${mov.columna12}</td>
                      <td align = "center">${mov.columna13}</td>
                      <td align = "center">${mov.columna14}</td>
                  </tr>
              </#list>
                  <tr>

                      <td width="25%" align = "center" style= "border-top:1px solid black"></td>
                      <td width="25%" align = "center" style= "border-top:1px solid black"></td>
                      <td width="25%" align = "center" style= "border-top:1px solid black"></td>
                      <td width="25%" align = "center" style= "border-top:1px solid black"></td>
                      <td width="25%" align = "center" style= "border-top:1px solid black"><b>TOTALES</b></td>
                      <td width="25%" align = "center" style= "border-top:1px solid black">${total.cantidadUnidFisicas}</td>
                      <td width="25%" align = "center" style= "border-top:1px solid black">${total.costoUnitBienIng}</td>
                      <td width="25%" align = "center" style= "border-top:1px solid black">${total.costoTotalBienIng}</td>
                      <td width="25%" align = "center" style= "border-top:1px solid black">${total.cantUnidFisicasBnRe}</td>
                      <td width="25%" align = "center" style= "border-top:1px solid black">${total.costUnitBienRet}</td>
                      <td width="25%" align = "center" style= "border-top:1px solid black">${total.costTotalBienRet}</td>
                      <td width="25%" align = "center" style= "border-top:1px solid black">${total.cantUnidFisicasSalFinal}</td>
                      <td width="25%" align = "center" style= "border-top:1px solid black">${total.costUnitSalFinal}</td>
                      <td width="25%" align = "center" style= "border-top:1px solid black">${total.costTotalSalFinal}</td>
                  </tr>
          </tbody>
        </table>
    </body>

</pdf>