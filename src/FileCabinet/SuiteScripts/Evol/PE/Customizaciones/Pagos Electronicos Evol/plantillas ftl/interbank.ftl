<#-- format specific processing INTERBANK-->
#OUTPUT START#
<#assign auxiliarCero = 0>
<#assign auxiliarEspacio = " ">
<#assign cuentaPagos = 0>
<#assign totalCuentas = 0>
<#assign cantidadTransacciones = 0>
<#assign moneda = "0">
<#list payments as payment>
<#assign totalAmount = computeTotalAmount(payments)>
<#assign cantidadTransacciones = cantidadTransacciones + 1>
</#list>
${cbank.custpage_eft_custrecord_2663_bank_num}${setPadding(auxiliarEspacio,"left"," ",36)}${pfa.custrecord_2663_process_date?string("yyyyMMddHHmmss")}${setPadding(auxiliarEspacio,"left"," ",9)}${setPadding(cantidadTransacciones,"left","0",6)}<#if cbank.custrecord_2663_currency == "Soles">${setPadding(totalAmount?string["0000000000000.00"]?replace('.','')?replace(',',''),"left","0",17)}${setPadding(auxiliarEspacio,"left"," ",1)}<#else>${setPadding(auxiliarCero,"left","0",17)}</#if><#if cbank.custrecord_2663_currency == "Soles">${setPadding(auxiliarCero,"left","0",13)}<#else>${setPadding(totalAmount?string["0000000000000.00"]?replace('.','')?replace(',',''),"left","0",13)}</#if>${cbank.custpage_eft_custrecord_2663_bank_code}
<#if cbank.custrecord_2663_currency == "Soles">
<#assign moneda = "01"> <#-- soles  -->
<#else> 
<#assign moneda = "10"> <#-- dólares  -->
</#if>
<#list payments as payment>
<#assign entidadesPago = entities[payment_index] >
<#assign amountPayment = getAmount(payment)>
<#assign ebank = ebanks[payment_index] >
<#assign primeraParte = ebank.custrecord_ts_type_account_int?split("-")[0]?trim>
<#if entidadesPago.vatregnumber?length==8>
<#assign tipoDocumento = "01"> <#-- dni  -->
<#elseif entidadesPago.vatregnumber?length==11>
<#assign tipoDocumento = "02"> <#-- ruc  -->
<#else>
<#assign tipoDocumento = "03"> <#-- carnet de extranjería  -->
</#if>
<#if ebank.custrecord_2663_entity_bban?length==20>
<#assign tipoAbono = "99"> <#-- interbancario  -->
<#elseif ebank.custrecord_2663_entity_bban?length==13>
<#assign tipoAbono = "09"> <#-- ahorro en cuenta  -->
<#else>
<#assign tipoAbono = "11"> <#-- cheque de gerencia  -->
</#if>
02${tipoDocumento}${setPadding(entidadesPago.vatregnumber,"right"," ",47)}${moneda}${setPadding(amountPayment?string["0000000000000.00"]?replace('.','')?replace(',',''),"left","0",15)}${setPadding(auxiliarEspacio,"left"," ",1)}${tipoAbono}${primeraParte}01${setPadding(ebank.custrecord_2663_entity_bban,"right"," ",23)}P${tipoDocumento}${setPadding(entidadesPago.vatregnumber,"right"," ",15)}<#if entidadesPago.vatregnumber?length==8>${setPadding(entidadesPago.firstname,"right"," ",20)}${entidadesPago.lastname}<#else>${entidadesPago.companyname}</#if>
</#list>
#OUTPUT END#
<#--  dfernanfez  -->