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
            <tipoComprobante>${item.tipoComprobante}</tipoComprobante>
            <parteRel>${item.parteRel}</parteRel>
            <tipoProv>${item.tipoProv}</tipoProv>
            <denoProv>${item.denoProv}</denoProv>
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
            <totbasesImpReemb>${item.totbasesImpReemb}</totbasesImpReemb>
            <pagoExterior>
                <pagoLocExt>${item.pagoExterior.pagoLocExt}</pagoLocExt>
                <tipoRegi>${item.pagoExterior.tipoRegi}</tipoRegi>
                <paisEfecPagoGen>${item.pagoExterior.paisEfecPagoGen}</paisEfecPagoGen>
                <paisEfecPagoParFis>${item.pagoExterior.paisEfecPagoParFis}</paisEfecPagoParFis>
                <denopago>${item.pagoExterior.denopago}</denopago>
                <paisEfecPago>${item.pagoExterior.paisEfecPago}</paisEfecPago>
                <aplicConvDobTrib>${item.pagoExterior.aplicConvDobTrib}</aplicConvDobTrib>
                <pagExtSujRetNorLeg>${item.pagoExterior.pagExtSujRetNorLeg}</pagExtSujRetNorLeg>
                <pagoRegFis>${item.pagoExterior.pagoRegFis}</pagoRegFis>
            </pagoExterior>
            <formasDePago>
                <formaPago>${item.formasDePago.formaPago}</formaPago>
            </formasDePago>
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
            <idCliente>${detalleVentas.idCliente}</tpIdCliente>
            <parteRel>${detalleVentas.parteRel}</tpIdCliente>
            <tipoCliente>${detalleVentas.tipoCliente}</tpIdCliente>
            <DenoCli>${detalleVentas.DenoCli}</tpIdCliente>
            <tipoComprobante>${detalleVentas.tipoComprobante}</tpIdCliente>
            <tipoEm>${detalleVentas.tipoEm}</tpIdCliente>
            <numeroComprobantes>${detalleVentas.numeroComprobantes}</tpIdCliente>
            <baseNoGraIva>${detalleVentas.baseNoGraIva}</tpIdCliente>
            <baseImponible>${detalleVentas.baseImponible}</tpIdCliente>
            <baseImpGrav>${detalleVentas.baseImpGrav}</tpIdCliente>
            <montoIva>${detalleVentas.montoIva}</tpIdCliente>
            <montoIce>${detalleVentas.montoIce}</tpIdCliente>
            <valorRetIva>${detalleVentas.valorRetIva}</tpIdCliente>
            <valorRetRenta>${detalleVentas.valorRetRenta}</tpIdCliente>
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
            </#if>
		    <paisEfecExp>${detalleExportaciones.paisEfecExp}</paisEfecExp>
			<pagoRegFis>${detalleExportaciones.pagoRegFis}</pagoRegFis>
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
		    <ingextgravotropaís>${detalleExportaciones.ingextgravotropaís}</ingextgravotropaís>
			<impuestootropaís>${detalleExportaciones.impuestootropaís}</impuestootropaís>
		    <tipoComprobante>${detalleExportaciones.tipoComprobante}</tipoComprobante>
		    <verificador>${detalleExportaciones.verificador}</verificador>
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