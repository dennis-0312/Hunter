<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
<head>
	<link name="NotoSans" type="font" subtype="truetype" src="${nsfont.NotoSans_Regular}" src-bold="${nsfont.NotoSans_Bold}" src-italic="${nsfont.NotoSans_Italic}" src-bolditalic="${nsfont.NotoSans_BoldItalic}" bytes="2" />
    <style type="text/css">* {
      			font-family: NotoSans, sans-serif;
			}
			table {
				font-size: 8.5pt;
				table-layout: fixed;
              	width:100%;
			}
			th {
				font-weight: bold;
				padding: 5px 6px 3px;
				background-color: #e3e3e3;
				color: #333333;
			}
            .tablaDatos {
              border-collapse: collapse;
              border: 1px solid black;
            }
            .tablaDatos th, .tablaDatos td{
              border: 1px solid black;
              border-top: none;
              border-bottom: none;
              border-left:none;
            }
            .tablaDatos th:last-child, .tablaDatos td:last-child {
              border-right: none;
            }
            .firma td{
              align: center;
              border-top: 1px solid black;
            }
            .reduceLetra{
              font-size: 8.25pt;
            }

</style>
</head>
    <#setting locale="en_US">

<!-- VARIABLES EXTERNAS A UTILIZAR -->
    <#assign beneficiario = data.entity> <!--String-->
        <#assign idBeneficiario = beneficiario?keep_before(" ")>
        <#assign nombreBeneficiario = beneficiario?keep_after(" ")?upper_case>
    <#assign transactionID = data.tranid>
    <#assign nroTransaccion = data.transactionnumber>
    <#assign memo = data.memo?upper_case> <!--String-->
    <#assign fechaRegistro = record.createddate?string["dd/MM/yyyy HH:mm:ss"]>  <!--Date-->
    <#assign importe = data.total?number?string.currency?replace("$","")>
    <#assign retencionTotalFuente = data.totalRetIR?number?string.currency?replace("$","")>
    <#assign retencionTotalIva = data.totalRetIva?number?string.currency?replace("$","")>
    <#assign nroRetencion = "${data.preCode}-${data.postCode}">
    <#assign extraccionListGL = data.listGL> <!--[account,name,debit,credit,memo]-->
    <#assign oficina = data.location?upper_case> <!--String-->
    <#assign rucProveedor = data.vatregnumber>
    <#assign fechaEmision = data.trandate> 
    <#assign direccionFiscal = data.billaddress?upper_case> <!--String-->
    <#assign tipoComprobante = data.custbodyts_ec_tipo_documento_fiscal> <!--String-->
    <#assign periodoContable = data.postingperiod?upper_case> <!--String-->
    <#assign importeBaseIva = data.importe_base_iva?number?string.currency?replace("$","")>
    <#assign listRetIR = data.listRetIR> <!--[ret,retBase,retPorcen,retMontRet]-->
    <#assign listRetIva = data.listRetIva> <!--[retIva,retIvaPorcen]-->

<!-- VARIABLES INTERNAS DEL SISTEMA -->
    <#assign logoHunter = companyInformation.logoUrl>
    <#assign indiceArroba = user.email?index_of("@")>
    <#assign usuarioActual = user.email?substring(0, indiceArroba)>
    <#assign diaActual = .now?string["dd/MM/yyyy"]>
    <#assign horaActual = .now?string["HH:mm:ss"]>

