
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
        <title>Programación de Pagos</title>

            <style>
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
                    font-size: 14px;
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

        <h1 class="title">PROGRAMACIÓN DE PAGOS</h1>
        <table class="under_title">
            <tr>
              <td class="subisidary va-bottom"><b>${subsidiary.legalname}</b></td>
              <td class="right va-bottom">${paymentbatch.date}</td>
            </tr>
            <tr>
              <td>${subsidiary.taxidnum}</td>
              <td class="right va-bottom">${now?string['hh:mm:ss a']}</td>
            </tr>
        </table>

        <table class="main">
			<tr>
				<td margin-bottom="2px" class="label" width="15%">Programa Pago #:</td>
				<td margin-bottom="2px" class="value" width="35%">${paymentbatch.internalid.value}</td>
				<td margin-bottom="2px" class="label" width="15%">Moneda:</td>
				<td margin-bottom="2px" class="value" width="35%">${currencyName}</td>
			</tr>
            <tr>
				<td margin-bottom="2px" class="label">Fecha de Pago:</td>
				<td margin-bottom="2px" class="value">${paymentbatch.custrecord_ts_epmt_prepmt_payment_date?datetime.iso?string('dd/MM/YYYY')}</td>
				<td margin-bottom="2px" class=""></td>
				<td margin-bottom="2px" class=""></td>
			</tr>
            <tr>
				<td class="label">Cuenta:</td>
				<td class="value">${formatAccountName(paymentbatch.custrecord_ts_epmt_prepmt_bank_account_name)}</td>
				<td class="label">Nro. Cuenta:</td>
				<td class="value">${paymentbatch.custrecord_ts_epmt_prepmt_bank_account_number}</td>
			</tr>
		</table>


        <table class="detail" width="100%">
            <thead>
				<tr>
					<th width="25%"><b>Proveedor</b></th>
					<th width="35%"><b>Razón Social</b></th>
					<th align="center" width="20%"><b>Saldo</b></th>
					<th align="center" width="20%"><b>Programado</b></th>
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
                <tr>
					<td><b>${entity.entityid}</b></td>
					<td><b>${entity.altname}</b></td>
					<td align="center"><b>${item.custrecord_ts_epmt_prepaydet_tran_amount}</b></td>
					<td align="center"><b>${item.custrecord_ts_epmt_prepaydet_paym_amount}</b></td>
				</tr>
                <tr>
					<td colspan="4" align="center">${item.account}</td>
				</tr>
                <tr>
					<td></td>
					<td></td>
					<td align="center">${item.custrecord_ts_epmt_prepaydet_tran_amount}</td>
					<td align="center">${item.custrecord_ts_epmt_prepaydet_paym_amount}</td>
				</tr>
                <tr>
					<td margin-bottom="10px" colspan="2" >Nota: ${transactions[item.custrecord_ts_epmt_prepaydet_origin_tran.value].tranid} - ${transactions[item.custrecord_ts_epmt_prepaydet_origin_tran.value].memo}</td>
					<td margin-bottom="10px"></td>
					<td margin-bottom="10px"></td>
				</tr>
                <#assign totalBalance = totalBalance + item.custrecord_ts_epmt_prepaydet_tran_amount?number>
                <#assign totalProgrammed = totalProgrammed + item.custrecord_ts_epmt_prepaydet_paym_amount?number>
            </#list>
                <tr>
                    <td class="summary"></td>
                    <td align="center" class="summary">TOTAL:</td>
                    <td align="center" class="summary">${totalBalance}</td>
                    <td align="center" class="summary">${totalProgrammed}</td>
                </tr>
            </tbody>
        </table>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <table class="sign">
            <tr>
                <td></td>
                <td align="center" style="border-top: 1.5px solid black;">Revisado</td>
                <td></td>
                <td align="center" style="border-top: 1.5px solid black;">Aprobado</td>
                <td></td>
                <td align="center" style="border-top: 1.5px solid black;">Autorizado</td>
                <td></td>
            </tr>
        </table>
    </body>
</pdf>