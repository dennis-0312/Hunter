<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
<head>
	<link name="NotoSans" type="font" subtype="truetype" src="${nsfont.NotoSans_Regular}" src-bold="${nsfont.NotoSans_Bold}" src-italic="${nsfont.NotoSans_Italic}" src-bolditalic="${nsfont.NotoSans_BoldItalic}" bytes="2" />
	<#if .locale == "zh_CN">
		<link name="NotoSansCJKsc" type="font" subtype="opentype" src="${nsfont.NotoSansCJKsc_Regular}" src-bold="${nsfont.NotoSansCJKsc_Bold}" bytes="2" />
	<#elseif .locale == "zh_TW">
		<link name="NotoSansCJKtc" type="font" subtype="opentype" src="${nsfont.NotoSansCJKtc_Regular}" src-bold="${nsfont.NotoSansCJKtc_Bold}" bytes="2" />
	<#elseif .locale == "ja_JP">
		<link name="NotoSansCJKjp" type="font" subtype="opentype" src="${nsfont.NotoSansCJKjp_Regular}" src-bold="${nsfont.NotoSansCJKjp_Bold}" bytes="2" />
	<#elseif .locale == "ko_KR">
		<link name="NotoSansCJKkr" type="font" subtype="opentype" src="${nsfont.NotoSansCJKkr_Regular}" src-bold="${nsfont.NotoSansCJKkr_Bold}" bytes="2" />
	<#elseif .locale == "th_TH">
		<link name="NotoSansThai" type="font" subtype="opentype" src="${nsfont.NotoSansThai_Regular}" src-bold="${nsfont.NotoSansThai_Bold}" bytes="2" />
	</#if>
    <macrolist>
        <macro id="footer">
            &nbsp;
        </macro>
    </macrolist>
    <style type="text/css">
		* {
			<#if .locale == "zh_CN">font-family: NotoSans, NotoSansCJKsc, sans-serif;
			<#elseif .locale == "zh_TW">font-family: NotoSans, NotoSansCJKtc, sans-serif;
			<#elseif .locale == "ja_JP">font-family: NotoSans, NotoSansCJKjp, sans-serif;
			<#elseif .locale == "ko_KR">font-family: NotoSans, NotoSansCJKkr, sans-serif;
			<#elseif .locale == "th_TH">font-family: NotoSans, NotoSansThai, sans-serif;
			<#else>font-family: NotoSans, sans-serif;
			</#if>
		}
		span.title {
			font-size: 28pt;
		}
		span.number {
			font-size: 16pt;
		}
		table.main td, th {
			border-bottom: 1px solid #ddd;
		}
		td.empty {
			border: none;
		}
		table.tablaDatos {
			border-spacing: 0; /* Elimina el espacio entre las celdas */
		}
		table.tablaDatos td{
			border: 1px solid black;
		}
		table.tablaDatos .header{
			margin-top: 10px;
		}
		table.tablaDatos td p{
			align: left;
		}
		table.tablaDatos .header p{
			align: center;
		}
		th {
			font-weight: bold;
			vertical-align: middle;
			padding: 5px 6px 3px;
			background-color: #e3e3e3;
			color: #333333;
		}
		td {
			padding: 4px 6px;
		}
		td p { align:left }
	</style>
