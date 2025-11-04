<#-- format specific processing BIF-->
#OUTPUT START#
<#assign auxiliarCero = 0>
<#assign auxiliarEspacio = " ">
<#list payments as payment>
<#assign entidadesPago = entities[payment_index] >
<#assign amountPayment = getAmount(payment)>
<#assign ebank = ebanks[payment_index] >
<#assign bankCode = ebank.custrecord_ts_entity_bank_account_name?split("-")[0]?trim>
<#if cbank.custrecord_2663_currency == "Soles">
<#assign moneda = "SOL"> <#-- soles -->
<#assign monedaCode = "4">
<#else>
<#assign moneda = "USD"> <#-- dólares -->
<#assign monedaCode = "3">
</#if>
<#if entidadesPago.vatregnumber?length==11>
<#assign tipoDocumento = "8"> <#-- ruc -->
<#assign razonSocial = entidadesPago.companyname > <#-- Company Name -->
<#else>
<#assign tipoDocumento = "1"> <#-- dni -->
<#assign razonSocial = entidadesPago.firstname + " " + entidadesPago.lastname > <#-- Nombre y Apellido -->
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
${tipoDocumento}${setPadding(entidadesPago.vatregnumber,"right"," ",15)}${setPadding(razonSocial,"right"," ",60)}4${pfa.custrecord_2663_process_date?string("ddMMyyyy")}-${(payment_index + 1)?string("00")}${setPadding(auxiliarEspacio,"left"," ",3)}${moneda}${setPadding(amountPayment?string?replace('.',''),"left"," ",10)}${pfa.custrecord_2663_process_date?string("yyyyMMdd")}${setPadding(auxiliarEspacio,"left"," ",15)}${monedaCode}${bankCode}${moneda}${setPadding(ebank.custrecord_2663_entity_bban,"right"," ",34)}${setPadding(auxiliarCero,"left","0",10)}
</#list>
</#list>
#OUTPUT END#
<#-- dfernanfez -->