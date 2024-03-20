<#assign detailType = "BZDET">
<#assign auxiliarCero = 0>
<#assign auxiliarEspacio = " ">
<#list payments as payment>
<#assign totalAmount = payment.custrecord_ts_epmt_prepaydet_paym_amount>
<#if (payment.ebank)??>
<#assign ebank = payment.ebank>
<#else>
<#assign ebank = {}>
</#if>
<#if payment["custrecord_ts_epmt_prepaydet_entity.type"].value == "Employee">
<#assign entity = employees[payment.custrecord_ts_epmt_prepaydet_entity.value]>
<#assign codigoEmpresa = entity.custentity_ec_cod_banco>
<#assign vatregnumber = entity.custentity_ec_numero_registro>
<#elseif payment["custrecord_ts_epmt_prepaydet_entity.type"].value == "Vendor">
<#assign entity = vendors[payment.custrecord_ts_epmt_prepaydet_entity.value]>
<#assign codigoEmpresa = ebank.custrecord_2663_entity_processor_code>
<#assign vatregnumber = entity.vatregnumber>
<#elseif payment["custrecord_ts_epmt_prepaydet_entity.type"].value == "CustJob">
<#assign entity = customers[payment.custrecord_ts_epmt_prepaydet_entity.value]>
<#assign codigoEmpresa = entity.custentity_ec_cod_banco>
<#assign vatregnumber = entity.vatregnumber>
<#else>
<#assign entity = {}>
</#if>
<#assign docTypeEntity = entity.custentityts_ec_cod_tipo_doc_identidad>
<#if docTypeEntity == "04">
<#assign docType = "R">
<#elseif docTypeEntity == "05">
<#assign docType = "C">
<#else>
<#assign docType = "P">
</#if>
<#assign transaction = transactions[payment.custrecord_ts_epmt_prepaydet_origin_tran.value]><!--<#assign serieCXC = transaction.custbody_ts_ec_serie_cxc>-->
<#assign serieCXC = ""><!--<#assign serieCXP = transaction.custbody_ts_ec_serie_doc_cxp>-->
<#assign serieCXP = ""><!--<#assign tipoDocumentiFiscal = transaction.custbodyts_ec_tipo_documento_fiscal>-->
<#assign codTerminoPago = payment.custrecord_ts_epmt_prepaydet_paym_method.text><!--<#assign comRetencion = transaction.custbody_ec_serie_cxc_retencion + transaction.custbody_ts_ec_preimpreso_retencion>-->
<#assign comRetencion = ""><!--<#assign fechaAuto = transaction.custbody_ec_fecha_autorizacion>-->
<#assign fechaAuto = ""><!--<#assign numAutorizacion = transaction.custbodyts_ec_num_autorizacion>-->
<#assign telefono = entity.phone>
<#if codTerminoPago == "CUE">
<#assign codTermino = ebank.custrecord_2663_entity_ec_tipo_cuentacob.text >
<#assign account = setMaxLength(ebank.custrecord_2663_entity_bban,10) >
<#assign codigoBanco = 34 >
<#elseif codTerminoPago == "IMP">
<#assign account = setMaxLength(ebank.custrecord_2663_entity_bban,10) >
<#elseif codTerminoPago == "COB">
<#assign codTermino = ebank.custrecord_2663_entity_ec_tipo_cuentacob.text >
<#assign account = setMaxLength(ebank.custrecord_2663_entity_bban,18) >
<#assign codigoBanco = ebank.custrecord_2663_entity_bank_code.value >
<#else>
<#assign codTermino = " " >
<#assign account = " " >
<#assign codigoBanco = " " >
</#if >
<#if telefono?length==0>
<#assign telefono = " " >
</#if>
<#if codigoEmpresa?length==0>
<#assign codigoEmpresa = " " >
</#if>
<#assign codigoEmpresa = "00363">
<#--  LOGICA EMITIDO SUSTENTO  -->
<#if transaction.custbody_ht_emitido_pago_electronico??><#-- si existe este campo puede ser cheque, anticipo o pago  -->
    <#assign emitido="SI">
    <#assign codigoBanco = "34" >
    <#assign codTermino = "03" >
    <#assign account = "0005018787">
    <#assign nrocheque = transaction.tranid>
    <#assign glosa=" ">
    <#if transaction.tipo=="VendPymt">
        <#assign sustento=transaction.custbody_ts_ec_numero_preimpreso>
        <#assign autorizacion=1115855284>
        <#assign fechaautorizacion=" ">
        <#assign pruebaVar="pruebaVar1">
        <#if transaction.custbody_ts_ec_preimpreso_retencion?length==0>
            <#assign rete="0">
        <#else>
            <#assign rete = transaction.custbody_ec_serie_cxc_retencion + transaction.custbody_ts_ec_preimpreso_retencion>
        </#if>
    <#else>
        <#assign pruebaVar = "pruebaVar2">
    </#if>
