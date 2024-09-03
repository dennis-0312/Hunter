<#setting locale="en_US">
<#setting locale = "computer">
<#setting number_format = "computer">
<#assign json = jsonString.text?eval>
<?xml version="1.0" encoding="UTF-8" ?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Aptos Narrow" x:Family="Swiss" ss:Size="11"
    ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="s70">
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="Aptos Narrow" x:Family="Swiss" ss:Size="8" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="s71">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="Aptos Narrow" x:Family="Swiss" ss:Size="9" ss:Color="#000000" ss:Bold="1"/>
   <Interior ss:Color="#D9D9D9" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="s72">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="Aptos Narrow" x:Family="Swiss" ss:Size="9" ss:Color="#000000"
    ss:Bold="1"/>
   <Interior ss:Color="#D9D9D9" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="s73">
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="Aptos Narrow" x:Family="Swiss" ss:Size="8" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="s74">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="Aptos Narrow" x:Family="Swiss" ss:Size="8" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="s75">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="Aptos Narrow" x:Family="Swiss" ss:Size="8" ss:Color="#000000"/>
  </Style>
 </Styles>
 <#macro listCell>
        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
        <Cell ss:StyleID="s73"><Data ss:Type="String"></Data></Cell>
        <Cell ss:StyleID="s73"><Data ss:Type="String"></Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
 </#macro>
  <Worksheet ss:Name="Compras">
    <Table>
      <Row>
        <Cell ss:StyleID="s71"><Data ss:Type="String">Tipo ID Informante</Data></Cell>
        <Cell ss:StyleID="s70"><Data ss:Type="String">${json.TipoIDInformante}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="s71"><Data ss:Type="String">Id Informante</Data></Cell>
        <Cell ss:StyleID="s70"><Data ss:Type="String">${json.IdInformante}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="s71"><Data ss:Type="String">Razón Social</Data></Cell>
        <Cell ss:StyleID="s70"><Data ss:Type="String">${json.razonSocial}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="s71"><Data ss:Type="String">Año</Data></Cell>
        <Cell ss:StyleID="s70"><Data ss:Type="String">${json.Anio}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="s71"><Data ss:Type="String">Mes</Data></Cell>
        <Cell ss:StyleID="s70"><Data ss:Type="String">${json.Mes}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="s71"><Data ss:Type="String">Numero Ruc</Data></Cell>
        <Cell ss:StyleID="s70"><Data ss:Type="String">${json.numEstabRuc}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="s71"><Data ss:Type="String">Total Ventas</Data></Cell>
        <Cell ss:StyleID="s70"><Data ss:Type="String">${json.totalVentas?string["###0.00"]}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="s71"><Data ss:Type="String">Código Operativo</Data></Cell>
        <Cell ss:StyleID="s70"><Data ss:Type="String">${json.codigoOperativo}</Data></Cell>
      </Row>
      <Row/>
      <Row/>
      <Row>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Identificación del sustento tributario</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Tipo de Identificación del Proveedor</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">No. de Identificación del Proveedor</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Código tipo de comprobante</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Parte Relacionada</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Tipo de Proveedor</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Razón o denominación social del proveedor</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Fecha de registro contable del comprobante de venta</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">No. de serie del comprobante de venta - establecimiento</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">No. de serie del comprobante de  venta - punto de emisión</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">No. secuencial del comprobante de venta</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Fecha  de  emisión  del comprobante de venta</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">No. de autorización  del comprobante de venta</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Base Imponible No objeto de IVA</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Base Imponible tarifa 0% IVA</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Base Imponible tarifa IVA diferente de 0%</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Base imponible exenta de IVA</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Monto ICE</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Monto IVA</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Retención IVA 10%</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Retención IVA 20%</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Retención IVA 30%</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Retención IVA 50%</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Retención IVA 70%</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Retención IVA 100%</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Pago a residente o no residente</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Tipos de régimen fiscal del exterior</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">País de residencia o establecimiento permanente a quién se efectúa el pago régimen general</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">País de residencia o establecimiento permanente a quién se efectúa el pago paraíso fiscal</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Denominación del régimen fiscal preferente o jurisdicción de menor imposición</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">País de residencia o establecimiento permanente a quién se efectúa el pago</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Aplica Convenio de Doble Tributación en el pago</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Pago al exterior sujeto a retención en aplicación a la norma legal</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">¿El pago es a unrégimen fiscal preferente o de menor imposición?</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Forma de pago</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">No. de serie del comprobante de retención - establecimiento</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">No. de serie del comprobante de retención - punto de emisión</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">No. secuencial del comprobante de retención</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">No. de autorización del comprobante de retención</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Fecha de emisión del comprobante de retención</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Total Bases Imponibles Reembolso</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Tipo de Comprobante Reembolso</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">TP ID Proveedor Reembolso</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">ID Proveedor Reembolso</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Establecimiento del Reembolso</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Punto de Emision del Reembolso</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Secuencia del Reembolso</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Fecha de Emision del Reembolso</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Autorizacion del Reembolso</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Bases Imponibles Reembolso</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Bases Imponible Gravada Reembolso</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Bases Imponible No Gravada IVA Reembolso</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Bases Imponible Exe. Reembolso</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Monto ICE Reembolso</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Monto IVA Reembolso</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Codigo de Retencion AIR 1</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Codigo de Retencion AIR 2</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Codigo de Retencion AIR 3</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Base de Importe AIR 1</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Base de Importe AIR 2</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Base de Importe AIR 3</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Porcentaje de Retencion AIR 1</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Porcentaje de Retencion AIR 2</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Porcentaje de Retencion AIR 3</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Valor de Retencion AIR 1</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Valor de Retencion AIR 2</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Valor de Retencion AIR 3</Data></Cell>
      </Row>
      <#list json.compras as item>
      <#assign variable = 0>
      <Row>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.codSustento}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.tpIdProv}</Data></Cell>
        <Cell ss:StyleID="s73"><Data ss:Type="String">${item.idProv}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.tipoComprobante}</Data></Cell>
        <#if item.tpIdProv == '01' || item.tpIdProv == '02' || item.tpIdProv == '03'>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.parteRel}</Data></Cell>
        <#else>
        <Cell ss:StyleID="s73"><Data ss:Type="String"></Data></Cell>
        </#if>
        <#if item.tpIdProv == '03'>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.tipoProv}</Data></Cell>
        <Cell ss:StyleID="s73"><Data ss:Type="String">${item.denoProv?replace('.','')}</Data></Cell>
        <#else>
        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
        <Cell ss:StyleID="s73"><Data ss:Type="String"></Data></Cell>
        </#if>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.fechaRegistro}</Data></Cell>
        <Cell ss:StyleID="s73"><Data ss:Type="String">${item.establecimiento}</Data></Cell>
        <Cell ss:StyleID="s73"><Data ss:Type="String">${item.puntoEmision}</Data></Cell>
        <Cell ss:StyleID="s73"><Data ss:Type="String">${item.secuencial}</Data>  </Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.fechaEmision}</Data></Cell>
        <Cell ss:StyleID="s73"><Data ss:Type="String">${item.autorizacion}</Data></Cell>
        <Cell ss:StyleID="s75"><Data ss:Type="String">${item.baseNoGraIva?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s75"><Data ss:Type="String">${item.baseImponible?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s75"><Data ss:Type="String">${item.baseImpGrav?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s75"><Data ss:Type="String">${item.baseImpExe?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s75"><Data ss:Type="String">${item.montoIce?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s75"><Data ss:Type="String">${item.montoIva?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s75"><Data ss:Type="String">${item.valRetBien10?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s75"><Data ss:Type="String">${item.valRetServ20?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s75"><Data ss:Type="String">${item.valorRetBienes?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s75"><Data ss:Type="String">${item.valRetServ50?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s75"><Data ss:Type="String">${item.valorRetServicios?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s75"><Data ss:Type="String">${item.valRetServ100?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.pagoLocExt}</Data></Cell>

        <#if item.pagoLocExt == '01'>
        <#assign variable = variable + 1>
        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.paisEfecPago}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.aplicConvDobTrib}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.pagExtSujRetNorLeg}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
        </#if>

        <#if item.pagoLocExt == '02'>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.tipoRegi}</Data></Cell>
          <#if item.tipoRegi == '01'>
        <#assign variable = variable + 1>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.paisEfecPagoGen}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.paisEfecPago}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.aplicConvDobTrib}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.pagExtSujRetNorLeg}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
          </#if>
          <#if item.tipoRegi == '02'>
        <#assign variable = variable + 1>
        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.paisEfecPago}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.paisEfecPagoParFis}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.aplicConvDobTrib}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.pagExtSujRetNorLeg}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
          </#if>
          <#if item.tipoRegi == '03'>
        <#assign variable = variable + 1>
        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.paisEfecPago}</Data></Cell>
        <Cell ss:StyleID="s73"><Data ss:Type="String">${item.denopago}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.aplicConvDobTrib}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.pagExtSujRetNorLeg}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.pagoRegFis}</Data></Cell>
          </#if>
          <#if item.tipoRegi != '01' && item.tipoRegi != '02' && item.tipoRegi != '03'>
        <#assign variable = variable + 1>
        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
        <Cell ss:StyleID="s73"><Data ss:Type="String"></Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
          </#if>
        <#else>
        <!-- <@listCell/> --> 
        </#if>
        <#if variable == 0>
        <@listCell/>
        </#if>
        <#if item.tipoComprobante != '04'>
        <Cell ss:StyleID="s73"><Data ss:Type="String">${item.formasDePago}</Data></Cell>
        <#else>
        <Cell ss:StyleID="s73"><Data ss:Type="String"></Data></Cell>
        </#if>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.estabRetencion1}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.ptoEmiRetencion1}</Data></Cell>
        <Cell ss:StyleID="s73"><Data ss:Type="String">${item.secRetencion1}</Data></Cell>
        <Cell ss:StyleID="s73"><Data ss:Type="String">${item.autRetencion1}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.fechaEmiRet1}</Data></Cell>
        <Cell ss:StyleID="s75"><Data ss:Type="String">${item.totbasesImpReemb?abs?string["###0.00"]}</Data></Cell>
        <#if item.reembolsos?has_content>
            <#assign cantireembolso = 0>
            <#list item.reembolsos as detallereembolso>
                <#if cantireembolso == 0>
                    <Cell ss:StyleID="s74"><Data ss:Type="String">${detallereembolso.tipoComprobanteReemb}</Data></Cell>
                    <Cell ss:StyleID="s74"><Data ss:Type="String">${detallereembolso.tpIdProvReemb}</Data></Cell>
                    <Cell ss:StyleID="s74"><Data ss:Type="String">${detallereembolso.idProvReemb}</Data></Cell>
                    <Cell ss:StyleID="s73"><Data ss:Type="String">${detallereembolso.establecimientoReemb}</Data></Cell>
                    <Cell ss:StyleID="s73"><Data ss:Type="String">${detallereembolso.puntoEmisionReemb}</Data></Cell>
                    <Cell ss:StyleID="s74"><Data ss:Type="String">${detallereembolso.secuencialReemb}</Data></Cell>
                    <Cell ss:StyleID="s74"><Data ss:Type="String">${detallereembolso.fechaEmisionReemb}</Data></Cell>
                    <Cell ss:StyleID="s74"><Data ss:Type="String">${detallereembolso.autorizacionReemb}</Data></Cell>
                    <Cell ss:StyleID="s75"><Data ss:Type="String">${detallereembolso.baseImponibleReemb}</Data></Cell>
                    <Cell ss:StyleID="s75"><Data ss:Type="String">${detallereembolso.baseImpGravReemb}</Data></Cell>
                    <Cell ss:StyleID="s75"><Data ss:Type="String">${detallereembolso.baseNoGraIvaReemb}</Data></Cell>
                    <Cell ss:StyleID="s75"><Data ss:Type="String">${detallereembolso.baseImpExeReemb}</Data></Cell>
                    <Cell ss:StyleID="s75"><Data ss:Type="String">${detallereembolso.montoIceRemb}</Data></Cell>
                    <Cell ss:StyleID="s75"><Data ss:Type="String">${detallereembolso.montoIvaRemb}</Data></Cell>
                    <#assign cantireembolso = cantireembolso + 1>
                <#else>
                    </Row>
                    <Row>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String">${detallereembolso.tipoComprobanteReemb}</Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String">${detallereembolso.tpIdProvReemb}</Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String">${detallereembolso.idProvReemb}</Data></Cell>
                        <Cell ss:StyleID="s73"><Data ss:Type="String">${detallereembolso.establecimientoReemb}</Data></Cell>
                        <Cell ss:StyleID="s73"><Data ss:Type="String">${detallereembolso.puntoEmisionReemb}</Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String">${detallereembolso.secuencialReemb}</Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String">${detallereembolso.fechaEmisionReemb}</Data></Cell>
                        <Cell ss:StyleID="s74"><Data ss:Type="String">${detallereembolso.autorizacionReemb}</Data></Cell>
                        <Cell ss:StyleID="s75"><Data ss:Type="String">${detallereembolso.baseImponibleReemb}</Data></Cell>
                        <Cell ss:StyleID="s75"><Data ss:Type="String">${detallereembolso.baseImpGravReemb}</Data></Cell>
                        <Cell ss:StyleID="s75"><Data ss:Type="String">${detallereembolso.baseNoGraIvaReemb}</Data></Cell>
                        <Cell ss:StyleID="s75"><Data ss:Type="String">${detallereembolso.baseImpExeReemb}</Data></Cell>
                        <Cell ss:StyleID="s75"><Data ss:Type="String">${detallereembolso.montoIceRemb}</Data></Cell>
                        <Cell ss:StyleID="s75"><Data ss:Type="String">${detallereembolso.montoIvaRemb}</Data></Cell>
                        <#assign cantireembolso = cantireembolso + 1>
                    </Row>
                </#if>
            </#list>
        <#else>
            <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
            <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
            <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
            <Cell ss:StyleID="s73"><Data ss:Type="String"></Data></Cell>
            <Cell ss:StyleID="s73"><Data ss:Type="String"></Data></Cell>
            <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
            <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
            <Cell ss:StyleID="s74"><Data ss:Type="String"></Data></Cell>
            <Cell ss:StyleID="s75"><Data ss:Type="String"></Data></Cell>
            <Cell ss:StyleID="s75"><Data ss:Type="String"></Data></Cell>
            <Cell ss:StyleID="s75"><Data ss:Type="String"></Data></Cell>
            <Cell ss:StyleID="s75"><Data ss:Type="String"></Data></Cell>
            <Cell ss:StyleID="s75"><Data ss:Type="String"></Data></Cell>
            <Cell ss:StyleID="s75"><Data ss:Type="String"></Data></Cell>    
        </#if>
      </Row>
      </#list>
    </Table>
  </Worksheet>
</Workbook>