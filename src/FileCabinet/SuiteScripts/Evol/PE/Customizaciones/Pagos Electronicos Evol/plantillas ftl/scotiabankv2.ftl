<#-- format specific processing SCOTIABANK-->
#OUTPUT START#
<#assign auxiliarCero = 0>
<#assign auxiliarEspacio = " ">
<#list payments as payment>
<#assign entidadesPago = entities[payment_index] >
<#assign amountPayment = getAmount(payment)>
<#assign ebank = ebanks[payment_index] >
<#if entidadesPago.vatregnumber?length==8>
<#assign tipoDocumento = "01"> <#-- dni -->
<#assign razonSocial = entidadesPago.firstname + " " + entidadesPago.lastname > <#-- Nombre y Apellido -->
<#elseif entidadesPago.vatregnumber?length==11>
<#assign tipoDocumento = "02"> <#-- ruc -->
<#assign razonSocial = entidadesPago.companyname > <#-- Company Name -->
<#else>
<#assign tipoDocumento = "03"> <#-- carnet de extranjería -->
<#assign razonSocial = entidadesPago.firstname + " " + entidadesPago.lastname > <#-- Nombre y Apellido -->
</#if>
<#if ebank.custrecord_2663_entity_bban?length==20>
<#assign esInterbancario = "4">
<#elseif ebank.custrecord_2663_entity_bban?length==10>
<#assign esInterbancario = "2">
<#else>
<#assign esInterbancario = "2">
</#if>
<#list transHash[payment.internalid] as transaction>
<#assign tipoTransaccion = transaction.type?substring(0,1)>
<#if tipoTransaccion == "B">
<#assign tipoTransaccion = "00">
<#else>
<#if tipoTransaccion == "V">
<#assign tipoTransaccion = "-0">
<#else>
<#if tipoTransaccion == "F">
<#assign tipoTransaccion = "00">
<#else>
<#assign tipoTransaccion = "-0">
</#if>
</#if>
</#if>
<#assign nroDocumento = transaction.custbody_pe_number>
<#assign currency = transaction.currency>
<#if currency == 'Soles'>
<#assign currency = "S">
<#assign codigoMoneda = "0001">
<#else>
<#assign currency = "D">
<#assign codigoMoneda = "0101">
</#if>
${setPadding(entidadesPago.vatregnumber,"right"," ",11)}${setPadding(razonSocial,"right"," ",60)}${setPadding(nroDocumento,"right"," ",14)}${pfa.custrecord_2663_process_date?string("yyyyMMdd")}${tipoTransaccion}${setPadding(amountPayment?string["0000000.00"]?replace('.','')?replace(',',''),"left","0",9)}${esInterbancario}<#if esInterbancario == "4">${setPadding(auxiliarEspacio,"left"," ",10)}<#else>${setPadding(ebank.custrecord_2663_entity_bban,"right"," ",10)}</#if>N${setPadding(ebank.custrecord_ts_entity_email?upper_case,"right"," ",50)}<#if esInterbancario == "4">${setPadding(ebank.custrecord_2663_entity_bban,"right"," ",20)}<#else>${setPadding(auxiliarEspacio,"left"," ",20)}</#if>${codigoMoneda}
</#list>
</#list>
#OUTPUT END#
<#-- dfernanfez -->