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
        <Cell ss:StyleID="s72"><Data ss:Type="String">RUC Empresa</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Periodo: MES</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Periodo: Año</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Fe. Emisión Comprobante</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Fe. Registro Contable</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Tipo Identificacion</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">RUC / Cédula / Pasaporte</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Número documento</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Nombre Proveedor (Opcional)</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Oficina de la Cabecera de la Factura</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">EC Report Type</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Concepto</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Co. Sust Tributario</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Cod de Tipo Comprobante</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">No. Serie de Comprobante</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">No.Secuencia Comprobante</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">No.Autorizacion Comprobante</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Base No aplica IVA</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Base tarifa 0%</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Base tarifa <> 0%</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">baseImpExe</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Monto IVA</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Descripción</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Monto ICE</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Monto Ret. IVA Bienes 30%</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Ret. IVA Servicios 70%</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Ret. IVA  100%</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Ret. IVA  10%</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Ret. IVA  20%</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Pago: Local</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Pago Exterior: Pais</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Pago Exterior:  Doble tributacion</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Pago Exterior: Sujeto a Retencion</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Comprobante Modificado</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Fe. Emisión Modificado</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">No. Serie de Modificado</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">No.Secuencia Modificado</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">No.Autorizacion Modificado</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">pagoRegFis</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Forma de Pago</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Co. IR(1)</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Base Impon. IR</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">% Ret. IR</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Monto Ret. IR</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Co. IR(2)</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Base Impon. IR</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">% Ret. IR</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Monto Ret. IR</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Co.  IR (3)</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Base Impon. IR</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">% Ret. IR</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Monto Ret. IR</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Dividendo: Fecha Pago</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Dividendo: IR pagado x empresa</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Dividendo: Año Utilid. del Divid.</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">No. Serie CR-1</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">No. Secuencia CR-1</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">No. Autoriza CR-1</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Fe. Emision CR-1</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Porcentaje IVA</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Valor Comp. Solidaria</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Fecha Autorización documento</Data></Cell>
      </Row>
      <#list json as item>
      <Row>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.rucEmpresa}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.mes}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.anio}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.fechaEmiCompro}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.fechaRegisConta}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.tipoIdent}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.rucCedPasa}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.numDocumento}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.nombreProvee}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.oficinaCabecera}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.ecReportType}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.concepto}</Data>  </Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.coSustTribu}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.codTipoConpro}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.numSerieCompro}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.numSecuenCompro}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.numAutorizaCompro}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.baseNoAplicaIva?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.baseTarifaCero?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.baseTarifaDifCero?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.baseImpExe?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.montoIVA?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.descripcion}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.montoICE?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.montoeRetIVA30?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.montoeRetIVA70?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.montoeRetIVA100?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.montoeRetIVA10?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.montoeRetIVA20?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.pagoLocal}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.pagoExteriorPais}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.pagoExteriorDoble}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.pagoExteriorReten}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.comprobanteModific}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.fechaEmiModific}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.numSerieModific}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.numSoecuenciaModific}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.numAutorizaModific}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.pagoRegFis}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.formaDePago}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.codIr1}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.baseImpIR1?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.porcentRetIR1}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.montoRetIR1?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.codIr2}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.baseImpIR2?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.porcentRetIR2}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.montoRetIR2?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.codIr3}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.baseImpIR3?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.porcentRetIR3}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.montoRetIR3?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.diviFechaPago}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.diviIrPago?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.diviAnoUtili}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.numSerieCR1}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.numSecuenciaCR1}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.numAutorizaCR1}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.fechaEmiCR1}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.porcentIVA}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.valorCompSoli?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.fechaAutorizaDocum}</Data></Cell>
      </Row>
      </#list>
    </Table>
  </Worksheet>
</Workbook>