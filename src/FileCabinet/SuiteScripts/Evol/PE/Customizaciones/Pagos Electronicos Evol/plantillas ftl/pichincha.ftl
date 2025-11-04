<#-- format specific processing PICHINCHA-->
#OUTPUT START#
<#assign auxiliarCero = 0>
<#assign auxiliarEspacio = " ">
<#list payments as payment>
<#assign entidadesPago = entities[payment_index] >
<#assign amountPayment = getAmount(payment)>
<#assign ebank = ebanks[payment_index] >
<#--  <#assign primeraParte = ebank.custrecord_ts_type_account_int?split("-")[0]?trim>  -->
<#if cbank.custrecord_2663_currency == "Soles">
<#assign moneda = "PEN"> <#-- soles  -->
<#else> 
<#assign moneda = "USD"> <#-- dólares  -->
</#if>
<#if entidadesPago.vatregnumber?length==11>
<#assign tipoDocumento = "RUC"> <#-- ruc  -->
<#assign razonSocial = entidadesPago.companyname > <#-- Company Name  -->
<#else>
<#assign tipoDocumento = "DNI"> <#-- dni  -->
<#assign razonSocial = entidadesPago.firstname + " " + entidadesPago.lastname > <#-- Nombre y Apellido  -->
</#if>
<#if ebank.custrecord_2663_entity_bban?length==20>
<#assign formadePago = "PCCI">
<#assign direccion = ebank.custrecord_2663_entity_state>
<#assign telefono = ebank.custrecord_ts_entity_phone>
<#elseif ebank.custrecord_2663_entity_bban?length==9>
<#assign formadePago = "CRE">
<#assign direccion = "">
<#assign telefono = "">
<#elseif ebank.custrecord_2663_entity_bban?length==10>
<#assign formadePago = "CRE">
<#assign direccion = "">
<#assign telefono = "">
<#else>
<#assign formadePago = "">
<#assign direccion = "">
<#assign telefono = "">
</#if>
<#if razonSocial?length > 40>
<#assign razonSocial = razonSocial?substring(0, 40)>
<#else>
<#assign razonSocial = razonSocial >
</#if>
<#list transHash[payment.internalid] as transaction> 
<#assign referencia = transaction.memo>
<#if referencia?length > 40>
<#assign referencia = referencia?substring(0, 40)>
<#else>
<#assign referencia = referencia>
</#if>
PA${setPadding(auxiliarEspacio,"left"," ",1)}${cbank.custpage_eft_custrecord_2663_bban}${setPadding(auxiliarEspacio,"left"," ",1)}${payment_index + 1}${setPadding(auxiliarEspacio,"left"," ",1)}${setPadding(moneda,"right"," ",4)}${amountPayment?string?replace('.','')}${setPadding(auxiliarEspacio,"left"," ",1)}${formadePago}${setPadding(auxiliarEspacio,"left"," ",1)}35${setPadding(auxiliarEspacio,"left"," ",1)}${tipoDocumento}${setPadding(auxiliarEspacio,"left"," ",1)}${entidadesPago.vatregnumber}${setPadding(auxiliarEspacio,"left"," ",1)}${razonSocial}${setPadding(auxiliarEspacio,"left"," ",1)}${referencia}${setPadding(auxiliarEspacio,"left"," ",1)}${direccion}${setPadding(auxiliarEspacio,"left"," ",1)}${telefono}
<#--  ${setPadding(entidadesPago.vatregnumber,"right"," ",11)}${setPadding(razonSocial,"right"," ",60)}FACTURA${setPadding(auxiliarEspacio,"left"," ",1)}${setPadding(tipoTransaccion,"right"," ",20)}${setPadding(auxiliarEspacio,"left"," ",1)}${pfa.custrecord_2663_process_date?string("yyyyMMdd")}${setPadding(amountPayment?string["0000000000000.00"]?replace('.',''),"left","0",12)}<#if esInterbancario == "1">${setPadding(auxiliarEspacio,"left"," ",10)}<#else>${setPadding(ebank.custrecord_2663_entity_bban,"right"," ",10)}</#if>N${setPadding(ebank.custrecord_ts_entity_email?upper_case,"right"," ",50)}<#if esInterbancario == "1">${setPadding(ebank.custrecord_2663_entity_bban,"right"," ",20)}<#else>${setPadding(auxiliarEspacio,"left"," ",20)}</#if>0001  -->
</#list>
</#list>
#OUTPUT END#
<#--  dfernanfez  -->