</head>
<body footer="footer" footer-height="0.5in" padding="0.5in 0.5in 0.5in 0.5in" size="A4">
    <table align="right" style="width:100%;">
		<tr>
			<td rowspan="3" style="width: 230px;"><#if companyInformation.logoUrl?length != 0><@filecabinet nstype="image" src="${companyInformation.logoUrl}" style="float: left; height:50px; width:120px" /></#if></td>
			<td style="width: 289px;">&nbsp;</td>
			<td colspan="1" rowspan="3" style="width: 115px;">
				<small><span style="font-family:Times New Roman,Times,serif;"><code><strong><span style="font-size:9px;">FECHA IMPRESION</span></strong></code></span></small><br />
				<small><span style="font-family:Times New Roman,Times,serif;"><code><strong><span style="font-size:9px;">HORA&nbsp; IMPRESION</span></strong></code></span></small><br />
				<small><span style="font-family:Times New Roman,Times,serif;"><code><strong><span style="font-size:9px;">USUARIO EMISION</span></strong></code></span></small><br />
				<small><span style="font-family:Times New Roman,Times,serif;"><code><strong><span style="font-size:9px;">PAGINA</span></strong></code></span></small>
			</td>
			<#assign indiceArroba = user.email?index_of("@")>
			<#assign parteAntesArroba = user.email?substring(0, indiceArroba)>
			<#assign dia=.now?string["dd/MM/yyyy"] horaActual=.now?string["HH:mm:ss"]>
			<td colspan="1" rowspan="3" style="width: 95px;">
				<span style="font-size:9px;"><span id="cke_bm_33923S" style="display: none;">&nbsp;</span>:&nbsp;${dia}</span><br />
				<span style="font-size:9px;">&nbsp;:&nbsp;${horaActual}</span><br /><span style="font-size:9px;">&nbsp;:&nbsp;${parteAntesArroba} </span><br />
				<span style="font-size:9px;">&nbsp;: <pagenumber/>/<totalpages/></span>
			</td>
		</tr>
		<tr>
			<td style="width: 289px;"><strong>VALE DEFINITIVO DE CAJA</strong></td>
		</tr>
		<tr>
			<td style="width: 289px; text-align: right;">&nbsp;</td>
		</tr>
	</table>

	<table cellpadding="1" style="width:100%;">
		<tr>
			<#assign beneficiario="">
			<#assign oficina = record.location?upper_case>
			<#assign beneficiario=record.entity>
			<#assign idBeneficiario=beneficiario?keep_before(" ")>
			<#assign nombreBeneficiario=beneficiario?keep_after(" ")?upper_case>
			<#assign horaRegistro=record.custbody_report_timestamp?keep_after(" ")?string>
				<#assign horaSplit = horaRegistro?split(":")>
				<#assign hora = horaRegistro?keep_before(":")?left_pad(2, "0")>
				<#assign minuto = horaRegistro?keep_after(":")?keep_before(":")?left_pad(2, "0")>
				<#assign segundo = horaRegistro?keep_after(":")?keep_after(":")?left_pad(2, "0")>
			<#assign horaRegistroFormateada = "${hora}:${minuto}:${segundo}">
			<td colspan="6" style="width: 165px;"><span style="font-family:Georgia,serif;"><span style="font-size:12px;"><strong>CARSEG S.A.<br />CAJA CHICA ${oficina}</strong></span></span><br />&nbsp;</td>
		</tr>
		<tr>
			<td style="width: 5%;"><strong><span style="font-size:12px;"><span style="font-family:Georgia,serif;">FECHA EMISION</span></span></strong></td>
			<td style="width: 62px;"><span style="font-family:Georgia,serif;"><span style="font-size:12px;">${record.trandate}</span></span></td>
			<td style="width: 108px; white-space: nowrap; align: right;"><strong><span style="font-size:12px;"><span style="font-family:Georgia,serif;">HORA:&nbsp; &nbsp;</span></span></strong><span style="font-family:Georgia,serif;"><span style="font-size:12px;">${horaRegistroFormateada}</span></span></td>
			<td style="align: right; width: 30px;"><strong><span style="font-size:12px;"><span style="font-family:Georgia,serif;">No.</span></span></strong></td>
			<td style="align: center; width: 30%; "><strong><span style="font-family:Georgia,serif;"><span style="font-size:12px;">${record.custbody_num_vale}</span></span></strong></td>
		</tr>
		<tr>
			<td style="width: 165px;"><strong><span style="font-size:12px;"><span style="font-family:Georgia,serif;">BENEFICIARIO</span></span></strong></td>
			<td colspan="3" style="width: 299.453px;"><span style="font-size:12px;"><span style="font-family:Georgia,serif;">${nombreBeneficiario}</span></span></td>
		</tr>
		<tr>
			<td style="width: 165px;"><strong><span style="font-size:12px;"><span style="font-family:Georgia,serif;">ID EMPLEADO</span></span></strong></td>
			<td colspan="3" style="width: 299.453px;"><span style="font-size:12px;"><span style="font-family:Georgia,serif;">${idBeneficiario}</span></span></td>
		</tr>
		<tr>
			<td style="width: 165px;"><strong><span style="font-size:12px;"><span style="font-family:Georgia,serif;">LA CANTIDAD DE</span></span></strong></td>
			<td colspan="3" style="width: 299.453px;"><span style="font-size:12px;"><span style="font-family:Georgia,serif;">${extra.formInfo.letrasMontoTotal}</span></span></td>
		</tr>
		<tr>
			<td style="width: 165px;"><strong><span style="font-size:12px;"><span style="font-family:Georgia,serif;">POR CONCEPTO</span></span></strong></td>
			<td colspan="5" style="width: 659px;"><span style="font-size:12px;"><span style="font-family:Georgia,serif;">${record.memo?upper_case}</span></span></td>
		</tr>
	</table>

	<table class="tablaDatos" style="width:100%;">
		<tr class="header">
			<td style="border-right: none; border-bottom: none; text-align: center;"><strong><span style="font-family:Georgia,serif;"><span style="font-size:12px;">EFECTIVO</span></span></strong></td>
			<td style="border-right: none; border-bottom: none; text-align: center;"><strong><span style="font-family:Georgia,serif;"><span style="font-size:12px;">CHEQUE</span></span></strong></td>
			<td style="border-bottom: none; text-align: center;"><strong><span style="font-family:Georgia,serif;"><span style="font-size:12px;">TOTAL</span></span></strong></td>
			<td style="border-right: none; border-left: none; border-bottom: none; text-align: center;"><strong><span style="font-family:Georgia,serif;"><span style="font-size:12px;">NUMERO CHEQUE</span></span></strong></td>
			<td style="border-bottom: none; text-align: center;"><strong><span style="font-family:Georgia,serif;"><span style="font-size:12px;">BANCO EMISOR</span></span></strong></td>
		</tr>
		<tr>
			<#assign total_credito=record.amount>
			<td style="border-right: none; align: right;"><font face="Georgia, serif"><span style="font-size: 12px;">${total_credito}</span></font></td>
			<td style="border-right: none; align: right;"><font face="Georgia, serif"><span style="font-size: 12px;">0.00</span></font></td>
			<td style="align: right;"><font face="Georgia, serif"><span style="font-size: 12px;">${total_credito}</span></font></td>
			<td style="border-right: none; border-left: none; align: right;">&nbsp;</td>
			<td style="align: right;">&nbsp;</td>
		</tr>
		<tr>
			<td style="border: none;">&nbsp;</td>
			<td style="border-top: none; border-right: none; align:left;"><strong><span style="font-size:12px;"><span style="font-family:Georgia,serif;">TOTAL PAGADO</span></span></strong></td>
			<td style="border-top: none; align: right;"><font face="Georgia, serif"><span style="font-size: 12px;"><b>${total_credito}</b></span></font></td>
			<td style="border: none;">&nbsp;</td>
			<td style="border: none;">&nbsp;</td>
		</tr>
	</table>

	<table style="width:100%;">
		<tr>
			<td rowspan="2" style="width: 5%;">&nbsp;</td>
			<td style="height: 100px; width: 27%; white-space: nowrap; align: center; vertical-align: bottom;"><span style="font-size:12px;"><span style="font-family:Georgia,serif;">${user.firstname?upper_case}&nbsp;${user.lastname?upper_case}</span></span></td>
			<td rowspan="2" style="width: 5%;">&nbsp;</td>
			<td style="width: 26%;">&nbsp;</td>
			<td rowspan="2" style="width: 5%;">&nbsp;</td>
			<td style="width: 27%; white-space: nowrap; align: center; vertical-align: bottom;"><span style="font-size:12px;"><span style="font-family:Georgia,serif;">${nombreBeneficiario}</span></span></td>
			<td rowspan="2" style="width: 5%;">&nbsp;</td>
		</tr>
		<tr>
			<td style="align: center; border-top: 1px solid black;"><strong><span style="font-family:Georgia,serif;"><span style="font-size:12px;">RECIBIDOR/PAGADOR</span></span></strong></td>
			<td style="align: center; border-top: 1px solid black;"><strong><span style="font-family:Georgia,serif;"><span style="font-size:12px;">APROBADO</span></span></strong></td>
			<td style="align: center; border-top: 1px solid black;"><strong><span style="font-family:Georgia,serif;"><span style="font-size:12px;">RECIBI CONFORME</span></span></strong></td>
		</tr>
	</table>
	&nbsp;
	<table style="width:100%; margin-top:20px;">
		<tr>
			<td colspan="2" style="align: center;"><strong>COMPROBANTE CONTABLE</strong></td>
		</tr>
			<tr style="margin-top:10px;">
			<td style="width: 250px;"><strong><span style="font-family:Georgia,serif;"><span style="font-size:12px;">NUMERO COMPROBANTE</span></span></strong></td>
			<td style="width: 551px;"><span style="font-family:Georgia,serif;"><span style="font-size:12px;">${record.tranid}</span></span></td>
		</tr>
	</table>

	<table class="tablaDatos" style="width:100%; table-layout: fixed;">
		<tr class="header">
			<td style="width: 14%; border-right: none; border-bottom: none;"><strong><span style="font-family:Georgia,serif;"><span style="font-size:12px;">CUENTA</span></span></strong></td>
			<td style="width: 25%; white-space: nowrap; border-right: none; border-bottom: none;"><strong><span style="font-family:Georgia,serif;"><span style="font-size:12px;">DESCRIPCION CUENTA</span></span></strong></td>
			<td style="width: 12%; border-right: none; border-bottom: none;"><strong><span style="font-family:Georgia,serif;"><span style="font-size:12px;">DEBITO</span></span></strong></td>
			<td style="width: 12%; border-bottom: none;"><strong><span style="font-family:Georgia,serif;"><span style="font-size:12px;">CREDITO</span></span></strong></td>
			<td style="width: 37%; border-left: none; border-bottom: none;"><strong><span style="font-family:Georgia,serif;"><span style="font-size:12px;">CONCEPTO</span></span></strong></td>
		</tr>
		<#assign nroVale = record.custbody_num_vale?replace("[^\\d]+", "", "r")?number>
		<#assign suma_credito = 0>
    	<#assign suma_debito = 0>
		<#macro listadoReporte nroCta nombreCta valorDebit valorCredit descrip>
			<tr>
				<td style="align: left; border-right: none;"><span style="font-family:Georgia,serif;"><span style="font-size:12px;">${nroCta}</span></span></td>
				<td style="align: left; border-right: none;"><span style="font-family:Georgia,serif;"><span style="font-size:12px;">${nombreCta}</span></span></td>
				<td style="align: right; border-right: none;"><span style="font-family:Georgia,serif;"><span style="font-size:12px;">${valorDebit}</span></span></td>
				<td style="align: right;"><span style="font-family:Georgia,serif;"><span style="font-size:12px;">${valorCredit}</span></span></td>
				<td style="align: left; border-left: none;"><span style="font-family:Georgia,serif;"><span style="font-size:12px;">VALE DEFINITIVO DE CAJA NRO. ${nroVale} SOLICITADO POR ${idBeneficiario} ${nombreBeneficiario}. ${descrip?upper_case}</span></span></td>
			</tr>
			<#assign suma_credito = suma_credito + valorCredit?replace(",","")?number>
			<#assign suma_debito = suma_debito + valorDebit?replace(",","")?number>
		</#macro>		
		<@listadoReporte extra.formInfo.numeroCredito extra.formInfo.nombreCredito "" record.amount?replace("$","") record.memo/>
		<#if record.advance2 != 0>
			<#assign nameCta = record.advanceaccount?keep_after(" ")>
			<#if record.advanceaccount?last_index_of(": ") != -1><#assign nameCta = record.advanceaccount?keep_after_last(": ")></#if>
			<@listadoReporte record.advanceaccount?keep_before(" ") nameCta "" record.advance2?replace("$","") ""/>
		</#if>
		<#list extra.formInfo.expense as line>
			<#assign nroCta = line.numeroCuenta>
			<#assign nombreCta = line.nombreCuenta>
			<#assign valorDebit = line.debitoCuenta>
			<#assign valorCredit = line.creditoCuenta>
			<#assign descrip = line.notaCuenta>
			<@listadoReporte nroCta nombreCta valorDebit valorCredit descrip/>
		</#list>
		<tr>
			<#setting locale="en_US">
			<td style="border: none;">&nbsp;</td>
			<td style="align: right; border: none; padding-top:7px;"><strong><span style="font-family:Georgia,serif;"><span style="font-size:12px;">TOTALES</span></span></strong></td>
			<td style="align: right; border-right: none; border-top: none;"><strong><span style="font-family:Georgia,serif;"><span style="font-size:12px;">${suma_debito?string.currency}</span></span></strong></td>
			<td style="align: right; border-top: none;"><strong><span style="font-family:Georgia,serif;"><span style="font-size:12px;">${suma_credito?string.currency}</span></span></strong></td>
			<td style="border: none;">&nbsp;</td>
		</tr>
	</table><br />
</body>
</pdf>