<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
<head>
    <style type="text/css">* {
      			font-family: sans-serif;
                font-size: 7pt;              
			}
    </style>
	<#setting locale="en_US">
</head>
  <!-- VARIABLES EXTERNAS A UTILIZAR -->
    <#assign tranid = data.tranid> <!--String-->
    <#assign trandate = data.trandate> <!--String-->
    <#assign clientId = data.clientId> <!--String-->
    <#assign clientName = data.clientName?upper_case> <!--String-->
    <#assign employeeServUser = data.employeeServUser?upper_case> <!--String-->
    <#assign employeeServName = data.employeeServName?upper_case> <!--String-->
    <#assign employeeRefUser = data.employeeRefUser?upper_case> <!--String-->
    <#assign employeeRefName = data.employeeRefName?upper_case> <!--String-->
    <#assign aproVenta = data.aproVenta?upper_case> <!--String-->
    <#assign vehiculo = data.vehiculo?upper_case> <!--String-->
    <#assign aseguradora = data.aseguradora?upper_case> <!--String-->
    <#assign concesionario = data.concesionario?upper_case> <!--String-->
    <#assign financiera = data.financiera?upper_case> <!--String-->
    <#assign vendCanalDist = data.vendCanalDist?upper_case> <!--String-->
    <#assign facturaId = data.facturaId> <!--String-->
    <#assign facturaName = data.facturaName?upper_case> <!--String-->
    <#assign estado = data.estado?upper_case> <!--String-->
    <#assign oficina = data.location?upper_case> <!--String-->
    <#assign memo = data.memo?upper_case> <!--String-->
    <#assign userCreatedBy = data.userCreatedBy?upper_case> <!--String-->
    <#assign fechaCreacion = data.createdDate> <!--String-->
    <#assign descTotal = data.descTotal> <!--Number-->
    <#assign subTotal = data.subTotal> <!--Number-->
    <#assign iva = data.iva> <!--Number-->
    <#assign total = data.total> <!--Number-->
    <#assign itemsList = data.itemsList> <!--[sec,item,importe,cantidad,subTotal,iva,total]-->
    <#assign cuotas = data.cuotas> <!--[num,porcentaje,importe]-->
    <#assign cuotaDescripcion = data.cuotaDescripcion> <!--String-->

  <!-- VARIABLES INTERNAS DEL SISTEMA -->
    <#assign logoHunter = companyInformation.logoUrl>
    <#assign indiceArroba = user.email?index_of("@")>
    <#assign usuarioActual = user.email?substring(0, indiceArroba)?upper_case>
    <#assign fechaActual = .now?string["dd/MM/yyyy HH:mm:ss"]>
