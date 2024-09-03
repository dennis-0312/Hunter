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
  <Worksheet ss:Name="Ventas">
    <Table>
      <Row>
        <Cell ss:StyleID="s72"><Data ss:Type="String">RUC Empresa</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Periodo: MES</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Periodo: Año</Data></Cell>
        --
        <Cell ss:StyleID="s72"><Data ss:Type="String">Tipo Identificacion</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Ruc / Cédula / Pasaporte</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Nombre (Opcional)</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Parterelvtas</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Establecimiento</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Co. Comprobante</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Cantidad De Comprob /Mes</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Factura Sistema</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Fac. Físico</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Base No Aplica Iva</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Base Impon. Tarifa 0%</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Base Impon. Tarifa <> 0%</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Monto Iva</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Declarar Ret.Iva</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Iva 10%</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Iva 20%</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Iva 30%</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Iva 70%</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Iva 100%</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Monto Ice</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Monto Ret. Iva</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Declarar Ret.Renta</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Monto Ret. Ir</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Ir 1%</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Ir 2%</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Ir 0%</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Fecha De Emision</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Serie</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Secuencia</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Autorizacion</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Origenrtf</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Oficinartf</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Tasa Iva Movimiento</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Dscto.2% Solidario</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Tiportf</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Fec.Emisión Documento</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Fec.Autorización Sri</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Denominación Cliente</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Tipo Emisión</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Tipo Compen.</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Monto Compensación</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Forma Pago</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Ir 1.75</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Ir 2.75%</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Par Rel.</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Monto Ice</Data></Cell>
        <Cell ss:StyleID="s72"><Data ss:Type="String">Tipo Id. Sri</Data></Cell>
      </Row>
      <#list json as item>
      <Row>      
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.rucEmpresa}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.mes}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.anio}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.fechaEmiCompro}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.rucCedPasa}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.nombreProvee}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.fechaRegisConta}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.establecimiento}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.codComprobante}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.cantComprobMes?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.factSistema}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.facFisico}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.baseNoIva?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.baseImponTarif0?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.baseImponTarif0_1?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.montoIva?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.declaraRetIva?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.iva10?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.iva20?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.iva30?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.iva70?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.iva100?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.montoIce?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.montoRetIva?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.declaraRetRenta?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.montoRetIr?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.ir1?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.ir2?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.ir0?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.factFisico}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.serie}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.secuencia}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.autoriza}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.origenRtf}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.oficinaRtf}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.tasaIvaMov}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.dscto2Solidario}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.tipoRtf}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.fecEmiDoc}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.fecAutSri}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.denom_cliente}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.tipoEmision}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.tipoCompen}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.montoCompen?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.formaPago}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.ir1_75?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.ir2_75?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.parRel}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.montoIce_1?abs?string["###0.00"]}</Data></Cell>
        <Cell ss:StyleID="s74"><Data ss:Type="String">${item.tipoIdeSri}</Data></Cell>
      </Row>
      </#list>
    </Table>
  </Worksheet>
</Workbook>