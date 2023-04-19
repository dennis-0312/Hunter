/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
 define(['N/log','N/https', 'N/encode','N/task'], function(log,https,encode,task) {
    function _post(context) {
        /*let mapReduceScript = task.create({ taskType: task.TaskType.MAP_REDUCE });
        mapReduceScript.scriptId = 'customscript_ts_mr_px_admin';
        mapReduceScript.deploymentId = 'customdeploy_ts_mr_px_admin';
        mapReduceScript.params = {
            'custscript_strtoken': 'SH2PX20230220',
            'custscript_username': 'PxPrTest',
            'custscript_password': 'PX12%09#w',
            'custscript_numeroorden': '1101895503',
            'custscript_usuarioingreso': 'PRUEBAEVOL',
            'custscript_operacionorden': '001'

        };
        let mapReduceTaskId = mapReduceScript.submit();
       
       
    
       return true;*/
       let headers1 = [];
       headers1['Content-Type'] = 'text/xml';
       headers1['SOAPAction'] = 'http://tempuri.org/AutenticacionUsuarioPx';
       var raw = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">\r\n  <soap:Header>\r\n    <SeguridadPx xmlns=\"http://tempuri.org/\">\r\n "+     
                  "<StrToken>"+context.StrToken+"</StrToken>\r\n" +     
                  "<UserName>"+context.UserName+"</UserName>\r\n"+
                  "<Password>"+context.Password+"</Password>\r\n"+    
                  "</SeguridadPx>\r\n  </soap:Header>\r\n  <soap:Body>\r\n"+    
                  "<AutenticacionUsuarioPx xmlns=\"http://tempuri.org/\" />\r\n  </soap:Body>\r\n</soap:Envelope>";

        const resp = https.post({
            url: "https://www2.huntermonitoreo.com/API_PX/WSPX.asmx?op=AutenticacionUsuarioPx",
            headers: headers1,
            body: raw
        });
        var xmlDoc = resp.body;
      log.debug('raw',raw);
        const regex = /.*<AutenticacionUsuarioPxResult>(.*)<\/AutenticacionUsuarioPxResult>.*/;
        let rowXml = "<Ordenes><Orden><NumeroOrden>"+context.NumeroOrden+"</NumeroOrden><UsuarioIngreso>"+context.UsuarioIngreso+"</UsuarioIngreso>"+
                    "<OperacionOrden>"+context.OperacionOrden+"</OperacionOrden>"+
                    "<NombreEjecutiva>"+context.NombreEjecutiva+"</NombreEjecutiva>"+
                    "<Vehiculo>"+
                    "<Placa>"+context.Placa+"</Placa>"+
                    "<IdMarca>"+context.IdMarca+"</IdMarca>"+
                    "<DescMarca>"+context.DescMarca+"</DescMarca>"+
                    "<IdModelo>"+context.IdModelo+"</IdModelo>"+
                    "<DescModelo>"+context.DescModelo+"</DescModelo>"+
                    "<CodigoVehiculo>"+context.CodigoVehiculo+"</CodigoVehiculo>"+
                    "<Chasis>"+context.Chasis+"</Chasis>"+
                    "<Motor>"+context.Motor+"</Motor>"+
                    "<Color>"+context.Color+"</Color>"+
                    "<Anio>"+context.Anio+"</Anio>"+
                    "<Tipo>"+context.Tipo+"</Tipo>"+
                    "</Vehiculo>"+
                    "<Dispositivo>"+
                    "<Vid>"+context.Vid+"</Vid>"+
                    "<IdProducto>"+context.IdProducto+"</IdProducto>"+
                    "<DescProducto>"+context.DescProducto+"</DescProducto>"+
                    "<CodMarcaDispositivo>"+context.CodMarcaDispositivo+"</CodMarcaDispositivo>"+
                    "<MarcaDispositivo>"+context.MarcaDispositivo+"</MarcaDispositivo>"+
                    "<CodModeloDispositivo>"+context.CodModeloDispositivo+"</CodModeloDispositivo>"+
                    "<ModeloDispositivo>"+context.ModeloDispositivo+"</ModeloDispositivo>"+
                    "<Sn>"+context.Sn+"</Sn>"+
                    "<Imei>"+context.Imei+"</Imei>"+
                    "<NumeroCamaras>"+context.NumeroCamaras+"</NumeroCamaras>"+
                    "<DireccionMac>"+context.DireccionMac+"</DireccionMac>"+
                    "<Icc>"+context.Icc+"</Icc>"+
                    "<NumeroCelular>"+context.NumeroCelular+"</NumeroCelular>"+
                    "<Operadora>"+context.Operadora+"</Operadora>"+
                    "<EstadoSim>"+context.EstadoSim+"</EstadoSim>"+
                    "<ServiciosInstalados>"+
                    "</ServiciosInstalados>"+
                    "<OperacionDispositivo>"+context.OperacionDispositivo+"</OperacionDispositivo>"+
                    "<VidAnterior>"+context.VidAnterior+"</VidAnterior>"+
                    "</Dispositivo>"+
                    "<Propietario>"+
                    "<IdentificadorPropietario>"+context.IdentificadorPropietario+"</IdentificadorPropietario>"+
                    "<NombrePropietario>"+context.NombrePropietario+"</NombrePropietario>"+
                    "<ApellidosPropietario>"+context.ApellidosPropietario+"</ApellidosPropietario>"+
                    "<DireccionPropietario>"+context.DireccionPropietario+"</DireccionPropietario>"+
                    "<ConvencionalPropietario>"+context.ConvencionalPropietario+"</ConvencionalPropietario>"+
                    "<CelularPropietario>"+context.CelularPropietario+"</CelularPropietario>"+
                    "<EmailPropietario>"+context.EmailPropietario+"</EmailPropietario>"+
                    "</Propietario>"+
                    "<Monitor>"+
                    "<IdentificadorMonitorea>"+context.IdentificadorMonitorea+"</IdentificadorMonitorea>"+
                    "<NombreMonitorea>"+context.NombreMonitorea+"</NombreMonitorea>"+
                    "<ApellidosMonitorea>"+context.ApellidosMonitorea+"</ApellidosMonitorea>"+
                    "<DireccionMonitorea>"+context.DireccionMonitorea+"</DireccionMonitorea>"+
                    "<ConvencionalMonitorea>"+context.ConvencionalMonitorea+"</ConvencionalMonitorea>"+
                    "<CelularMonitorea>"+context.CelularMonitorea+"</CelularMonitorea>"+
                    "<EmailMonitorea>"+context.EmailMonitorea+"</EmailMonitorea>"+
                    "</Monitor>"+
                    "<Concesionario>"+
                    "<IdentificadorConcesionario>"+context.IdentificadorConcesionario+"</IdentificadorConcesionario>"+
                    "<RazonSocialConcesionario>"+context.RazonSocialConcesionario+"</RazonSocialConcesionario>"+
                    "<DireccionConcesionario>"+context.DireccionConcesionario+"</DireccionConcesionario>"+
                    "<ConvencionalConcesionario>"+context.ConvencionalConcesionario+"</ConvencionalConcesionario>"+
                    "<CelularConcesionario>"+context.CelularConcesionario+"</CelularConcesionario>"+
                    "<EmailConcesionario>"+context.EmailConcesionario+"</EmailConcesionario>"+
                    "</Concesionario>"+
                    "<Financiera>"+
                    "<IdentificadorFinanciera>"+context.IdentificadorFinanciera+"</IdentificadorFinanciera>"+
                    "<RazonSocialFinanciera>"+context.RazonSocialFinanciera+"</RazonSocialFinanciera>"+
                    "<DireccionFinanciera>"+context.DireccionFinanciera+"</DireccionFinanciera>"+
                    "<ConvencionalFinanciera>"+context.ConvencionalFinanciera+"</ConvencionalFinanciera>"+
                    "<CelularFinanciera>"+context.CelularFinanciera+"</CelularFinanciera>"+
                    "<EmailFinanciera>"+context.EmailFinanciera+"</EmailFinanciera>"+
                    "</Financiera>"+
                    "<Aseguradora>"+
                    "<IdentificadorAseguradora>"+context.IdentificadorAseguradora+"</IdentificadorAseguradora>"+
                    "<RazonSocialAseguradora>"+context.RazonSocialAseguradora+"</RazonSocialAseguradora>"+
                    "<DireccionAseguradora>"+context.DireccionAseguradora+"</DireccionAseguradora>"+
                    "<ConvencionalAseguradora>"+context.ConvencionalAseguradora+"</ConvencionalAseguradora>"+
                    "<CelularAseguradora>"+context.CelularAseguradora+"</CelularAseguradora>"+
                    "<EmailAseguradora>"+context.EmailAseguradora+"</EmailAseguradora>"+
                    "</Aseguradora>"+
                    "<Convenio>"+
                    "<IdentificadorConvenio>"+context.IdentificadorConvenio+"</IdentificadorConvenio>"+
                    "<RazonSocialConvenio>"+context.RazonSocialConvenio+"</RazonSocialConvenio>"+
                    "<DireccionConvenio>"+context.DireccionConvenio+"</DireccionConvenio>"+
                    "<ConvencionalConvenio>"+context.ConvencionalConvenio--+"</ConvencionalConvenio>"+
                    "<CelularConvenio>"+context.VidAnterior+"</CelularConvenio>"+
                    "<EmailConvenio>"+context.VidAnterior+"</EmailConvenio></Convenio></Orden></Ordenes>";
       
        let string = xmlDoc.replace(regex, '$1');
      log.debug('string',string);
        let headers2 = [];
         headers2['Content-Type'] = 'text/xml';
         headers2['SOAPAction'] = 'http://tempuri.org/InsertaOrden';
         headers2['Authorization'] = 'Bearer 2bbca8dd-81ca-4de8-ae3e-3f212286cafe';
        var rawInsert = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\r\n<soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">\r\n"+    
                        "<soap:Header>\r\n  "+      
                        "<SeguridadPx xmlns=\"http://tempuri.org/\">\r\n"+            
                        "<StrToken>"+context.StrToken+"</StrToken>\r\n"+            
                        "<AutenticacionToken>"+string+"</AutenticacionToken>\r\n"+            
                        "<UserName>"+context.UserName+"</UserName>\r\n"+            
                        "<Password>"+context.Password+"</Password>\r\n"+        
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
        
        return Respon;
       
     }
    function Vehiculo(Vehiculo){
        var raw = "<Vehiculo>";
            raw = Vehiculo.Placa ? "<Placa>"+Vehiculo.Placa+"</Placa>" : "<placa/>";
            raw = Vehiculo.IdMarca ? "<IdMarca>"+Vehiculo.IdMarca+"</IdMarca>" : "<IdMarca/>";
            raw = Vehiculo.DescMarca ? "<DescMarca>"+Vehiculo.DescMarca+"</DescMarca>" : "<DescMarca/>";
            raw = Vehiculo.CodigoVehiculo ? "<CodigoVehiculo>"+Vehiculo.CodigoVehiculo+"</CodigoVehiculo>" : "<CodigoVehiculo/>";
            raw = Vehiculo.Chasis ? "<Chasis>"+Vehiculo.Chasis+"</Chasis>" : "<Chasis/>";
            raw = Vehiculo.Motor ? "<Motor>"+Vehiculo.Motor+"</Motor>" : "<Motor/>";
            raw = Vehiculo.Color ? "<Color>"+Vehiculo.Color+"</Color>" : "<Color/>";
            raw = Vehiculo.Anio ? "<Anio>"+Vehiculo.Anio+"</Anio>" : "<Anio/>";
            raw = Vehiculo.Tipo ? "<Tipo>"+Vehiculo.Tipo+"</Tipo>" : "<Tipo/>";
            raw = "</Vehiculo>";         
         return  raw;                                     
    }
    function Dispositivo(Dispositivo){
        var raw = "<Dispositivo>";
            raw = Dispositivo.Vid ? "<Vid>"+Dispositivo.Vid+"</Vid>" : "<Vid/>";
            raw = Dispositivo.IdProducto ? "<IdProducto>"+Dispositivo.IdProducto+"</IdProducto>" : "<IdProducto/>";
            raw = Dispositivo.DescProducto ? "<DescProducto>"+Dispositivo.DescProducto+"</DescProducto>" : "<DescProducto/>";
            raw = Dispositivo.CodMarcaDispositivo ? "<CodMarcaDispositivo>"+Dispositivo.CodMarcaDispositivo+"</CodMarcaDispositivo>" : "<CodMarcaDispositivo/>";
            raw = Dispositivo.MarcaDispositivo ? "<MarcaDispositivo>"+Dispositivo.MarcaDispositivo+"</MarcaDispositivo>" : "<MarcaDispositivo/>";
            raw = Dispositivo.CodModeloDispositivo ? "<CodModeloDispositivo>"+Dispositivo.CodModeloDispositivo+"</CodModeloDispositivo>" : "<CodModeloDispositivo/>";
            raw = Dispositivo.ModeloDispositivo ? "<ModeloDispositivo>"+Dispositivo.ModeloDispositivo+"</ModeloDispositivo>" : "<ModeloDispositivo/>";
            raw = Dispositivo.Sn ? "<Sn>"+Dispositivo.Sn+"</Sn>" : "<Sn/>";
            raw = Dispositivo.Imei ? "<Imei>"+Dispositivo.Imei+"</Imei>" : "<Imei/>";
            raw = Dispositivo.NumeroCamaras ? "<NumeroCamaras>"+Dispositivo.NumeroCamaras+"</NumeroCamaras>" : "<NumeroCamaras/>";
            raw = Dispositivo.DireccionMac ? "<DireccionMac>"+Dispositivo.DireccionMac+"</DireccionMac>" : "<DireccionMac/>";
            raw = Dispositivo.Icc ? "<Icc>"+Dispositivo.Icc+"</Icc>" : "<Icc/>";
            raw = Dispositivo.NumeroCelular ? "<NumeroCelular>"+Dispositivo.NumeroCelular+"</NumeroCelular>" : "<NumeroCelular/>";
            raw = Dispositivo.Operadora ? "<Operadora>"+Dispositivo.Operadora+"</Operadora>" : "<Operadora/>";
            raw = Dispositivo.EstadoSim ? "<EstadoSim>"+Dispositivo.EstadoSim+"</EstadoSim>" : "<EstadoSim/>";
            raw = "<ServiciosInstalados><Servicio>";
            raw = Dispositivo.ServiciosInstalados.CodServicio ? "<CodServicio>"+Dispositivo.ServiciosInstalados.CodServicio+"</CodServicio>" : "<CodServicio/>";
            raw = Dispositivo.ServiciosInstalados.DescripcionServicio ? "<DescripcionServicio>"+Dispositivo.ServiciosInstalados.DescripcionServicio+"</DescripcionServicio>" : "<DescripcionServicio/>";
            raw = Dispositivo.ServiciosInstalados.FechaInicioServicio ? "<FechaInicioServicio>"+Dispositivo.ServiciosInstalados.FechaInicioServicio+"</FechaInicioServicio>" : "<FechaInicioServicio/>";
            raw = Dispositivo.ServiciosInstalados.FechaFinServicio ? "<FechaFinServicio>"+Dispositivo.ServiciosInstalados.FechaFinServicio+"</FechaFinServicio>" : "<FechaInicioServicio/>";
            raw = Dispositivo.ServiciosInstalados.EstadoServicio ? "<EstadoServicio>"+Dispositivo.ServiciosInstalados.EstadoServicio+"</EstadoServicio>" : "<FechaInicioServicio/>";
            raw = "</Servicio></ServiciosInstalados>";
            raw = "</Dispositivo>";       
         return  raw;                                     
    }
    function Propietario(Propietario){
        var raw = "<Propietario>"+
                        "<IdentificadorPropietario>"+Propietario.IdentificadorPropietario+"</IdentificadorPropietario>\r\n"+
                        "<NombrePropietario>"+Propietario.NombrePropietario+"</NombrePropietario>\r\n"+
                        "<ApellidosPropietario>"+Propietario.ApellidosPropietario+"</ApellidosPropietario>\r\n"+
                        "<DireccionPropietario>"+Propietario.DireccionPropietario+"</DireccionPropietario>\r\n"+
                        "<ConvencionalPropietario>"+Propietario.ConvencionalPropietario+"</ConvencionalPropietario>\r\n"+
                        "<CelularPropietario>"+Propietario.CelularPropietario+"</CelularPropietario>\r\n"+
                        "<EmailPropietario>"+Propietario.EmailPropietario+"</EmailPropietario>\r\n"+
                    "</Propietario>";     
         return  raw;                                     
    }
    function Monitor(Monitor){
        var raw = "<Monitor>\r\n"+
                        "<IdentificadorMonitorea>"+Monitor.IdentificadorMonitorea+"</IdentificadorMonitorea>\r\n"+
                        "<NombreMonitorea>"+Monitor.NombreMonitorea+"</NombreMonitorea>\r\n"+
                        "<ApellidosMonitorea>"+Monitor.ApellidosMonitorea+"</ApellidosMonitorea>\r\n"+
                        "<DireccionMonitorea>"+Monitor.DireccionMonitorea+"</DireccionMonitorea>\r\n"+
                        "<ConvencionalMonitorea>"+Monitor.ConvencionalMonitorea+"</ConvencionalMonitorea>\r\n"+
                        "<CelularMonitorea>"+Monitor.CelularMonitorea+"</CelularMonitorea>\r\n"+
                        "<EmailMonitorea>"+Monitor.EmailMonitorea+"</EmailMonitorea>\r\n"+
                    "</Monitor>";   
         return  raw;                                     
    }
    function Concesionario(Concesionario){
        var raw = "<Concesionario>\r\n"+
                        "<IdentificadorConcesionario>"+Concesionario.IdentificadorConcesionario+"</IdentificadorConcesionario>\r\n"+
                        "<RazonSocialConcesionario>"+Concesionario.RazonSocialConcesionario+"</RazonSocialConcesionario>\r\n"+
                        "<DireccionConcesionario>"+Concesionario.DireccionConcesionario+"</DireccionConcesionario>\r\n"+
                        "<ConvencionalConcesionario>"+Concesionario.ConvencionalConcesionario+"</ConvencionalConcesionario>\r\n"+
                        "<CelularConcesionario>"+Concesionario.CelularConcesionario+"</CelularConcesionario>\r\n"+
                        "<EmailConcesionario/>\r\n"+
                    "</Concesionario>"; 
         return  raw;                                     
    }
    function Convenio(Convenio){
        var raw =  "<Convenio>\r\n"+
                        "<IdentificadorConvenio>"+Convenio.IdentificadorConvenio+"</IdentificadorConvenio>\r\n"+
                        "<RazonSocialConvenio>"+Convenio.RazonSocialConvenio+"</RazonSocialConvenio>\r\n"+
                        "<DireccionConvenio>"+Convenio.DireccionConvenio+"</DireccionConvenio>\r\n"+
                        "<ConvencionalConvenio>"+Convenio.ConvencionalConvenio+"</ConvencionalConvenio>\r\n"+
                        "<CelularConvenio>"+Convenio.CelularConvenio+"</CelularConvenio>\r\n"+
                        "<EmailConvenio></EmailConvenio>\r\n"+
                    "</Convenio>";
         return  raw;                                     
    }
   return {
     post : _post
   }
});