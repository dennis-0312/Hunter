<#setting locale = "computer">
<#setting number_format = "computer">
<#assign json = jsonString.text?eval>
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<iva>
    <TipoIDInformante>${json.TipoIDInformante}</TipoIDInformante>
	<IdInformante>${json.IdInformante}</IdInformante>
	<razonSocial>${json.razonSocial}</razonSocial>
	<Anio>${json.Anio}</Anio>
	<Mes>${json.Mes}</Mes>
	<numEstabRuc>${json.numEstabRuc}</numEstabRuc>
	<totalVentas>${json.totalVentas}</totalVentas>
	<codigoOperativo>${json.codigoOperativo}</codigoOperativo>
    <compras>
        <#list json.compras as item>
        <detalleCompras>
            <codSustento>${item.codSustento}</codSustento>
            <tpIdProv>${item.tpIdProv}</tpIdProv>
            <idProv>${item.idProv}</idProv>
            <tipoComprobante>${item.tipoComprobante}</tipoComprobante>
            <parteRel>${item.parteRel}</parteRel>
            <#if item.idProv == '03'>
            <tipoProv>${item.tipoProv}</tipoProv>
            <denoProv>${item.denoProv}</denoProv>
            </#if>
            <fechaRegistro>${item.fechaRegistro}</fechaRegistro>
            <establecimiento>${item.establecimiento}</establecimiento>
            <puntoEmision>${item.puntoEmision}</puntoEmision>
            <secuencial>${item.secuencial}</secuencial>
            <fechaEmision>${item.fechaEmision}</fechaEmision>
            <autorizacion>${item.autorizacion}</autorizacion>
            <baseNoGraIva>${item.baseNoGraIva}</baseNoGraIva>
            <baseImponible>${item.baseImponible}</baseImponible>
            <baseImpGrav>${item.baseImpGrav}</baseImpGrav>
            <baseImpExe>${item.baseImpExe}</baseImpExe>
            <montoIce>${item.montoIce}</montoIce>
            <montoIva>${item.montoIva}</montoIva>
            <valRetBien10>${item.valRetBien10}</valRetBien10>
            <valRetServ20>${item.valRetServ20}</valRetServ20>
            <valorRetBienes>${item.valorRetBienes}</valorRetBienes>
            <valRetServ50>${item.valRetServ50}</valRetServ50>
            <valorRetServicios>${item.valorRetServicios}</valorRetServicios>
            <valRetServ100>${item.valRetServ100}</valRetServ100>
            <valorRetencionNc>${item.valorRetencionNc}</valorRetencionNc>
            <totbasesImpReemb>${item.totbasesImpReemb}</totbasesImpReemb>
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
            <#if item.formasDePago.formaPago != ''>
            <formasDePago>
                <formaPago>${item.formasDePago.formaPago}</formaPago>
            </formasDePago>
            </#if>
            <air>
            <#list item.air as detalleAir>
            	<detalleAir>
					<codRetAir>${detalleAir.codRetAir}</codRetAir>
					<baseImpAir>${detalleAir.baseImpAir}</baseImpAir>
					<porcentajeAir>${detalleAir.porcentajeAir}</porcentajeAir>
					<valRetAir>${detalleAir.valRetAir}</valRetAir>
                </detalleAir>
            </#list>
			</air>
        </detalleCompras>
        </#list>
    </compras>
    <ventas>
        <#list json.ventas as detalleVentas>
        <detalleVentas>
            <tpIdCliente>${detalleVentas.tpIdCliente}</tpIdCliente>
            <idCliente>${detalleVentas.idCliente}</idCliente>
            <#if detalleVentas.tpIdCliente = '04' || detalleVentas.tpIdCliente = '05' || detalleVentas.tpIdCliente = '06' >
            <parteRel>${detalleVentas.parteRel}</parteRel>
            </#if>
            <#if detalleVentas.tpIdCliente = '06'>
            <tipoCliente>${detalleVentas.tipoCliente}</tipoCliente>
            <DenoCli>${detalleVentas.DenoCli}</DenoCli>
            </#if>
            <tipoComprobante>${detalleVentas.tipoComprobante}</tipoComprobante>
            <tipoEm>${detalleVentas.tipoEm}</tipoEm>
            <numeroComprobantes>${detalleVentas.numeroComprobantes}</numeroComprobantes>
            <baseNoGraIva>${detalleVentas.baseNoGraIva}</baseNoGraIva>
            <baseImponible>${detalleVentas.baseImponible}</baseImponible>
            <baseImpGrav>${detalleVentas.baseImpGrav}</baseImpGrav>
            <montoIva>${detalleVentas.montoIva}</montoIva>
            <montoIce>${detalleVentas.montoIce}</montoIce>
            <valorRetIva>${detalleVentas.valorRetIva}</valorRetIva>
            <valorRetRenta>${detalleVentas.valorRetRenta}</valorRetRenta>
			<formasDePago>
            <#list detalleVentas.formasDePago as formaPago>
                <formaPago>${formaPago}</formaPago>
            </#list>
			</formasDePago>
        </detalleVentas>
        </#list>
    </ventas>
    <ventasEstablecimiento>
        <#list json.ventasEstablecimiento as ventaEst>
        <ventaEst>
			<codEstab>${ventaEst.codEstab}</codEstab>
		    <ventasEstab>${ventaEst.ventasEstab}</ventasEstab>
		    <ivaComp>${ventaEst.ivaComp}</ivaComp>
	    </ventaEst>
        </#list>
    </ventasEstablecimiento>
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
			<pagoRegFis>${detalleExportaciones.pagoRegFis}</pagoRegFis>
            </#if>
		    <paisEfecExp>${detalleExportaciones.paisEfecExp}</paisEfecExp>
		    <exportacionDe>${detalleExportaciones.exportacionDe}</exportacionDe>
            
            
            <#if detalleExportaciones.exportacionDe == '01'>
			<impuestootropaís>${detalleExportaciones.impuestootropaís}</impuestootropaís>
		    <tipoComprobante>${detalleExportaciones.tipoComprobante}</tipoComprobante>
		    <distAduanero>${detalleExportaciones.distAduanero}</distAduanero>
		    <anio>${detalleExportaciones.anio}</anio>
			<regimen>${detalleExportaciones.regimen}</regimen>
		    <correlativo>${detalleExportaciones.correlativo}</correlativo>
		    <verificador>${detalleExportaciones.verificador}</verificador>
		    <docTransp>${detalleExportaciones.docTransp}</docTransp>
			<fechaEmbarque>${detalleExportaciones.fechaEmbarque}</fechaEmbarque>
            
            <#elseif detalleExportaciones.exportacionDe == '02'>
			<impuestootropaís>${detalleExportaciones.impuestootropaís}</impuestootropaís>
		    <tipoComprobante>${detalleExportaciones.tipoComprobante}</tipoComprobante>
            
            <#elseif detalleExportaciones.exportacionDe == '03'>
            <tipIngExt>${detalleExportaciones.tipIngExt}</tipIngExt>
		    <ingExtGravOtroPais>${detalleExportaciones.ingExtGravOtroPais}</ingExtGravOtroPais>
			    <#if detalleExportaciones.ingExtGravOtroPais = 'SI'>
            <impuestootropaís>${detalleExportaciones.impuestootropaís}</impuestootropaís>
                </#if> 
		    <tipoComprobante>${detalleExportaciones.tipoComprobante}</tipoComprobante>
		    <fechaEmbarque>${detalleExportaciones.fechaEmbarque}</fechaEmbarque>
            </#if>
            <valorFOB>${detalleExportaciones.valorFOB}</valorFOB>
            <valorFOBComprobante>${detalleExportaciones.valorFOBComprobante}</valorFOBComprobante>
            <establecimiento>${detalleExportaciones.establecimiento}</establecimiento>
            <puntoEmision>${detalleExportaciones.puntoEmision}</puntoEmision>
            <secuencial>${detalleExportaciones.secuencial}</secuencial>
            <autorizacion>${detalleExportaciones.autorizacion}</autorizacion>
            <fechaEmision>${detalleExportaciones.fechaEmision}</fechaEmision>                
	    </detalleExportaciones>
        </#list>
    </exportaciones>
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
</iva>