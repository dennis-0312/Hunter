<#assign data = input.data?eval >
<#assign company = data.company >
<#assign totalDebit = data.totalDebit >
<#assign totalCredit = data.totalCredit >
<#assign movements = data.movements >
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
   <head>
      <meta name="title" value="Formato 5.3" />
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
                    <td width="50%" align="left"><b>APELLIDOS Y NOMBRES, DENOMINACION O RAZON SOCIAL</b></td>
                    <td width="5%" align="right"><b>:</b></td>
                    <td width="30%" align="left">${company.fourthTitle}</td>
                    <td width="15%" align="left"></td>
               </tr>
            </table>
         </macro>
      </macrolist>
   </head>
    <body background-color="white" font-size="8" size="A4-landscape" header = "cabecera" header-height="25mm" footer-height="10mm">
        <table style="font-family: Verdana, Arial, Helvetica, sans-serif; width:100%" >
            <tr>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">PERIODO</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">CUENTA CONTABLE</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">DESC. CONTABLE</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">PLAN DE CUENTAS</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">DESC. PLAN DE CUENTAS</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">CUENTA COPORATIVA</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">DESC. CTA. CORP.</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">ESTADO</td>
            </tr>
            <#list movements as key,mov>
                <tr>
                    <td width="25%" align = "center">${mov.periodoContable}</td>
                    <td width="25%" align = "center">${mov.cuentaContable}</td>
                    <td width="25%" align = "center">${mov.descripcionContable}</td>
                    <td width="25%" align = "center">${mov.planCuentas}</td>
                    <td width="25%" align = "center">${mov.descripcionCuentas}</td>
                    <td width="25%" align = "center">${mov.cuentaCorporativa}</td>
                    <td width="25%" align = "center">${mov.descripcionCorporativa}</td>
                    <td width="25%" align = "left">${mov.estadoOperacion}</td>
                </tr>
            </#list>
                <#--  <tr>
                    <td width="25%" align = "center"></td>
                    <td width="25%" align = "center"></td>
                    <td width="25%" align = "center"></td>
                    <td width="25%" align = "center"></td>
                    <td width="25%" align = "center"></td>
                    <td width="25%" align = "center"></td>
                    <td width="25%" align = "center"></td>
                    <td width="25%" align = "center" style= "border-top:1px solid black"><b>TOTAL GENERAL</b></td>
                    <td width="25%" align = "right" style= "border-top:1px solid black">${totalDebit.total}</td>
                    <td width="25%" align = "right" style= "border-top:1px solid black">${totalCredit.total}</td>
                </tr>  -->
        </table>
    </body>
</pdf>