<body padding="0.45in 0.25in" size="A4">
  <div width="100%" height="100px">
    <div position="absolute" top="-0.4in" left="0.1in">
        <#if logoHunter?length != 0>
          <@filecabinet nstype="image" src="${logoHunter}" style="float: left; height:50px; width:120px;" />
            <p width="120px" top="-6px"  align="center"><b font-size="9pt">CARSEG S.A.</b></p>
       </#if>
    </div>
    <div position="absolute" height="60px" vertical-align="middle" left="37%">      
      <p align="center"><b font-size="12pt">ORDEN DE SERVICIO</b></p>
    </div>
    <div position="absolute" top="0" left="70%">
            <div width="30%">
              <table width="100%" cellmargin="0" cellpadding="0" table-layout="fixed">
                <tr>
                  <td align="right" width="46%"><b font-size="6pt" margin-right="5px">Usuario Impresión:</b></td>
                  <td><span font-size="6pt">${usuarioActual}</span></td>
                </tr>
                <tr>
                  <td align="right"><b font-size="6pt" margin-right="5px">Fecha Impresión:</b></td>
                  <td><span font-size="6pt">${fechaActual}</span></td>
                </tr>
                <tr>
                  <td align="right"><b font-size="6pt" margin-right="5px">Usuario Creación:</b></td>
                  <td><span font-size="6pt">${userCreatedBy}</span></td>
                </tr>
                <tr>
                  <td align="right"><b font-size="6pt" margin-right="5px">Fecha Creación:</b></td>
                  <td><span font-size="6pt">${fechaCreacion}</span></td>
                </tr>
              </table>
            </div>
          </div>
    <div margin-top="50px">
      <table width="100%" cellmargin="0" cellpadding="1.5" border-top="1" table-layout="fixed" padding-top="10px">
        <tr>
          <td width="14%"><b>Nro. Orden/Serv.:</b></td>
          <td width="34%">${tranid}</td>
          <td width="16%"><b>Ejecutivo de Gestión:</b></td>
          <td width="36%">${employeeServUser} - ${employeeServName}</td>
        </tr>
        <tr>
          <td><b>Fecha:</b></td>
          <td>${trandate}</td>
          <td><b>Ejecutivo de Referencia:</b></td>
          <td>${employeeRefUser} - ${employeeRefName}</td>
        </tr>
        <tr>
          <td><b>Aprobación Venta:</b></td>
          <td colspan="3">${aproVenta}</td>
        </tr>
      </table>      
      <table width="100%" cellmargin="0" cellpadding="1.5" table-layout="fixed">
        <tr>
          <td width="14%"><b>Cliente:</b></td>
          <td width="86%">${clientId} - ${clientName}</td>
        </tr>
        <tr>
          <td><b>Vehículo:</b></td>
          <td>${vehiculo}</td>
        </tr>
      </table>
      <table width="100%" cellmargin="0" cellpadding="1.5" table-layout="fixed" border-bottom="1" padding-bottom="5px">
        <tr>
          <td width="14%"><b>Aseguradora:</b></td>
          <td width="34%"><p margin="0" padding-right="15px">${aseguradora}</p></td>
          <td width="14%"><b>Concesionaria:</b></td>
          <td width="38%">${concesionario}</td>
        </tr>
        <tr>
          <td><b>Banco/Financiera:</b></td>
          <td><p margin="0" padding-right="15px">${financiera}</p></td>
          <td><b>Vend. Canal Dist:</b></td>
          <td>${vendCanalDist}</td>
        </tr>
        <tr>
          <td><b>Facturar a:</b></td>
          <td colspan="3">${facturaId} - ${facturaName}</td>
        </tr>
        <tr>
          <td><b>Estado de Factura:</b></td>
          <td colspan="3">${estado}</td>
        </tr>
        <tr>
          <td><b>Oficina:</b></td>
          <td  colspan="3">${oficina}</td>
        </tr>
        <tr>
          <td><b>Observación:</b></td>
          <td colspan="3">${memo}</td>
        </tr>
      </table>
    </div>
    <p align="center"  left="-3%" margin-bottom="0"><b font-size="10pt">DETALLE</b></p>    
  </div>
  <table width="100%" cellmargin="0" cellpadding="0" table-layout="fixed">
    <thead>
     <tr border="1 0">
      <th width="4%" align="center"><b>Sec.</b></th>
      <th width="39%" align="center"><b>Item</b></th>
      <th width="12%" align="right"><b padding-right="2px">Importe</b></th>
      <th width="10%" align="right"><b>Cant.</b></th>
      <th width="12%" align="right"><b padding-right="2px">Subtotal</b></th>
      <th width="10%" align="right"><b padding-right="2px">Iva</b></th>
      <th width="12%" align="right"><b padding-right="2px">Neto x Item</b></th>
     </tr>
    </thead>
    <#list itemsList as line>
      <tr margin-top="8px">
        <th align="center">${line.sec}</th>
        <th><p margin="0" padding-right="10px">${line.item}</p></th>
        <th align="right">${line.importe}</th>
        <th align="right">${line.cantidad}</th>
        <th align="right">${line.subTotal}</th>
        <th align="right">${line.iva}</th>
        <th align="right">${line.total}</th>
      </tr>
    </#list>
  </table>
  <table width="100%" cellmargin="0" cellpadding="0" table-layout="fixed" margin-top="8px">               
    <tr page-break-after="avoid">
      <td width="58%"></td>
      <td width="10%" align="right" border-top="1" border-bottom="1" border-left="1"><b padding-right="1px">Desc. Aplicado</b></td>
      <td width="10%" align="right" border-top="1" border-bottom="1"><b padding-right="2px">Subtotal</b></td>
      <td width="10%" align="right" border-top="1" border-bottom="1"><b padding-right="2px">Iva</b></td>
      <td width="12%" align="right" border-top="1" border-bottom="1" border-right="1"><b padding-right="2px">Total</b></td>
    </tr>
    <tr margin-top="5px">
      <td></td>
      <td align="right"><b>${descTotal}</b></td>
      <td align="right"><b>${subTotal}</b></td>
      <td align="right"><b>${iva}</b></td>
      <td align="right"><b>${total}</b></td>
    </tr>
  </table>
  <p align="center"  left="-2%" margin-top="20px" margin-bottom="0"><b font-size="10pt">FORMAS DE PAGO</b></p>  
  <table width="100%" cellmargin="0" cellpadding="0" table-layout="fixed">
    <thead>
     <tr border="1 0" margin-bottom="5px">
      <th width="40%"><b padding-left="10px">Forma de pago</b></th>
      <th width="15%" align="right"><b>Cuota</b></th>
      <th width="15%" align="right"><b padding-right="2px">Valor</b></th>
      <th width="15%" align="right"><b padding-right="2px">Porcentaje</b></th>
      <th width="15%" align="right"><b padding-right="2px">Total a pagar</b></th>
     </tr>
    </thead>
    <#list cuotas as cuota>
      <tr margin-top="5px">
        <th><p margin="0" padding-right="10px" padding-left="10px">${cuotaDescripcion}</p></th>
        <th align="right"><p padding-right="10px">${cuota.num}</p></th>
        <th align="right">${cuota.importe}</th>
        <th align="right">${cuota.porcentaje}</th>
        <th align="right">${cuota.importe}</th>
      </tr>
    </#list> 
  </table>
</body>
</pdf>