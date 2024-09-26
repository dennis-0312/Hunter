<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
<head>
	<link name="NotoSans" type="font" subtype="truetype" src="${nsfont.NotoSans_Regular}" src-bold="${nsfont.NotoSans_Bold}" src-italic="${nsfont.NotoSans_Italic}" src-bolditalic="${nsfont.NotoSans_BoldItalic}" bytes="2" />
    <style type="text/css">
		* {
            font-family: NotoSans, sans-serif;
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
	<#setting locale="en_US">
</head>
<!-- VARIABLES EXTERNAS A UTILIZAR -->
    <#assign encabezado = data.header?upper_case> <!--String-->
    <#assign oficina = data.location?upper_case> <!--String-->
    <#assign beneficiario = data.entity> <!--"IdNetSuite NombreBeneficiario"-->
        <#assign idBeneficiario = beneficiario?keep_before(" ")>
        <#assign nombreBeneficiario = beneficiario?keep_after(" ")?upper_case>
    <#assign incluyeHoraEmision = data.hasHour> <!--Bool(Muestra u Oculta la Hora)-->
    <#assign horaEmision = data.hour?string["HH:mm:ss"]> <!--Date-->
    <#assign fechaEmision = data.trandate> 
    <#assign nroVale = data.custbody_num_vale>
    <#assign letrasMontoTotal = data.letrasTotal>
    <#assign memo = data.memo?upper_case> <!--String-->
    <#assign total_credito = data.total?number?string.currency?replace("$","")>
    <#assign transactionID = data.tranid>
    <#assign extraccionListGL = data.listGL> <!--[account,name,debit,credit,memo]-->

<!-- VARIABLES INTERNAS DEL SISTEMA -->
    <#assign logoHunter = companyInformation.logoUrl>
    <#assign indiceArroba = user.email?index_of("@")>
    <#assign usuarioActual = user.email?substring(0, indiceArroba)>
    <#assign diaActual = .now?string["dd/MM/yyyy"]>
    <#assign horaActual = .now?string["HH:mm:ss"]>
    <#assign nombreUsuario = user.firstname?upper_case>
    <#assign apellidoUsuario = user.lastname?upper_case>

<body padding="0.5in 0.5in 0.5in 0.5in" size="A4">
    <table align="right" style="width: 100%; margin-bottom: 10px">
		<tr>
			<td style="width: 31%;"><#if logoHunter?length != 0><@filecabinet nstype="image" src="${logoHunter}" style="float: left; height:50px; width:120px" /></#if></td>
			<td style="width: 40%; align: center; vertical-align: bottom;"><strong>${encabezado}</strong></td>
			<td style="width: 3%;"></td>
			<td style="width: 13%;">
				<small><span style="font-family:Times New Roman,Times,serif;"><code><strong><span style="font-size:9px;">FECHA IMPRESION</span></strong></code></span></small><br />
				<small><span style="font-family:Times New Roman,Times,serif;"><code><strong><span style="font-size:9px;">HORA&nbsp; IMPRESION</span></strong></code></span></small><br />
				<small><span style="font-family:Times New Roman,Times,serif;"><code><strong><span style="font-size:9px;">USUARIO EMISION</span></strong></code></span></small><br />
				<small><span style="font-family:Times New Roman,Times,serif;"><code><strong><span style="font-size:9px;">PAGINA</span></strong></code></span></small>
			</td>
			<td style="width: 13%;">
				<span style="font-size:9px;">&nbsp;:&nbsp;${diaActual}</span><br />
				<span style="font-size:9px;">&nbsp;:&nbsp;${horaActual}</span><br />
				<span style="font-size:9px;">&nbsp;:&nbsp;${usuarioActual} </span><br />
				<span style="font-size:9px;">&nbsp;: <pagenumber/>/<totalpages/></span>
			</td>
		</tr>
	</table>

	<table cellpadding="1" style="width: 100%;">
		<tr>			
			<td><span style="font-family:Georgia,serif;"><span style="font-size:12px;"><strong>CARSEG S.A.<br />CAJA CHICA ${oficina}</strong></span></span><br />&nbsp;</td>
		</tr>
	</table>
	<table cellpadding="1" style="width: 100%;">
		<tr>
			<td style="width: 20%;"><strong><span style="font-size:12px;"><span style="font-family:Georgia,serif;">FECHA EMISION</span></span></strong></td>
			<td style="width: 35%;"><span style="font-size:12px;"><span style="font-family:Georgia,serif;">${fechaEmision}</span></span></td>
            <#if incluyeHoraEmision>
			    <td style="width: 15%; white-space: nowrap; align: left;"><strong><span style="font-size:12px;"><span style="font-family:Georgia,serif;">HORA:&nbsp; &nbsp;</span></span></strong><span style="font-family:Georgia,serif;"><span style="font-size:12px;">${horaEmision}</span></span></td>
            <#else>
			    <td style="width: 15%; white-space: nowrap; align: left;"><strong><span style="font-size:12px;"><span style="font-family:Georgia,serif;">&nbsp;</span></span></strong><span style="font-family:Georgia,serif;"><span style="font-size:12px;">&nbsp;</span></span></td>
            </#if>
			<td style="align: right; width: 10%;"><strong><span style="font-family:Georgia,serif;"><span style="font-size:12px;">No.</span></span></strong></td>
			<td style="align: left; width: 20%; "><strong><span style="font-family:Georgia,serif;"><span style="font-size:12px;">&nbsp;&nbsp;${nroVale}</span></span></strong></td>
		</tr>
	</table>
	<table cellpadding="1" style="width: 100%; table-layout: fixed;">
		<tr>
			<td style="width: 20%;"><strong><span style="font-size:12px;"><span style="font-family:Georgia,serif;">BENEFICIARIO</span></span></strong></td>
			<td style="width: 80%;"><span style="font-size:12px;"><span style="font-family:Georgia,serif;">${nombreBeneficiario}</span></span></td>
		</tr>
		<tr>
			<td><strong><span style="font-size:12px;"><span style="font-family:Georgia,serif;">ID BENEFICIARIO</span></span></strong></td>
			<td><span style="font-size:12px;"><span style="font-family:Georgia,serif;">${idBeneficiario}</span></span></td>
		</tr>
		<tr>
			<td><strong><span style="font-size:12px;"><span style="font-family:Georgia,serif;">LA CANTIDAD DE</span></span></strong></td>
			<td><span style="font-size:12px;"><span style="font-family:Georgia,serif;">${letrasMontoTotal}</span></span></td>
		</tr>
		<tr>
			<td><strong><span style="font-size:12px;"><span style="font-family:Georgia,serif;">POR CONCEPTO</span></span></strong></td>
			<td><span style="font-size:12px;"><span style="font-family:Georgia,serif;">${memo}</span></span></td>
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
			<td style="height: 100px; width: 27%; white-space: nowrap; align: center; vertical-align: bottom;"><span style="font-size:12px;"><span style="font-family:Georgia,serif;">${nombreUsuario}&nbsp;${apellidoUsuario}</span></span></td>
			<td rowspan="2" style="width: 5%;">&nbsp;</td>
			<td style="width: 20%;">&nbsp;</td>
			<td rowspan="2" style="width: 5%;">&nbsp;</td>
			<#if (nombreBeneficiario?length > 40)>
				<td style="width: 33%; display: block; overflow: hidden; text-overflow: ellipsis; vertical-align: bottom; align: center;"><span style="font-size:12px;"><span style="font-family:Georgia,serif;">${nombreBeneficiario}</span></span></td>
			<#else>
				<td style="width: 33%; white-space: nowrap; vertical-align: bottom; align: center;"><span style="font-size:12px;"><span style="font-family:Georgia,serif;">${nombreBeneficiario}</span></span></td>
			</#if>
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
			<td style="width: 551px;"><span style="font-family:Georgia,serif;"><span style="font-size:12px;">${transactionID}</span></span></td>
		</tr>
	</table>

	<table class="tablaDatos" style="width:100%; table-layout: fixed;">
		<tr class="header">
			<td style="width: 14%; border-right: none;"><strong><span style="font-family:Georgia,serif;"><span style="font-size:12px;">CUENTA</span></span></strong></td>
			<td style="width: 25%; white-space: nowrap; border-right: none;"><strong><span style="font-family:Georgia,serif;"><span style="font-size:12px;">DESCRIPCION CUENTA</span></span></strong></td>
			<td style="width: 12%; border-right: none;"><strong><span style="font-family:Georgia,serif;"><span style="font-size:12px;">DEBITO</span></span></strong></td>
			<td style="width: 12%;"><strong><span style="font-family:Georgia,serif;"><span style="font-size:12px;">CREDITO</span></span></strong></td>
			<td style="width: 37%; border-left: none;"><strong><span style="font-family:Georgia,serif;"><span style="font-size:12px;">CONCEPTO</span></span></strong></td>
		</tr>		
		<#assign suma_debito = 0>
        <#assign suma_credito = 0>
        <#list extraccionListGL as line>
            <#if (line.debit?length != 0 || line.credit?length  != 0)>
            <tr>
                <td style="align: left; border-right: none; border-top: none;"><span style="font-family:Georgia,serif;"><span style="font-size:12px;">${line.account}</span></span></td>
				<td style="align: left; border-right: none; border-top: none;"><span style="font-family:Georgia,serif;"><span style="font-size:12px;">${line.name?upper_case}</span></span></td>
				<td style="align: right; border-right: none; border-top: none;"><span style="font-family:Georgia,serif;"><span style="font-size:12px;">${line.debit?number?string.currency?replace("$","")}</span></span></td>
				<td style="align: right; border-top: none;"><span style="font-family:Georgia,serif;"><span style="font-size:12px;">${line.credit?number?string.currency?replace("$","")}</span></span></td>
				<td style="align: left; border-left: none; border-top: none;"><span style="font-family:Georgia,serif;"><span style="font-size:12px;">${line.memo?upper_case}</span></span></td>
            </tr>
            <#if line.debit?length != 0>
                <#assign suma_debito = suma_debito + line.debit?number>
            <#else>
                <#assign suma_credito = suma_credito + line.credit?number>
            </#if>
            </#if>
        </#list> 
		<tr>			
			<td style="border: none;">&nbsp;</td>
			<td style="align: right; border: none; padding-top:7px;"><strong><span style="font-family:Georgia,serif;"><span style="font-size:12px;">TOTALES</span></span></strong></td>
			<td style="align: right; border-right: none; border-top: none;"><strong><span style="font-family:Georgia,serif;"><span style="font-size:12px;">${suma_debito?string.currency}</span></span></strong></td>
			<td style="align: right; border-top: none;"><strong><span style="font-family:Georgia,serif;"><span style="font-size:12px;">${suma_credito?string.currency}</span></span></strong></td>
			<td style="border: none;">&nbsp;</td>
		</tr>
	</table><br />
</body>
</pdf>