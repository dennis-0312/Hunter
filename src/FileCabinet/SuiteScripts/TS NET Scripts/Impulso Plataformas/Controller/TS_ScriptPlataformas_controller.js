/**
 * @NApiVersion 2.1
 */
define(['N/log', 'N/search', 'N/record', 'N/https', 'N/url'],
    (log, search, record, https, url) => {
        let myRestletHeaders = new Array();
        myRestletHeaders['Accept'] = '*/*';
        myRestletHeaders['Content-Type'] = 'application/json';
        var date = new Date();
        var dd = date.getDate();
        var mm = date.getMonth() + 1; //January is 0!
        var yyyy = date.getFullYear();
        mm = mm < 10 ? '0' + mm : mm;
        dd = dd < 10 ? '0' + dd : dd;
        const OPERACION_ORDEN_INSTALACION = "001"; // Instalación
        const OPERACION_ORDEN_DESINSTALACION = "002"; // Desinstalación
        const OPERACION_ORDEN_REINSTALACION = "003"; // Reinstalación
        const OPERACION_ORDEN_RENOVACION = "004"; // Renovación
        const OPERACION_ORDEN_MODIFICACION = "005";
        const OPERACION_ORDEN_MANTENIMIENTO_CHEQUEO = "006";
        const OPERACION_ORDEN_CHEQUEO_COMPONENTES = "007";
        const OPERACION_ORDEN_VENTA_SEGUROS = "008";
        const OPERACION_ORDEN_RENOVACION_SEGUROS = "009";
        const OPERACION_ORDEN_CAMBIO_PROPIETARIO = "010";
        const OPERACION_ORDEN_INSTALACION_OTROS_PRODUCTOS = "011";
        const OPERACION_ORDEN_DESINSTALACION_OTROS_PRODUCTOS = "012";
        const OPERACION_ORDEN_CHEQUEO_OTROS_PRODUCTOS = "013";
        const OPERACION_ORDEN_REINSTALACION_OTROS_PRODUCTOS = "014";
        const OPERACION_ORDEN_VENTA_SERVICIOS = "015";
        const OPERACION_ORDEN_ACTUALIZACION_DATOS_PROPIETARIOS = "016";
        const OPERACION_ORDEN_ACTUALIZACION_ESTADOS = "017";
        const OPERACION_ORDEN_REGISTRAR_CANAL = "018";
        const OPERACION_ORDEN_INSTALACION_COMPONENTES = "019";

        const TELEMATIC_OPERACION_DESINSTALACION = "002";

        const getHeaders = () => {
            let headers = [];
            headers['Accept'] = '*/*';
            headers['Content-Type'] = 'application/json';
            return headers;
        };

        const getDateValues = () => {
            let date = new Date();
            let year = date.getFullYear();
            let month = date.getMonth() + 1;
            let day = date.getDate();
            month = month < 10 ? `0${month}` : month;
            day = day < 10 ? `0${day}` : day;
            return { year, month, day };
        }

        const getSalesOrder = (salesOrderId) => {
            let salesOrderValues = search.lookupFields({
                type: search.Type.SALES_ORDER,
                id: salesOrderId,
                columns: ['tranid']
            });
            return salesOrderValues;
        }

        const setAuthenticationValues = (PxAdmin) => {
            let { year, month, day } = getDateValues();

            PxAdmin["StrToken"] = `SH2PX${year}${month}${day}`;
            PxAdmin["UserName"] = `PxPrTest`;
            PxAdmin["Password"] = `PX12%09#w`;
            PxAdmin["UsuarioIngreso"] = `PRUEBAEVOL`;
        }

        const setEmptyFields = (PxAdmin) => {
            setVehiculoEmptyField(PxAdmin);
            setDispositivoEmptyFields(PxAdmin);
            setPropietarioEmptyFields(PxAdmin);
            setMonitorEmptyFields(PxAdmin);
            setConcesionarioEmptyFields(PxAdmin);
            setFinancieraEmptyFields(PxAdmin);
            setAseguradoraEmptyFields(PxAdmin);
            setConvenioEmptyFields(PxAdmin);
        }

        const setVehiculoEmptyField = (PxAdmin) => {
            PxAdmin["Placa"] = "";
            PxAdmin["IdMarca"] = "";
            PxAdmin["DescMarca"] = "";
            PxAdmin["IdModelo"] = "";
            PxAdmin["DescModelo"] = "";
            PxAdmin["CodigoVehiculo"] = "";
            PxAdmin["Chasis"] = "";
            PxAdmin["Motor"] = "";
            PxAdmin["Color"] = "";
            PxAdmin["Anio"] = "";
            PxAdmin["Tipo"] = "";
        }

        const setDispositivoEmptyFields = (PxAdmin) => {
            PxAdmin["Vid"] = "";
            PxAdmin["IdProducto"] = "";
            PxAdmin["DescProducto"] = "";
            PxAdmin["CodMarcaDispositivo"] = "";
            PxAdmin["MarcaDispositivo"] = "";
            PxAdmin["CodModeloDispositivo"] = "";
            PxAdmin["ModeloDispositivo"] = "";
            PxAdmin["Sn"] = "";
            PxAdmin["Imei"] = "";
            PxAdmin["NumeroCamaras"] = "0";
            PxAdmin["DireccionMac"] = "";
            PxAdmin["Icc"] = "";
            PxAdmin["NumeroCelular"] = "";
            PxAdmin["Operadora"] = "";
            PxAdmin["EstadoSim"] = "";
            PxAdmin["ServiciosInstalados"] = "";
            PxAdmin["OperacionDispositivo"] = "";
            PxAdmin["VidAnterior"] = "";
        }

        const setPropietarioEmptyFields = (PxAdmin) => {
            PxAdmin["IdentificadorPropietario"] = "";
            PxAdmin["NombrePropietario"] = "";
            PxAdmin["ApellidosPropietario"] = "";
            PxAdmin["DireccionPropietario"] = "";
            PxAdmin["ConvencionalPropietario"] = "";
            PxAdmin["CelularPropietario"] = "";
            PxAdmin["EmailPropietario"] = "";
        }

        const setMonitorEmptyFields = (PxAdmin) => {
            PxAdmin["IdentificadorMonitorea"] = "";
            PxAdmin["NombreMonitorea"] = "";
            PxAdmin["ApellidosMonitorea"] = "";
            PxAdmin["DireccionMonitorea"] = "";
            PxAdmin["ConvencionalMonitorea"] = "";
            PxAdmin["CelularMonitorea"] = "";
            PxAdmin["EmailMonitorea"] = "";
        }

        const setConcesionarioEmptyFields = (PxAdmin) => {
            PxAdmin["IdentificadorConcesionario"] = "";
            PxAdmin["RazonSocialConcesionario"] = "";
            PxAdmin["DireccionConcesionario"] = "";
            PxAdmin["ConvencionalConcesionario"] = "";
            PxAdmin["CelularConcesionario"] = "";
            PxAdmin["EmailConcesionario"] = "";
        }

        const setFinancieraEmptyFields = (PxAdmin) => {
            PxAdmin["IdentificadorFinanciera"] = "";
            PxAdmin["RazonSocialFinanciera"] = "";
            PxAdmin["RazonSocialFinanciera"] = "";
            PxAdmin["ConvencionalFinanciera"] = "";
            PxAdmin["CelularFinanciera"] = "";
            PxAdmin["EmailFinanciera"] = "";
        }

        const setAseguradoraEmptyFields = (PxAdmin) => {
            PxAdmin["IdentificadorAseguradora"] = "";
            PxAdmin["RazonSocialAseguradora"] = "";
            PxAdmin["DireccionAseguradora"] = "";
            PxAdmin["ConvencionalAseguradora"] = "";
            PxAdmin["CelularAseguradora"] = "";
            PxAdmin["EmailAseguradoras"] = "";
        }

        const setConvenioEmptyFields = (PxAdmin) => {
            PxAdmin["IdentificadorConvenio"] = "";
            PxAdmin["RazonSocialConvenio"] = "";
            PxAdmin["DireccionConvenio"] = "";
            PxAdmin["ConvencionalConvenio"] = "";
            PxAdmin["CelularConvenio"] = "";
            PxAdmin["EmailConvenio"] = "";
        }

        const setSalesOrderValues = (PxAdmin, salesOrderId) => {
            let salesOrder = getSalesOrder(salesOrderId);
            PxAdmin["NumeroOrden"] = salesOrder.tranid;
        }

        const setVehiculoValues = (PxAdmin, vehiculo, operacionOrden) => {
            if (operacionOrden == OPERACION_ORDEN_INSTALACION) {
                PxAdmin["Placa"] = vehiculo.custrecord_ht_bien_placa == "S/P" ? vehiculo.name : vehiculo.custrecord_ht_bien_placa;
                PxAdmin["IdMarca"] = vehiculo.custrecord_ht_bien_marca[0].value.substr(0, 3);
                PxAdmin["DescMarca"] = vehiculo.custrecord_ht_bien_marca[0].text;
                PxAdmin["IdModelo"] = vehiculo.custrecord_ht_bien_modelo[0].value.substr(0, 3);
                PxAdmin["DescModelo"] = vehiculo.custrecord_ht_bien_modelo[0].text;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
                PxAdmin["Chasis"] = vehiculo.custrecord_ht_bien_chasis;
                PxAdmin["Motor"] = vehiculo.custrecord_ht_bien_motor;
                PxAdmin["Color"] = vehiculo.custrecord_ht_bien_colorcarseg[0].text;
                PxAdmin["Anio"] = vehiculo.custrecord_ht_bien_ano;
                PxAdmin["Tipo"] = vehiculo.custrecord_ht_bien_tipoterrestre[0].text;
            } else if (operacionOrden == OPERACION_ORDEN_DESINSTALACION) {
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_REINSTALACION) {
                PxAdmin["IdMarca"] = vehiculo.custrecord_ht_bien_marca[0].value.substr(0, 3);
                PxAdmin["DescMarca"] = vehiculo.custrecord_ht_bien_marca[0].text;
                PxAdmin["IdModelo"] = vehiculo.custrecord_ht_bien_modelo[0].value.substr(0, 3);
                PxAdmin["DescModelo"] = vehiculo.custrecord_ht_bien_modelo[0].text;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_RENOVACION) {
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_MODIFICACION) {
                PxAdmin["IdMarca"] = vehiculo.custrecord_ht_bien_marca[0].value.substr(0, 3);
                PxAdmin["DescMarca"] = vehiculo.custrecord_ht_bien_marca[0].text;
                PxAdmin["IdModelo"] = vehiculo.custrecord_ht_bien_modelo[0].value.substr(0, 3);
                PxAdmin["DescModelo"] = vehiculo.custrecord_ht_bien_modelo[0].text;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_MANTENIMIENTO_CHEQUEO) {
                PxAdmin["IdMarca"] = vehiculo.custrecord_ht_bien_marca[0].value.substr(0, 3);
                PxAdmin["DescMarca"] = vehiculo.custrecord_ht_bien_marca[0].text;
                PxAdmin["IdModelo"] = vehiculo.custrecord_ht_bien_modelo[0].value.substr(0, 3);
                PxAdmin["DescModelo"] = vehiculo.custrecord_ht_bien_modelo[0].text;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_CHEQUEO_COMPONENTES) {
                PxAdmin["IdMarca"] = vehiculo.custrecord_ht_bien_marca[0].value.substr(0, 3);
                PxAdmin["DescMarca"] = vehiculo.custrecord_ht_bien_marca[0].text;
                PxAdmin["IdModelo"] = vehiculo.custrecord_ht_bien_modelo[0].value.substr(0, 3);
                PxAdmin["DescModelo"] = vehiculo.custrecord_ht_bien_modelo[0].text;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_VENTA_SEGUROS) {
                PxAdmin["IdMarca"] = vehiculo.custrecord_ht_bien_marca[0].value.substr(0, 3);
                PxAdmin["DescMarca"] = vehiculo.custrecord_ht_bien_marca[0].text;
                PxAdmin["IdModelo"] = vehiculo.custrecord_ht_bien_modelo[0].value.substr(0, 3);
                PxAdmin["DescModelo"] = vehiculo.custrecord_ht_bien_modelo[0].text;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_RENOVACION_SEGUROS) {
                PxAdmin["IdMarca"] = vehiculo.custrecord_ht_bien_marca[0].value.substr(0, 3);
                PxAdmin["DescMarca"] = vehiculo.custrecord_ht_bien_marca[0].text;
                PxAdmin["IdModelo"] = vehiculo.custrecord_ht_bien_modelo[0].value.substr(0, 3);
                PxAdmin["DescModelo"] = vehiculo.custrecord_ht_bien_modelo[0].text;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_CAMBIO_PROPIETARIO) {
                PxAdmin["IdMarca"] = vehiculo.custrecord_ht_bien_marca[0].value.substr(0, 3);
                PxAdmin["DescMarca"] = vehiculo.custrecord_ht_bien_marca[0].text;
                PxAdmin["IdModelo"] = vehiculo.custrecord_ht_bien_modelo[0].value.substr(0, 3);
                PxAdmin["DescModelo"] = vehiculo.custrecord_ht_bien_modelo[0].text;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_INSTALACION_OTROS_PRODUCTOS) {
                PxAdmin["IdMarca"] = vehiculo.custrecord_ht_bien_marca[0].value.substr(0, 3);
                PxAdmin["DescMarca"] = vehiculo.custrecord_ht_bien_marca[0].text;
                PxAdmin["IdModelo"] = vehiculo.custrecord_ht_bien_modelo[0].value.substr(0, 3);
                PxAdmin["DescModelo"] = vehiculo.custrecord_ht_bien_modelo[0].text;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_DESINSTALACION_OTROS_PRODUCTOS) {
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_CHEQUEO_OTROS_PRODUCTOS) {
                PxAdmin["IdMarca"] = vehiculo.custrecord_ht_bien_marca[0].value.substr(0, 3);
                PxAdmin["DescMarca"] = vehiculo.custrecord_ht_bien_marca[0].text;
                PxAdmin["IdModelo"] = vehiculo.custrecord_ht_bien_modelo[0].value.substr(0, 3);
                PxAdmin["DescModelo"] = vehiculo.custrecord_ht_bien_modelo[0].text;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_REINSTALACION_OTROS_PRODUCTOS) {
                PxAdmin["IdMarca"] = vehiculo.custrecord_ht_bien_marca[0].value.substr(0, 3);
                PxAdmin["DescMarca"] = vehiculo.custrecord_ht_bien_marca[0].text;
                PxAdmin["IdModelo"] = vehiculo.custrecord_ht_bien_modelo[0].value.substr(0, 3);
                PxAdmin["DescModelo"] = vehiculo.custrecord_ht_bien_modelo[0].text;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_VENTA_SERVICIOS) {
                PxAdmin["IdMarca"] = vehiculo.custrecord_ht_bien_marca[0].value.substr(0, 3);
                PxAdmin["DescMarca"] = vehiculo.custrecord_ht_bien_marca[0].text;
                PxAdmin["IdModelo"] = vehiculo.custrecord_ht_bien_modelo[0].value.substr(0, 3);
                PxAdmin["DescModelo"] = vehiculo.custrecord_ht_bien_modelo[0].text;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_ACTUALIZACION_ESTADOS) {
                PxAdmin["IdMarca"] = vehiculo.custrecord_ht_bien_marca[0].value.substr(0, 3);
                PxAdmin["DescMarca"] = vehiculo.custrecord_ht_bien_marca[0].text;
                PxAdmin["IdModelo"] = vehiculo.custrecord_ht_bien_modelo[0].value.substr(0, 3);
                PxAdmin["DescModelo"] = vehiculo.custrecord_ht_bien_modelo[0].text;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_REGISTRAR_CANAL) {
                PxAdmin["Placa"] = vehiculo.custrecord_ht_bien_placa == "S/P" ? vehiculo.name : vehiculo.custrecord_ht_bien_placa;
                PxAdmin["IdMarca"] = vehiculo.custrecord_ht_bien_marca[0].value.substr(0, 3);
                PxAdmin["DescMarca"] = vehiculo.custrecord_ht_bien_marca[0].text;
                PxAdmin["IdModelo"] = vehiculo.custrecord_ht_bien_modelo[0].value.substr(0, 3);
                PxAdmin["DescModelo"] = vehiculo.custrecord_ht_bien_modelo[0].text;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
                PxAdmin["Chasis"] = vehiculo.custrecord_ht_bien_chasis;
                PxAdmin["Motor"] = vehiculo.custrecord_ht_bien_motor;
                PxAdmin["Color"] = vehiculo.custrecord_ht_bien_colorcarseg[0].text;
                PxAdmin["Anio"] = vehiculo.custrecord_ht_bien_ano;
                PxAdmin["Tipo"] = vehiculo.custrecord_ht_bien_tipoterrestre[0].text;
            } else if (operacionOrden == OPERACION_ORDEN_INSTALACION_COMPONENTES) {
                PxAdmin["Placa"] = vehiculo.custrecord_ht_bien_placa == "S/P" ? vehiculo.name : vehiculo.custrecord_ht_bien_placa;
                PxAdmin["IdMarca"] = vehiculo.custrecord_ht_bien_marca[0].value.substr(0, 3);
                PxAdmin["DescMarca"] = vehiculo.custrecord_ht_bien_marca[0].text;
                PxAdmin["IdModelo"] = vehiculo.custrecord_ht_bien_modelo[0].value.substr(0, 3);
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            }
        }

        const setDispositivoValues = (PxAdmin, Dispositivo, operacionOrden, workOrder) => {
            let modelo = Dispositivo.custrecord_ht_mc_modelo[0].text.split(' - ');
            let unidad = Dispositivo.custrecord_ht_mc_unidad[0].text.split(' - ');
            if (operacionOrden == OPERACION_ORDEN_INSTALACION) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["IdProducto"] = Dispositivo.name.substr(0, 5);
                PxAdmin["DescProducto"] = Dispositivo.name;
                PxAdmin["CodMarcaDispositivo"] = modelo[0].substr(0, 3);
                PxAdmin["MarcaDispositivo"] = modelo[1];
                PxAdmin["CodModeloDispositivo"] = unidad[0].substr(0, 3);
                PxAdmin["ModeloDispositivo"] = unidad[1];
                PxAdmin["Sn"] = Dispositivo.custrecord_ht_mc_seriedispositivo[0].text;
                PxAdmin["Imei"] = Dispositivo.custrecord_ht_mc_imei;
                PxAdmin["NumeroCamaras"] = "0";
                PxAdmin["DireccionMac"] = Dispositivo.custrecord_ht_mc_ip;
                PxAdmin["Icc"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                PxAdmin["NumeroCelular"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                PxAdmin["Operadora"] = Dispositivo.custrecord_ht_mc_operadora[0].text;
                PxAdmin["EstadoSim"] = Dispositivo.custrecord_ht_mc_estado[0].text.substr(0, 5);
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_DESINSTALACION) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["OperacionDispositivo"] = "D";
            } else if (operacionOrden == OPERACION_ORDEN_REINSTALACION) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["IdProducto"] = Dispositivo.name.substr(0, 5);
                PxAdmin["DescProducto"] = Dispositivo.name;
                PxAdmin["CodMarcaDispositivo"] = modelo[0].substr(0, 3);
                PxAdmin["MarcaDispositivo"] = modelo[1];
                PxAdmin["CodModeloDispositivo"] = unidad[0].substr(0, 3);
                PxAdmin["ModeloDispositivo"] = unidad[1];
                PxAdmin["Sn"] = Dispositivo.custrecord_ht_mc_seriedispositivo[0].text;
                PxAdmin["Imei"] = Dispositivo.custrecord_ht_mc_imei;
                PxAdmin["NumeroCamaras"] = "0";
                PxAdmin["DireccionMac"] = Dispositivo.custrecord_ht_mc_ip;
                PxAdmin["Icc"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                PxAdmin["NumeroCelular"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                PxAdmin["Operadora"] = Dispositivo.custrecord_ht_mc_operadora[0].text;
                PxAdmin["EstadoSim"] = Dispositivo.custrecord_ht_mc_estado[0].text.substr(0, 5);
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_RENOVACION) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["OperacionDispositivo"] = "A";
            } else if (operacionOrden == OPERACION_ORDEN_MODIFICACION) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["CodMarcaDispositivo"] = modelo[0].substr(0, 3);
                PxAdmin["MarcaDispositivo"] = modelo[1];
                PxAdmin["CodModeloDispositivo"] = unidad[0].substr(0, 3);
                PxAdmin["ModeloDispositivo"] = unidad[1];
                PxAdmin["Sn"] = Dispositivo.custrecord_ht_mc_seriedispositivo[0].text;
                PxAdmin["Imei"] = Dispositivo.custrecord_ht_mc_imei;
                PxAdmin["NumeroCamaras"] = "0";
                PxAdmin["DireccionMac"] = Dispositivo.custrecord_ht_mc_ip;
                PxAdmin["Icc"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                PxAdmin["NumeroCelular"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                PxAdmin["Operadora"] = Dispositivo.custrecord_ht_mc_operadora[0].text;
                PxAdmin["EstadoSim"] = Dispositivo.custrecord_ht_mc_estado[0].text.substr(0, 5);
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_MANTENIMIENTO_CHEQUEO) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["CodMarcaDispositivo"] = modelo[0].substr(0, 3);
                PxAdmin["MarcaDispositivo"] = modelo[1];
                PxAdmin["CodModeloDispositivo"] = unidad[0].substr(0, 3);
                PxAdmin["ModeloDispositivo"] = unidad[1];
                PxAdmin["Sn"] = Dispositivo.custrecord_ht_mc_seriedispositivo[0].text;
                PxAdmin["Imei"] = Dispositivo.custrecord_ht_mc_imei;
                PxAdmin["NumeroCamaras"] = "0";
                PxAdmin["DireccionMac"] = Dispositivo.custrecord_ht_mc_ip;
                PxAdmin["Icc"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                PxAdmin["NumeroCelular"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                PxAdmin["Operadora"] = Dispositivo.custrecord_ht_mc_operadora[0].text;
                PxAdmin["EstadoSim"] = Dispositivo.custrecord_ht_mc_estado[0].text.substr(0, 5);
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_CHEQUEO_COMPONENTES) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["CodMarcaDispositivo"] = modelo[0].substr(0, 3);
                PxAdmin["MarcaDispositivo"] = modelo[1];
                PxAdmin["CodModeloDispositivo"] = unidad[0].substr(0, 3);
                PxAdmin["ModeloDispositivo"] = unidad[1];
                PxAdmin["Sn"] = Dispositivo.custrecord_ht_mc_seriedispositivo[0].text;
                PxAdmin["Imei"] = Dispositivo.custrecord_ht_mc_imei;
                PxAdmin["NumeroCamaras"] = "0";
                PxAdmin["DireccionMac"] = Dispositivo.custrecord_ht_mc_ip;
                PxAdmin["Icc"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                PxAdmin["NumeroCelular"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                PxAdmin["Operadora"] = Dispositivo.custrecord_ht_mc_operadora[0].text;
                PxAdmin["EstadoSim"] = Dispositivo.custrecord_ht_mc_estado[0].text.substr(0, 5);
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_VENTA_SEGUROS) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["CodMarcaDispositivo"] = modelo[0].substr(0, 3);
                PxAdmin["MarcaDispositivo"] = modelo[1];
                PxAdmin["CodModeloDispositivo"] = unidad[0].substr(0, 3);
                PxAdmin["ModeloDispositivo"] = unidad[1];
                PxAdmin["Sn"] = Dispositivo.custrecord_ht_mc_seriedispositivo[0].text;
                PxAdmin["Imei"] = Dispositivo.custrecord_ht_mc_imei;
                PxAdmin["NumeroCamaras"] = "0";
                PxAdmin["DireccionMac"] = Dispositivo.custrecord_ht_mc_ip;
                PxAdmin["Icc"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                PxAdmin["NumeroCelular"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                PxAdmin["Operadora"] = Dispositivo.custrecord_ht_mc_operadora[0].text;
                PxAdmin["EstadoSim"] = Dispositivo.custrecord_ht_mc_estado[0].text.substr(0, 5);
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_RENOVACION_SEGUROS) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["CodMarcaDispositivo"] = modelo[0].substr(0, 3);
                PxAdmin["MarcaDispositivo"] = modelo[1];
                PxAdmin["CodModeloDispositivo"] = unidad[0].substr(0, 3);
                PxAdmin["ModeloDispositivo"] = unidad[1];
                PxAdmin["Sn"] = Dispositivo.custrecord_ht_mc_seriedispositivo[0].text;
                PxAdmin["Imei"] = Dispositivo.custrecord_ht_mc_imei;
                PxAdmin["NumeroCamaras"] = "0";
                PxAdmin["DireccionMac"] = Dispositivo.custrecord_ht_mc_ip;
                PxAdmin["Icc"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                PxAdmin["NumeroCelular"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                PxAdmin["Operadora"] = Dispositivo.custrecord_ht_mc_operadora[0].text;
                PxAdmin["EstadoSim"] = Dispositivo.custrecord_ht_mc_estado[0].text.substr(0, 5);
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_INSTALACION_OTROS_PRODUCTOS) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["CodMarcaDispositivo"] = modelo[0].substr(0, 3);
                PxAdmin["MarcaDispositivo"] = modelo[1];
                PxAdmin["CodModeloDispositivo"] = unidad[0].substr(0, 3);
                PxAdmin["ModeloDispositivo"] = unidad[1];
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_DESINSTALACION_OTROS_PRODUCTOS) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["OperacionDispositivo"] = "D";
            } else if (operacionOrden == OPERACION_ORDEN_CHEQUEO_OTROS_PRODUCTOS) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["CodMarcaDispositivo"] = modelo[0].substr(0, 3);
                PxAdmin["MarcaDispositivo"] = modelo[1];
                PxAdmin["CodModeloDispositivo"] = unidad[0].substr(0, 3);
                PxAdmin["ModeloDispositivo"] = unidad[1];
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_REINSTALACION_OTROS_PRODUCTOS) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["CodMarcaDispositivo"] = modelo[0].substr(0, 3);
                PxAdmin["MarcaDispositivo"] = modelo[1];
                PxAdmin["CodModeloDispositivo"] = unidad[0].substr(0, 3);
                PxAdmin["ModeloDispositivo"] = unidad[1];
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_VENTA_SERVICIOS) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["CodMarcaDispositivo"] = modelo[0].substr(0, 3);
                PxAdmin["MarcaDispositivo"] = modelo[1];
                PxAdmin["CodModeloDispositivo"] = unidad[0].substr(0, 3);
                PxAdmin["ModeloDispositivo"] = unidad[1];
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_ACTUALIZACION_DATOS_PROPIETARIOS) {
                PxAdmin["CodMarcaDispositivo"] = modelo[0].substr(0, 3);
                PxAdmin["MarcaDispositivo"] = modelo[1];
                PxAdmin["CodModeloDispositivo"] = unidad[0].substr(0, 3);
                PxAdmin["ModeloDispositivo"] = unidad[1];
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_ACTUALIZACION_ESTADOS) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["IdProducto"] = Dispositivo.name.substr(0, 5);
                PxAdmin["DescProducto"] = Dispositivo.name;
                PxAdmin["CodMarcaDispositivo"] = modelo[0].substr(0, 3);
                PxAdmin["MarcaDispositivo"] = modelo[1];
                PxAdmin["CodModeloDispositivo"] = unidad[0].substr(0, 3);
                PxAdmin["ModeloDispositivo"] = unidad[1];
                PxAdmin["EstadoSim"] = Dispositivo.custrecord_ht_mc_estado[0].text.substr(0, 5);
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_REGISTRAR_CANAL) {
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_INSTALACION_COMPONENTES) {
                PxAdmin["OperacionDispositivo"] = "I";
                PxAdmin["CodMarcaDispositivo"] = modelo[0].substr(0, 3);
                PxAdmin["MarcaDispositivo"] = modelo[1];
                PxAdmin["CodModeloDispositivo"] = unidad[0].substr(0, 3);
                PxAdmin["ModeloDispositivo"] = unidad[1];
            }
        }

        const setPropietarioValues = (PxAdmin, Propietario, operacionOrden) => {
            if (operacionOrden == OPERACION_ORDEN_INSTALACION) {
                PxAdmin["IdentificadorPropietario"] = Propietario.vatregnumber;
                PxAdmin["NombrePropietario"] = Propietario.custentity_ht_cl_primernombre + ' ' + Propietario.custentity_ht_cl_segundonombre;
                PxAdmin["ApellidosPropietario"] = Propietario.custentity_ht_cl_apellidopaterno + ' ' + Propietario.custentity_ht_cl_apellidomaterno;
                PxAdmin["DireccionPropietario"] = "SURCO";
                PxAdmin["ConvencionalPropietario"] = "43576409";
                PxAdmin["CelularPropietario"] = Propietario.phone;
                PxAdmin["EmailPropietario"] = Propietario.email;
            } else if (operacionOrden == OPERACION_ORDEN_ACTUALIZACION_DATOS_PROPIETARIOS) {
                PxAdmin["IdentificadorPropietario"] = Propietario.vatregnumber;
                PxAdmin["NombrePropietario"] = Propietario.custentity_ht_cl_primernombre + ' ' + Propietario.custentity_ht_cl_segundonombre;
                PxAdmin["ApellidosPropietario"] = Propietario.custentity_ht_cl_apellidopaterno + ' ' + Propietario.custentity_ht_cl_apellidomaterno;
                PxAdmin["DireccionPropietario"] = "LIMA";
                PxAdmin["ConvencionalPropietario"] = "43576409";
                PxAdmin["CelularPropietario"] = Propietario.phone;
                PxAdmin["EmailPropietario"] = Propietario.email;
            } else if (operacionOrden == OPERACION_ORDEN_CAMBIO_PROPIETARIO) {
                PxAdmin["IdentificadorPropietario"] = Propietario.vatregnumber;
                PxAdmin["NombrePropietario"] = Propietario.custentity_ht_cl_primernombre + ' ' + Propietario.custentity_ht_cl_segundonombre;
                PxAdmin["ApellidosPropietario"] = Propietario.custentity_ht_cl_apellidopaterno + ' ' + Propietario.custentity_ht_cl_apellidomaterno;
                PxAdmin["DireccionPropietario"] = "SURCO";
                PxAdmin["ConvencionalPropietario"] = "43576409";
                PxAdmin["CelularPropietario"] = Propietario.phone;
                PxAdmin["EmailPropietario"] = Propietario.email;
            }
        }

        const setMonitoreoValues = (PxAdmin, PropietarioMonitoreo, operacionOrden) => {
            if (operacionOrden == OPERACION_ORDEN_INSTALACION) {
                PxAdmin["IdentificadorMonitorea"] = PropietarioMonitoreo.vatregnumber;
                PxAdmin["NombreMonitorea"] = PropietarioMonitoreo.custentity_ht_cl_primernombre + ' ' + PropietarioMonitoreo.custentity_ht_cl_segundonombre;
                PxAdmin["ApellidosMonitorea"] = PropietarioMonitoreo.custentity_ht_cl_apellidopaterno + ' ' + PropietarioMonitoreo.custentity_ht_cl_apellidomaterno;
                PxAdmin["DireccionMonitorea"] = "SURCO";
                PxAdmin["ConvencionalMonitorea"] = "43576409";
                PxAdmin["CelularMonitorea"] = PropietarioMonitoreo.phone;
                PxAdmin["EmailMonitorea"] = PropietarioMonitoreo.email;
            } else if (operacionOrden == OPERACION_ORDEN_CAMBIO_PROPIETARIO) {
                PxAdmin["IdentificadorMonitorea"] = PropietarioMonitoreo.vatregnumber;
                PxAdmin["NombreMonitorea"] = PropietarioMonitoreo.custentity_ht_cl_primernombre + ' ' + PropietarioMonitoreo.custentity_ht_cl_segundonombre;
                PxAdmin["ApellidosMonitorea"] = PropietarioMonitoreo.custentity_ht_cl_apellidopaterno + ' ' + PropietarioMonitoreo.custentity_ht_cl_apellidomaterno;
                PxAdmin["DireccionMonitorea"] = "SURCO";
                PxAdmin["ConvencionalMonitorea"] = "43576409";
                PxAdmin["CelularMonitorea"] = PropietarioMonitoreo.phone;
                PxAdmin["EmailMonitorea"] = PropietarioMonitoreo.email;
            }
        }

        const setCoberturaValues = (PxAdmin, Cobertura, operacionOrden) => {
            PxAdmin["Servicio"] = [];
            PxAdmin["FechaInicioCobertura"] = "2023-09-18";
            PxAdmin["FechaFinCobertura"] = "2024-09-18";
            PxAdmin["Servicio"].push(
                {
                    "CodServicio": "001",
                    "DescripcionServicio": "SERVICIO01",
                    "FechaInicioServicio": "2023-09-18",
                    "FechaFinServicio": "2024-09-18",
                    "EstadoServicio": "ACTIVO",
                }
            )
        }

        getPropietarioTelematic = (Propietario, operacion) => {
            let customer = {};
            if (operacion == TELEMATIC_OPERACION_DESINSTALACION) {
                customer.id = Propietario.custentity_ht_customer_id_telematic;
            }
            return customer;
        }

        getVehiculoTelematic = (Vehiculo, operacion) => {
            let asset = {};
            if (operacion == TELEMATIC_OPERACION_DESINSTALACION) {
                asset.id = Vehiculo.custrecord_ht_bien_id_telematic;
            }
            return asset;
        }

        getDispositivoTelematic = (Dispositivo, operacion) => {
            let device = {};
            if (operacion == TELEMATIC_OPERACION_DESINSTALACION) {
                device.id = Dispositivo.name;
            }
            return device;
        }

        const obtenerCamposOrdenServicio = (ordenServicioId) => {
            let ordenVenta = record.load({ type: record.Type.SALES_ORDER, id: ordenServicioId });
            let Propietario = obtenerPropietario(ordenVenta.getValue('entity'));
            let vehiculo = obtenerVehiculo(ordenVenta.getValue('custbody_ht_so_bien'));
            let PropietarioMonitoreo = obtenerPropietarioMonitoreo(ordenVenta, null, true);
            return { vehiculo, Propietario, PropietarioMonitoreo, };
        }

        const obtenerCamposOrdenTrabajo = (ordenTrabajoId) => {
            let ordenTrabajo = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
            let Dispositivo = obtenerDispositivo(ordenTrabajo.getValue('custrecord_ht_ot_serieproductoasignacion'));
            let vehiculo = obtenerVehiculo(ordenTrabajo.getValue('custrecord_ht_ot_vehiculo'));
            let Propietario = obtenerPropietario(ordenTrabajo.getValue('custrecord_ht_ot_cliente_id'));
            let PropietarioMonitoreo = obtenerPropietarioMonitoreo(ordenTrabajo.getValue('custrecord_ht_ot_orden_servicio'), ordenTrabajo.getValue('custrecord_ht_ot_item'));
            let Cobertura = obtenerCobertura(ordenTrabajo);
            let pxadminfinalizacion = ordenTrabajo.getValue('custrecord_ht_ot_pxadminfinalizacion');
            let confirmaciontelamatic = ordenTrabajo.getValue('custrecord_ht_ot_confirmaciontelamatic');
            let salesOrderId = ordenTrabajo.getValue('custrecord_ht_ot_orden_servicio');
            return { Dispositivo, vehiculo, Propietario, PropietarioMonitoreo, Cobertura, pxadminfinalizacion, confirmaciontelamatic, salesOrderId };
        }

        const envioPXInstalacionDispositivo = (ordenTrabajoId) => {
            let { Dispositivo, vehiculo, Propietario, PropietarioMonitoreo, Cobertura, pxadminfinalizacion, salesOrderId } = obtenerCamposOrdenTrabajo(ordenTrabajoId);

            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_INSTALACION;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_INSTALACION);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_INSTALACION);
                setPropietarioValues(PxAdmin, Propietario, OPERACION_ORDEN_INSTALACION);
                setMonitoreoValues(PxAdmin, PropietarioMonitoreo, OPERACION_ORDEN_INSTALACION);
                setCoberturaValues(PxAdmin, Cobertura);
                log.error("PxAdmin", PxAdmin);
                let response = sendPXServer(PxAdmin);
                log.error("response", response);
                if (response == 1) {
                    let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                    updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    updatePxadmin.save();
                    pxadminfinalizacion = true;
                }
            }
            if (!pxadminfinalizacion) {
                let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updatePxadmin.save();
                return false;
            }
            return true;
        }

        const envioPXDesinstalacionDispositivo = (ordenTrabajoId) => {
            //const envioPXDesinstalacionDispositivo = (Dispositivo, vehiculo, id) => {
            let { Dispositivo, vehiculo, pxadminfinalizacion, salesOrderId } = obtenerCamposOrdenTrabajo(ordenTrabajoId);

            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_DESINSTALACION;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_DESINSTALACION);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_DESINSTALACION);
                let response = sendPXServer(PxAdmin);
                log.error("PxAdmin", PxAdmin)
                if (response == 1) {
                    let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                    updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    updatePxadmin.save();
                    pxadminfinalizacion = true;
                }
            }
            if (!pxadminfinalizacion) {
                let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updatePxadmin.save();
                return false;
            }
            return true;
        }

        const envioPXReinstalacionDispositivo = (ordenTrabajoId) => {
            let { Dispositivo, vehiculo, Cobertura, pxadminfinalizacion, salesOrderId } = obtenerCamposOrdenTrabajo(ordenTrabajoId);
            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_REINSTALACION;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_REINSTALACION);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_REINSTALACION);
                setCoberturaValues(PxAdmin, Cobertura);
                log.error("PxAdmin", PxAdmin);
                let response = sendPXServer(PxAdmin);
                if (response == 1) {
                    let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                    updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    updatePxadmin.save();
                    pxadminfinalizacion = true;
                }
            }
            if (!pxadminfinalizacion) {
                let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updatePxadmin.save();
                return false;
            }
            return true;
        }

        const envioPXRenovacionDispositivo = (ordenTrabajoId) => {
            let { Dispositivo, vehiculo, pxadminfinalizacion, salesOrderId } = obtenerCamposOrdenTrabajo(ordenTrabajoId);
            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_RENOVACION;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_RENOVACION);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_RENOVACION);
                log.error("PxAdmin", PxAdmin);
                let response = sendPXServer(PxAdmin);
                if (response == 1) {
                    let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                    updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    updatePxadmin.save();
                    pxadminfinalizacion = true;
                }
            }
            if (!pxadminfinalizacion) {
                let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updatePxadmin.save();
                return false;
            }
            return true;
        }

        const envioPXModificacionDispositivo = (ordenTrabajoId) => {
            let { Dispositivo, vehiculo, Cobertura, pxadminfinalizacion, salesOrderId } = obtenerCamposOrdenTrabajo(ordenTrabajoId);

            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_MODIFICACION;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_MODIFICACION);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_MODIFICACION);
                setCoberturaValues(PxAdmin, Cobertura);
                log.error("PxAdmin", PxAdmin);
                let response = sendPXServer(PxAdmin);
                if (response == 1) {
                    let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                    updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    updatePxadmin.save();
                    pxadminfinalizacion = true;
                }
            }
            if (!pxadminfinalizacion) {
                let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updatePxadmin.save();
                return false;
            }
            return true;
        }

        const envioPXMantenimientoChequeoDispositivo = (ordenTrabajoId) => {
            let { Dispositivo, vehiculo, Cobertura, pxadminfinalizacion, salesOrderId } = obtenerCamposOrdenTrabajo(ordenTrabajoId);

            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_MANTENIMIENTO_CHEQUEO;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_MANTENIMIENTO_CHEQUEO);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_MANTENIMIENTO_CHEQUEO);
                setCoberturaValues(PxAdmin, Cobertura);
                log.error("PxAdmin", PxAdmin);
                let response = sendPXServer(PxAdmin);
                if (response == 1) {
                    order.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    order.save();
                    pxadminfinalizacion = true;
                }
            }
            if (!pxadminfinalizacion) {
                let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updateTelematic.save();
                return false;
            }
            return true;
        }

        const envioPXChequeoComponentes = (ordenTrabajoId) => {
            let { Dispositivo, vehiculo, Cobertura, pxadminfinalizacion, salesOrderId } = obtenerCamposOrdenTrabajo(ordenTrabajoId);

            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_CHEQUEO_COMPONENTES;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_CHEQUEO_COMPONENTES);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_CHEQUEO_COMPONENTES);
                setCoberturaValues(PxAdmin, Cobertura);
                log.error("PxAdmin", PxAdmin);
                let response = sendPXServer(PxAdmin);
                if (response == 1) {
                    let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                    updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    updatePxadmin.save();
                    pxadminfinalizacion = true;
                }
            }
            if (!pxadminfinalizacion) {
                let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updatePxadmin.save();
                return false;
            }
            return true;
        }

        const envioPXVentaSeguros = (ordenTrabajoId) => {
            let { Dispositivo, vehiculo, pxadminfinalizacion, salesOrderId } = obtenerCamposOrdenTrabajo(ordenTrabajoId);

            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_VENTA_SEGUROS;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_VENTA_SEGUROS);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_VENTA_SEGUROS);
                setCoberturaValues(PxAdmin, Cobertura);
                log.error("PxAdmin", PxAdmin);
                let response = sendPXServer(PxAdmin);
                if (response == 1) {
                    let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                    updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    updatePxadmin.save();
                    pxadminfinalizacion = true;
                }
            }
            if (!pxadminfinalizacion) {
                let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updatePxadmin.save();
                return false;
            }
            return true;
        }

        const envioPXRenovacionSeguro = (ordenTrabajoId) => {
            let { Dispositivo, vehiculo, Cobertura, pxadminfinalizacion, salesOrderId } = obtenerCamposOrdenTrabajo(ordenTrabajoId);

            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_RENOVACION_SEGUROS;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_RENOVACION_SEGUROS);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_RENOVACION_SEGUROS);
                setCoberturaValues(PxAdmin, Cobertura);
                log.error("PxAdmin", PxAdmin);
                let response = sendPXServer(PxAdmin);
                if (response == 1) {
                    let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                    updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    updatePxadmin.save();
                    pxadminfinalizacion = true;
                }
            }
            if (!pxadminfinalizacion) {
                let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updatePxadmin.save();
                return false;
            }
            return true;
        }

        const envioPXCambioPropietario = (ordenServicioId) => {
            let { vehiculo, Propietario, PropietarioMonitoreo } = obtenerCamposOrdenServicio(ordenServicioId);
            let PxAdmin = {};
            setAuthenticationValues(PxAdmin);
            setSalesOrderValues(PxAdmin, ordenServicioId);
            setEmptyFields(PxAdmin);
            PxAdmin["OperacionOrden"] = OPERACION_ORDEN_CAMBIO_PROPIETARIO;
            setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_CAMBIO_PROPIETARIO);
            setPropietarioValues(PxAdmin, Propietario, OPERACION_ORDEN_CAMBIO_PROPIETARIO);
            setMonitoreoValues(PxAdmin, PropietarioMonitoreo, OPERACION_ORDEN_CAMBIO_PROPIETARIO);
            PxAdmin["OperacionDispositivo"] = "A";
            log.error("PxAdmin", PxAdmin);
            let response = sendPXServer(PxAdmin);
            log.error("envioPXCambioPropietario Response", response);
            return true;
        }

        const envioPXInstalacionOtrosProductos = (ordenTrabajoId) => {
            let { Dispositivo, vehiculo, pxadminfinalizacion, salesOrderId } = obtenerCamposOrdenTrabajo(ordenTrabajoId);

            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_INSTALACION_OTROS_PRODUCTOS;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_INSTALACION_OTROS_PRODUCTOS);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_INSTALACION_OTROS_PRODUCTOS);
                log.error("PxAdmin", PxAdmin);
                let response = sendPXServer(PxAdmin);
                if (response == 1) {
                    order.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    order.save();
                    pxadminfinalizacion = true;
                }
            }
            if (!pxadminfinalizacion) {
                let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updateTelematic.save();
                return false;
            }
            return true;
        }

        const envioPXDesinstalacionOtrosProductos = (ordenTrabajoId) => {
            let { Dispositivo, vehiculo, Cobertura, pxadminfinalizacion, salesOrderId } = obtenerCamposOrdenTrabajo(ordenTrabajoId);

            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_DESINSTALACION_OTROS_PRODUCTOS;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_DESINSTALACION_OTROS_PRODUCTOS);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_DESINSTALACION_OTROS_PRODUCTOS);
                setCoberturaValues(PxAdmin, Cobertura);
                log.error("PxAdmin", PxAdmin);
                let response = sendPXServer(PxAdmin);
                if (response == 1) {
                    let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                    updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    updatePxadmin.save();
                    pxadminfinalizacion = true;
                }
            }
            if (!pxadminfinalizacion) {
                let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updatePxadmin.save();
                return false;
            }
            return true;
        }

        const envioPXChequeoOtrosProductos = (ordenTrabajoId) => {
            let { Dispositivo, vehiculo, Cobertura, pxadminfinalizacion, salesOrderId } = obtenerCamposOrdenTrabajo(ordenTrabajoId);

            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_CHEQUEO_OTROS_PRODUCTOS;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_CHEQUEO_OTROS_PRODUCTOS);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_CHEQUEO_OTROS_PRODUCTOS);
                setCoberturaValues(PxAdmin, Cobertura);
                log.error("PxAdmin", PxAdmin);
                let response = sendPXServer(PxAdmin);
                if (response == 1) {
                    let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                    updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    updatePxadmin.save();
                    pxadminfinalizacion = true;
                }
            }
            if (!pxadminfinalizacion) {
                let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updatePxadmin.save();
                return false;
            }
            return true;
        }

        const envioPXReinstalacionOtrosProductos = (ordenTrabajoId) => {
            let { Dispositivo, vehiculo, Cobertura, pxadminfinalizacion, salesOrderId } = obtenerCamposOrdenTrabajo(ordenTrabajoId);

            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_REINSTALACION_OTROS_PRODUCTOS;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_REINSTALACION_OTROS_PRODUCTOS);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_REINSTALACION_OTROS_PRODUCTOS);
                setCoberturaValues(PxAdmin, Cobertura);
                log.error("PxAdmin", PxAdmin);
                let response = sendPXServer(PxAdmin);
                if (response == 1) {
                    let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                    updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    updatePxadmin.save();
                    pxadminfinalizacion = true;
                }
            }
            if (!pxadminfinalizacion) {
                let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updatePxadmin.save();
                return false;
            }
            return true;
        }

        const envioPXVentaServicios = (ordenTrabajoId) => {
            let { Dispositivo, vehiculo, Cobertura, pxadminfinalizacion, salesOrderId } = obtenerCamposOrdenTrabajo(ordenTrabajoId);

            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_VENTA_SERVICIOS;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_VENTA_SERVICIOS);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_VENTA_SERVICIOS);
                setCoberturaValues(PxAdmin, Cobertura);
                log.error("PxAdmin", PxAdmin);
                let response = sendPXServer(PxAdmin);
                if (response == 1) {
                    let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                    updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    updatePxadmin.save();
                    pxadminfinalizacion = true;
                }
            }
            if (!pxadminfinalizacion) {
                let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updatePxadmin.save();
                return false;
            }
            return true;
        }

        const envioPXActualizacionDatosPropietario = (ordenTrabajoId) => {
            let { Dispositivo, Propietario, pxadminfinalizacion, salesOrderId } = obtenerCamposOrdenTrabajo(ordenTrabajoId);

            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_ACTUALIZACION_DATOS_PROPIETARIOS;
                //setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_ACTUALIZACION_DATOS_PROPIETARIOS);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_ACTUALIZACION_DATOS_PROPIETARIOS);
                setPropietarioValues(PxAdmin, Propietario, OPERACION_ORDEN_ACTUALIZACION_DATOS_PROPIETARIOS);
                log.error("PxAdmin", PxAdmin);
                let response = sendPXServer(PxAdmin);
                log.error("response", response);
                if (response == 1) {
                    let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                    updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    updatePxadmin.save();
                    pxadminfinalizacion = true;
                }
            }
            if (!pxadminfinalizacion) {
                let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updatePxadmin.save();
                return false;
            }
            return true;
        }

        const envioPXActualizacionEstado = (ordenTrabajoId) => {
            let { Dispositivo, vehiculo, pxadminfinalizacion, salesOrderId } = obtenerCamposOrdenTrabajo(ordenTrabajoId);

            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_ACTUALIZACION_ESTADOS;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_ACTUALIZACION_ESTADOS);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_ACTUALIZACION_ESTADOS);
                log.error("PxAdmin", PxAdmin);
                let response = sendPXServer(PxAdmin);
                if (response == 1) {
                    let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                    updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    updatePxadmin.save();
                    pxadminfinalizacion = true;
                }
            }
            if (!pxadminfinalizacion) {
                let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updatePxadmin.save();
                return false;
            }
            return true;
        }

        const envioPXRegistrarCanal = (ordenTrabajoId) => {
            let { Dispositivo, vehiculo, pxadminfinalizacion, salesOrderId } = obtenerCamposOrdenTrabajo(ordenTrabajoId);

            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_REGISTRAR_CANAL;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_REGISTRAR_CANAL);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_ACTUALIZACION_ESTADOS);
                log.error("PxAdmin", PxAdmin);
                let response = sendPXServer(PxAdmin);
                if (response == 1) {
                    let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                    updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    updatePxadmin.save();
                    pxadminfinalizacion = true;
                }
            }
            if (!pxadminfinalizacion) {
                let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updatePxadmin.save();
                return false;
            }
            return true;
        }

        const envioPXInstalacionComponentes = (ordenTrabajoId) => {
            let { Dispositivo, vehiculo, Cobertura, pxadminfinalizacion, salesOrderId } = obtenerCamposOrdenTrabajo(ordenTrabajoId);

            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_INSTALACION_COMPONENTES;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_INSTALACION_COMPONENTES);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_INSTALACION_COMPONENTES);
                setCoberturaValues(PxAdmin, Cobertura);
                log.error("PxAdmin", PxAdmin);
                let response = sendPXServer(PxAdmin);
                if (response == 1) {
                    let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                    updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    updatePxadmin.save();
                    pxadminfinalizacion = true;
                }
            }
            if (!pxadminfinalizacion) {
                let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updatePxadmin.save();
                return false;
            }
            return true;
        }

        const envioTelematicInstalacionNueva = (ordenTrabajoId) => {
            let { Dispositivo, vehiculo, Propietario, confirmaciontelamatic, salesOrderId } = obtenerCamposOrdenTrabajo(ordenTrabajoId);
            if (!confirmaciontelamatic) {

            }
        }

        const envioTelecInstalacionNueva = (ordenTrabajoId) => {
            let { Dispositivo, vehiculo, Propietario, confirmaciontelamatic, Cobertura, salesOrderId } = obtenerCamposOrdenTrabajo(ordenTrabajoId);

            if (!confirmaciontelamatic) {
                let telemat = {
                    customer: {
                        username: Propietario.email,
                        customer: {
                            identity_document_number: Propietario.vatregnumber,
                            company_code: "0991259546001",
                            identity_document_type: 3
                        },
                        first_name: Propietario.custentity_ht_cl_primernombre + ' ' + Propietario.custentity_ht_cl_segundonombre,
                        last_name: Propietario.custentity_ht_cl_apellidopaterno + ' ' + Propietario.custentity_ht_cl_apellidomaterno,
                        is_active: true,
                        email: Propietario.email,
                        id: Propietario.custentity_ht_customer_id_telematic
                    },
                    asset: {
                        product: vehiculo.altname.substring(0, 100),
                        name: vehiculo.name,
                        custom_name: "",
                        description: vehiculo.altname.substring(0, 100),
                        contract_code: "",
                        owner: "",
                        aceptation_date: "2023-09-18T18:04:38.934Z",
                        active: true,
                        attributes: [
                            {

                                attribute: 10,
                                value: vehiculo.custrecord_ht_bien_marca[0].text,
                                attribute_name: "Brand"
                            },
                            {

                                attribute: 11,
                                value: vehiculo.custrecord_ht_bien_marca[0].text,
                                attribute_name: "Model"
                            },
                            {

                                attribute: 16,
                                value: vehiculo.custrecord_ht_bien_chasis,
                                attribute_name: "Chasis"
                            },
                            {

                                attribute: 17,
                                value: vehiculo.custrecord_ht_bien_motor,
                                attribute_name: "Motor"
                            },
                            {

                                attribute: 18,
                                value: vehiculo.custrecord_ht_bien_placa == "S/P" ? vehiculo.name : vehiculo.custrecord_ht_bien_placa,
                                attribute_name: "Plate"
                            }
                        ],
                        doors_sensors: 0,
                        asset_type: "2",
                        product_expire_date: "2024-09-18T05:00:00.000Z",
                        id: vehiculo.custrecord_ht_bien_id_telematic
                    },
                    device: {
                        report_from: 3,
                        active: true,
                        model: 1,
                        company_code: "0991259546001",
                        id: Dispositivo.name
                    },
                    command: [
                        "CAR_LOCK",
                        "OPEN_DOOR_LOCKS"
                    ]
                };
                log.debug("telemat", telemat);
                let myRestletResponse = https.requestRestlet({
                    body: JSON.stringify(telemat),
                    deploymentId: 'customdeploy_ns_rs_new_installation',
                    scriptId: 'customscript_ns_rs_new_installation',
                    headers: myRestletHeaders,
                });
                log.debug('Response Telematic Instalacion', myRestletResponse);
                let response = myRestletResponse.body;
                let Telematic = JSON.parse(response);
                if (Telematic.device && Telematic.customer && Telematic.asset) {
                    let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                    updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_confirmaciontelamatic', value: true })
                    updateTelematic.save();
                    actualizarIdVehiculo(vehiculo.internalid[0].value, response.asset.id);
                    actualizarIdCliente(Propietario.internalid[0].value, response.asset.customer.id);
                    confirmaciontelamatic = true;
                }
            }

            if (!confirmaciontelamatic) {
                let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updateTelematic.save();
                return false;
            }
            return true;
        };

        const envioTelecDesinstalacionDispositivo = (ordenTrabajoId) => {
            log.error("envioTelecDesinstalacionDispositivo", "envioTelecDesinstalacionDispositivo");
            let { Dispositivo, vehiculo, Propietario, confirmaciontelamatic } = obtenerCamposOrdenTrabajo(ordenTrabajoId);

            log.error("Dispositivo, vehiculo, Propietario, confirmaciontelamatic", { Dispositivo, vehiculo, Propietario, confirmaciontelamatic });
            if (!confirmaciontelamatic) {
                log.error('Entro a if confirmaciontelamatic', confirmaciontelamatic);
                let telematic = {};
                telematic.customer = getPropietarioTelematic(Propietario, TELEMATIC_OPERACION_DESINSTALACION);
                telematic.asset = getVehiculoTelematic(vehiculo, TELEMATIC_OPERACION_DESINSTALACION);
                telematic.device = getDispositivoTelematic(Dispositivo, TELEMATIC_OPERACION_DESINSTALACION);
                log.error("telematic", telematic)
                let myRestletResponse = https.requestRestlet({
                    body: JSON.stringify(telematic),
                    deploymentId: 'customdeploy_ns_rs_uninstallation_devise',
                    scriptId: 'customscript_ns_rs_uninstallation_devise',
                    headers: myRestletHeaders,
                });
                log.error('Response Telematic Desinstalacion', myRestletResponse);
                let response = myRestletResponse.body;
                log.error("response", response);
                if (telematic.device && telematic.customer && telematic.asset) {
                    let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                    updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_confirmaciontelamatic', value: true })
                    updateTelematic.save();
                    confirmaciontelamatic = true;
                }
            }
            if (!confirmaciontelamatic) {
                let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updateTelematic.save();
                return false;
            }
            return true;
        }

        const envioTelecCambioPropietario = (id) => {
            try {
                let order = record.load({ type: 'salesorder', id: id });
                fechaActual = "SH2PX" + yyyy + mm + dd;
                let clienteNew = order.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente', line: 0 });
                let clienteMonitoreo = order.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente_monitoreo', line: 0 });
                let vehiculo = search.lookupFields({
                    type: 'customrecord_ht_record_bienes', id: order.getValue('custbody_ht_so_bien'),
                    columns: ['custrecord_ht_bien_placa', 'custrecord_ht_bien_marca', 'custrecord_ht_bien_modelo',
                        'custrecord_ht_bien_chasis',
                        'custrecord_ht_bien_motor',
                        'custrecord_ht_bien_colorcarseg',
                        'custrecord_ht_bien_tipoterrestre',
                        'name',
                        'custrecord_ht_bien_ano',
                        'altname', 'custrecord_ht_bien_id_telematic']
                });
                let Propietario = search.lookupFields({
                    type: 'customer', id: order.getValue('entity'),
                    columns: ['entityid', 'custentity_ht_cl_primernombre', 'custentity_ht_cl_segundonombre',
                        'custentity_ht_cl_apellidopaterno',
                        'custentity_ht_cl_apellidomaterno',
                        'phone',
                        'email', 'custentity_ht_customer_id_telematic']
                });
                let PropietarioNew = search.lookupFields({
                    type: 'customer', id: clienteNew,
                    columns: ['entityid', 'custentity_ht_cl_primernombre', 'custentity_ht_cl_segundonombre',
                        'custentity_ht_cl_apellidopaterno',
                        'custentity_ht_cl_apellidomaterno',
                        'phone',
                        'email',
                        'custentity_ht_customer_id_telematic'
                    ]
                });
                let PropietarioMonitoreo = search.lookupFields({
                    type: 'customer', id: clienteMonitoreo,
                    columns: ['entityid', 'custentity_ht_cl_primernombre', 'custentity_ht_cl_segundonombre',
                        'custentity_ht_cl_apellidopaterno',
                        'custentity_ht_cl_apellidomaterno',
                        'phone',
                        'email'
                    ]
                });
                let PxAdmin = {
                    StrToken: fechaActual,
                    UserName: "PxPrTest",
                    Password: "PX12%09#w",
                    NumeroOrden: "1101895503",
                    UsuarioIngreso: "PRUEBAEVOL",
                    OperacionOrden: "010",

                    CodigoVehiculo: vehiculo.name,

                    NumeroCamaras: "0",
                    OperacionDispositivo: "A",

                    IdentificadorPropietario: PropietarioNew.entityid,
                    NombrePropietario: PropietarioNew.custentity_ht_cl_primernombre + ' ' + PropietarioNew.custentity_ht_cl_segundonombre,
                    ApellidosPropietario: PropietarioNew.custentity_ht_cl_apellidopaterno + ' ' + PropietarioNew.custentity_ht_cl_apellidomaterno,
                    DireccionPropietario: "GUAYAQUIL",
                    ConvencionalPropietario: "43576409",
                    CelularPropietario: PropietarioNew.phone,
                    EmailPropietario: PropietarioNew.email,

                    IdentificadorMonitorea: PropietarioMonitoreo.entityid,
                    NombreMonitorea: PropietarioMonitoreo.custentity_ht_cl_primernombre + ' ' + PropietarioMonitoreo.custentity_ht_cl_segundonombre,
                    ApellidosMonitorea: PropietarioMonitoreo.custentity_ht_cl_apellidopaterno + ' ' + PropietarioMonitoreo.custentity_ht_cl_apellidomaterno,
                    DireccionMonitorea: "GUAYAQUIL",
                    ConvencionalMonitorea: "43576409",
                    CelularMonitorea: PropietarioMonitoreo.phone,
                    EmailMonitorea: PropietarioMonitoreo.email,
                }

                let outputPXadmin = url.resolveScript({
                    scriptId: 'customscript_ns_rs_px_services',
                    deploymentId: 'customdeploy_ns_rs_px_services',
                });


                /*let myRestletResponsePX = https.post({
                    url: outputPXadmin,
                    body: PxAdmin,
                    headers: myRestletHeaders
                });*/

                let telemat = {
                    customerNew: {
                        id: PropietarioNew.custentity_ht_customer_id_telematic,
                        username: PropietarioNew.entityid,
                        customer: {
                            identity_document_number: "0932677495",
                            company_code: "0991259546001",
                            identity_document_type: 3
                        },
                        first_name: PropietarioNew.custentity_ht_cl_primernombre + ' ' + PropietarioNew.custentity_ht_cl_segundonombre,
                        last_name: PropietarioNew.custentity_ht_cl_apellidopaterno + ' ' + PropietarioNew.custentity_ht_cl_apellidomaterno,
                        is_active: true,
                        email: PropietarioNew.email
                    },
                    customerOld: Propietario.custentity_ht_customer_id_telematic,
                    asset: vehiculo.custrecord_ht_bien_id_telematic

                }

                let myRestletResponse = https.requestRestlet({
                    body: JSON.stringify(telemat),
                    deploymentId: 'customdeploy_ns_rs_new_owner',
                    scriptId: 'customscript_ns_rs_new_owner',
                    headers: myRestletHeaders,
                });

                let response = myRestletResponse.body;
                log.error("envioTelecCambioPropietario Response", response);
                return true;
            } catch (e) {
                return false;
            }
        }

        const sendPXServer = (PxAdmin) => {
            let myRestletResponse = https.requestRestlet({
                body: JSON.stringify(PxAdmin),
                deploymentId: 'customdeploy_ns_rs_px_services',
                scriptId: 'customscript_ns_rs_px_services',
                headers: getHeaders(),
            });
            return myRestletResponse.body;
        }

        const obtenerPropietario = (id) => {
            if (!id) return;
            let Propietario = search.lookupFields({
                type: 'customer', id: id,
                columns: ['entityid', 'custentity_ht_cl_primernombre', 'custentity_ht_cl_segundonombre',
                    'custentity_ht_cl_apellidopaterno',
                    'custentity_ht_cl_apellidomaterno',
                    'phone',
                    'email',
                    'vatregnumber',
                    'custentity_ht_customer_id_telematic',
                    'internalid'
                ]
            });
            return Propietario;
        }

        const obtenerVehiculo = (id) => {
            if (!id) return;
            let vehiculo = search.lookupFields({
                type: 'customrecord_ht_record_bienes', id: id,
                columns: ['custrecord_ht_bien_placa', 'custrecord_ht_bien_marca', 'custrecord_ht_bien_modelo',
                    'custrecord_ht_bien_chasis',
                    'custrecord_ht_bien_motor',
                    'custrecord_ht_bien_colorcarseg',
                    'custrecord_ht_bien_tipoterrestre',
                    'name',
                    'custrecord_ht_bien_ano',
                    'altname',
                    'custrecord_ht_bien_consesionarios.custrecord_ht_cd_ruccanaldistribucion',
                    'custrecord_ht_bien_consesionarios.custrecord_ht_cd_nombre',
                    'custrecord_ht_bien_consesionarios.custrecord_ht_cd_direccion',
                    'custrecord_ht_bien_consesionarios.custrecord_ht_cd_telefono',
                    'custrecord_ht_bien_consesionarios.custrecord_ht_cd_tipocanal',
                    'custrecord_ht_bien_id_telematic',
                    'internalid'
                ]
            });
            return vehiculo;
        }

        const obtenerDispositivo = (id) => {
            if (!id) return;
            let Dispositivo = search.lookupFields({
                type: 'customrecord_ht_record_mantchaser', id: id,
                columns: ['custrecord_ht_mc_vid', 'custrecord_ht_mc_modelo',
                    'custrecord_ht_mc_unidad',
                    'custrecord_ht_mc_seriedispositivo',
                    'custrecord_ht_mc_imei',
                    'name',
                    'custrecord_ht_mc_nocelularsim',
                    'custrecord_ht_mc_operadora',
                    'custrecord_ht_mc_ip', 'custrecord_ht_mc_celularsimcard',
                    'custrecord_ht_mc_estado'
                ]
            });
            return Dispositivo;
        }

        const obtenerPropietarioMonitoreo = (salesOrderId, itemMonitoreo, isRecord) => {
            let salesorder;
            if (isRecord) {
                salesorder = salesOrderId;
            } else {
                salesorder = record.load({ type: 'salesorder', id: salesOrderId });
            }
            let inventoryAssignmentLines = salesorder.getLineCount({ sublistId: 'item' });
            let PropietarioMonitoreo = 0;
            for (let j = 0; j < inventoryAssignmentLines; j++) {
                let item = salesorder.getSublistValue({ sublistId: 'item', fieldId: 'item', line: j });
                if (itemMonitoreo && item == itemMonitoreo) {
                    PropietarioMonitoreo = salesorder.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente_monitoreo', line: j });
                    break;
                } else {
                    PropietarioMonitoreo = salesorder.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente_monitoreo', line: j });
                    if (PropietarioMonitoreo) break;
                }
            }
            var lookupFieldsPropietarioMonitoreo = {};
            if (PropietarioMonitoreo != 0) {
                lookupFieldsPropietarioMonitoreo = search.lookupFields({
                    type: 'customer', id: PropietarioMonitoreo,
                    columns: [
                        'entityid',
                        'custentity_ht_cl_primernombre',
                        'custentity_ht_cl_segundonombre',
                        'custentity_ht_cl_apellidopaterno',
                        'custentity_ht_cl_apellidomaterno',
                        'phone',
                        'email',
                        'vatregnumber',
                        'custentity_ht_customer_id_telematic'
                    ]
                });
            }
            return lookupFieldsPropietarioMonitoreo;
        }

        const obtenerCobertura = (ordenTrabajo) => {
            let itemId = ordenTrabajo.getValue('custrecord_ht_ot_item');
            let bienId = ordenTrabajo.getValue('custrecord_ht_ot_vehiculo');
            let clienteId = ordenTrabajo.getValue('custrecord_ht_ot_cliente_id');

            let coberturaSearchResult = search.create({
                type: "customrecord_ht_co_cobertura",
                filters: [
                    ["custrecord_ht_co_bien", "anyof", bienId],
                    "AND",
                    ["custrecord_ht_co_propietario", "anyof", clienteId],
                    "AND",
                    ["custrecord_ht_co_producto", "anyof", itemId]
                ],
                columns: [
                    search.createColumn({ name: "name", sort: search.Sort.ASC, label: "ID" }),
                    search.createColumn({ name: "custrecord_ht_co_estado_cobertura", label: "HT CO Estado Cobertura" }),
                    search.createColumn({ name: "formulatext", formula: "to_char({custrecord_ht_co_coberturainicial}, 'YYYY-MM-DD')", label: "Formula (Text)" }),
                    search.createColumn({ name: "formulatext", formula: "to_char({custrecord_ht_co_coberturafinal}, 'YYYY-MM-DD')", label: "Formula (Text)" }),
                    search.createColumn({ name: "custrecord_ht_co_coberturainicial"}),
                    search.createColumn({ name: "custrecord_ht_co_coberturafinal"})
                ]
            }).run().getRange(0, 10);

            let result = {
                name: "",
                custrecord_ht_co_estado_cobertura: "",
                custrecord_ht_co_coberturainicial: "",
                custrecord_ht_co_coberturafinal: "",
                custrecord_ht_co_coberturainicialtext: "",
                custrecord_ht_co_coberturafinaltext: "",
            };

            if (!coberturaSearchResult.length) return result;
            let columns = coberturaSearchResult[0].columns;
            return {
                name: coberturaSearchResult[0].getValue("name"),
                custrecord_ht_co_estado_cobertura: coberturaSearchResult[0].getText("custrecord_ht_co_estado_cobertura"),
                custrecord_ht_co_coberturainicialtext: coberturaSearchResult[0].getValue(columns[2]),
                custrecord_ht_co_coberturafinaltext: coberturaSearchResult[0].getValue(columns[3]),
                custrecord_ht_co_coberturainicial: format.parse({ value: coberturaSearchResult[0].getValue(columns[4]), type: format.Type.DATE }),
                custrecord_ht_co_coberturafinal: format.parse({ value: coberturaSearchResult[0].getValue(columns[5]), type: format.Type.DATE })
            };
        }

        const Propietario = (id) => {
            let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
            let Propietario = search.lookupFields({
                type: 'customer', id: order.getValue('custrecord_ht_ot_cliente_id'),
                columns: ['entityid', 'custentity_ht_cl_primernombre', 'custentity_ht_cl_segundonombre',
                    'custentity_ht_cl_apellidopaterno',
                    'custentity_ht_cl_apellidomaterno',
                    'phone',
                    'email',
                    'vatregnumber'
                ]
            });
            return Propietario;
        }

        const vehiculo = (id) => {
            let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
            let vehiculo = search.lookupFields({
                type: 'customrecord_ht_record_bienes', id: order.getValue('custrecord_ht_ot_vehiculo'),
                columns: ['custrecord_ht_bien_placa', 'custrecord_ht_bien_marca', 'custrecord_ht_bien_modelo',
                    'custrecord_ht_bien_chasis',
                    'custrecord_ht_bien_motor',
                    'custrecord_ht_bien_colorcarseg',
                    'custrecord_ht_bien_tipoterrestre',
                    'name',
                    'custrecord_ht_bien_ano',
                    'altname',
                    'custrecord_ht_bien_consesionarios.custrecord_ht_cd_ruccanaldistribucion',
                    'custrecord_ht_bien_consesionarios.custrecord_ht_cd_nombre',
                    'custrecord_ht_bien_consesionarios.custrecord_ht_cd_direccion',
                    'custrecord_ht_bien_consesionarios.custrecord_ht_cd_telefono',
                    'custrecord_ht_bien_consesionarios.custrecord_ht_cd_tipocanal'
                ]
            });
            return vehiculo;

        }

        const Dispositivo = (id) => {
            let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
            let Dispositivo = search.lookupFields({
                type: 'customrecord_ht_record_mantchaser', id: order.getValue('custrecord_ht_ot_serieproductoasignacion'),
                columns: ['custrecord_ht_mc_vid', 'custrecord_ht_mc_modelo',
                    'custrecord_ht_mc_unidad',
                    'custrecord_ht_mc_seriedispositivo',
                    'custrecord_ht_mc_imei',
                    'name',
                    'custrecord_ht_mc_nocelularsim',
                    'custrecord_ht_mc_operadora',
                    'custrecord_ht_mc_ip', 'custrecord_ht_mc_celularsimcard',
                    'custrecord_ht_mc_estado'
                ]
            });
            return Dispositivo;
        }

        const PropietarioMonitoreo = (id) => {
            let lookupFieldsPropietarioMonitoreo = 0
            let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
            let salesorder = record.load({ type: 'salesorder', id: order.getValue('custrecord_ht_ot_orden_servicio') });
            let inventoryAssignmentLines = salesorder.getLineCount({ sublistId: 'item' });
            let PropietarioMonitoreo = 0;
            for (let j = 0; j < inventoryAssignmentLines; j++) {
                let item = salesorder.getSublistValue({ sublistId: 'item', fieldId: 'item', line: j });
                if (item == order.getValue('custrecord_ht_ot_item')) {
                    PropietarioMonitoreo = salesorder.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente_monitoreo', line: j });
                }
            }
            if (PropietarioMonitoreo != 0) {
                lookupFieldsPropietarioMonitoreo = search.lookupFields({
                    type: 'customer', id: PropietarioMonitoreo,
                    columns: [
                        'entityid',
                        'custentity_ht_cl_primernombre',
                        'custentity_ht_cl_segundonombre',
                        'custentity_ht_cl_apellidopaterno',
                        'custentity_ht_cl_apellidomaterno',
                        'phone',
                        'email',
                        'vatregnumber'
                    ]
                });
            }
            return lookupFieldsPropietarioMonitoreo;
        }

        const actualizarIdVehiculo = (idVehiculo, idVehiculoTelematic) => {
            if (!idVehiculoTelematic) return;
            record.submitFields({
                type: 'customrecord_ht_record_bienes',
                id: idVehiculo,
                values: {
                    'custrecord_ht_bien_id_telematic': idVehiculoTelematic
                }
            });
        }

        const actualizarIdCliente = (idCliente, idClienteTelematic) => {
            if (!idClienteTelematic) return;
            record.submitFields({
                type: 'customer',
                id: idCliente,
                values: {
                    'custentity_ht_customer_id_telematic': idClienteTelematic
                }
            });
        }

        const envioTelecActualizacionDatosTecnicos = () => {

        }

        const envioTelecActualizacionDatosClientes = () => {

        }

        const envioTelecActualizacionDatosVehiculo = () => {

        }

        const envioTelecActualizacionActualizacionServicio = () => {

        }

        const envioTelecActualizacionCobertura = () => {

        }

        const envioTelecCorteSim = () => {

        }

        const envioTelecReconexion = () => {

        }

        return {
            envioPXInstalacionDispositivo,
            envioPXDesinstalacionDispositivo,
            envioPXReinstalacionDispositivo,
            envioPXRenovacionDispositivo,
            envioPXModificacionDispositivo,
            envioPXMantenimientoChequeoDispositivo,
            envioPXChequeoComponentes,
            envioPXVentaSeguros,
            envioPXRenovacionSeguro,
            envioPXCambioPropietario,
            envioPXInstalacionOtrosProductos,
            envioPXDesinstalacionOtrosProductos,
            envioPXChequeoOtrosProductos,
            envioPXReinstalacionOtrosProductos,
            envioPXVentaServicios,
            envioPXActualizacionDatosPropietario,
            envioPXActualizacionEstado,
            envioPXRegistrarCanal,
            envioPXInstalacionComponentes,
            envioTelecInstalacionNueva,
            envioTelecDesinstalacionDispositivo,
            envioTelecCambioPropietario,
            envioTelecActualizacionDatosTecnicos,
            envioTelecActualizacionDatosClientes,
            envioTelecActualizacionDatosVehiculo,
            envioTelecActualizacionActualizacionServicio,
            envioTelecActualizacionCobertura,
            envioTelecCorteSim,
            envioTelecReconexion,
            Propietario,
            vehiculo,
            Dispositivo,
            PropietarioMonitoreo
        }
    });