<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
<head>
    <style type="text/css">* {
      			font-family: sans-serif;
                font-size: 7pt;
			}
    </style>
	<#setting locale="es_EC">
</head>
  <!-- VARIABLES EXTERNAS A UTILIZAR -->
  <#assign usuarioRecepcion = data.recepcion?upper_case> <!--String-->
  <#assign fechaRecepcion = data.fechaRecepcion>
  <#assign horaRecepcion = data.horaRecepcion>
  <#assign oficina = data.location?upper_case> <!--String-->
  <#assign telefono = data.telefono> <!--String-->
  <#assign celular = data.celular> <!--String-->
  <#assign beneficiarioId = data.clientId> <!--String-->
  <#assign beneficiarioName = data.clientName?upper_case> <!--String--> <!-- ESCAPE XML -->
  <#assign companyName = data.companyName?upper_case> <!--String--> <!-- ESCAPE XML -->

  <#assign placa = data.placa?upper_case> <!--String-->
  <#assign color = data.color?upper_case> <!--String-->
  <#assign chasis = data.chasis?upper_case> <!--String--> <!-- ESCAPE XML -->
  <#assign motor = data.motor?upper_case> <!--String--> <!-- ESCAPE XML -->
  <#assign marca = data.marca?upper_case> <!--String--> <!-- ESCAPE XML -->
  <#assign modelo = data.modelo?upper_case> <!--String--> <!-- ESCAPE XML -->
  <#assign version = data.version?upper_case> <!--String--> <!-- ESCAPE XML -->

  <#assign codVehiculo = data.codVehiculo?upper_case> <!--String-->
  <#assign tranid = data.tranid?upper_case> <!--String-->

  <#assign novComercial = data.novComercial?upper_case> <!--String--> <!-- ESCAPE XML -->
  <#assign novTecnica = data.novTecnica?upper_case> <!--String--> <!-- ESCAPE XML -->

  <#assign dateOS = data.date> <!--String-->
  <#assign trabajosData = data.trabajosData> <!--[otNro,trabajo]-->

  <#assign lojackData = data.lojackData> <!--[serieLojack,activacion,respuesta,ubicacionDispositivo]--> 
  <#assign monitoreoData = data.monitoreoData> <!--[serieChaser,unidad,imei,modelo,sim,ip,apn,vid,servidor,firmware,script,ubicacionDispositivo]--> 

  <!-- VARIABLES INTERNAS DEL SISTEMA -->
    <#assign logoHunter = companyInformation.logoUrl>
    <#assign indiceArroba = user.email?index_of("@")>
    <#assign usuarioActual = user.email?substring(0, indiceArroba)?upper_case>
    <#assign fechaActualLetras = .now?date?string.long?upper_case>
    <#assign fechaActual = .now?string["dd/MM/yyyy HH:mm:ss"]>

<body padding="0.45in 0.25in" size="A4-landscape">
  <div width="100%" height="50px">
    <div position="absolute" top="-0.4in" left="0.1in">
        <#if logoHunter?length != 0>
          <@filecabinet nstype="image" src="${logoHunter}" style="float: left; height:50px; width:120px;" />
       </#if>
    </div>
    <div position="absolute" height="60px" vertical-align="middle" left="39%">      
      <p align="center" margin="0"><b font-size="12pt">CARRO SEGURO CARSEG S.A.</b></p>
      <p align="center" margin="0"><b font-size="12pt">Ordenes de Trabajo</b></p>
    </div>
    <div position="absolute" top="0" left="70%">
            <div width="30%">
              <table width="100%" cellmargin="0" cellpadding="0" table-layout="fixed">
                <tr>
                  <td align="right" width="46%"><b font-size="6pt" margin-right="5px">Usuario Impresión:</b></td>
                  <td><span font-size="6pt">${usuarioActual}</span></td>
                </tr>
                <tr>
                  <td align="right"><b font-size="6pt" margin-right="5px">Fecha Impresión:</b></td>
                  <td><span font-size="6pt">${fechaActual}</span></td>
                </tr>
                <tr>
                  <td align="right"><b font-size="6pt" margin-right="5px">Usuario Recepción:</b></td>
                  <td><span font-size="6pt">${usuarioRecepcion}</span></td>
                </tr>
                <tr>
                  <td align="right"><b font-size="6pt" margin-right="5px">Fecha Recepción:</b></td>
                  <td><span font-size="6pt">${fechaRecepcion} ${horaRecepcion}</span></td>
                </tr>
              </table>
            </div>
    </div>
