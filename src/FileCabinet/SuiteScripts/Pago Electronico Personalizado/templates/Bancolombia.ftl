<#assign detailType = "BZDET">
<#assign auxiliarCero = 0>
<#assign auxiliarEspacio = " ">
<#list payments as payment>
  <#assign totalAmount = payment.custrecord_ts_epmt_prepaydet_paym_amount>
  <#if payment["custrecord_ts_epmt_prepaydet_entity.type"].value == "Employee">
    <#assign entity = employees[payment.custrecord_ts_epmt_prepaydet_entity.value]>
  <#elseif payment["custrecord_ts_epmt_prepaydet_entity.type"].value == "Vendor">
    <#assign entity = vendors[payment.custrecord_ts_epmt_prepaydet_entity.value]>
  <#elseif payment["custrecord_ts_epmt_prepaydet_entity.type"].value == "CustJob">
    <#assign entity = customer[payment.custrecord_ts_epmt_prepaydet_entity.value]>
  <#else>
    <#assign entity = {}>
  </#if>
  <#if (payment.ebank)??>
    <#assign ebank = payment.ebank>
  <#else>
    <#assign ebank = {}>
  </#if>
  <#assign docTypeEntity = entity.custentityts_ec_cod_tipo_doc_identidad>
    <#if docTypeEntity == "04">
        <#assign docType = "R">
        <#elseif docTypeEntity == "05">
        <#assign docType = "C">
    <#else>
        <#assign docType = "P">
    </#if>
  <#assign transaction = transactions[payment.custrecord_ts_epmt_prepaydet_origin_tran.value]>
  <!--<#assign serieCXC = transaction.custbody_ts_ec_serie_cxc>-->
  <#assign serieCXC = "">
  <!--<#assign serieCXP = transaction.custbody_ts_ec_serie_doc_cxp>-->
  <#assign serieCXP = "">
  <!--<#assign tipoDocumentiFiscal = transaction.custbodyts_ec_tipo_documento_fiscal>-->
  <#assign tipoDocumentiFiscal = "">
  <#assign codTerminoPago = ebank.custrecord_entity_ec_forma_pago.text>
  <!--<#assign comRetencion = transaction.custbody_ec_serie_cxc_retencion + transaction.custbody_ts_ec_preimpreso_retencion>-->
  <#assign comRetencion = "">
  <!--<#assign fechaAuto = transaction.custbody_ec_fecha_autorizacion>-->
  <#assign fechaAuto = "">
  <!--<#assign numAutorizacion = transaction.custbodyts_ec_num_autorizacion>-->
  <#assign numAutorizacion = "">
  <#assign telefono = entity.phone>
  <#assign codigoEmpresa = ebank.custrecord_2663_entity_processor_code>
  <#if tipoDocumentiFiscal == "03 Liquidación de compra de Bienes o Prestación de servicios" >
    <!--<#assign facturaSRI = serieCXC + transaction.custbody_ts_ec_numero_preimpreso >-->
    <#assign facturaSRI = "" >
  <#else>
    <!--<#assign facturaSRI = serieCXP + transaction.custbody_ts_ec_numero_preimpreso >-->
    <#assign facturaSRI = "" >
  </#if>
  <#if codTerminoPago == "CUE">
    <#assign codTermino = ebank.custrecord_2663_entity_ec_tipo_cuentacob.text >
    <#assign account = setMaxLength(ebank.custrecord_2663_entity_bban,10) >
    <#assign codigoBanco = 34 >
  <#elseif codTerminoPago == "IMP">
    <#assign account = setMaxLength(ebank.custrecord_2663_entity_bban,10) >
  <#elseif codTerminoPago == "COB">
    <#assign codTermino = ebank.custrecord_2663_entity_ec_tipo_cuentacob.text >
    <#assign account = setMaxLength(ebank.custrecord_2663_entity_bban,18) >
    <#assign codigoBanco = ebank.custrecord_2663_entity_bank_code >
  <#else>
    <#assign codTermino = " " >
    <#assign account = " " >
    <#assign codigoBanco = " " >
  </#if >
  <#if comRetencion?length==0>
    <#assign retencion = " " >
  <#else>
    <#assign retencion = comRetencion?replace('-','') >
    <#if fechaAuto?length==0>
      <#assign fechaAutorizacion = " " >
    <#else>
      <#assign fechaAutorizacion = fechaAuto?string("yyyyMMdd") >
    </#if>
  </#if>
  <#if numAutorizacion?length==0>
    <#assign numAutorizacion = " " >
  </#if>
  <#if telefono?length==0>
    <#assign telefono = " " >
  </#if>
  <#if codigoEmpresa?length==0>
    <#assign codigoEmpresa = " " >
  </#if>
=====================================
${detailType}|
${setPadding(payment_index + 1, "left", "0", 6)}|
${setPadding(entity.vatregnumber,"right"," ",18)}|
${docType}|
${setPadding(entity.vatregnumber,"right"," ",14)}|
${setPadding(entity.altname,"right"," ",60)}|
${setPadding(codTerminoPago,"right"," ",3)}|
001
${setPadding(codigoBanco,"right"," ",2)}|
${setPadding(codTermino,"right"," ",2)}|
${setPadding(account,"right"," ",20)}|
1
${setPadding(totalAmount,"left","0",15)}|
${setPadding(transaction.memo,"right"," ",60)}|
${setPadding(facturaSRI,"right"," ",15)}|
${setPadding(retencion,"left"," ",15)}|
${setPadding(retencion,"left"," ",15)}|
<#if facturaSRI?length==0>
${setPadding(auxiliarCero,"left","0",20)}|
<#else>
${setPadding(facturaSRI?replace('-',''),"right"," ",20)}|
</#if>
${setPadding(auxiliarEspacio,"right"," ",10)}|
${setPadding(auxiliarEspacio,"right"," ",50)}|
${setPadding(entity.address?replace('<br />',' ')?replace('\n',' '),"right"," ",50)}|
${setPadding(telefono?replace("+593","")?replace("+19",""),"right"," ",20)}|
PRO
${setPadding(numAutorizacion,"right"," ",10)}|
${setPadding(fechaAutorizacion,"right"," ",10)}|
${setLength("",10)}|
N
${setPadding(codigoEmpresa,"right"," ",5)}|
${setPadding(auxiliarEspacio,"right"," ",6)}|
RPA
${setPadding(fechaAutorizacion,"rgiht"," ",10)}|
</#list>