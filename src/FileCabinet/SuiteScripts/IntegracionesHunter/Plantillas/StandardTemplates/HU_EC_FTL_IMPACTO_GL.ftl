<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
<head>
    <style type="text/css">* {
      			font-family: sans-serif;
                font-size: 8pt;              
			}
    </style>
	<#setting locale="en_US">
</head>
  <!-- VARIABLES EXTERNAS A UTILIZAR -->
  <#assign tranid = data.tranid> <!--String-->
  <#assign trantype = data.trantype?upper_case> <!--String-->
  <#assign oficina = data.location?upper_case> <!--String-->
  <#assign fechaCreacion = data.createdDate> <!--String-->
  <#assign userCreatedBy = data.userCreatedBy?upper_case> <!--String-->
  <#assign nameCreatedBy = data.nameCreatedBy?upper_case> <!--String-->
  <#assign departamento = data.department?upper_case> <!--String-->
  <#assign extraccionListGL = data.listGL> <!--[account,name,debit,credit,memo]-->

  <!-- VARIABLES INTERNAS DEL SISTEMA -->
    <#assign logoHunter = companyInformation.logoUrl>
    <#assign indiceArroba = user.email?index_of("@")>
    <#assign usuarioActual = user.email?substring(0, indiceArroba)?upper_case>
    <#assign fechaActual = .now?string["dd/MM/yyyy HH:mm:ss"]>
<body padding="0.45in 0.25in" size="A4">
  <div width="100%" height="100px">
    <div position="absolute" top="-0.4in" left="0.3in">
        <#if logoHunter?length != 0>
          <@filecabinet nstype="image" src="${logoHunter}" style="float: left; height:50px; width:120px" />
       </#if>
    </div>
    <div position="absolute" top="-0.20in" left="37%">
      <p width="120px"  align="center"><b font-size="11pt">CARSEG S.A.</b></p>
      <p align="center"><b font-size="10pt">COMPROBANTE CONTABLE</b></p>
    </div>
    <div top="50px">
      <table width="100%" cellmargin="0" cellpadding="0" table-layout="fixed" padding-left="30px" padding-right="30px">
        <tr>
          <td width="15%"><b>N° Transacción:</b></td>
          <td width="40%">${tranid}</td>
          <td width="15%"><b>Usuario Impresión:</b></td>
          <td width="30%" align="right">${usuarioActual} - ${fechaActual}</td>
        </tr>
        <tr>
          <td><b>Tipo Transacción:</b></td>
          <td>${trantype}</td>
          <td><b>Usuario Creación:</b></td>
          <td align="right">${userCreatedBy} - ${fechaCreacion}</td>
        </tr>
        <tr>
          <td><b>Departamento:</b></td>
          <td>${departamento}</td>
          <td><b>Oficina:</b></td>
          <td align="right">${oficina}</td>
        </tr>
      </table>      
    </div>    
  </div>
  <table width="100%" cellborder="1" cellmargin="0" cellpadding="3px 0px" table-layout="fixed" margin-top="15px">
    <thead>
		<tr>
			<td width="10%" border-right="none" align="center"><b font-size="9px">CUENTA</b></td>
			<td width="29%" border-right="none" align="center"><b font-size="9px">DESCRIPCION CUENTA</b></td>
			<td width="12%" border-right="none" align="center"><b font-size="9px">DEBITO</b></td>
			<td width="12%" align="center"><b font-size="9px">CREDITO</b></td>		
			<td width="37%" border-left="none" align="center"><b font-size="9px">CONCEPTO</b></td>
		</tr>
      </thead>
		<#assign suma_debito = 0>
        <#assign suma_credito = 0>
        <#list extraccionListGL as line>
            <#if (line.debit?length != 0 || line.credit?length  != 0)>
            <tr>
                <td border-right="none" border-top="none" vertical-align="middle"><span font-size="9px" padding="0 5px">${line.account}</span></td>
                <td border-right="none" border-top="none" vertical-align="middle"><p white-space="normal" padding="0 5px" font-size="9px">${line.name?upper_case}</p></td>
                <td border-right="none" border-top="none" align="right" vertical-align="middle"><span padding="0 5px" font-size="9px">${line.debit?number?string.currency?replace("$","")}</span></td>
                <td border-top="none" align="right" vertical-align="middle"><span padding="0 5px" font-size="9px">${line.credit?number?string.currency?replace("$","")}</span></td>		
                <td border-left="none" border-top="none"><p white-space="normal" margin="0" padding="0 5px" font-size="9px">${line.memo?upper_case}</p></td>
            </tr>   
            <#if line.debit?length != 0>
                <#assign suma_debito = suma_debito + line.debit?number>
            <#else>
                <#assign suma_credito = suma_credito + line.credit?number>
            </#if>
            </#if>
        </#list>                  
		<tr>
			<td border="none"></td>
			<td align="right" border="none"><b font-size="9px">TOTALES</b></td>
			<td align="right" border-right="none" border-top="none"><b padding="0 5px" font-size="9px">${suma_debito?string.currency}</b></td>	
			<td align="right" border-top="none"><b padding="0 5px" font-size="9px">${suma_credito?string.currency}</b></td>	
			<td border="none"></td>
		</tr>          
	</table>
    <table width="100%" cellmargin="0" cellpadding="2px 0" table-layout="fixed" margin="80px 12px 0px 12px">
      <tr>
        <td width="31%" align="center">${nameCreatedBy}</td>
        <td width="3%"></td>
        <td width="31%"></td>
        <td width="3%"></td>
        <td width="32%"></td>
      </tr>
      <tr>
        <td align="center" border-top="1">ELABORADO POR</td>
        <td></td>
        <td align="center" border-top="1">REVISADO</td>
        <td></td>
        <td align="center" border-top="1">APROBADO</td>
      </tr>
    </table>
</body>
</pdf>