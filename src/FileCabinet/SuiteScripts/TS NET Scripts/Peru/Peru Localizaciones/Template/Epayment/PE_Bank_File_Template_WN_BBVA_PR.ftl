<#-- format specific processing -->
<#function getReferenceAmount payment accountType transaction>
<#assign tranAmount = 0 >
<#if payment.currency?has_content>
<#if accountType == "Bank">
<#assign tranAmount = transaction.appliedtoforeignamount>
<#else>
<#assign tranAmount = transaction.applyingforeignamount>
</#if>
<#else>
<#if accountType == "Bank">
<#assign tranAmount = transaction.appliedtolinkamount>
<#else>
<#assign tranAmount = transaction.applyinglinkamount>
</#if>
</#if>
<#if (tranAmount < 0)>
<#assign tranAmount = tranAmount * -1>
</#if>
<#return tranAmount>
</#function>
<#-- template building -->
#OUTPUT START#
<#assign cuentaPagos = 0>
<#assign auxiliarCero = 0>
<#assign auxiliarEspacio = " ">
<#list payments as payment>
<#assign cuentaPagos = cuentaPagos + 1>
<#assign totalAmount = computeTotalAmount(payments)>
<#assign tipoProceso = cbank.custrecord_bbva_process_type>
<#assign tipoProceso = tipoProceso?substring(0,1)>
</#list>
<#assign monedaBBVA = "PEN">
<#if cbank.custrecord_2663_currency == "US Dollar">
<#assign monedaBBVA = "USD">
</#if>
<#assign fechaProceso = " ">
<#if tipoProceso == "F">
<#assign fechaProceso = pfa.custrecord_2663_process_date?string("yyyyMMdd")>
</#if>
<#assign horaProceso = " ">
<#if tipoProceso == "H">
<#assign horaProceso = cbank.custpage_eft_custrecord_2663_process_hours?substring(0,1)>
</#if>
750${setPadding(cbank.custpage_eft_custrecord_2663_bban,"right","",20)}${monedaBBVA}${setPadding(formatAmount(totalAmount,"noDec"),"left","0",15)}${setPadding(tipoProceso,"right"," ",1)}${setPadding(fechaProceso,"right"," ",8)}${setPadding(horaProceso,"right"," ",1)}${setPadding(pfa.custrecord_2663_ref_note,"right"," ",25)}${setPadding(cuentaPagos?c,"left","0",6)}N${setPadding(auxiliarEspacio,"left"," ",15)}${setPadding(auxiliarEspacio,"left"," ",3)}${setPadding(auxiliarEspacio,"left"," ",30)}${setPadding(auxiliarEspacio,"left"," ",20)}
<#list payments as payment>
<#assign entidadesPago = entities[payment_index] >
<#assign ebank = ebanks[payment_index] >
<#assign amountPayment = getAmount(payment)>
<#assign tipoAbono = ebank.custrecord_ts_bbva_vendor_abono>
<#assign tipoAbono = tipoAbono?substring(0,1)>
<#assign cuentaAbono = setPadding(ebank.custrecord_2663_entity_bban,"right"," ",20)>
<#if tipoAbono == "O">
<#assign cuentaAbono = " ">
<#elseif tipoAbono == "P">
<#assign cuentaAbono = setPadding(ebank.custrecord_2663_entity_bban,"right"," ",20)>
</#if>
<#list transHash[payment.internalid] as transaction>
<#assign transaction = transHash[payment.internalid]>
<#assign tipoTransaccion = transaction.custbody_pe_document_type>
<#if tipoTransaccion == "Factura">
<#assign tipoTransaccion = "F">
<#elseif tipoTransaccion == "Boleta">
<#assign tipoTransaccion = "B">
<#else>
<#assign tipoTransaccion = "N">
</#if>
<#assign numberDoc = setPadding(transaction.tranid?replace(' ','')?replace('-',''),"right"," ",12)>
002<#if entidadesPago.vatregnumber?length==8>L<#else>R</#if>${setPadding(entidadesPago.vatregnumber,"right"," ",12)}${setPadding(tipoAbono,"right"," ",1)}${cuentaAbono}${setLength(buildEntityName(entidadesPago)?replace('Á','A')?replace('É','E')?replace('Í','I')?replace('Ó','O')?replace('Ú','U')?replace('á','a')?replace('ñ','n')?replace('Ñ','N')?replace('é','e')?replace('í','i')?replace('ó','o')?replace('ú','u'),40)}${setPadding(formatAmount(getReferenceAmount(payment, pfa.custrecord_2663_account.type, transaction),"noDec"),"left","0",15)}${tipoTransaccion}${numberDoc}N${setPadding(auxiliarEspacio,"left"," ",40)}${setPadding(auxiliarEspacio,"left"," ",81)}${setPadding(auxiliarEspacio,"left"," ",32)}${setPadding(auxiliarEspacio,"left"," ",18)}
</#list>
</#list>
#OUTPUT END#