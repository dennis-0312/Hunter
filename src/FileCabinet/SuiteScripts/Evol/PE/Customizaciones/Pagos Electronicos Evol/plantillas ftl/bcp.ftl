<#-- format specific processing -->
<#assign totalAmount = 0>
<#assign cuentaPagos = 0>

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
</#if>TeleCredito BCP
<#if (tranAmount < 0)>
<#assign tranAmount = tranAmount * -1>
</#if>
<#return tranAmount>
</#function>

<#-- template building -->
#OUTPUT START#
<#assign cuentaPagos = 0>
<#assign totalCuentas = 0>
<#list payments as payment>
<#assign totalAmount = computeTotalAmount(payments)>
<#assign cuentaPagos = cuentaPagos + 1>
<#assign ebank = ebanks[payment_index] >
<#assign tipoCuenta = ebank.custrecord_ev_type_bank_account_bcp>
<#assign tipoCuenta = tipoCuenta?substring(0,1)>
<#if tipoCuenta == "A">
<#assign totalCuentas = totalCuentas + ebank.custrecord_2663_entity_bban?substring(ebank.custrecord_2663_entity_bban?length?number - 11,ebank.custrecord_2663_entity_bban?length)?number>
<#else>
<#assign totalCuentas = totalCuentas + ebank.custrecord_2663_entity_bban?substring(ebank.custrecord_2663_entity_bban?length?number - 10,ebank.custrecord_2663_entity_bban?length)?number>
</#if>
</#list>
<#assign monedaBCP = "1001">
<#if cbank.custrecord_2663_currency == "Soles">
<#assign monedaBCP = "0001">
</#if>
<#if tipoCuenta == "A">
<#assign totalCuentas = totalCuentas + cbank.custpage_eft_custrecord_2663_bban?substring(cbank.custpage_eft_custrecord_2663_bban?length?number - 11,cbank.custpage_eft_custrecord_2663_bban?length)?number>
<#else>
<#assign totalCuentas = totalCuentas + cbank.custpage_eft_custrecord_2663_bban?substring(cbank.custpage_eft_custrecord_2663_bban?length?number - 10,cbank.custpage_eft_custrecord_2663_bban?length)?number>
</#if>
<#assign totalCuentas = formatAmount(totalCuentas,"noDec")?string>
<#assign totalCuentas = totalCuentas?substring(0,totalCuentas?length-2)>
1${setPadding(cuentaPagos?c,"left","0",6)}${pfa.custrecord_2663_process_date?string("yyyyMMdd")}${cbank.custpage_eft_custrecord_2663_bank_num}${monedaBCP}${setPadding(cbank.custpage_eft_custrecord_2663_bban,"right"," ",20)}${setPadding(formatAmount(totalAmount,"dec"),"left","0",17)}${setPadding(paf.custrecord_2663_ref_note,"left"," ",40)}${setPadding(setPadding(pfa.internalid,"left","0",8),"left"," ",40)}N${setPadding(totalCuentas?string,"left","0",15)}
<#list payments as payment>
<#assign entidadesPago = entities[payment_index] >
<#assign ebank = ebanks[payment_index] >
<#assign amountPayment = getAmount(payment)>
2${setPadding(ebank.custrecord_ev_type_bank_account_bcp,"right"," ",1)}${setPadding(ebank.custrecord_2663_entity_bban,"right"," ",20)}1<#if entidadesPago.vatregnumber?length==8>1<#else>6</#if>${setPadding(entidadesPago.vatregnumber,"right"," ",12)}${setLength("",3)}${setLength(buildEntityName(entidadesPago)?replace('Á','A')?replace('É','E')?replace('Í','I')?replace('Ó','O')?replace('Ú','U')?replace('á','a')?replace('ñ','n')?replace('Ñ','N')?replace('é','e')?replace('í','i')?replace('ó','o')?replace('ú','u'),75)}${setLength("",60)}${monedaBCP}${setPadding(formatAmount(amountPayment,"dec"),"left","0",17)}${setPadding(ebank.custrecord_ev_validate_account_bcp,"right","",1)}
<#list transHash[payment.internalid] as transaction>
<#assign totalAmount2 = computeTotalAmount(transaction)>
<#assign tipoTransaccion = transaction.type?substring(0,1)>
<#if tipoTransaccion == "B">
<#assign tipoTransaccion = "F">
<#else>
<#if tipoTransaccion == "V">
<#assign tipoTransaccion = "N">
<#else>
<#if tipoTransaccion == "F">
<#assign tipoTransaccion = "F">
<#else>
<#assign tipoTransaccion = "C">
</#if>
</#if>
</#if>
3${tipoTransaccion}${setPadding((transaction.tranid)?replace(' ','')?replace('-',''),"right"," ",15)}${setPadding(formatAmount(getReferenceAmount(payment, pfa.custrecord_2663_account.type, transaction),"dec"),"left","0",17)}
</#list>
</#list>
#OUTPUT END#