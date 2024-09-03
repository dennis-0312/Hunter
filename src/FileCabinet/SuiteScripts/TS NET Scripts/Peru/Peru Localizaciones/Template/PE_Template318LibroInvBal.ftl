<#assign data = input.data?eval >
<#assign company = data.company >
<#assign movements = data.movements >
<#assign operacion = movements.operacion>
<#assign inversion = movements.inversion>
<#assign financiamiento = movements.financiamiento>
<#assign totals = movements.totals>
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
   <head>
      <meta name="title" value="Formato 3.18" />
      <macrolist>
         <macro id = "cabecera">
            <table width="100%">
               <tr>
                  <td colspan="4" width="100%" align="center"><b>${company.firtsTitle}</b></td>
               </tr>
                <tr>
                    <td width="45%" align="left"><b>PERIODO</b></td>
                    <td width="5%" align="right"><b>:</b></td>
                    <td width="50%" align="left">${company.secondTitle}</td>
               </tr>
                <tr>
                    <td width="45%" align="left"><b>RUC</b></td>
                    <td width="5%" align="right"><b>:</b></td>
                    <td width="50%" align="left">${company.thirdTitle}</td>
               </tr>
                <tr>
                    <td width="45%" align="left"><b>RAZÓN SOCIAL</b></td>
                    <td width="5%" align="right"><b>:</b></td>
                    <td width="50%" align="left">${company.fourthTitle}</td>
               </tr>
            </table>
         </macro>
          <macro id = "piepagina">
            <table width="100%">
                <tr>
                  <td colspan="4" width="100%" align="left"></td>
                </tr>
            </table>
          </macro>
      </macrolist>
      <style type="text/css">
            * {
                <#if .locale=="zh_CN">font-family: NotoSans, NotoSansCJKsc, sans-serif;
                <#elseif .locale=="zh_TW">font-family: NotoSans, NotoSansCJKtc, sans-serif;
                <#elseif .locale=="ja_JP">font-family: NotoSans, NotoSansCJKjp, sans-serif;
                <#elseif .locale=="ko_KR">font-family: NotoSans, NotoSansCJKkr, sans-serif;
                <#elseif .locale=="th_TH">font-family: NotoSans, NotoSansThai, sans-serif;
                <#else>font-family: NotoSans, sans-serif;
                </#if>
            }

            table {
                font-size: 9pt;
                table-layout: fixed;
            }

            th {
                font-weight: bold;
                font-size: 8pt;
                vertical-align: middle;
                padding: 2px 6px 2px;
                background-color: #333333;
                color: #333333;
            }

            td {
                padding: 2px 6px;
            }

            td p {
                align: left
            }

            b {
                font-weight: bold;
                color: #333333;
            }

            table.header td {
                padding: 0;
                font-size: 10pt;
            }

            table.footer td {
                padding: 0;
                font-size: 7pt;
            }

            table.itemtable th {
                padding-bottom: 10px;
                padding-top: 10px;
            }

            table.body td {
                padding-top: 2px;
            }

            .borderheader {
               /*border-width: top */
               border-width: 1px 1px 1px 1px;
               border-style: solid;
               border-color: black;
            }

            .borderheader2 {
               /*border-width: top right bottom left */
               border-width: 1px 1px 1px 0px;
               border-style: solid;
               border-color: black;
            }

            .borderlines {
               border-width: 0px 1px 1px 1px;
               border-style: solid;
               border-color: black;
            }

            .borderlines2 {
               /*border-width: top right bottom left */
               border-width: 0px 1px 1px 0px;
               border-style: solid;
               border-color: black;
            }

            .fontweightbold {
               font-weight:bold
            }
      </style>
   </head>
    <body background-color="white" font-size="7" size="A4" header = "cabecera"  footer = "piepagina" header-height="25mm" footer-height="10mm">
        <table style="font-family: Verdana, Arial, Helvetica, sans-serif; width:100%">
          <thead>
            <tr>
              <td width="75%" align = "center " class="borderheader fontweightbold">ACTIVIDADES</td>
              <td width="25%" align = "center " class="borderheader2 fontweightbold">EJERCICIO O PERIODO</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td width="75%" align="left" class="borderlines fontweightbold">Actividades de Operación</td>
              <td width="25%" align="right" class="borderlines2"></td>
            </tr>

            <tr>
              <td width="75%" align="left" class="borderlines">Cobranza por aportes y demás servicios</td>
              <td width="25%" align="right" class="borderlines2">${operacion.operacion01}</td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines">Cobranza de regalías, honorarios, comisiones y otros</td>
              <td width="25%" align="right" class="borderlines2">${operacion.operacion02}</td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines">Cobranza de intereses y dividendos recibidos</td>
              <td width="25%" align="right" class="borderlines2">${operacion.operacion03}</td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines">Otros cobros de efectivo relativos a la actividad</td>
              <td width="25%" align="right" class="borderlines2">${operacion.operacion04}</td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines ">Menos:</td>
              <td width="25%" align="right" class="borderlines2"></td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines">Pagos a proveedores por el suministro de bienes y servicios</td>
              <td width="25%" align="right" class="borderlines2">${operacion.operacion05}</td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines ">Pagos de remuneraciones y beneficios sociales</td>
              <td width="25%" align="right" class="borderlines2">${operacion.operacion06}</td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines">Pago por tributos</td>
              <td width="25%" align="right" class="borderlines2">${operacion.operacion07}</td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines">Pago de intereses y rendimientos</td>
              <td width="25%" align="right" class="borderlines2">${operacion.operacion08}</td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines">Imputación de detracciones ingresada como recaudación tributaria</td>
              <td width="25%" align="right" class="borderlines2">${operacion.operacion09}</td>
            </tr> 
            <tr>
              <td width="75%" align="left" class="borderlines">&nbsp;</td>
              <td width="25%" align="right" class="borderlines2"></td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines fontweightbold">Aumento (Disminución) del Efectivo y Equivalente de Efectivo Provenientes de Actividades de Operación</td>
              <td width="25%" align="right" class="borderlines2 fontweightbold" style="vertical-align:middle">${totals.total01}</td>
              
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines">&nbsp;</td>
              <td width="25%" align="right" class="borderlines2"></td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines fontweightbold">Actividades de Inversión</td>
              <td width="25%" align="right" class="borderlines2"></td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines">Cobranza de venta de valores e inversiones permanentes</td>
              <td width="25%" align="right" class="borderlines2">${inversion.inversion01}</td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines">Cobranza de venta de inmuebles, maquinaria y equipo</td>
              <td width="25%" align="right" class="borderlines2">${inversion.inversion02}</td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines">Cobranza de venta de activos intangibles</td>
              <td width="25%" align="right" class="borderlines2">${inversion.inversion03}</td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines">Otros cobros de efectivo relativos a la actividad</td>
              <td width="25%" align="right" class="borderlines2">${inversion.inversion04}</td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines ">Menos:</td>
              <td width="25%" align="right" class="borderlines2"></td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines">Pagos por compra de valores e inversiones permanentes</td>
              <td width="25%" align="right" class="borderlines2">${inversion.inversion05}</td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines ">Compra de propiedades, planta y equipo </td>
              <td width="25%" align="right" class="borderlines2">${inversion.inversion06}</td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines">Pagos por compra de activos intangibles</td>
              <td width="25%" align="right" class="borderlines2">${inversion.inversion07}</td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines">Otros pagos de efectivo relativos a la actividad</td>
              <td width="25%" align="right" class="borderlines2">${inversion.inversion08}</td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines">&nbsp;</td>
              <td width="25%" align="right" class="borderlines2"></td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines fontweightbold">Aumento (Disminución) del Efectivo y Equivalente de Efectivo Provenientes de Actividades de Inversión</td>
              <td width="25%" align="right" class="borderlines2 fontweightbold" style="vertical-align:middle">${totals.total02}</td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines">&nbsp;</td>
              <td width="25%" align="right" class="borderlines2"></td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines fontweightbold">Actividades de Financiamiento</td>
              <td width="25%" align="right" class="borderlines2"></td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines">Emisión y obtención de otros pasivos financieros </td>
              <td width="25%" align="right" class="borderlines2">${financiamiento.financiamiento01}</td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines">Cobranza de recursos obtenidos por emisión de valores u otras obligaciones de largo plazo</td>
              <td width="25%" align="right" class="borderlines2">${financiamiento.financiamiento02}</td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines">Otros cobros de efectivo relativos a la actividad</td>
              <td width="25%" align="right" class="borderlines2">${financiamiento.financiamiento03}</td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines">Menos:</td>
              <td width="25%" align="right" class="borderlines2"></td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines">Amortización o pago de otros pasivos financieros</td>
              <td width="25%" align="right" class="borderlines2">${financiamiento.financiamiento04}</td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines">Pago de intereses financieros</td>
              <td width="25%" align="right" class="borderlines2">${financiamiento.financiamiento05}</td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines">Otros pagos de efectivo relativos a la actividad</td>
              <td width="25%" align="right" class="borderlines2">${financiamiento.financiamiento06}</td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines">&nbsp;</td>
              <td width="25%" align="right" class="borderlines2"></td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines fontweightbold">Aumento (Disminución) del Efectivo y Equivalente de Efectivo Provenientes de Actividades de Financiamiento</td>
              <td width="25%" align="right" class="borderlines2 fontweightbold" style="vertical-align:middle">${totals.total03}</td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines">&nbsp;</td>
              <td width="25%" align="right" class="borderlines2"></td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines fontweightbold">Saldo Efectivo y Equivalente de Efectivo al Inicio del Ejercicio</td>
              <td width="25%" align="right" class="borderlines2 fontweightbold" style="vertical-align:middle">${totals.total04}</td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines">&nbsp;</td>
              <td width="25%" align="right" class="borderlines2"></td>
            </tr>
            <tr>
              <td width="75%" align="left" class="borderlines fontweightbold">Saldo Efectivo y Equivalente de Efectivo al Finalizar el Ejercicio</td>
              <td width="25%" align="right" class="borderlines2 fontweightbold" style="vertical-align:middle">${totals.total05}</td>
            </tr>
          </tbody>
        </table>
    </body>

</pdf>