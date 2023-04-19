/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 */
 define(['N/log', 'N/https', 'N/search', 'N/record', 'N/task', 'N/runtime'], function(log, https,search, record, task, runtime) {
    const scriptObj = runtime.getCurrentScript();
    function getInputData() {
        let StrToken = scriptObj.getParameter({ name: 'custscript_strtoken' });
        let UserName = scriptObj.getParameter({ name: 'custscript_username' });
        let Password = scriptObj.getParameter({ name: 'custscript_password' });
        let NumeroOrden = scriptObj.getParameter({ name: 'custscript_numeroorden' });
        let UsuarioIngreso = scriptObj.getParameter({ name: 'custscript_usuarioingreso'});
        let OperacionOrden = scriptObj.getParameter({ name: 'custscript_operacionorden'});
        let placa = scriptObj.getParameter({ name: 'custscript_placa'});
        let idmarca = scriptObj.getParameter({ name: 'custscript_idmarca'});
        let descmarca = scriptObj.getParameter({ name: 'custscript_descmarca'});
        let idmodelo = scriptObj.getParameter({ name: 'custscript_idmodelo'});
        let descmodelo = scriptObj.getParameter({ name: 'custscript_descmodelo'});
        let codigovehiculo = scriptObj.getParameter({ name: 'custscript_codigovehiculo'});
        let chasis = scriptObj.getParameter({ name: 'custscript_chasis' });
        let motor = scriptObj.getParameter({ name: 'custscript_motor'});
        let color = scriptObj.getParameter({ name: 'custscript_color'});
        let anio = scriptObj.getParameter({ name: 'custscript_anio'});
        let tipo = scriptObj.getParameter({ name: 'custscript_tipo'});
        let vid = scriptObj.getParameter({ name: 'custscript_vid'});
        let idproducto = scriptObj.getParameter({ name: 'custscript_idproducto'});
        let descproducto = scriptObj.getParameter({ name: 'custscript_descproducto'});
        let codmarcadispositivo = scriptObj.getParameter({ name: 'custscript_codmarcadispositivo'});
        let marcadispositivo = scriptObj.getParameter({ name: 'custscript_marcadispositivo'});
        let codmodelodispositivo = scriptObj.getParameter({ name: 'custscript_codmodelodispositivo'});
        let modelodispositivo = scriptObj.getParameter({ name: 'custscript_modelodispositivo'});
        let sn = scriptObj.getParameter({ name: 'custscript_sn'});
        let imei = scriptObj.getParameter({ name: 'custscript_imei'});
        let numerocamaras = scriptObj.getParameter({ name: 'custscript_numerocamaras' });
        let direccionmac = scriptObj.getParameter({ name: 'custscript_direccionmac'});
        let icc = scriptObj.getParameter({ name: 'custscript_icc'});
        let numerocelular = scriptObj.getParameter({ name: 'custscript_numerocelular'});
        let operadora = scriptObj.getParameter({ name: 'custscript_operadora'});
        let estadosim = scriptObj.getParameter({ name: 'custscript_estadosim'});
        
        let headers1 = [];
         headers1['Content-Type'] = 'text/xml';
         headers1['SOAPAction'] = 'http://tempuri.org/AutenticacionUsuarioPx';
         var raw = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">\r\n  <soap:Header>\r\n    <SeguridadPx xmlns=\"http://tempuri.org/\">\r\n "+     
                    "<StrToken>"+StrToken+"</StrToken>\r\n" +     
                    "<UserName>"+UserName+"</UserName>\r\n"+
                    "<Password>"+Password+"</Password>\r\n"+    
                    "</SeguridadPx>\r\n  </soap:Header>\r\n  <soap:Body>\r\n"+    
                    "<AutenticacionUsuarioPx xmlns=\"http://tempuri.org/\" />\r\n  </soap:Body>\r\n</soap:Envelope>";

        const resp = https.post({
           url: "https://www2.huntermonitoreo.com/API_PX/WSPX.asmx?op=AutenticacionUsuarioPx",
           headers: headers1,
            body: raw
        });
       var xmlDoc = resp.body;
       const regex = /.*<AutenticacionUsuarioPxResult>(.*)<\/AutenticacionUsuarioPxResult>.*/;
       let rowXml = "<Ordenes><Orden><NumeroOrden>"+NumeroOrden+"</NumeroOrden><UsuarioIngreso>"+UsuarioIngreso+"</UsuarioIngreso>"+
                    "<OperacionOrden>"+OperacionOrden+"</OperacionOrden>"+
                    "<NombreEjecutiva>PIERINA GOMEZ</NombreEjecutiva>"+
                    "<Vehiculo>"+
                    "<Placa>BXB-519</Placa>"+
                    "<IdMarca>033</IdMarca>"+
                    "<DescMarca>HYUNDAI</DescMarca>"+
                    "<IdModelo>029</IdModelo>"+
                    "<DescModelo>H-1 MINI BUS</DescModelo>"+
                    "<CodigoVehiculo>1101255207</CodigoVehiculo>"+
                    "<Chasis>KMJWA37KAMU192089</Chasis>"+
                    "<Motor>D4CBM212841</Motor>"+
                    "<Color>ROJO</Color>"+
                    "<Anio>2021</Anio>"+
                    "<Tipo>AUTO</Tipo>"+
                    "</Vehiculo>"+
                    "<Dispositivo>"+
                    "<Vid>2021031119</Vid>"+
                    "<IdProducto>7809</IdProducto>"+
                    "<DescProducto>REINSTALACION GPS GM</DescProducto>"+
                    "<CodMarcaDispositivo>007</CodMarcaDispositivo>"+
                    "<MarcaDispositivo>CALAMP</MarcaDispositivo>"+
                    "<CodModeloDispositivo>030</CodModeloDispositivo>"+
                    "<ModeloDispositivo>LMU-2640</ModeloDispositivo>"+
                    "<Sn>4635224500</Sn>"+
                    "<Imei>014776002419017</Imei>"+
                    "<NumeroCamaras>0</NumeroCamaras>"+
                    "<DireccionMac>20:21:03:11:19</DireccionMac>"+
                    "<Icc>014776002419017</Icc>"+
                    "<NumeroCelular>8934071100297737540</NumeroCelular>"+
                    "<Operadora>SMART</Operadora>"+
                    "<EstadoSim>ACT</EstadoSim>"+
                    "<ServiciosInstalados>"+
                    "<Servicio>"+
                    "<CodServicio>001</CodServicio>"+
                    "<DescripcionServicio>SERVICIO1</DescripcionServicio>"+
                    "<FechaInicioServicio>2022-09-01</FechaInicioServicio>"+
                    "<FechaFinServicio>2024-09-01</FechaFinServicio>"+
                    "<EstadoServicio>ACTIVO</EstadoServicio>"+
                    "</Servicio>"+
                    "</ServiciosInstalados>"+
                    "<OperacionDispositivo>C</OperacionDispositivo>"+
                    "<VidAnterior>2021031118</VidAnterior></Dispositivo><Propietario><IdentificadorPropietario>43576409</IdentificadorPropietario><NombrePropietario>ROLANDO</NombrePropietario><ApellidosPropietario>ZAMUDIO DE LA CRUZ</ApellidosPropietario><DireccionPropietario>SURCO</DireccionPropietario><ConvencionalPropietario>43576409</ConvencionalPropietario><CelularPropietario>989046299</CelularPropietario><EmailPropietario>rzamud@hunterlojak.com</EmailPropietario></Propietario><Monitor><IdentificadorMonitorea>43576409</IdentificadorMonitorea><NombreMonitorea>ROLANDO</NombreMonitorea><ApellidosMonitorea>ZAMUDIO DE LA CRUZ</ApellidosMonitorea><DireccionMonitorea>SURCO</DireccionMonitorea><ConvencionalMonitorea>43576409</ConvencionalMonitorea><CelularMonitorea>989046299</CelularMonitorea><EmailMonitorea>rzamud@hunterlojak.com</EmailMonitorea></Monitor><Concesionario><IdentificadorConcesionario>20519033233</IdentificadorConcesionario><RazonSocialConcesionario>MOTOR MUNDO SA</RazonSocialConcesionario><DireccionConcesionario>Av anfgamos este 1559 dpt a 1904</DireccionConcesionario><ConvencionalConcesionario>20519033233</ConvencionalConcesionario><CelularConcesionario>989046299</CelularConcesionario><EmailConcesionario>rzamud@hunterlojak.com</EmailConcesionario></Concesionario><Financiera><IdentificadorFinanciera>9980000000004</IdentificadorFinanciera><RazonSocialFinanciera>SIN FINANCIERA</RazonSocialFinanciera><DireccionFinanciera>Av anfgamos este 1559 dpt a 1904</DireccionFinanciera><ConvencionalFinanciera>9980000000004</ConvencionalFinanciera><CelularFinanciera>989046299</CelularFinanciera><EmailFinanciera>rzamud@hunterlojak.com</EmailFinanciera></Financiera><Aseguradora><IdentificadorAseguradora>9980000000004</IdentificadorAseguradora><RazonSocialAseguradora>SIN ASEGURADORA</RazonSocialAseguradora><DireccionAseguradora>Av anfgamos este 1559 dpt a 1904</DireccionAseguradora><ConvencionalAseguradora>9980000000004</ConvencionalAseguradora><CelularAseguradora>989046299</CelularAseguradora><EmailAseguradora>rzamud@hunterlojak.com</EmailAseguradora></Aseguradora><Convenio><IdentificadorConvenio>9980000000004</IdentificadorConvenio><RazonSocialConvenio>SIN CONVENIO</RazonSocialConvenio><DireccionConvenio>Av anfgamos este 1559 dpt a 1904</DireccionConvenio><ConvencionalConvenio>9980000000004</ConvencionalConvenio><CelularConvenio>989046299</CelularConvenio><EmailConvenio>rzamud@hunterlojak.com</EmailConvenio></Convenio></Orden></Ordenes>";
        let string = xmlDoc.replace(regex, '$1');
        let headers2 = [];
         headers2['Content-Type'] = 'text/xml';
         headers2['SOAPAction'] = 'http://tempuri.org/InsertaOrden';
         headers2['Authorization'] = 'Bearer 2bbca8dd-81ca-4de8-ae3e-3f212286cafe';
        var rawInsert = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\r\n<soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">\r\n"+    
                        "<soap:Header>\r\n  "+      
                        "<SeguridadPx xmlns=\"http://tempuri.org/\">\r\n"+            
                        "<StrToken>"+StrToken+"</StrToken>\r\n"+            
                        "<AutenticacionToken>"+string+"</AutenticacionToken>\r\n"+            
                        "<UserName>"+UserName+"</UserName>\r\n"+            
                        "<Password>"+Password+"</Password>\r\n"+        
                        "</SeguridadPx>\r\n"+  
                        "</soap:Header>\r\n"+  
                        "<soap:Body>\r\n"+    
                        "<InsertaOrden xmlns=\"http://tempuri.org/\">\r\n"+    
                        "<strXml>\r\n"+     
                        "<![CDATA[\r\n"+ 
                        rowXml+"\r\n"+     
                        "]]>\r\n"+
                        "</strXml>\r\n" + 
                        "</InsertaOrden>\r\n"+  
                        "</soap:Body>\r\n"+
                        "</soap:Envelope>";
            const resp2 = https.post({
                            url: "https://www2.huntermonitoreo.com/API_PX/WSPX.asmx?op=InsertaOrden",
                            headers: headers2,
                             body: rawInsert
        });
  
        const regex2 = /.*<string>(.*)<\/string>.*/;
        let Respon = resp2.body.replace(regex2, '$1');
        log.debug("resp-code",Respon);

    }

    function map(context) {
        
    }

    function reduce(context) {
        
    }

    function summarize(summary) {
        
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    }
});
