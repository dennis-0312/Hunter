<#-- format specific processing SCOTIABANK-->
#OUTPUT START#
<#assign auxiliarCero = 0>
<#assign auxiliarEspacio = " ">
<#list payments as payment>
<#assign entidadesPago = entities[payment_index] >
<#assign amountPayment = getAmount(payment)>
<#assign ebank = ebanks[payment_index] >
<#assign primeraParte = ebank.custrecord_ts_type_account_int?split("-")[0]?trim>
<#if entidadesPago.vatregnumber?length==8>
<#assign tipoDocumento = "01"> <#-- dni  -->
<#assign razonSocial = entidadesPago.firstname + " " + entidadesPago.lastname > <#-- Nombre y Apellido  -->
<#elseif entidadesPago.vatregnumber?length==11>
<#assign tipoDocumento = "02"> <#-- ruc  -->
<#assign razonSocial = entidadesPago.companyname > <#-- Company Name  -->
<#else>
<#assign tipoDocumento = "03"> <#-- carnet de extranjería  -->
<#assign razonSocial = entidadesPago.firstname + " " + entidadesPago.lastname > <#-- Nombre y Apellido  -->
</#if>
<#if ebank.custrecord_2663_entity_bban?length==20>
<#assign esInterbancario = "1">
<#elseif ebank.custrecord_2663_entity_bban?length==10>
<#assign esInterbancario = "0">
<#else>
<#assign esInterbancario = "0">
</#if>
<#list transHash[payment.internalid] as transaction> 
<#assign nroDocumento = transaction.custbody_pe_number>
${setPadding(entidadesPago.vatregnumber,"right"," ",11)}${setPadding(razonSocial,"right"," ",60)}FACTURA${setPadding(auxiliarEspacio,"left"," ",1)}${setPadding(nroDocumento,"right"," ",20)}${setPadding(auxiliarEspacio,"left"," ",1)}${pfa.custrecord_2663_process_date?string("yyyyMMdd")}${setPadding(amountPayment?string["0000000000000.00"]?replace('.','')?replace(',',''),"left","0",12)}<#if esInterbancario == "1">${setPadding(auxiliarEspacio,"left"," ",10)}<#else>${setPadding(ebank.custrecord_2663_entity_bban,"right"," ",10)}</#if>N${setPadding(ebank.custrecord_ts_entity_email?upper_case,"right"," ",50)}<#if esInterbancario == "1">${setPadding(ebank.custrecord_2663_entity_bban,"right"," ",20)}<#else>${setPadding(auxiliarEspacio,"left"," ",20)}</#if>0001
</#list>
</#list>
#OUTPUT END#
<#--  dfernanfez  -->