</div>
    <div width="100%">
          <div margin="0" border="1" corner-radius="5" width="39%" height="25%">
                <table width="100%" corner-radius="0" cellmargin="1pt 0 0 0" table-layout="fixed">
                    <tr>
                        <td width="22%" padding-left="5pt"><b>Lugar y Fecha:</b></td>
                        <td width="78%">${oficina}, ${fechaActualLetras}</td>
                    </tr>
                    <tr>
                        <td padding-left="5pt"><b>Cliente:</b></td>
                        <td>${beneficiarioId} - ${beneficiarioName}</td>
                    </tr>            
                    <tr>
                        <td padding-left="5pt"><b>Compañía:</b></td>
                        <td>${companyName}</td>
                    </tr>
                    <tr>
                        <td padding-left="5pt"><b>Teléfono:</b></td>
                        <td>
                          <#if telefono?length != 0>
                            <#if celular?length != 0>
                              ${telefono} / ${celular}
                            <#else>
                              ${telefono}
                            </#if>
                          <#else>
                            <#if celular?length != 0>
                              ${celular}
                            </#if>
                          </#if>
                        </td>
                    </tr>
                </table>
        </div>
        <div margin-top="5pt" border="1" corner-radius="5" width="39%">
                <p align="center" margin="2pt 0 0 0">
                    <span><b font-size="8pt">Datos del vehículo</b></span>
                </p>
                <table width="100%" corner-radius="0" cellmargin="1pt 0" table-layout="fixed">
                    <tr>
                        <td width="34%" padding-left="5pt"><b>Placa / Color:</b></td>
                        <td>${placa} / ${color}</td>
                    </tr>
                    <tr>
                        <td padding-left="5pt"><b>Chasis:</b></td>
                        <td>${chasis}</td>
                    </tr>
                    <tr>
                        <td padding-left="5pt"><b>Motor:</b></td>
                        <td>${motor}</td>
                    </tr>                    
                    <tr>
                        <td padding-left="5pt"><b>Marca / Modelo / Version:</b></td>
                        <td>${marca} / ${modelo} / ${version}</td>
                    </tr>
                </table>
        </div>
        <div position="absolute" width="20%" left="40%">
          <table width="100%" corner-radius="0" cellmargin="1pt 0 0 0" cellpadding="0" table-layout="fixed">
              <tr height="23pt">
                  <td width="50%" align="center" vertical-align="bottom"><b font-size="10pt">O/S: ${tranid}</b></td>
              </tr>
            <tr height="36pt">
                  <td align="center" vertical-align="middle"><barcode codetype="code-39" bar-width="1" showtext="false" height="30" width="130" value="${tranid}"/></td>
              </tr>
            <tr height="16pt">
                  <td></td>
              </tr>
            <tr height="23pt">
                  <td width="50%" align="center" vertical-align="bottom"><b font-size="10pt">C/V: ${codVehiculo}</b></td>
              </tr>
            <tr height="36pt">
                  <td align="center" vertical-align="middle"><barcode codetype="code-39" bar-width="1" showtext="false" height="30" width="130" value="${codVehiculo}"/></td>
              </tr>
          </table>
        </div>
        <div position="absolute" width="39%" left="61%">
          <div  border="1" corner-radius="5" height="83px" width="100%" margin-bottom="7px">
               <p align="center" margin="2pt 0 0 0">
                    <span><b font-size="10pt">Novedad Comercial</b></span>
               </p>
               <p margin="1pt 3pt 0 3pt">
                    <span>${novComercial}</span>
               </p>
          </div>
          <div  border="1" corner-radius="5" height="83px" width="100%" margin-top="7px">
               <p align="center" margin="2pt 0 0 0">
                    <span><b font-size="10pt">Novedad Técnica</b></span>
               </p>
               <p margin="1pt 3pt 0 3pt">
                    <span>${novTecnica}</span>
               </p>        
          </div>
        </div>
    </div>
      <table width="100%" margin-top="10px">
        <tr>
          <td width="64%">
            <div width="100%">
        <p font-size="10pt" margin-bottom="3px">
          <b>TRABAJOS:</b>
        </p>
        <table width="100%" cellborder="1" cellpadding="3px 0px 1px 5px" table-layout="fixed">
          <tr>
            <th width="10%" align="center" border-right="none"><b>FECHA</b></th>
            <th width="15%" align="center"  border-right="none"><b>OT Nro.</b></th>
            <th width="45%" align="center"  border-right="none"><b>TRABAJO</b></th>
            <th width="30%" align="center"><b>TÉCNICO</b></th>
          </tr>
          <#list trabajosData as trabajoOT>
            <tr>
              <td border-top="none" border-right="none">${dateOS}</td>
              <td border-top="none"  border-right="none">${trabajoOT.otNro}</td>
              <td border-top="none"  border-right="none">${trabajoOT.trabajo?upper_case}</td>
              <td border-top="none"></td>
            </tr>
          </#list>          
        </table>
      </div>
          </td>
          <td width="2%"></td>
          <td width="34%">
            <div width="100%">
        <p font-size="10pt" margin-bottom="3px" align="center">
          <b>DETALLE DE PRODUCCION</b>
        </p>
        <table width="100%" cellborder="1" cellpadding="3px 0px 3px 7px" table-layout="fixed">
          <tr>
            <th width="37%" align="center"  border-right="none"><b>TIPO PRODUCTO</b></th>
            <th width="37%" align="center"  border-right="none"><b>SERIE</b></th>
            <th width="26%" align="center"><b>ESTADO</b></th>
          </tr>
          <!-- <tr>
            <td border-top="none"  border-right="none"></td>
            <td border-top="none"  border-right="none"></td>
            <td border-top="none"></td>
          </tr> -->
        </table>
      </div>
          </td>
        </tr>
      </table>            
    <p align="center"  left="-0.5%" margin-top="15px"><b font-size="10pt">DATOS TECNICOS</b></p>
    <table width="100%" cellborder="1" cellpadding="3px 0px 1px 2px" table-layout="fixed">
          <tr>
            <th width="12%" border-right="none" border-left="none" border-top="none">
              <p position="absolute" margin="0"><p margin="0" position="relative"><nobr><b>DETALLE DE DISPOSITIVO LOJACK</b></nobr></p></p>
            </th>
            <th width="12%" vertical-align="middle"  border-right="none" border-left="none" border-top="none"></th>
            <th width="8%" vertical-align="middle"  border-right="none" border-left="none" border-top="none"></th>
            <th width="6%" vertical-align="middle"  border-right="none" border-left="none" border-top="none"></th>
            <th colspan="2" width="12%" align="center" vertical-align="middle"  border-right="none"><p text-align="center"><b>BATERIA VEH. ENCENDIDO</b></p></th>
            <th colspan="2" width="12%" align="center" vertical-align="middle"  border-right="none"><p text-align="center"><b >BATERIA VEH. APAGADO</b></p></th>
            <th colspan="2" width="12%" align="center" vertical-align="middle"  border-right="none"><p text-align="center"><b>BATERIA RESPALDO</b></p></th>
            <th colspan="2" width="12%" align="center" vertical-align="middle"  border-right="none"><p text-align="center"><b>SEÑAL TRACKER</b></p></th>
            <th colspan="2" width="12%" align="center" vertical-align="middle"><p text-align="center"><b>SEÑAL PUNTO</b></p></th>
          </tr>
          <tr>
            <td align="center" border-top="none" border-right="none"><b>SERIE</b></td>
            <td align="center" border-top="none" border-right="none"><b>ACTIVACION</b></td>
            <td align="center" border-top="none" border-right="none"><b>RESPUESTA</b></td>
            <td align="center" border-top="none" border-right="none"><b>UBICACION</b></td>
            <td align="center" border-top="none" border-right="none"><b>PRE CHEQ</b></td>
            <td align="center" border-top="none" border-right="none"><b>CHEQ FIN</b></td>
            <td align="center" border-top="none" border-right="none"><b>PRE CHEQ</b></td>
            <td align="center" border-top="none" border-right="none"><b>CHEQ FIN</b></td>
            <td align="center" border-top="none" border-right="none"><b>PRE CHEQ</b></td>
            <td align="center" border-top="none" border-right="none"><b>CHEQ FIN</b></td>
            <td align="center" border-top="none" border-right="none"><b>PRE CHEQ</b></td>
            <td align="center" border-top="none" border-right="none"><b>CHEQ FIN</b></td>
            <td align="center" border-top="none" border-right="none"><b>PRE CHEQ</b></td>
            <td align="center" border-top="none"><b>CHEQ FIN</b></td>
          </tr>
          <#list lojackData as lojack>
            <tr>
              <td border-top="none" border-right="none">${lojack.serieLojack?upper_case}</td>
              <td border-top="none" border-right="none">${lojack.activacion?upper_case}</td>
              <td border-top="none" border-right="none">${lojack.respuesta?upper_case}</td>
              <td border-top="none" border-right="none">${lojack.ubicacionDispositivo?upper_case}</td>
              <td border-top="none" border-right="none"></td>
              <td border-top="none" border-right="none"></td>
              <td border-top="none" border-right="none"></td>
              <td border-top="none" border-right="none"></td>
              <td border-top="none" border-right="none"></td>
              <td border-top="none" border-right="none"></td>
              <td border-top="none" border-right="none"></td>
              <td border-top="none" border-right="none"></td>
              <td border-top="none" border-right="none"></td>
              <td border-top="none"></td>
            </tr>
          </#list>            
        </table>
      <table margin-top="20px">
        <tr height="20px">
            <th vertical-align="middle"><b>DETALLE DE DISPOSITIVO MONITOREO CELULAR / SATELITAL</b></th>
          </tr>
      </table>
        <table width="100%" cellborder="1" cellpadding="3px 0px 1px 2px" table-layout="fixed">          
          <tr>
            <td width="9%" align="center" border-right="none"><b>SERIE</b></td>
            <td width="8%" align="center" border-right="none"><b>UNIDAD</b></td>
            <td width="10%" align="center" border-right="none"><b>IMEI</b></td>
            <td width="8%" align="center" border-right="none"><b>MODELO</b></td>
            <td width="11%" align="center" border-right="none"><b>SIM</b></td>
            <td width="7%" align="center" border-right="none"><b>IP</b></td>
            <td width="7%" align="center" border-right="none"><b>APN</b></td>
            <td width="10%" align="center" border-right="none"><b>VID</b></td>
            <td width="6%" align="center" border-right="none"><b>SERVIDOR</b></td>
            <td width="6%" align="center" border-right="none"><b>FIRMWARE</b></td>
            <td width="5%" align="center" border-right="none"><b>SCRIPT</b></td>
            <td width="6%" align="center" border-right="none"><b>UBICACION</b></td>
            <td width="7%" align="center"><b>ODOMETRO</b></td>
          </tr>
          <#list monitoreoData as monitoreo>
            <tr>
              <td border-top="none" border-right="none">${monitoreo.serieChaser?upper_case}</td>
              <td border-top="none" border-right="none">${monitoreo.unidad?upper_case}</td>
              <td border-top="none" border-right="none">${monitoreo.imei?upper_case}</td>
              <td border-top="none" border-right="none">${monitoreo.modelo?upper_case}</td>
              <td border-top="none" border-right="none">${monitoreo.sim?upper_case}</td>
              <td border-top="none" border-right="none">${monitoreo.ip?upper_case}</td>
              <td border-top="none" border-right="none">${monitoreo.apn?upper_case}</td>
              <td border-top="none" border-right="none">${monitoreo.vid?upper_case}</td>
              <td border-top="none" border-right="none">${monitoreo.servidor?upper_case}</td>
              <td border-top="none" border-right="none">${monitoreo.firmware?upper_case}</td>
              <td border-top="none" border-right="none">${monitoreo.script?upper_case}</td>
              <td border-top="none" border-right="none">${monitoreo.ubicacionDispositivo?upper_case}</td>
              <td border-top="none"></td>
            </tr>
          </#list>          
        </table>
        <div  border="1" corner-radius="5" height="88px" width="100%" margin-top="15px">
               <p margin="4pt">
                    <span><b font-size="10pt">Observación Técnica : &nbsp;</b></span>
               </p>            
          </div>
  
</body>
</pdf>