<#else>
    <#assign emitido="NO">
    <#assign glosa=transaction.memo>
    <#if transaction.custbody_ts_related_transaction.value?length==0>
        <#assign sustento="0">
        <#assign rete="0">
        <#assign autorizacion=" ">
        <#assign fechaautorizacion=" ">
        <#assign pruebaVar="pruebaVar3">
    <#else>
        <#if transaction.type.value=="PurchOrd">
            <#assign sustento="0">
            <#assign rete="0">
            <#assign autorizacion=" ">
            <#assign pruebaVar="pruebaVar4">
        <#else>
            <#assign sustento = transaction.relatedTransaction.sustento>
            <#assign autorizacion=1115855284>
            <#assign fechaautorizacion=" ">
            <#assign pruebaVar="pruebaVar5">
            <#if transaction.relatedTransaction.retencion?length==0>
                <#assign rete = "0" >
            <#else>
                <#assign rete = transaction.relatedTransaction.retencion >
            </#if>
        </#if>
    </#if>  
</#if>
<#--  <#if transaction.custbody_ts_related_transaction.value?length==0>
<#assign sustento = "0" >
<#assign rete = "0" >
<#assign autorizacion = " " >
<#assign fechaautorizacion = " " >
<#assign pruebaVar = "pruebaVar1" >
    <#if transaction.custbody_ht_emitido_pago_electronico??>
    <#assign emitido = "SI1" >
    <#else>
    <#assign emitido = transaction.memo >
    </#if>
<#elseif transaction.tipo=="Custom">
    <#assign emitido = transaction.memo >
    <#if transaction.type.value=="PurchOrd">
    <#assign sustento = "0" >
    <#assign rete = "0" >
    <#assign autorizacion = " " >
    <#assign pruebaVar = "pruebaVar2" >
    <#else>
    <#assign sustento = transaction.relatedTransaction.sustento >
        <#if transaction.relatedTransaction.retencion?length==0>
        <#assign rete = "0" >
        <#else>
        <#assign rete = transaction.relatedTransaction.retencion >
        </#if>
    <#assign autorizacion = 1115855284 >
    <#assign fechaautorizacion = transaction.relatedTransaction.custbody_ec_fecha_autorizacion >
    <#assign pruebaVar = "pruebaVar3" >
    </#if>
<#elseif transaction.tipo=="VendPymt">
<#assign emitido = "SI2" >
<#assign sustento = transaction.custbody_ts_ec_numero_preimpreso >
    <#if transaction.custbody_ts_ec_preimpreso_retencion?length==0>
    <#assign rete = "0" >
    <#else>
    <#assign rete = transaction.custbody_ec_serie_cxc_retencion + transaction.custbody_ts_ec_preimpreso_retencion  >
    </#if>