<body padding="0.5in 0.5in 0.5in 0.5in" size="A4">

  <table style="margin-bottom: 25px;">
    <tr>
      <td style="width: 45%;"><#if logoHunter?length != 0><@filecabinet nstype="image" src="${logoHunter}" style="float: left; height:50px; width:120px" /></#if></td>
      <td style="width: 27%; align: left;"><br /><br /><br /><strong>CARSEG S.A.</strong></td>
      <td style="width: 13%;">
        <small><code><strong><span style="font-size:9px;">FECHA IMPRESION</span></strong></code></small><br />
        <small><code><strong><span style="font-size:9px;">HORA&nbsp; IMPRESION</span></strong></code></small><br />
        <small><code><strong><span style="font-size:9px;">USUARIO EMISION</span></strong></code></small><br />
        <small><code><strong><span style="font-size:9px;">PAGINA</span></strong></code></small>
      </td>
      <td style="width: 15%;">
        <span style="font-size:9px;">:&nbsp;${diaActual}</span><br />
        <span style="font-size:9px;">:&nbsp;${horaActual}</span><br />
        <span style="font-size:9px;">:&nbsp;${usuarioActual} </span><br />
        <span style="font-size:9px;">: <pagenumber/>/<totalpages/></span>
      </td>
    </tr>
  </table>

  <table>
    <tr>
      <td style="width:12%">VENDEDOR:</td>
      <td style="width:44%">${nombreBeneficiario}</td>
      <td style="width:5%"></td>
      <td style="width:17%; align:left">NS REFERENCIA:</td>
      <td style="width:22%">${transactionID}</td>
    </tr>
  </table>

  <table  style="margin-bottom: 15px">
    <tr>
      <td style="width:12%">CONCEPTO:</td>
      <td style="width:44%">${memo}</td>
      <td style="width:5%"></td>
      <td style="width:17%; align:left">NS TRANSACCIÓN:</td>
      <td style="width:22%">${nroTransaccion}</td>
    </tr>
  </table>

  <table>
    <tr>
      <td style="width:17%">DOCUMENTO:</td>
      <td style="width:83%">${transactionID}</td>
    </tr>
    <tr>
      <td>FECHA REGISTRO:</td>
      <td>${fechaRegistro}</td>
    </tr>
  </table>

  <table style="margin-bottom:40px">
    <tr>
      <td style="width:17%">RETECI&Oacute;N FUENTE:</td>
      <td style="width:33%">${retencionTotalFuente}</td>
      <td style="width:18%">VALOR A PAGAR:</td>
      <td style="width:32%">${importe}</td>
    </tr>
    <tr>
      <td>RETENCI&Oacute;N IVA:</td>
      <td>${retencionTotalIva}</td>
      <td>RETENCI&Oacute;N:</td>
      <td>${nroRetencion}</td>
    </tr>
  </table>
  <div style="min-height: 200px;">
    <table class="tablaDatos">
      <tr>
        <th style="align: center; width: 13%;">Nro. Cuenta</th>
        <th style="width: 31%; align: left">Cuenta</th>
        <th style="width: 32%; align: left">Concepto</th>
        <th style="align: right; width: 12%;">Debe</th>
        <th style="align: right; width: 12%;">Haber</th>
      </tr>
      <#assign debeTotal = 0>
      <#assign haberTotal = 0>

      <#list extraccionListGL as line>
        <#if (line.debit?length != 0 || line.credit?length  != 0)>
          <tr>
            <td style="align: center">${line.account}</td>
            <td style="align: left">${line.name?upper_case}</td>
            <td style="align: left">${line.memo?upper_case}</td>
            <td style="align: right">${line.debit?number?string.currency?replace("$","")}</td>
            <td style="align: right">${line.credit?number?string.currency?replace("$","")}</td>
          </tr>
          <#if line.debit?length != 0>
            <#assign debeTotal = debeTotal + line.debit?number>
          <#else>
            <#assign haberTotal = haberTotal + line.credit?number>
          </#if>
        </#if>
      </#list>

    </table>
    <table style="margin-top:15px">
      <tr>
        <td style="width: 13%;"></td>
        <td style="width: 27%;"></td>
        <td style="width: 5%;"></td>
        <td style="width: 27%;"><strong>TOTALES:</strong></td>
        <td style="align: right; width: 12%;"><strong>${debeTotal?string.currency?replace("$","")}</strong></td>
        <td style="align: right; width: 12%;"><strong>${haberTotal?string.currency?replace("$","")}</strong></td>
      </tr>
    </table>
  </div>
  <table>
    <tr style="margin-top:80px;" class="firma">
      <td>HECHO POR</td>
      <td style="border-top: none; width:20px"></td>
      <td>AUTORIZADO POR</td>
      <td style="border-top: none; width:20px"></td>
      <td>CONTABILIZADO POR</td>
      <td style="border-top: none; width:20px"></td>
      <td>RECIBIDO POR</td>
    </tr>
  </table>
