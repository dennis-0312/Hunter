
<#assign totalBalance = 0>
<#assign totalProgrammed = 0>
<#if paymentbatch.custrecord_ts_epmt_prepmt_currency_symbol == "PEN">
    <#assign currencyName = "SOLES">
<#elseif paymentbatch.custrecord_ts_epmt_prepmt_currency_symbol == "USD">
    <#assign currencyName = "DOLARES">
<#else>
    <#assign currencyName = "">
</#if>
<#assign now = .now>
<?xml version="1.0"?>
<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
    <head>
        <#--  <#assign font_lucidasans_regular="https://7451241-sb1.app.netsuite.com/core/media/media.nl?id=73318&c=7451241_SB1&h=b1xSzViYzklbf5lAuDsVAniJfqb7qfgpe_rONLpAgCbUZyQY&_xt=.ttf" />
        <link name="LucidaSans" type="font" subtype="TrueType" src="${font_lucidasans_regular?html}" bytes="2" />
        <#assign font_robotocondensed_italic="https://7451241-sb1.app.netsuite.com/core/media/media.nl?id=74819&c=7451241_SB1&h=RZ0l8Nxe0KFtoEISrmhkc9S2RMffOWshI_cZIGxsvXga2oB1&_xt=.ttf" />
        <link name="RobotoCondensed" type="font" subtype="TrueType" src="${font_robotocondensed_italic?html}" bytes="2" />  -->
        
        <title>Programación de Pagos</title>
            <style>
                /** {
                    font-family: LucidaSans;
                    font_family: RobotoCondensed;
                }*/
                body { 
                    /*background-color:brown;*/ 
                    font-size: 10px;
                    padding: 16pt 28pt 0pt 16pt;
                    font-family: "Times";
                }
                p, h1, h2, h3, h4, h5, h6, tr, th {
                    margin: 0px;
                    padding: 0px;
                    font-family: "Times";
                }
                table{
                    margin: 0px;
                    padding: 0px;
                    cellmargin: 0px;
                    cellpadding:0px
                }
                .title {
                    align: center;
                }
                .under_title {
                    width: 100%;
                    margin-bottom: 15px;
                }
                .under_title td {
                    width: 50%;
                    border: 0px;
                    /*background-color: cornflowerblue;*/
                    font-size: 12px;
                }
                .under_title td.subisidary {
                    font-size: 12px;
                }
                .right {
                    align: right;
                }
                .va-bottom {
                    vertical-align: bottom
                }
                .detail{
                    width: 100%;
                }
                .detail th {
                    border-top: 1px solid black;
                    margin-bottom: 2px;
                    padding-top: 3px;
                    padding-bottom: 3px;
                    border-bottom: 1px solid black;
                }
                .detail td.summary {
                    border-top: 1.5px solid black;
                    padding-top: 10px;
                    padding-bottom: 4px;
                    border-bottom: 1.5px solid black;
                }
                .main {
                    width: 100%;
                    margin-bottom: 2px;
                }
                .main td.label {
                    font-size: 12px;
                }
                .main td.value {
                    font-size: 12px;
                }
                .sign {
                    width: 100%;
                }
            </style>
        <macrolist>
            <macro id="myfooter" background-color="gray">
                <p align="right">Pág. <pagenumber/>/<totalpages/></p>
            </macro>
        </macrolist>
        <style>

        </style>
    </head>
    <body size="A4" footer="myfooter" footer-height="20mm">
        <#--  <h1 class="title"><spam>CARSEG S.A<p>PAGOS</p></spam></h1>  -->
        <table class="under_title">
            <tr>
                <td class="left va-bottom" width="30%">
                    <#if companyInformation.logoUrl?length !=0>
                        <@filecabinet nstype="image" src="http://7451241-sb1.shop.netsuite.com/core/media/media.nl?id=2240&c=&h=Ok21KfUdVZdUn-0SKzwvGo0kgxpDyXwkFUdn4sdej1eLURWH" style="float: left; width: 100px; height: 50px;" />
                    </#if>
                </td>
                <#--  <td class="subisidary va-bottom" width="40%"><b>${subsidiary.legalname}</b></td>  -->
                <td class="subisidary" width="40%" align="left" style="padding-left:50px"><b>PAGOS ENVIADOS AL BANCO</b></td>
                <#--  <td class="right va-bottom">${paymentbatch.date}</td>  -->
                <#--  <td class="right va-bottom" width="30%">${now?string['hh:mm:ss a']}</td>  -->
                <td class="right va-bottom" width="30%"><p>${aditional.user}</p>Fecha: ${now?string("dd/MM/yyyy")}</td>
            </tr>
            <#--  <tr>
                <td>${subsidiary.taxidnum}</td>
                <td class="right va-bottom">${now?string['hh:mm:ss a']}</td>
            </tr>  -->
        </table>

        <table class="main">
			<tr>
				<td margin-bottom="2px" class="label" width="15%">Programa Pago #:</td>
				<td margin-bottom="2px" class="value" width="35%">${paymentbatch.internalid.value}</td>
                <td margin-bottom="2px" class="label">Fecha de Generación:</td>
				<td margin-bottom="2px" class="value">${paymentbatch.custrecord_ts_epmt_prepmt_payment_date?datetime.iso?string('dd/MM/YYYY')}</td>
				<#--  <td margin-bottom="2px" class="label" width="15%">Moneda:</td>
				<td margin-bottom="2px" class="value" width="35%">${currencyName}</td>  -->
			</tr>
            <tr>
				<td class="label">Cuenta:</td>
				<td class="value">${formatAccountName(paymentbatch.custrecord_ts_epmt_prepmt_bank_account_name)}</td>
				<#--  <td class="label">Nro. Cuenta:</td>
				<td class="value">${paymentbatch.custrecord_ts_epmt_prepmt_bank_account_number}</td>  -->
                <td class="label">Nombre Archivo:</td>
				<td class="value">${aditional.name?replace('pdf', 'BIZ')}</td>
			</tr>
		</table>


        <table class="detail" width="100%">
            <thead>
				<tr>
                    <th width="16%"><b>ANTICIPO/DEUDA</b></th>
					<th width="20%"><b>BENEFICIARIO</b></th>
					<th width="16%"><b>F.ACREDITACION</b></th>
                    <th width="16%"><b>CUENTA</b></th>
                    <th width="16%"><b>TRAN.RELACIONADA</b></th>
					<th width="16%"><b>VALOR</b></th>
				</tr>
			</thead>
            <tbody>
            <#list payments as item>
                <#if item["custrecord_ts_epmt_prepaydet_entity.type"].value == "Employee">
                    <#assign entity = employees[item.custrecord_ts_epmt_prepaydet_entity.value]>
                <#elseif item["custrecord_ts_epmt_prepaydet_entity.type"].value == "Vendor">
                    <#assign entity = vendors[item.custrecord_ts_epmt_prepaydet_entity.value]>
                <#elseif item["custrecord_ts_epmt_prepaydet_entity.type"].value == "CustJob">
                    <#assign entity = customers[item.custrecord_ts_epmt_prepaydet_entity.value]>
                <#else>
                    <#assign entity = {}>
                </#if>
                <#assign transaction = transactions[item.custrecord_ts_epmt_prepaydet_origin_tran.value]>
                <tr>
                    <td>${item.custrecord_ts_epmt_prepaydet_origin_tran.text?replace('Orden de Pago #','')?replace('Bill Payment #','')?replace('Vendor Prepayment #','')?replace('Check #','')?replace('Cheque #','')?replace('Pago anticipado al proveedor #','')}</td>
					<td align="left">${entity.entityid}-${entity.altname}</td>
                    <td align="center">${item.custrecord_ts_epmt_prepaydet_paym_method.text}</td>
                    <td>${item.ebank.custrecord_2663_entity_ec_tipo_cuentacob.text}-${item.ebank.custrecord_2663_entity_bban}</td>
                    <td>
                        <#if transaction.custbody_ts_related_transaction.value?length == 0>
                            ${transaction.appliedtotransaction.text?replace('Factura #','')?replace('Bill #','')?replace('Orden de compra #','')?replace('Purchase Order #','')?replace('Pedido #','')}
                        <#else>
                            ${transaction.custbody_ts_related_transaction.text?replace('Factura #','')?replace('Bill #','')?replace('Orden de compra #','')?replace('Purchase Order #','')?replace('Pedido #','')}
                        </#if>
                    </td>
					<td>${item.custrecord_ts_epmt_prepaydet_paym_amount}</td>
				</tr>
                <#assign totalProgrammed = totalProgrammed + item.custrecord_ts_epmt_prepaydet_paym_amount?number>
            </#list>
                <tr>
                    <td class="summary"></td>
                    <td class="summary"></td>
                    <td class="summary"></td>
                    <td class="summary"></td>
                    <td align="left" class="summary">TOTAL:</td>
                    <td align="left" class="summary">${totalProgrammed}</td>
                </tr>
            </tbody>
        </table>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <#--  <table class="sign">
            <tr>
                <td></td>
                <td align="center" style="border-top: 1.5px solid black;">Revisado</td>
                <td></td>
                <td align="center" style="border-top: 1.5px solid black;">Aprobado</td>
                <td></td>
                <td align="center" style="border-top: 1.5px solid black;">Autorizado</td>
                <td></td>
            </tr>
        </table>  -->
    </body>
</pdf>