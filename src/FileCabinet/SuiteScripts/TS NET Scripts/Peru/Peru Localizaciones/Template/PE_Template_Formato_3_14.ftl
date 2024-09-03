<#assign data = input.data?eval>
<#assign company = data.company>
<#assign cabecera = data.cabecera>
<#assign total = data.total>
<#assign movements = data.movements>
<#assign jsonTransacionvine = data.jsonTransacionvine>
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
   <head>
      <meta name="title" value="Formato 3.14" />
      <macrolist>
         <macro id = "cabecera">
            <table width="100%"  style= "font-size: 8px; table-layout: fixed; ">
               <tr>
                  <td colspan="3" align="center" style="font-size: 10px; font-family: Verdana, Arial, Helvetica, sans-serif; font-weight: bold;">FORMATO 3.14: "LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO </td>
               </tr>
               <tr>
                  <td width="40%" align="left" style="font-size: 10px; font-family: Verdana, Arial, Helvetica, sans-serif; font-weight: bold;">PERIODO</td>
                  <td width="1%" align="left" style="font-size: 10px; font-family: Verdana, Arial, Helvetica, sans-serif; font-weight: bold;">:</td>
                  <td width="59%" align="left" style="font-size: 10px; font-family: Verdana, Arial, Helvetica, sans-serif; font-weight: bold;">${cabecera.periodo}</td>
               </tr>
               <tr>
                  <td width="40%" align="left" style="font-size: 10px; font-family: Verdana, Arial, Helvetica, sans-serif; font-weight: bold;">RUC</td>
                  <td width="1%" align="left" style="font-size: 10px; font-family: Verdana, Arial, Helvetica, sans-serif; font-weight: bold;">:</td>
                  <td width="59%" align="left" style="font-size: 10px; font-family: Verdana, Arial, Helvetica, sans-serif; font-weight: bold;">${cabecera.ruc}</td>
               </tr>
               <tr>
                  <td width="40%" align="left" style="font-size: 10px; font-family: Verdana, Arial, Helvetica, sans-serif; font-weight: bold;">APELLIDOS Y NOMBRES, DENOMINACIÓN O RAZON SOCIAL</td>
                  <td width="1%" align="left" style="font-size: 10px; font-family: Verdana, Arial, Helvetica, sans-serif; font-weight: bold;">:</td>
                  <td width="59%" align="left" style="font-size: 10px; font-family: Verdana, Arial, Helvetica, sans-serif; font-weight: bold;">${cabecera.razonSocial}</td>
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
   <body background-color="white" font-size="6" size="A4" header="cabecera" header-height="30mm">
      <table style="font-family: Verdana, Arial, Helvetica, sans-serif; width:100%;" writing-mode="lr">
        <thead>
            <tr>
              <td align = "center " colspan="2" class="borderheader fontweightbold" style="vertical-align: middle;"><p style= "width: 100%; font-weight:bold; text-align: center; border-bottom:0 none;">DOCUMENTO DE IDENTIDAD</p></td>
              <td align = "center" rowspan="2" class="borderheader2 fontweightbold" style="vertical-align: middle;"><p style= "width: 100%; font-weight:bold; text-align: center;">APELLIDOS Y NOMBRES DEL TRABAJADOR</p></td>
              <td align = "center" rowspan="2" class="borderheader2 fontweightbold" style="vertical-align: middle;"><p style= "width: 100%; font-weight:bold; text-align: center;">SALDO FINAL</p></td>
            </tr>
            <tr>
              <td align="center"  class="borderheader fontweightbold" style="vertical-align: middle;"><p style= "width: 100%; font-weight:bold; text-align: center; border-bottom: 0px none #fff;">TIPO (TABLA 2)</p></td>
              <td align="center"  class="borderheader2 fontweightbold" style="vertical-align: middle;"><p style= "width: 100%; font-weight:bold; text-align: center; border-top:0 none;">NÚMERO</p></td>
            </tr>
        </thead>
        <tbody>
          <#list movements as key,mov>
              <tr>
                <td align = "center" class="borderlines" style="vertical-align: middle;">${mov.dato1}</td>
                <td align = "center" class="borderlines2" style="vertical-align: middle;">${mov.dato2}</td>
                <td align = "center" class="borderlines2" style="vertical-align: middle;"><p style="font-size:10px width:150px;text-transform: uppercase;margin-top: 0;margin-bottom: 0;hyphens: auto;word-wrap: break-word;word-break: break-all;">${mov.dato3}</p></td>
                <td align = "center" class="borderlines2" style="vertical-align: middle;">${mov.dato4}</td>
              </tr>
              <#list jsonTransacionvine as item>
                   <#if mov.number == item.cantidadFor>
                   <tr >
                     <td align = "center" class="borderlines" style="vertical-align: middle;"></td>
                     <td align = "center" class="borderlines2" style="vertical-align: middle;"></td>
                     <td align = "center" class="borderlines2" style="vertical-align: middle;">VAN</td>
                     <td align = "center" class="borderlines2" style="vertical-align: middle;">${item.montoviene}</td>
                  </tr>
                  <tr >
                     <td align = "center" class="borderlines" style="vertical-align: middle;"></td>
                     <td align = "center" class="borderlines2" style="vertical-align: middle;"></td>
                     <td align = "center" class="borderlines2" style="vertical-align: middle;">VIENE</td>
                     <td align = "center" class="borderlines2" style="vertical-align: middle;">${item.montoviene}</td>
                  </tr>
                  </#if>
            </#list>
              
          </#list>
          <tr>
            <td align = "center " ></td>
            <td align = "center " ></td>
            <td align = "center " class="borderlines">TOTAL</td>
            <td align = "center " class="borderlines2">${total.dato4}</td>
          </tr>
        </tbody> 
      </table>  
  </body>
</pdf>