<div>
  <table class="reduceLetra" style="margin-top: 50px">
    <tr>
    	<td style="width: 13%">Matriz:</td>
      <td style="width: 42%">CARSEG S.A.</td>
      <td style="width: 27%"></td>
      <td style="width: 18%"></td>
    </tr>
    <tr>
    	<td>Sucursal:</td>
      <td>${oficina}</td>
      <td style="align: right; font-size: 8pt;">COMPROBANTE DE RETENCIÓN Nº</td>
      <td>${nroRetencion}</td>
    </tr>
    <tr>
    	<td>Proveedor: </td>
      <td>${nombreBeneficiario}</td>
      <td></td>
      <td></td>
    </tr>
    <tr>
    	<td>R.U.C.:</td>
      <td>${rucProveedor}</td>
      <td style="align: right">Fecha de Emisión:</td>
      <td>${fechaEmision}</td>
    </tr>
    <tr>
    	<td>Dirección:</td>
      <td>${direccionFiscal}</td>
      <td style="align: right">Tipo de Comprobante de Venta:</td>
      <td>${tipoComprobante}</td>
    </tr>
    <tr>
    	<td>Ejercicio Fiscal: </td>
      <td>${periodoContable}</td>
      <td style="align: right">Nº de Comprobante de Venta:</td>
      <td>${transactionID}</td>
    </tr>
  </table>
  <table style="margin-top:10px">
    <tr>
      <td style="width:55%;">
        <table class="tablaDatos" style="border-bottom: none; font-size: 8pt;"><tr><td style="align:center"><strong>RETENCIÓN EN LA FUENTE I.R.</strong></td></tr></table>
        <table class="tablaDatos reduceLetra" style="width:100%;">
          <tr>
            <th style="align: center; width:15%;">%</th>
            <th style="align: center; width:29%;">Base</th>
            <th style="align: center; width:29%;">Monto Retenido</th>
            <th style="align: center; width:27%;">Cod. Ret.</th>
          </tr>
          <#list listRetIR as retIr>
            <tr>
              <td style="align: center;">${retIr.retPorcen?replace("%","")?number?string["0.00"]}</td>
              <td style="align: right; padding-right: 10px">${retIr.retBase?number?string.currency?replace("$","")}</td>
              <td style="align: right; padding-right: 10px">${retIr.retMontRet?number?string.currency?replace("$","")}</td>
              <td style="align: center;">${retIr.ret?keep_before(" -")}</td>
            </tr>
          </#list>
          <tr>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td></td>
            <td style="align: right; padding-right: 10px"><strong>TOTAL:</strong></td>
            <td style="align: right; padding-right: 10px"><strong>${retencionTotalFuente}</strong></td>
            <td></td>
          </tr>
        </table>
      </td>
      <td style="width:1%;"></td>
      <td style="width:44%;">
        <table class="tablaDatos" style="border-bottom: none; font-size: 8pt;"><tr><td style="align:center"><strong>RETENCIÓN IVA</strong></td></tr></table>
        <table class="tablaDatos reduceLetra" style="width:100%">
          <tr>
            <th style="align: center; width:28%;">%</th>
            <th style="align: center; width:36%;">Base</th>
            <th style="align: center; width:36%;">Monto Retenido</th>
          </tr>
          <#list listRetIva as retIva>
            <tr>
              <td style="align: center;">${retIva.retIvaPorcen}</td>
              <td style="align: right; padding-right: 10px">${importeBaseIva}</td>
              <td style="align: right; padding-right: 10px">${retIva.retIva?number?string.currency?replace("$","")}</td>
          </tr>
          </#list>
          <tr>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td></td>
            <td style="align: right; padding-right: 10px"><strong>TOTAL:</strong></td>
            <td style="align: right; padding-right: 10px"><strong>${retencionTotalIva}</strong></td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>
</body>
</pdf>