<#assign autorizacion = 1115855284 >
<#assign fechaautorizacion = " " >
<#assign pruebaVar = "pruebaVar4" >
<#else>
<#assign emitido = "SI3" >
</#if>  -->
<#--  <#if emitido == "SI">
${detailType}${setPadding(payment_index + 1,"left","0",6)}${setPadding(vatregnumber,"right"," ",18)}${docType}${setPadding(vatregnumber,"right"," ",14)}${setPadding(entity.altname,"right"," ",60)}${setPadding(codTerminoPago,"right"," ",3)}001${setPadding(codigoBanco,"right"," ",2)}${setPadding(codTermino,"right"," ",2)}${setPadding(account,"right"," ",20)}1${totalAmount?string["0000000000000.00"]?replace('.','')}${setPadding(emitido,"right"," ",60)}${setPadding(transaction.internalid.value,"left","0",15)}${setPadding(rete,"left","0",15)}${setPadding(rete,"left","0",15)}${setPadding(sustento,"left","0",20)}${setPadding(auxiliarEspacio,"right"," ",10)}${setPadding(auxiliarEspacio,"right"," ",50)}${setPadding(entity.address?replace('<br />',' ')?replace('\n',' '),"right"," ",50)}${setPadding(telefono?replace("+593","")?replace("+19",""),"right"," ",20)}PRO${setPadding(autorizacion,"right"," ",10)}${setPadding(auxiliarEspacio,"right"," ",20)}N${setPadding(codigoEmpresa,"right"," ",5)}${setPadding(auxiliarEspacio,"right"," ",6)}RPA${setPadding(fechaAutorizacion,"right"," ",10)}
<#else>
${detailType}${setPadding(payment_index + 1,"left","0",6)}${setPadding(vatregnumber,"right"," ",18)}${docType}${setPadding(vatregnumber,"right"," ",14)}${setPadding(entity.altname,"right"," ",60)}${setPadding(codTerminoPago,"right"," ",3)}001${setPadding(codigoBanco,"right"," ",2)}${setPadding(codTermino,"right"," ",2)}${setPadding(account,"right"," ",20)}1${totalAmount?string["0000000000000.00"]?replace('.','')}${setPadding(emitido,"right"," ",60)}${setPadding(transaction.internalid.value,"left","0",15)}${setPadding(rete,"left","0",15)}${setPadding(rete,"left","0",15)}${setPadding(sustento,"left","0",20)}${setPadding(auxiliarEspacio,"right"," ",10)}${setPadding(auxiliarEspacio,"right"," ",50)}${setPadding(entity.address?replace('<br />',' ')?replace('\n',' '),"right"," ",50)}${setPadding(telefono?replace("+593","")?replace("+19",""),"right"," ",20)}PRO${setPadding(autorizacion,"right"," ",10)}${setPadding(auxiliarEspacio,"right"," ",20)}N${setPadding(codigoEmpresa,"right"," ",5)}${setPadding(auxiliarEspacio,"right"," ",6)}RPA${setPadding(fechaAutorizacion,"right"," ",10)}
</#if>  -->
<#if emitido == "SI">
${detailType}${setPadding(payment_index + 1,"left","0",6)}${setPadding(vatregnumber,"right"," ",18)}${docType}${setPadding(vatregnumber,"right"," ",14)}${setPadding(entity.altname,"right"," ",60)}${setPadding(codTerminoPago,"right"," ",3)}001${setPadding(codigoBanco,"right"," ",2)}${setPadding(codTermino,"right"," ",2)}${setPadding(account,"right"," ",10)}${setPadding(nrocheque,"left","0",10)}1${totalAmount?string["0000000000000.00"]?replace('.','')}${setPadding(glosa,"right"," ",60)}${setPadding(auxiliarEspacio,"right"," ",195)}CCH${setPadding(auxiliarEspacio,"right"," ",30)}N${setPadding(codigoEmpresa,"right"," ",5)}
<#--  ${pruebaVar}
${emitido}  -->
<#else>
${detailType}${setPadding(payment_index + 1,"left","0",6)}${setPadding(vatregnumber,"right"," ",18)}${docType}${setPadding(vatregnumber,"right"," ",14)}${setPadding(entity.altname,"right"," ",60)}${setPadding(codTerminoPago,"right"," ",3)}001${setPadding(codigoBanco,"right"," ",2)}${setPadding(codTermino,"right"," ",2)}${setPadding(account,"right"," ",20)}1${totalAmount?string["0000000000000.00"]?replace('.','')}${setPadding(glosa,"right"," ",60)}${setPadding(transaction.internalid.value,"left","0",15)}${setPadding(rete,"left","0",15)}${setPadding(rete,"left","0",15)}${setPadding(sustento,"left","0",20)}${setPadding(auxiliarEspacio,"right"," ",10)}${setPadding(auxiliarEspacio,"right"," ",50)}${setPadding(entity.address?replace('<br />',' ')?replace('\n',' '),"right"," ",50)}${setPadding(telefono?replace("+593","")?replace("+19",""),"right"," ",20)}PRO${setPadding(autorizacion,"right"," ",10)}${setPadding(auxiliarEspacio,"right"," ",20)}N${setPadding(codigoEmpresa,"right"," ",5)}${setPadding(auxiliarEspacio,"right"," ",6)}RPA${setPadding(fechaAutorizacion,"right"," ",10)}
<#--  ${pruebaVar}
${emitido}  -->
</#if>
<#--  ${setPadding(totalAmount,"left","0",15)}  -->
</#list>