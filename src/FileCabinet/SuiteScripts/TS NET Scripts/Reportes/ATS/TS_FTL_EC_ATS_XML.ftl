<#setting locale="en_US">
<#setting locale = "computer">
<#setting number_format = "computer">
<#assign json = jsonString.text?eval>
<#assign conta = 0>
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<iva>
    <TipoIDInformante>${json.TipoIDInformante}</TipoIDInformante>
	<IdInformante>${json.IdInformante}</IdInformante>
	<razonSocial>${json.razonSocial}</razonSocial>
	<Anio>${json.Anio}</Anio>
	<Mes>${json.Mes}</Mes>
	<numEstabRuc>${json.numEstabRuc}</numEstabRuc>
	<totalVentas>${json.totalVentas?string["###0.00"]}</totalVentas>
	<codigoOperativo>${json.codigoOperativo}</codigoOperativo>
    <compras>
        <#list json.compras as item>
        <detalleCompras>
            <codSustento>${item.codSustento}</codSustento>
            <tpIdProv>${item.tpIdProv}</tpIdProv>
            <idProv>${item.idProv}</idProv>
            <tipoComprobante>${item.tipoComprobante}</tipoComprobante>
            <#if item.tpIdProv == '03'>
            <tipoProv>${item.tipoProv}</tipoProv>
            <denoProv>${item.denoProv}</denoProv>
            </#if>
            <#if item.tpIdProv == '01' || item.tpIdProv == '02' || item.tpIdProv == '03'>
            <parteRel>${item.parteRel}</parteRel>
            </#if>
            <fechaRegistro>${item.fechaRegistro}</fechaRegistro>
            <establecimiento>${item.establecimiento}</establecimiento>
            <puntoEmision>${item.puntoEmision}</puntoEmision>
            <secuencial>${item.secuencial}</secuencial>
            <fechaEmision>${item.fechaEmision}</fechaEmision>
            <autorizacion>${item.autorizacion}</autorizacion>
            <baseNoGraIva>${item.baseNoGraIva?abs?string["###0.00"]}</baseNoGraIva>
            <baseImponible>${item.baseImponible?abs?string["###0.00"]}</baseImponible>
            <baseImpGrav>${item.baseImpGrav?abs?string["###0.00"]}</baseImpGrav>
            <baseImpExe>${item.baseImpExe?abs?string["###0.00"]}</baseImpExe>
            <montoIce>${item.montoIce?abs?string["###0.00"]}</montoIce>
            <montoIva>${item.montoIva?abs?string["###0.00"]}</montoIva>
            <valRetBien10>${item.valRetBien10?abs?string["###0.00"]}</valRetBien10>
            <valRetServ20>${item.valRetServ20?abs?string["###0.00"]}</valRetServ20>
            <valorRetBienes>${item.valorRetBienes?abs?string["###0.00"]}</valorRetBienes>
            <valRetServ50>${item.valRetServ50?abs?string["###0.00"]}</valRetServ50>
            <valorRetServicios>${item.valorRetServicios?abs?string["###0.00"]}</valorRetServicios>
            <valRetServ100>${item.valRetServ100?abs?string["###0.00"]}</valRetServ100>
            <totbasesImpReemb>${item.totbasesImpReemb?abs?string["###0.00"]}</totbasesImpReemb>
            <pagoExterior>
                <pagoLocExt>${item.pagoExterior.pagoLocExt}</pagoLocExt>
                <#if item.pagoExterior.pagoLocExt == '01'>
                <paisEfecPago>${item.pagoExterior.paisEfecPago}</paisEfecPago>
                <aplicConvDobTrib>${item.pagoExterior.aplicConvDobTrib}</aplicConvDobTrib>
                <pagExtSujRetNorLeg>${item.pagoExterior.pagExtSujRetNorLeg}</pagExtSujRetNorLeg>
                </#if>
                <#if item.pagoExterior.pagoLocExt == '02'>
                <tipoRegi>${item.pagoExterior.tipoRegi}</tipoRegi>
                    <#if item.pagoExterior.tipoRegi == '01'>
                <paisEfecPagoGen>${item.pagoExterior.paisEfecPagoGen}</paisEfecPagoGen>
                <paisEfecPago>${item.pagoExterior.paisEfecPago}</paisEfecPago>
                <aplicConvDobTrib>${item.pagoExterior.aplicConvDobTrib}</aplicConvDobTrib>
                <pagExtSujRetNorLeg>${item.pagoExterior.pagExtSujRetNorLeg}</pagExtSujRetNorLeg>
                    </#if>
                    <#if item.pagoExterior.tipoRegi == '02'>
                <paisEfecPagoParFis>${item.pagoExterior.paisEfecPagoParFis}</paisEfecPagoParFis>
                <paisEfecPago>${item.pagoExterior.paisEfecPago}</paisEfecPago>
                <aplicConvDobTrib>${item.pagoExterior.aplicConvDobTrib}</aplicConvDobTrib>
                <pagExtSujRetNorLeg>${item.pagoExterior.pagExtSujRetNorLeg}</pagExtSujRetNorLeg>
                    </#if>
                    <#if item.pagoExterior.tipoRegi == '03'>
                <denopago>${item.pagoExterior.denopago}</denopago>
                <paisEfecPago>${item.pagoExterior.paisEfecPago}</paisEfecPago>
                <aplicConvDobTrib>${item.pagoExterior.aplicConvDobTrib}</aplicConvDobTrib>
                <pagExtSujRetNorLeg>${item.pagoExterior.pagExtSujRetNorLeg}</pagExtSujRetNorLeg>
                <pagoRegFis>${item.pagoExterior.pagoRegFis}</pagoRegFis>
                    </#if>
                </#if>
            </pagoExterior>
            <#if item.tipoComprobante == '05'>
            <docModificado>${item.codigoTipoCM}</docModificado>
            <estabModificado>${item.establecimientoCM}</estabModificado>
            <ptoEmiModificado>${item.puntoEmisionCM}</ptoEmiModificado>
            <secModificado>${item.secuencialCM}</secModificado>
            <autModificado>${item.numeroAutorizacionCM}</autModificado>
            </#if>
            <#if item.tipoComprobante != '04'>
            <#if item.formasDePago.formaPago != ''>
            <formasDePago>
                <formaPago>${item.formasDePago.formaPago}</formaPago>
            </formasDePago>
            </#if>
            </#if>
            <#if item.air?has_content>
            <air>
            <#list item.air as detalleAir>
                <#assign conta = 1>
            	<detalleAir>
					<codRetAir>${detalleAir.codRetAir}</codRetAir>
					<baseImpAir>${detalleAir.baseImpAir?abs?string["###0.00"]}</baseImpAir>
					<porcentajeAir>${detalleAir.porcentajeAir}</porcentajeAir>
					<valRetAir>${detalleAir.valRetAir?abs?string["###0.00"]}</valRetAir>
                </detalleAir>
            </#list>
			</air>
			</#if>
            <#if conta == 1>
            <#if item.estabRetencion1 != ''>
            <estabRetencion1>${item.estabRetencion1}</estabRetencion1>
            <ptoEmiRetencion1>${item.ptoEmiRetencion1}</ptoEmiRetencion1>
            <secRetencion1>${item.secRetencion1}</secRetencion1>
            <autRetencion1>${item.autRetencion1}</autRetencion1>
            <fechaEmiRet1>${item.fechaEmiRet1}</fechaEmiRet1>
			</#if>
			</#if>
            <#assign conta = 0>
            <#if item.reembolsos?has_content>
            <reembolsos>
            <#list item.reembolsos as detallereembolso>
            	<reembolso>
					<tipoComprobanteReemb>${detallereembolso.tipoComprobanteReemb}</tipoComprobanteReemb>
                    <tpIdProvReemb>${detallereembolso.tpIdProvReemb}</tpIdProvReemb>
                    <idProvReemb>${detallereembolso.idProvReemb}</idProvReemb>    
                    <establecimientoReemb>${detallereembolso.establecimientoReemb}</establecimientoReemb>
                    <puntoEmisionReemb>${detallereembolso.puntoEmisionReemb}</puntoEmisionReemb>
                    <secuencialReemb>${detallereembolso.secuencialReemb}</secuencialReemb>
                    <fechaEmisionReemb>${detallereembolso.fechaEmisionReemb}</fechaEmisionReemb>
                    <autorizacionReemb>${detallereembolso.autorizacionReemb}</autorizacionReemb>
                    <baseImponibleReemb>${detallereembolso.baseImponibleReemb}</baseImponibleReemb>
                    <baseImpGravReemb>${detallereembolso.baseImpGravReemb}</baseImpGravReemb>
                    <baseNoGraIvaReemb>${detallereembolso.baseNoGraIvaReemb}</baseNoGraIvaReemb>
                    <baseImpExeReemb>${detallereembolso.baseImpExeReemb}</baseImpExeReemb>
                    <montoIceRemb>${detallereembolso.montoIceRemb}</montoIceRemb>
                    <montoIvaRemb>${detallereembolso.montoIvaRemb}</montoIvaRemb>
                </reembolso>
            </#list>
			</reembolsos>
			</#if>
        </detalleCompras>
        </#list>
    </compras>
    <#if json.ventas?has_content>
    <ventas>
        <#list json.ventas as detalleVentas>
        <detalleVentas>
            <tpIdCliente>${detalleVentas.tpIdCliente}</tpIdCliente>
            <idCliente>${detalleVentas.idCliente}</idCliente>
            <#if detalleVentas.tpIdCliente == '04' || detalleVentas.tpIdCliente == '05' || detalleVentas.tpIdCliente == '06' >
            <parteRelVtas>${detalleVentas.parteRelVtas}</parteRelVtas>
            </#if>
            <#if detalleVentas.tpIdCliente == '06'>
            <tipoCliente>${detalleVentas.tipoCliente}</tipoCliente>
            </#if>
            <#if detalleVentas.tpIdCliente == '03'>
            <DenoCli>${detalleVentas.DenoCli}</DenoCli>
            </#if>
            <tipoComprobante>${detalleVentas.tipoComprobante}</tipoComprobante>
            <tipoEmision>${detalleVentas.tipoEmision}</tipoEmision>
            <numeroComprobantes>${detalleVentas.numeroComprobantes}</numeroComprobantes>
            <baseNoGraIva>${detalleVentas.baseNoGraIva?abs?string["###0.00"]}</baseNoGraIva>
            <baseImponible>${detalleVentas.baseImponible?abs?string["###0.00"]}</baseImponible>
            <baseImpGrav>${detalleVentas.baseImpGrav?abs?string["###0.00"]}</baseImpGrav>
            <montoIva>${detalleVentas.montoIva?abs?string["###0.00"]}</montoIva>
            <montoIce>${detalleVentas.montoIce?abs?string["###0.00"]}</montoIce>
            <valorRetIva>${detalleVentas.valorRetIva?abs?string["###0.00"]}</valorRetIva>
            <valorRetRenta>${detalleVentas.valorRetRenta?abs?string["###0.00"]}</valorRetRenta>
            <#if detalleVentas.tipoComprobante != '04'>
            <formasDePago>
            <#list detalleVentas.formasDePago as formaPago>
                <formaPago>${formaPago}</formaPago>
            </#list>
            </formasDePago>
            </#if>
        </detalleVentas>
        </#list>
    </ventas>
    </#if>
    <#if json.ventasEstablecimiento?has_content>
    <ventasEstablecimiento>
        <#list json.ventasEstablecimiento as ventaEst>
        <ventaEst>
            <codEstab>${ventaEst.codEstab}</codEstab>
            <ventasEstab>${ventaEst.ventasEstab?abs?string["###0.00"]}</ventasEstab>
        </ventaEst>
        </#list>
    </ventasEstablecimiento>
    </#if>
    <#if json.exportaciones?has_content>
    <exportaciones>
        <#list json.exportaciones as detalleExportaciones>
        <detalleExportaciones>
            <tpIdClienteEx>${detalleExportaciones.tpIdClienteEx}</tpIdClienteEx>
            <idClienteEx>${detalleExportaciones.idClienteEx}</idClienteEx>
            <parteRelExp>${detalleExportaciones.parteRelExp}</parteRelExp>
            <tipoCli>${detalleExportaciones.tipoCli}</tipoCli>
            <denoExpCli>${detalleExportaciones.denoExpCli}</denoExpCli>
            <tipoRegi>${detalleExportaciones.tipoRegi}</tipoRegi>
            <#if detalleExportaciones.tipoRegi == '01'>
            <paisEfecPagoGen>${detalleExportaciones.paisEfecPagoGen}</paisEfecPagoGen>
            <#elseif detalleExportaciones.tipoRegi == '02'>
            <paisEfecPagoParFis>${detalleExportaciones.paisEfecPagoParFis}</paisEfecPagoParFis>
            <#elseif detalleExportaciones.tipoRegi == '03'>
            <denopagoRegFis>${detalleExportaciones.denopagoRegFis}</denopagoRegFis>
            </#if>
            <paisEfecExp>${detalleExportaciones.paisEfecExp}</paisEfecExp>
            <#if detalleExportaciones.tipoRegi == '03'>
            <pagoRegFis>${detalleExportaciones.pagoRegFis}</pagoRegFis>
            </#if>
            <exportacionDe>${detalleExportaciones.exportacionDe}</exportacionDe>
            <tipIngExt>${detalleExportaciones.tipIngExt}</tipIngExt>
            <ingExtGravOtroPais>${detalleExportaciones.ingExtGravOtroPais}</ingExtGravOtroPais>
            <#if detalleExportaciones.exportacionDe == '01'>
				<#if detalleExportaciones.ingExtGravOtroPais == 'SI'>
					<impuestootropais>${detalleExportaciones.impuestootropais?abs?string["###0.00"]}</impuestootropais>
				</#if>
            <tipoComprobante>${detalleExportaciones.tipoComprobante}</tipoComprobante>
			<#if '02' == '01'>
            <distAduanero>${detalleExportaciones.distAduanero}</distAduanero>
            <anio>${detalleExportaciones.anio}</anio>
            <regimen>${detalleExportaciones.regimen}</regimen>
            <correlativo>${detalleExportaciones.correlativo}</correlativo>
            <verificador>${detalleExportaciones.verificador}</verificador>
            <docTransp>${detalleExportaciones.docTransp}</docTransp>
			</#if>
            <fechaEmbarque>${detalleExportaciones.fechaEmbarque}</fechaEmbarque>
            <#elseif detalleExportaciones.exportacionDe == '02'>
            <#-- <impuestootropais>${detalleExportaciones.impuestootropais?abs?string["###0.00"]}</impuestootropais> -->
            <tipoComprobante>${detalleExportaciones.tipoComprobante}</tipoComprobante>
            <fechaEmbarque>${detalleExportaciones.fechaEmbarque}</fechaEmbarque>
            <#elseif detalleExportaciones.exportacionDe == '03'>
                <#if detalleExportaciones.ingExtGravOtroPais == 'SI'>
            <impuestootropais>${detalleExportaciones.impuestootropais}</impuestootropais>
                </#if> 
            <tipoComprobante>${detalleExportaciones.tipoComprobante}</tipoComprobante>
            <fechaEmbarque>${detalleExportaciones.fechaEmbarque}</fechaEmbarque>
            </#if>
            <valorFOB>${detalleExportaciones.valorFOB?abs?string["###0.00"]}</valorFOB>
            <valorFOBComprobante>${detalleExportaciones.valorFOBComprobante?abs?string["###0.00"]}</valorFOBComprobante>
            <establecimiento>${detalleExportaciones.establecimiento}</establecimiento>
            <puntoEmision>${detalleExportaciones.puntoEmision}</puntoEmision>
            <secuencial>${detalleExportaciones.secuencial}</secuencial>
            <autorizacion>${detalleExportaciones.autorizacion}</autorizacion>
            <fechaEmision>${detalleExportaciones.fechaEmision}</fechaEmision>                
        </detalleExportaciones>
        </#list>
    </exportaciones>
    </#if>
    <#if json.anulados?has_content>
    <anulados>
        <#list json.anulados as detalleAnulados>
        <detalleAnulados>
            <tipoComprobante>${detalleAnulados.tipoComprobante}</tipoComprobante>
            <establecimiento>${detalleAnulados.establecimiento}</establecimiento>
            <puntoEmision>${detalleAnulados.puntoEmision}</puntoEmision>
            <secuencialInicio>${detalleAnulados.secuencialInicio}</secuencialInicio>
            <secuencialFin>${detalleAnulados.secuencialFin}</secuencialFin>
            <autorizacion>${detalleAnulados.autorizacion}</autorizacion>
        </detalleAnulados>
        </#list>
    </anulados>
    </#if>
</iva>