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
  <#assign tranid = data.tranid> <!--String-->
  <#assign codVehiculo = data.codVehiculo> <!--String-->
  <#assign oficina = data.location?upper_case> <!--String-->
  <#assign telefono = data.telefono> <!--String-->
  <#assign celular = data.celular> <!--String-->
  <#assign beneficiarioId = data.clientId> <!--String-->
  <#assign beneficiarioName = data.clientName?upper_case> <!--String--> <!-- ESCAPE XML -->

  <#assign usuarioRecepcion = data.recepcion?upper_case> <!--String-->
  <#assign fechaRecepcion = data.fechaRecepcion>
  <#assign horaRecepcion = data.horaRecepcion>

  <#assign placa = data.placa?upper_case> <!--String-->
  <#assign color = data.color?upper_case> <!--String-->
  <#assign chasis = data.chasis> <!--String--> <!-- ESCAPE XML -->
  <#assign motor = data.motor> <!--String--> <!-- ESCAPE XML -->
  <#assign marca = data.marca?upper_case> <!--String--> <!-- ESCAPE XML -->
  <#assign modelo = data.modelo?upper_case> <!--String--> <!-- ESCAPE XML -->
  <#assign version = data.version?upper_case> <!--String--> <!-- ESCAPE XML -->
  <#assign trabajosList = data.trabajosList> <!--[trabajo]--> 

  <!-- VARIABLES INTERNAS DEL SISTEMA -->
    <#assign logoHunter = companyInformation.logoUrl>
    <#assign vistasAuto = "https://${companyinformation.companyid}.app.netsuite.com/core/media/media.nl?id=84425&c=${companyinformation.companyid}&h=VYiRVMzVV3NxcTLwldHaNDspGk3xyRQoe1if89uVX2L6KYLo"> 
    <#assign indiceArroba = user.email?index_of("@")>
    <#assign usuarioActual = user.email?substring(0, indiceArroba)?upper_case>
    <#assign fechaActualLetras = .now?date?string.long?upper_case>
    <#assign fechaActual = .now?string["dd/MM/yyyy HH:mm:ss"]>    

<body padding="0" size="A4"><div padding="0.25in" width="100%" height="297mm">
    <div name="originalCliente" border-bottom="1" position="absolute" width="100%" height="50%">
      <div position="absolute" top="-0.2in" left="0.3in">
        <#if logoHunter?length != 0><@filecabinet nstype="image" src="${logoHunter}" style="float: left; height:50px; width:120px" /></#if>
      </div>
          <div position="absolute" top="0" left="75%">
            <div width="25%">
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
      <p align="center" margin-top="0" margin-bottom="2pt" line-height="10pt">
                <span><b><i font-size="12pt">CARRO SEGURO CARSEG S.A.</i></b></span><br/>
                <span><b font-size="10pt">Acta de Entrega - Recepción de Vehículos</b></span><br/>
                <span font-size="8pt"><b font-size="8pt">Original:</b> Cliente</span>
            </p>
        <div width="48%" height="50%" margin="12pt 0 0 5pt" name="EncabezadoIzquierdo" >            
            <div margin="0" border="1" corner-radius="5" width="100%" height="25%">
                <table width="100%" corner-radius="0" cellmargin="1pt 0 0 0" table-layout="fixed">
                    <tr>
                        <td width="25%" padding-left="5pt"><b>Lugar y Fecha:</b></td>
                        <td>
                            <p position="absolute" padding-right="5pt" overflow="hidden">
                                <p margin="0" position="relative">
                                    <nobr>${oficina}, ${fechaActualLetras}</nobr>
                                </p>
                            </p>
                        </td>
                    </tr>
                </table>
                <table width="100%" corner-radius="0" table-layout="fixed">
                    <tr>
                        <td width="14%" padding-left="5pt"><b>Cliente:</b></td>
                        <td>
                            <p position="absolute" padding-right="5pt" overflow="hidden">
                                <p margin="0" position="relative">
                                    <nobr>${beneficiarioId} - ${beneficiarioName}</nobr>
                                </p>
                            </p>
                        </td>
                    </tr>
                </table>
                <table width="100%" corner-radius="0" table-layout="fixed">                
                    <tr>
                        <td width="29%" padding-left="5pt"><b>Cliente Monitoreo:</b></td>
                        <td></td>
                    </tr>
                </table>
              <table width="100%" corner-radius="0" table-layout="fixed">                
                    <tr>
                        <td width="16%" padding-left="5pt"><b>Teléfono:</b></td>
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
            <div margin-top="5pt" border="1" corner-radius="5" width="100%" height="29%">
                <p align="center" margin="2pt 0 0 0">
                    <span><b font-size="8pt">Datos del vehículo</b></span>
                </p>
                <table width="100%" corner-radius="0" cellmargin="1pt 0" table-layout="fixed">
                    <tr>
                        <td width="22%" padding-left="5pt"><b>No Motor:</b></td>
                        <td width="80%">
                            <p position="absolute" padding-right="5pt" overflow="hidden">
                                <p margin="0" position="relative">
                                    <nobr>${motor}</nobr>
                                </p>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td padding-left="5pt"><b>Placa/Color:</b></td>
                        <td>
                            <p position="absolute" padding-right="5pt" overflow="hidden">
                                <p margin="0" position="relative">
                                    <nobr>${placa} / ${color}</nobr>
                                </p>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td padding-left="5pt"><b>Serie Chasis:</b></td>
                        <td>
                            <p position="absolute" padding-right="5pt" overflow="hidden">
                                <p margin="0" position="relative">
                                    <nobr>${chasis}</nobr>
                                </p>
                            </p>
                        </td>
                    </tr>                    
                </table>
                <table width="100%" corner-radius="0" cellmargin="1pt 0" table-layout="fixed">
                    <tr>
                        <td width="34%" padding-left="5pt"><b>Marca/Modelo/Version:</b></td>
                        <td overflow="hidden" height="22pt">
                            <p position="absolute" padding-right="5pt">
                                <p margin="0" position="relative">
                                    ${marca} / ${modelo} / ${version}
                                </p>
                            </p>
                        </td>
                    </tr>
                </table>
            </div>
          <#macro filaItemsAccesorios name1 name2 name3>
              <tr>
                <td width="33%" heigt="12px">
                  <div border="1" margin="0 3pt 0 10pt" height="12px" width="30px" float="left" display="inline"></div>
                  <p height="12px" vertical-align="middle" display="inline" margin="0" padding-top="1pt">
                    <nobr>${name1}</nobr>
                  </p>
                </td>
                <td width="33%" heigt="12px">
                  <div border="1" margin="0 3pt 0 10pt" height="12px" width="30px" float="left" display="inline"></div>
                  <p height="12px" vertical-align="middle" display="inline" margin="0" padding-top="1pt">
                    <nobr>${name2}</nobr>
                  </p>
                </td>
                <td width="34%" heigt="12px">
                  <div border="1" margin="0 3pt 0 5pt" height="12px" width="24px" float="left" display="inline"></div>
                  <p height="12px" vertical-align="middle" display="inline" margin="0" padding-top="1pt">
                    <nobr>${name3}</nobr>
                  </p>
                </td>
              </tr>
            </#macro>
          <div margin-top="5pt" padding-bottom="3pt" border="1" corner-radius="5" width="100%" height="29%">
            <p align="center" margin="2pt 0 1pt">
                <b font-size="8pt">Accesorios</b>
            </p>            
            <table table-layout="fixed" width="100%" corner-radius="0" cellpadding="0">              
              <@filaItemsAccesorios "Radio" "Antena" "Luces y Faros"/>
              <@filaItemsAccesorios "Perillas" "Mascarilla" "Micas de Luces"/>
              <@filaItemsAccesorios "Parlantes" "Espejos ext." "Brazos y plumas"/>
              <@filaItemsAccesorios "Aire Acond." "Tapa Comb." "Luces de Parqueo"/>
              <@filaItemsAccesorios "Vent./Calef." "Tapa Cubos" "Topes de Puertas"/>
              <@filaItemsAccesorios "Cámara Retro" "Llantas Emerg." "Vidrios y Seguros"/>
              <@filaItemsAccesorios "Espejo interior" "Herramientas" "Alfombra de piso"/>
              <@filaItemsAccesorios "Manual Radio" "Llave Rueda" "Cabeceras ......."/>
              <@filaItemsAccesorios "Manual Carro" "Chicotes" "Moquetas ........"/>
                <tr>
                <td width="33%" heigt="12px">
                  <div border="1" margin="0 3pt 0 10pt" height="12px" width="30px" float="left" display="inline"></div>
                  <p height="12px" vertical-align="middle" display="inline" margin="0" padding-top="1pt">
                    <nobr>Encendedor</nobr>
                  </p>
                </td>
                <td width="33%" heigt="12px">
                  <div border="1" margin="0 3pt 0 10pt" height="12px" width="30px" float="left" display="inline"></div>
                  <p height="12px" vertical-align="middle" display="inline" margin="0" padding-top="1pt">
                    <nobr>Palanca</nobr>
                  </p>
                </td>
                <td width="34%" heigt="12px">
                </td>
              </tr>
                <tr>
                <td width="33%" heigt="12px">
                  <div border="1" margin="0 3pt 0 10pt" height="12px" width="30px" float="left" display="inline"></div>
                  <p height="12px" vertical-align="middle" display="inline" margin="0" padding-top="1pt">
                    <nobr>Cenicero</nobr>
                  </p>
                </td>
                <td width="33%" heigt="12px">
                  <div border="1" margin="0 3pt 0 10pt" height="12px" width="30px" float="left" display="inline"></div>
                  <p height="12px" vertical-align="middle" display="inline" margin="0" padding-top="1pt">
                    <nobr>Gata</nobr>
                  </p>
                </td>
                <td width="34%" heigt="12px">
                </td>
              </tr>
            </table>
        </div>
                <div margin-top="5pt" border="1" corner-radius="5" width="100%">
            <table table-layout="fixed" width="100%" corner-radius="0">              
              <tr>
                <td width="35%" padding="2pt 0 2pt 5pt" border-bottom="1">
                  <p height="12px" vertical-align="middle" display="inline" margin="0" padding-top="1pt">
                    <b>Cantidad Llaves:</b>
                  </p>
                </td>
                <td width="35%" border-left="1" border-bottom="1" padding="2pt 0 2pt 5pt">
                  <p height="12px" vertical-align="middle" display="inline" margin="0" padding-top="1pt">
                    <b>Odometro:</b>
                  </p>
                </td>
                <td width="30%" border-bottom="1" padding="2pt 0 2pt 5pt">
                  <p height="12px" vertical-align="middle" display="inline" margin="0" padding-top="1pt">
                    <b>Entrega:</b>
                  </p>
                </td>
              </tr>
              <tr>
                <td padding="2pt 0 2pt 5pt">
                  <p height="12px" vertical-align="middle" display="inline" margin="0" padding-top="1pt">
                    <b>Cantidad Controles:</b>
                  </p>
                </td>
                <td border-left="1" padding="2pt 0 2pt 5pt">
                  <p height="12px" vertical-align="middle" display="inline" margin="0" padding-top="1pt">
                    <b>Fecha Entrega:</b>
                  </p>
                </td>
                <td padding="2pt 0 2pt 15pt">
                  <p height="12px" vertical-align="middle" display="inline" margin="0" padding-top="1pt">
                    <b>Hora:</b>
                  </p>
                </td>
              </tr>
            </table>                  
        </div>
                <div margin-top="5pt" border="1" corner-radius="5" width="100%" height="52pt" overflow="hidden">
                  <div position="absolute" width="100%" height="100%">                    
                    <p align="center" margin="2pt 0 0">
                       <b font-size="8pt">Novedades</b>
                    </p>
                    <p margin="0" padding="0 5pt">

                    </p>
                  </div>
                </div>
        </div>
      <div width="50%" height="50%" position="absolute" left="49%" top="8%"  name="EncabezadoDerecho" background-color="#FFFFFF">
        <div margin="0" width="100%" height="60pt" >
          <table width="100%" corner-radius="0" cellmargin="1pt 0 0 0" cellpadding="0" table-layout="fixed">
              <tr height="24pt">
                  <td width="50%" align="center" vertical-align="bottom"><b font-size="9pt">O/S: ${tranid}</b></td>
                  <td width="50%" align="center" vertical-align="bottom"><b font-size="9pt">C/V: ${codVehiculo}</b></td>
              </tr>
            <tr height="36pt">
                  <td align="center" vertical-align="middle"><barcode codetype="code-39" bar-width="1" showtext="false" height="30" width="130" value="${tranid}"/></td>
                  <td align="center" vertical-align="middle"><barcode codetype="code-39" bar-width="1" showtext="false" height="30" width="130" value="${codVehiculo}"/></td>
              </tr>
          </table>
        </div>
        <div margin-top="8pt" border="1" corner-radius="5" width="100%" height="29%">
          <div margin="0" width="100%" height="77pt" overflow="hidden">
            <div margin="0" width="100%" height="100%" position="absolute">
              <p align="center" margin="2pt 0 0 0">
                  <span><b font-size="8pt">Orden de Trabajo</b></span>
              </p>          
              <p line-height="100%" width="100%" margin="2pt 10pt 0 5pt">
                <p margin="0" ><b>Trabajos:</b></p>
                <ul >
                  <#list trabajosList as trabajo>
                    <li>${trabajo?upper_case}</li>
                  </#list>                            
                </ul>
              </p>
            </div>                
          </div>                
        </div>
        <div margin-top="5pt" width="100%" height="204px" overflow="hidden">
          <div position="absolute" width="100%" height="100%" top="-8px" left="-1px" padding="0">
            <#if vistasAuto?length != 0><@filecabinet nstype="image" src="${vistasAuto}" style="float: left; height:197px; width:300px" /></#if>
          </div>
              <div position="absolute" width="13%" left="87%" height="100%" background-color="white" padding="0">
                <div position="absolute" width="100%" height="100%">
                  <shape margin-left="4pt" border="0.5">
                    <shapepath>
                        <moveto x="5px" y="20px"/>
                        <lineto x="10px" y="20px"/>
                        <arcto width="10px" height="10px" startangle="0" endangle="90"/>
                        <lineto x="15px" y="175px"/>
                        <arcto width="10px" height="10px" startangle="90" endangle="180"/>
                        <lineto x="5px" y="180px"/>
                        <arcto width="10px" height="10px" startangle="180" endangle="270"/>
                        <lineto x="0px" y="25px"/>
                        <arcto width="10px" height="10px" startangle="270" endangle="360"/>
                        <moveto x="0px" y="40px"/>
                        <lineto x="15px" y="40px"/>
                        <moveto x="0px" y="80px"/>
                        <lineto x="15px" y="80px"/>
                        <moveto x="0px" y="120px"/>
                        <lineto x="15px" y="120px"/>
                        <moveto x="0px" y="160px"/>
                        <lineto x="15px" y="160px"/>
                    </shapepath>
                  </shape>
                  <shape margin-left="4pt">
                    <shapepath >                                             
                        <moveto x="0px" y="60px"/>
                        <lineto x="20px" y="60px"/>
                        <moveto x="0px" y="100px"/>
                        <lineto x="20px" y="100px"/>
                        <moveto x="0px" y="140px"/>
                        <lineto x="20px" y="140px"/>
                    </shapepath>
                  </shape>
                </div> 
                <div position="absolute" width="39%" left="61%" top="23%" height="100%">
                  <b>3/4</b>
                </div>
                <div position="absolute" width="39%" left="61%" top="43%" height="100%">
                  <b>1/2</b>
                </div>
                <div position="absolute" width="39%" left="61%" top="63%" height="100%">
                  <b>1/4</b>
                </div>
              </div>
              <div position="absolute" width="17%" left="83%" top="-2%" height="10pt">
                  <b>Combustible</b>
                </div>
        </div>
        <div margin-top="5pt" border="1" corner-radius="5" width="100%" height="52pt" overflow="hidden">                   
          <p margin="0" padding="4pt 5pt 0" line-height="90%">
              El cliente declara haber entregado el vehículo en las condiciones establecidas en la presente acta, la cual suscribe en señal de aceptación.
          </p>
          <div position="absolute" width="100%" height="20%" top="80%">
            <table width="100%" height="100%" table-layout="fixed">
              <tr>
                <td align="center" border-top="1" padding="0" margin="0 8pt 0 16pt">Cliente</td>
                <td align="center" border-top="1" padding="0" margin="0 16pt 0 8pt">Asesor de Servicio CARSEG S.A.</td>
              </tr>
            </table>
          </div>            
        </div>
      </div>
    </div>

    <div name="copiaTalleres" position="absolute" top="51%" width="100%" height="50%">
    
      <div position="absolute" top="-0.2in" left="0.3in">
        <#if logoHunter?length != 0><@filecabinet nstype="image" src="${logoHunter}" style="float: left; height:50px; width:120px" /></#if>
      </div>
          <div position="absolute" top="0" left="75%">
            <div width="25%">
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
      <p align="center" margin-top="0" margin-bottom="2pt" line-height="10pt">
                <span><b><i font-size="12pt">CARRO SEGURO CARSEG S.A.</i></b></span><br/>
                <span><b font-size="10pt">Acta de Entrega - Recepción de Vehículos</b></span><br/>
                <span font-size="8pt"><b font-size="8pt">Copia:</b> Talleres</span>
            </p>
        <div width="48%" height="50%" margin="12pt 0 0 5pt" name="EncabezadoIzquierdo" >            
            <div margin="0" border="1" corner-radius="5" width="100%" height="25%">
                <table width="100%" corner-radius="0" cellmargin="1pt 0 0 0" table-layout="fixed">
                    <tr>
                        <td width="25%" padding-left="5pt"><b>Lugar y Fecha:</b></td>
                        <td>
                            <p position="absolute" padding-right="5pt" overflow="hidden">
                                <p margin="0" position="relative">
                                    <nobr>${oficina}, ${fechaActualLetras}</nobr>
                                </p>
                            </p>
                        </td>
                    </tr>
                </table>
                <table width="100%" corner-radius="0" table-layout="fixed">
                    <tr>
                        <td width="14%" padding-left="5pt"><b>Cliente:</b></td>
                        <td>
                            <p position="absolute" padding-right="5pt" overflow="hidden">
                                <p margin="0" position="relative">
                                    <nobr>${beneficiarioId} - ${beneficiarioName}</nobr>
                                </p>
                            </p>
                        </td>
                    </tr>
                </table>
                <table width="100%" corner-radius="0" table-layout="fixed">                
                    <tr>
                        <td width="29%" padding-left="5pt"><b>Cliente Monitoreo:</b></td>
                        <td></td>
                    </tr>
                </table>
              <table width="100%" corner-radius="0" table-layout="fixed">                
                    <tr>
                        <td width="16%" padding-left="5pt"><b>Teléfono:</b></td>
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
            <div margin-top="5pt" border="1" corner-radius="5" width="100%" height="29%">
                <p align="center" margin="2pt 0 0 0">
                    <span><b font-size="8pt">Datos del vehículo</b></span>
                </p>
                <table width="100%" corner-radius="0" cellmargin="1pt 0" table-layout="fixed">
                    <tr>
                        <td width="22%" padding-left="5pt"><b>No Motor:</b></td>
                        <td width="80%">
                            <p position="absolute" padding-right="5pt" overflow="hidden">
                                <p margin="0" position="relative">
                                    <nobr>${motor}</nobr>
                                </p>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td padding-left="5pt"><b>Placa/Color:</b></td>
                        <td>
                            <p position="absolute" padding-right="5pt" overflow="hidden">
                                <p margin="0" position="relative">
                                    <nobr>${placa} / ${color}</nobr>
                                </p>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td padding-left="5pt"><b>Serie Chasis:</b></td>
                        <td>
                            <p position="absolute" padding-right="5pt" overflow="hidden">
                                <p margin="0" position="relative">
                                    <nobr>${chasis}</nobr>
                                </p>
                            </p>
                        </td>
                    </tr>                    
                </table>
                <table width="100%" corner-radius="0" cellmargin="1pt 0" table-layout="fixed">
                    <tr>
                        <td width="34%" padding-left="5pt"><b>Marca/Modelo/Version:</b></td>
                        <td overflow="hidden" height="22pt">
                            <p position="absolute" padding-right="5pt">
                                <p margin="0" position="relative">
                                    ${marca} / ${modelo} / ${version}
                                </p>
                            </p>
                        </td>
                    </tr>
                </table>
            </div>
          <#macro filaItemsAccesorios name1 name2 name3>
              <tr>
                <td width="33%" heigt="12px">
                  <div border="1" margin="0 3pt 0 10pt" height="12px" width="30px" float="left" display="inline"></div>
                  <p height="12px" vertical-align="middle" display="inline" margin="0" padding-top="1pt">
                    <nobr>${name1}</nobr>
                  </p>
                </td>
                <td width="33%" heigt="12px">
                  <div border="1" margin="0 3pt 0 10pt" height="12px" width="30px" float="left" display="inline"></div>
                  <p height="12px" vertical-align="middle" display="inline" margin="0" padding-top="1pt">
                    <nobr>${name2}</nobr>
                  </p>
                </td>
                <td width="34%" heigt="12px">
                  <div border="1" margin="0 3pt 0 5pt" height="12px" width="24px" float="left" display="inline"></div>
                  <p height="12px" vertical-align="middle" display="inline" margin="0" padding-top="1pt">
                    <nobr>${name3}</nobr>
                  </p>
                </td>
              </tr>
            </#macro>
          <div margin-top="5pt" padding-bottom="3pt" border="1" corner-radius="5" width="100%" height="29%">
            <p align="center" margin="2pt 0 1pt">
                <b font-size="8pt">Accesorios</b>
            </p>            
            <table table-layout="fixed" width="100%" corner-radius="0" cellpadding="0">              
              <@filaItemsAccesorios "Radio" "Antena" "Luces y Faros"/>
              <@filaItemsAccesorios "Perillas" "Mascarilla" "Micas de Luces"/>
              <@filaItemsAccesorios "Parlantes" "Espejos ext." "Brazos y plumas"/>
              <@filaItemsAccesorios "Aire Acond." "Tapa Comb." "Luces de Parqueo"/>
              <@filaItemsAccesorios "Vent./Calef." "Tapa Cubos" "Topes de Puertas"/>
              <@filaItemsAccesorios "Cámara Retro" "Llantas Emerg." "Vidrios y Seguros"/>
              <@filaItemsAccesorios "Espejo interior" "Herramientas" "Alfombra de piso"/>
              <@filaItemsAccesorios "Manual Radio" "Llave Rueda" "Cabeceras ......."/>
              <@filaItemsAccesorios "Manual Carro" "Chicotes" "Moquetas ........"/>
                <tr>
                <td width="33%" heigt="12px">
                  <div border="1" margin="0 3pt 0 10pt" height="12px" width="30px" float="left" display="inline"></div>
                  <p height="12px" vertical-align="middle" display="inline" margin="0" padding-top="1pt">
                    <nobr>Encendedor</nobr>
                  </p>
                </td>
                <td width="33%" heigt="12px">
                  <div border="1" margin="0 3pt 0 10pt" height="12px" width="30px" float="left" display="inline"></div>
                  <p height="12px" vertical-align="middle" display="inline" margin="0" padding-top="1pt">
                    <nobr>Palanca</nobr>
                  </p>
                </td>
                <td width="34%" heigt="12px">
                </td>
              </tr>
                <tr>
                <td width="33%" heigt="12px">
                  <div border="1" margin="0 3pt 0 10pt" height="12px" width="30px" float="left" display="inline"></div>
                  <p height="12px" vertical-align="middle" display="inline" margin="0" padding-top="1pt">
                    <nobr>Cenicero</nobr>
                  </p>
                </td>
                <td width="33%" heigt="12px">
                  <div border="1" margin="0 3pt 0 10pt" height="12px" width="30px" float="left" display="inline"></div>
                  <p height="12px" vertical-align="middle" display="inline" margin="0" padding-top="1pt">
                    <nobr>Gata</nobr>
                  </p>
                </td>
                <td width="34%" heigt="12px">
                </td>
              </tr>
            </table>
        </div>
                <div margin-top="5pt" border="1" corner-radius="5" width="100%">
            <table table-layout="fixed" width="100%" corner-radius="0">              
              <tr>
                <td width="35%" padding="2pt 0 2pt 5pt" border-bottom="1">
                  <p height="12px" vertical-align="middle" display="inline" margin="0" padding-top="1pt">
                    <b>Cantidad Llaves:</b>
                  </p>
                </td>
                <td width="35%" border-left="1" border-bottom="1" padding="2pt 0 2pt 5pt">
                  <p height="12px" vertical-align="middle" display="inline" margin="0" padding-top="1pt">
                    <b>Odometro:</b>
                  </p>
                </td>
                <td width="30%" border-bottom="1" padding="2pt 0 2pt 5pt">
                  <p height="12px" vertical-align="middle" display="inline" margin="0" padding-top="1pt">
                    <b>Entrega:</b>
                  </p>
                </td>
              </tr>
              <tr>
                <td padding="2pt 0 2pt 5pt">
                  <p height="12px" vertical-align="middle" display="inline" margin="0" padding-top="1pt">
                    <b>Cantidad Controles:</b>
                  </p>
                </td>
                <td border-left="1" padding="2pt 0 2pt 5pt">
                  <p height="12px" vertical-align="middle" display="inline" margin="0" padding-top="1pt">
                    <b>Fecha Entrega:</b>
                  </p>
                </td>
                <td padding="2pt 0 2pt 15pt">
                  <p height="12px" vertical-align="middle" display="inline" margin="0" padding-top="1pt">
                    <b>Hora:</b>
                  </p>
                </td>
              </tr>
            </table>                  
        </div>
                <div margin-top="5pt" border="1" corner-radius="5" width="100%" height="52pt" overflow="hidden">
                  <div position="absolute" width="100%" height="100%">                    
                    <p align="center" margin="2pt 0 0">
                       <b font-size="8pt">Novedades</b>
                    </p>
                    <p margin="0" padding="0 5pt">

                    </p>
                  </div>
                </div>
        </div>
      <div width="50%" height="50%" position="absolute" left="49%" top="8%"  name="EncabezadoDerecho" background-color="#FFFFFF">
        <div margin="0" width="100%" height="60pt" >
          <table width="100%" corner-radius="0" cellmargin="1pt 0 0 0" cellpadding="0" table-layout="fixed">
              <tr height="24pt">
                  <td width="50%" align="center" vertical-align="bottom"><b font-size="9pt">O/S: ${tranid}</b></td>
                  <td width="50%" align="center" vertical-align="bottom"><b font-size="9pt">C/V: ${codVehiculo}</b></td>
              </tr>
            <tr height="36pt">
                  <td align="center" vertical-align="middle"><barcode codetype="code-39" bar-width="1" showtext="false" height="30" width="130" value="${tranid}"/></td>
                  <td align="center" vertical-align="middle"><barcode codetype="code-39" bar-width="1" showtext="false" height="30" width="130" value="${codVehiculo}"/></td>
              </tr>
          </table>
        </div>
        <div margin-top="8pt" border="1" corner-radius="5" width="100%" height="29%">
          <div margin="0" width="100%" height="77pt" overflow="hidden">
            <div margin="0" width="100%" height="100%" position="absolute">
              <p align="center" margin="2pt 0 0 0">
                  <span><b font-size="8pt">Orden de Trabajo</b></span>
              </p>          
              <p line-height="100%" width="100%" margin="2pt 10pt 0 5pt">
                <p margin="0" ><b>Trabajos:</b></p>
                <ul >
                  <#list trabajosList as trabajo>
                    <li>${trabajo?upper_case}</li>
                  </#list>                            
                </ul>
              </p>
            </div>                
          </div>                
        </div>
        <div margin-top="5pt" width="100%" height="204px" overflow="hidden">
          <div position="absolute" width="100%" height="100%" top="-8px" left="-1px" padding="0">
            <#if vistasAuto?length != 0><@filecabinet nstype="image" src="${vistasAuto}" style="float: left; height:197px; width:300px" /></#if>
          </div>
              <div position="absolute" width="13%" left="87%" height="100%" background-color="white" padding="0">
                <div position="absolute" width="100%" height="100%">
                  <shape margin-left="4pt" border="0.5">
                    <shapepath>
                        <moveto x="5px" y="20px"/>
                        <lineto x="10px" y="20px"/>
                        <arcto width="10px" height="10px" startangle="0" endangle="90"/>
                        <lineto x="15px" y="175px"/>
                        <arcto width="10px" height="10px" startangle="90" endangle="180"/>
                        <lineto x="5px" y="180px"/>
                        <arcto width="10px" height="10px" startangle="180" endangle="270"/>
                        <lineto x="0px" y="25px"/>
                        <arcto width="10px" height="10px" startangle="270" endangle="360"/>
                        <moveto x="0px" y="40px"/>
                        <lineto x="15px" y="40px"/>
                        <moveto x="0px" y="80px"/>
                        <lineto x="15px" y="80px"/>
                        <moveto x="0px" y="120px"/>
                        <lineto x="15px" y="120px"/>
                        <moveto x="0px" y="160px"/>
                        <lineto x="15px" y="160px"/>
                    </shapepath>
                  </shape>
                  <shape margin-left="4pt">
                    <shapepath >                                             
                        <moveto x="0px" y="60px"/>
                        <lineto x="20px" y="60px"/>
                        <moveto x="0px" y="100px"/>
                        <lineto x="20px" y="100px"/>
                        <moveto x="0px" y="140px"/>
                        <lineto x="20px" y="140px"/>
                    </shapepath>
                  </shape>
                </div> 
                <div position="absolute" width="39%" left="61%" top="23%" height="100%">
                  <b>3/4</b>
                </div>
                <div position="absolute" width="39%" left="61%" top="43%" height="100%">
                  <b>1/2</b>
                </div>
                <div position="absolute" width="39%" left="61%" top="63%" height="100%">
                  <b>1/4</b>
                </div>
              </div>
              <div position="absolute" width="17%" left="83%" top="-2%" height="10pt">
                  <b>Combustible</b>
                </div>
        </div>
        <div margin-top="5pt" border="1" corner-radius="5" width="100%" height="52pt" overflow="hidden">                   
          <p margin="0" padding="4pt 5pt 0" line-height="90%">
              El cliente declara haber entregado el vehículo en las condiciones establecidas en la presente acta, la cual suscribe en señal de aceptación.
          </p>
          <div position="absolute" width="100%" height="20%" top="80%">
            <table width="100%" height="100%" table-layout="fixed">
              <tr>
                <td align="center" border-top="1" padding="0" margin="0 8pt 0 16pt">Cliente</td>
                <td align="center" border-top="1" padding="0" margin="0 16pt 0 8pt">Asesor de Servicio CARSEG S.A.</td>
              </tr>
            </table>
          </div>            
        </div>
      </div>
    
    </div>

</div></body>
</pdf>