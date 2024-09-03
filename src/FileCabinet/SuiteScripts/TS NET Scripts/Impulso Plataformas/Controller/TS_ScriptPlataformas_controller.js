/**
 * @NApiVersion 2.1
 */
define(['N/log',
    'N/search',
    'N/record',
    'N/https',
    'N/url',
    'N/format',
    'N/file',
    'N/query'
],
    (log, search, record, https, url, format, file, query) => {
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
        const TELEMATIC_OPERACION_INSTALACION_NUEVA = "001";
        const TELEMATIC_OPERACION_DESINSTALACION_DISPOSITIVO = "002";
        const TELEMATIC_OPERACION_CAMBIO_PROPIETARIO = "003";
        const TELEMATIC_OPERACION_ACTUALIZACION_DATOS_TECNICOS = "004";
        const TELEMATIC_OPERACION_ACTUALIZACION_DATOS_CLIENTES = "006";
        const TELEMATIC_OPERACION_ACTUALIZACION_DATOS_VEHICULOS = "007";
        const TELEMATIC_OPERACION_ACTUALIZACION_SERVICIOS = "008";
        const TELEMATIC_OPERACION_ACTUALIZACION_COBERTURAS = "009";
        const TELEMATIC_OPERACION_CORTE_SIM = "010";
        const TELEMATIC_OPERACION_RECONEXION = "011";

        const obtenerHeaders = () => {
            let headers = {};
            headers['Accept'] = '*/*';
            headers['Content-Type'] = 'application/json';
            return headers;
        };

        const obtenerValoresFechaHoy = () => {
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
            let { year, month, day } = obtenerValoresFechaHoy();

            PxAdmin["StrToken"] = `SH2PX${year}${month}${day}`;
            PxAdmin["UserName"] = `PxPrTest`;
            PxAdmin["Password"] = `PX12%09#w`;
            PxAdmin["UsuarioIngreso"] = `PRUEBAEVOL`;
        }

        const setEmptyFields = (PxAdmin) => {
            setOrdenVentaEmptyField(PxAdmin);
            setVehiculoEmptyField(PxAdmin);
            setDispositivoEmptyFields(PxAdmin);
            setPropietarioEmptyFields(PxAdmin);
            setMonitorEmptyFields(PxAdmin);
            setConcesionarioEmptyFields(PxAdmin);
            setFinancieraEmptyFields(PxAdmin);
            setAseguradoraEmptyFields(PxAdmin);
            setConvenioEmptyFields(PxAdmin);
        }

        const setOrdenVentaEmptyField = (PxAdmin) => {
            PxAdmin["NumeroOrden"] = "";
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
            PxAdmin["DireccionMac"] = "0";
            PxAdmin["Icc"] = "0";
            PxAdmin["NumeroCelular"] = "0";
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
            PxAdmin["EmailAseguradora"] = "";
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
            PxAdmin["NumeroOrden"] = "9999" + salesOrder.tranid.replace(/\D/g, '');
        }

        const setVehiculoValues = (PxAdmin, vehiculo, operacionOrden) => {
            let idMarca = vehiculo["custrecord_ht_bien_marca.custrecord_ht_marca_codigo"] || "";
            let descMarca = vehiculo["custrecord_ht_bien_marca.custrecord_ht_marca_descripcion"] || "";
            let idModelo = vehiculo["custrecord_ht_bien_modelo.custrecord_ht_mod_codigo"] || "";
            let descModelo = vehiculo["custrecord_ht_bien_modelo.custrecord_ht_mod_descripcion"];
            let colorName = vehiculo["custrecord_ht_bien_colorcarseg.custrecord_ht_bn_colorcarseg_descripcion"];
            let tipoVehiculo = vehiculo["custrecord_ht_bien_tipo.custrecord_ht_tv_descripcion"];

            if (operacionOrden == OPERACION_ORDEN_INSTALACION) {
                PxAdmin["Placa"] = vehiculo.custrecord_ht_bien_placa == "S/P" ? vehiculo.name : vehiculo.custrecord_ht_bien_placa;
                PxAdmin["IdMarca"] = idMarca;
                PxAdmin["DescMarca"] = descMarca;
                PxAdmin["IdModelo"] = idModelo;
                PxAdmin["DescModelo"] = descModelo;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
                PxAdmin["Chasis"] = vehiculo.custrecord_ht_bien_chasis;
                PxAdmin["Motor"] = vehiculo.custrecord_ht_bien_motor;
                PxAdmin["Color"] = colorName;
                PxAdmin["Anio"] = vehiculo.custrecord_ht_bien_ano;
                PxAdmin["Tipo"] = tipoVehiculo;
            } else if (operacionOrden == OPERACION_ORDEN_DESINSTALACION) {
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_REINSTALACION) {
                PxAdmin["IdMarca"] = idMarca;
                PxAdmin["DescMarca"] = descMarca;
                PxAdmin["IdModelo"] = idModelo;
                PxAdmin["DescModelo"] = descModelo;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_RENOVACION) {
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_MODIFICACION) {
                PxAdmin["IdMarca"] = idMarca;
                PxAdmin["DescMarca"] = descMarca;
                PxAdmin["IdModelo"] = idModelo;
                PxAdmin["DescModelo"] = descModelo;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_MANTENIMIENTO_CHEQUEO) {
                PxAdmin["IdMarca"] = idMarca;
                PxAdmin["DescMarca"] = descMarca;
                PxAdmin["IdModelo"] = idModelo;
                PxAdmin["DescModelo"] = descModelo;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_CHEQUEO_COMPONENTES) {
                PxAdmin["IdMarca"] = idMarca;
                PxAdmin["DescMarca"] = descMarca;
                PxAdmin["IdModelo"] = idModelo;
                PxAdmin["DescModelo"] = descModelo;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_VENTA_SEGUROS) {
                PxAdmin["IdMarca"] = idMarca;
                PxAdmin["DescMarca"] = descMarca;
                PxAdmin["IdModelo"] = idModelo;
                PxAdmin["DescModelo"] = descModelo;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_RENOVACION_SEGUROS) {
                PxAdmin["IdMarca"] = idMarca;
                PxAdmin["DescMarca"] = descMarca;
                PxAdmin["IdModelo"] = idModelo;
                PxAdmin["DescModelo"] = descModelo;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_CAMBIO_PROPIETARIO) {
                PxAdmin["IdMarca"] = idMarca;
                PxAdmin["DescMarca"] = descMarca;
                PxAdmin["IdModelo"] = idModelo;
                PxAdmin["DescModelo"] = descModelo;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_INSTALACION_OTROS_PRODUCTOS) {
                PxAdmin["IdMarca"] = idMarca;
                PxAdmin["DescMarca"] = descMarca;
                PxAdmin["IdModelo"] = idModelo;
                PxAdmin["DescModelo"] = descModelo;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_DESINSTALACION_OTROS_PRODUCTOS) {
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_CHEQUEO_OTROS_PRODUCTOS) {
                PxAdmin["IdMarca"] = idMarca;
                PxAdmin["DescMarca"] = descMarca;
                PxAdmin["IdModelo"] = idModelo;
                PxAdmin["DescModelo"] = descModelo;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_REINSTALACION_OTROS_PRODUCTOS) {
                PxAdmin["IdMarca"] = idMarca;
                PxAdmin["DescMarca"] = descMarca;
                PxAdmin["IdModelo"] = idModelo;
                PxAdmin["DescModelo"] = descModelo;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_VENTA_SERVICIOS) {
                PxAdmin["IdMarca"] = idMarca;
                PxAdmin["DescMarca"] = descMarca;
                PxAdmin["IdModelo"] = idModelo;
                PxAdmin["DescModelo"] = descModelo;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_ACTUALIZACION_ESTADOS) {
                PxAdmin["IdMarca"] = idMarca;
                PxAdmin["DescMarca"] = descMarca;
                PxAdmin["IdModelo"] = idModelo;
                PxAdmin["DescModelo"] = descModelo;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_REGISTRAR_CANAL) {
                PxAdmin["Placa"] = vehiculo.custrecord_ht_bien_placa == "S/P" ? vehiculo.name : vehiculo.custrecord_ht_bien_placa;
                PxAdmin["IdMarca"] = idMarca;
                PxAdmin["DescMarca"] = descMarca;
                PxAdmin["IdModelo"] = idModelo;
                PxAdmin["DescModelo"] = descModelo;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
                PxAdmin["Chasis"] = vehiculo.custrecord_ht_bien_chasis;
                PxAdmin["Motor"] = vehiculo.custrecord_ht_bien_motor;
                PxAdmin["Color"] = colorName;
                PxAdmin["Anio"] = vehiculo.custrecord_ht_bien_ano;
                PxAdmin["Tipo"] = tipoVehiculo;
            } else if (operacionOrden == OPERACION_ORDEN_INSTALACION_COMPONENTES) {
                PxAdmin["Placa"] = vehiculo.custrecord_ht_bien_placa == "S/P" ? vehiculo.name : vehiculo.custrecord_ht_bien_placa;
                PxAdmin["IdMarca"] = idMarca;
                PxAdmin["DescMarca"] = descMarca;
                PxAdmin["IdModelo"] = idModelo;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            }
        }

        const obtenerEstadoSIM = (idEstadoDispositivo) => {
            let estadoSIM = "";
            if (idEstadoDispositivo == "001") {
                estadoSIM = "ACT";
            } else if (idEstadoDispositivo == "002") {
                estadoSIM = "INA";
            } else if (idEstadoDispositivo == "003") {
                estadoSIM = "INA";
            } else if (idEstadoDispositivo == "004") {
            } else if (idEstadoDispositivo == "005") {
            } else if (idEstadoDispositivo == "006") {
                estadoSIM = "INA";
            } else if (idEstadoDispositivo == "007") {
            }
            return estadoSIM;
        }

        const setDispositivoValues = (PxAdmin, Dispositivo, operacionOrden, workOrder) => {
            let idUnidad = Dispositivo["custrecord_ht_mc_unidad.custrecord_ht_dd_tipodispositivo_codigo"];
            let descUnidad = Dispositivo["custrecord_ht_mc_unidad.custrecord_ht_dd_tipodispositivo_descrip"];
            let idModelo = Dispositivo["custrecord_ht_mc_modelo.custrecord_ht_dd_modelodispositivo_codig"];
            let descModelo = Dispositivo["custrecord_ht_mc_modelo.custrecord_ht_dd_modelodispositivo_descr"];

            // Serie
            let serie = Dispositivo.custrecord_ht_mc_seriedispositivo.length ? Dispositivo.custrecord_ht_mc_seriedispositivo[0].text.split(' - ') : '';
            let idSerie = serie.length ? serie[0] : '';

            let descOperadora = Dispositivo["custrecord_ht_mc_operadora.custrecord_ht_cs_operadora_descrip"];

            //EstadoSim
            //let Estado = Dispositivo.custrecord_ht_mc_estado[0].text.split(' - ');
            let Estado = Dispositivo.custrecord_ht_mc_estadolodispositivo[0].text.split(' - ');
            let descEstado = Estado.length > 1 ? Estado[1] : '';

            let producto = Dispositivo.producto ? Dispositivo.producto.split(' - ') : "";
            let idProducto = producto.length ? producto[0] : '';
            let descProducto = producto.length > 1 ? producto[1] : '';

            let estadoDispositivo = Dispositivo.custrecord_ht_mc_estadolodispositivo.length ? Dispositivo.custrecord_ht_mc_estadolodispositivo[0].text.split(' - ') : '';
            let idEstadoDispositivo = estadoDispositivo.length ? estadoDispositivo[0] : "";
            //let estadoSim = obtenerEstadoSIM(idEstadoDispositivo);

            if (operacionOrden == OPERACION_ORDEN_INSTALACION) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["IdProducto"] = idProducto.substr(0, 5);
                PxAdmin["DescProducto"] = descProducto;
                PxAdmin["CodMarcaDispositivo"] = idUnidad;
                PxAdmin["MarcaDispositivo"] = descUnidad;
                PxAdmin["CodModeloDispositivo"] = idModelo;
                PxAdmin["ModeloDispositivo"] = descModelo;
                PxAdmin["Sn"] = Dispositivo.custrecord_ht_mc_sn;
                PxAdmin["Imei"] = Dispositivo.custrecord_ht_mc_imei;
                PxAdmin["NumeroCamaras"] = Dispositivo.custrecord_ht_mc_numero_camara || "0";
                PxAdmin["DireccionMac"] = Dispositivo.custrecord_ht_mc_macaddress;
                PxAdmin["Icc"] = Dispositivo.custrecord_ht_mc_icc;
                PxAdmin["NumeroCelular"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                PxAdmin["Operadora"] = descOperadora;
                PxAdmin["EstadoSim"] = 'ACT';
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_DESINSTALACION) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["OperacionDispositivo"] = "D";
            } else if (operacionOrden == OPERACION_ORDEN_REINSTALACION) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["IdProducto"] = Dispositivo.name.substr(0, 5);
                PxAdmin["DescProducto"] = Dispositivo.name;
                PxAdmin["CodMarcaDispositivo"] = idUnidad;
                PxAdmin["MarcaDispositivo"] = descUnidad;
                PxAdmin["CodModeloDispositivo"] = idModelo;
                PxAdmin["ModeloDispositivo"] = descModelo;
                PxAdmin["Sn"] = Dispositivo.custrecord_ht_mc_sn;
                PxAdmin["Imei"] = Dispositivo.custrecord_ht_mc_imei;
                PxAdmin["NumeroCamaras"] = Dispositivo.custrecord_ht_mc_numero_camara || "0";
                PxAdmin["DireccionMac"] = Dispositivo.custrecord_ht_mc_macaddress;
                PxAdmin["Icc"] = Dispositivo.custrecord_ht_mc_icc;
                PxAdmin["NumeroCelular"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                PxAdmin["Operadora"] = descOperadora;
                PxAdmin["EstadoSim"] = descEstado;
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_RENOVACION) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["OperacionDispositivo"] = "A";
            } else if (operacionOrden == OPERACION_ORDEN_MODIFICACION) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["CodMarcaDispositivo"] = idUnidad;
                PxAdmin["MarcaDispositivo"] = descUnidad;
                PxAdmin["CodModeloDispositivo"] = idModelo;
                PxAdmin["ModeloDispositivo"] = descModelo;
                PxAdmin["Sn"] = Dispositivo.custrecord_ht_mc_sn;
                PxAdmin["Imei"] = Dispositivo.custrecord_ht_mc_imei;
                PxAdmin["NumeroCamaras"] = Dispositivo.custrecord_ht_mc_numero_camara || "0";
                PxAdmin["DireccionMac"] = Dispositivo.custrecord_ht_mc_macaddress;
                PxAdmin["Icc"] = Dispositivo.custrecord_ht_mc_icc;
                PxAdmin["NumeroCelular"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                PxAdmin["Operadora"] = descOperadora;
                PxAdmin["EstadoSim"] = descEstado;
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_MANTENIMIENTO_CHEQUEO) {
                let estadoSim = obtenerEstadoSIM(idEstadoDispositivo);
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["CodMarcaDispositivo"] = idUnidad;
                PxAdmin["MarcaDispositivo"] = descUnidad;
                PxAdmin["CodModeloDispositivo"] = idModelo;
                PxAdmin["ModeloDispositivo"] = descModelo;
                PxAdmin["Sn"] = Dispositivo.custrecord_ht_mc_sn;
                PxAdmin["Imei"] = Dispositivo.custrecord_ht_mc_imei;
                PxAdmin["NumeroCamaras"] = Dispositivo.custrecord_ht_mc_numero_camara || "0";
                PxAdmin["DireccionMac"] = Dispositivo.custrecord_ht_mc_macaddress;
                PxAdmin["Icc"] = Dispositivo.custrecord_ht_mc_icc;
                PxAdmin["NumeroCelular"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                PxAdmin["Operadora"] = descOperadora;
                PxAdmin["EstadoSim"] = estadoSim;
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_CHEQUEO_COMPONENTES) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["CodMarcaDispositivo"] = idUnidad;
                PxAdmin["MarcaDispositivo"] = descUnidad;
                PxAdmin["CodModeloDispositivo"] = idModelo;
                PxAdmin["ModeloDispositivo"] = descModelo;
                PxAdmin["Sn"] = Dispositivo.custrecord_ht_mc_sn;
                PxAdmin["Imei"] = Dispositivo.custrecord_ht_mc_imei;
                PxAdmin["NumeroCamaras"] = Dispositivo.custrecord_ht_mc_numero_camara || "0";
                PxAdmin["DireccionMac"] = Dispositivo.custrecord_ht_mc_macaddress;
                PxAdmin["Icc"] = Dispositivo.custrecord_ht_mc_icc;
                PxAdmin["NumeroCelular"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                PxAdmin["Operadora"] = descOperadora;
                PxAdmin["EstadoSim"] = descEstado;
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_VENTA_SEGUROS) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["CodMarcaDispositivo"] = idUnidad;
                PxAdmin["MarcaDispositivo"] = descUnidad;
                PxAdmin["CodModeloDispositivo"] = idModelo;
                PxAdmin["ModeloDispositivo"] = descModelo;
                PxAdmin["Sn"] = Dispositivo.custrecord_ht_mc_sn;
                PxAdmin["Imei"] = Dispositivo.custrecord_ht_mc_imei;
                PxAdmin["NumeroCamaras"] = Dispositivo.custrecord_ht_mc_numero_camara || "0";
                PxAdmin["DireccionMac"] = Dispositivo.custrecord_ht_mc_macaddress;
                PxAdmin["Icc"] = Dispositivo.custrecord_ht_mc_icc;
                PxAdmin["NumeroCelular"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                PxAdmin["Operadora"] = descOperadora;
                PxAdmin["EstadoSim"] = descEstado;
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_RENOVACION_SEGUROS) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["CodMarcaDispositivo"] = idUnidad;
                PxAdmin["MarcaDispositivo"] = descUnidad;
                PxAdmin["CodModeloDispositivo"] = idModelo;
                PxAdmin["ModeloDispositivo"] = descModelo;
                PxAdmin["Sn"] = Dispositivo.custrecord_ht_mc_sn;
                PxAdmin["Imei"] = Dispositivo.custrecord_ht_mc_imei;
                PxAdmin["NumeroCamaras"] = Dispositivo.custrecord_ht_mc_numero_camara || "0";
                PxAdmin["DireccionMac"] = Dispositivo.custrecord_ht_mc_macaddress;
                PxAdmin["Icc"] = Dispositivo.custrecord_ht_mc_icc;
                PxAdmin["NumeroCelular"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                PxAdmin["Operadora"] = descOperadora;
                PxAdmin["EstadoSim"] = descEstado;
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_INSTALACION_OTROS_PRODUCTOS) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["CodMarcaDispositivo"] = idUnidad;
                PxAdmin["MarcaDispositivo"] = descUnidad;
                PxAdmin["CodModeloDispositivo"] = idModelo;
                PxAdmin["ModeloDispositivo"] = descModelo;
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_DESINSTALACION_OTROS_PRODUCTOS) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["OperacionDispositivo"] = "D";
            } else if (operacionOrden == OPERACION_ORDEN_CHEQUEO_OTROS_PRODUCTOS) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["CodMarcaDispositivo"] = idUnidad;
                PxAdmin["MarcaDispositivo"] = descUnidad;
                PxAdmin["CodModeloDispositivo"] = idModelo;
                PxAdmin["ModeloDispositivo"] = descModelo;
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_REINSTALACION_OTROS_PRODUCTOS) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["CodMarcaDispositivo"] = idUnidad;
                PxAdmin["MarcaDispositivo"] = descUnidad;
                PxAdmin["CodModeloDispositivo"] = idModelo;
                PxAdmin["ModeloDispositivo"] = descModelo;
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_VENTA_SERVICIOS) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["CodMarcaDispositivo"] = idUnidad;
                PxAdmin["MarcaDispositivo"] = descUnidad;
                PxAdmin["CodModeloDispositivo"] = idModelo;
                PxAdmin["ModeloDispositivo"] = descModelo;
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_ACTUALIZACION_DATOS_PROPIETARIOS) {
                PxAdmin["CodMarcaDispositivo"] = idUnidad;
                PxAdmin["MarcaDispositivo"] = descUnidad;
                PxAdmin["CodModeloDispositivo"] = idModelo;
                PxAdmin["ModeloDispositivo"] = descModelo;
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_ACTUALIZACION_ESTADOS) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["IdProducto"] = Dispositivo.name.substr(0, 5);
                PxAdmin["DescProducto"] = Dispositivo.name;
                PxAdmin["CodMarcaDispositivo"] = idUnidad;
                PxAdmin["MarcaDispositivo"] = descUnidad;
                PxAdmin["CodModeloDispositivo"] = idModelo;
                PxAdmin["ModeloDispositivo"] = descModelo;
                //PxAdmin["EstadoSim"] = Dispositivo.custrecord_ht_mc_estado[0].text.substr(0, 5);
                PxAdmin["OperacionDispositivo"] = "A";
            } else if (operacionOrden == OPERACION_ORDEN_REGISTRAR_CANAL) {
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_INSTALACION_COMPONENTES) {
                PxAdmin["OperacionDispositivo"] = "I";
                PxAdmin["CodMarcaDispositivo"] = idUnidad;
                PxAdmin["MarcaDispositivo"] = descUnidad;
                PxAdmin["CodModeloDispositivo"] = idModelo;
                PxAdmin["ModeloDispositivo"] = descModelo;
            }
        }

        const setPropietarioValues = (PxAdmin, Propietario, operacionOrden) => {
            let persona = Propietario.isperson;
            if (operacionOrden == OPERACION_ORDEN_INSTALACION) {
                PxAdmin["IdentificadorPropietario"] = Propietario.vatregnumber;
                PxAdmin["NombrePropietario"] = Propietario.custentity_ht_cl_primernombre + ' ' + (typeof Propietario.custentity_ht_cl_segundonombre == 'undefined' ? '' : Propietario.custentity_ht_cl_segundonombre);
                PxAdmin["ApellidosPropietario"] = (typeof Propietario.custentity_ht_cl_apellidopaterno == 'undefined' ? '' : Propietario.custentity_ht_cl_apellidopaterno) + ' ' + (typeof Propietario.custentity_ht_cl_apellidomaterno == 'undefined' ? '' : Propietario.custentity_ht_cl_apellidomaterno);
                PxAdmin["DireccionPropietario"] = Propietario.provincia;
                PxAdmin["ConvencionalPropietario"] = Propietario.homephone;
                PxAdmin["CelularPropietario"] = Propietario.phone.length ? Propietario.phone.replace('+593', '0') : '';
                PxAdmin["EmailPropietario"] = Propietario.email;
            } else if (operacionOrden == OPERACION_ORDEN_ACTUALIZACION_DATOS_PROPIETARIOS) {
                PxAdmin["IdentificadorPropietario"] = Propietario.vatregnumber;
                PxAdmin["NombrePropietario"] = (typeof Propietario.custentity_ht_cl_primernombre == 'undefined' ? '' : Propietario.custentity_ht_cl_primernombre) + ' ' + (typeof Propietario.custentity_ht_cl_segundonombre == 'undefined' ? '' : Propietario.custentity_ht_cl_segundonombre);
                PxAdmin["ApellidosPropietario"] = (typeof Propietario.custentity_ht_cl_apellidopaterno == 'undefined' ? '' : Propietario.custentity_ht_cl_apellidopaterno) + ' ' + (typeof Propietario.custentity_ht_cl_apellidomaterno == 'undefined' ? '' : Propietario.custentity_ht_cl_apellidomaterno);
                PxAdmin["DireccionPropietario"] = Propietario.provincia;
                PxAdmin["ConvencionalPropietario"] = Propietario.homephone;
                PxAdmin["CelularPropietario"] = Propietario.phone.length ? Propietario.phone.replace('+593', '0') : '';
                PxAdmin["EmailPropietario"] = Propietario.email;
            } else if (operacionOrden == OPERACION_ORDEN_CAMBIO_PROPIETARIO) {
                PxAdmin["IdentificadorPropietario"] = Propietario.vatregnumber;
                PxAdmin["NombrePropietario"] = Propietario.custentity_ht_cl_primernombre + ' ' + (typeof Propietario.custentity_ht_cl_segundonombre == 'undefined' ? '' : Propietario.custentity_ht_cl_segundonombre);
                PxAdmin["ApellidosPropietario"] = (typeof Propietario.custentity_ht_cl_apellidopaterno == 'undefined' ? '' : Propietario.custentity_ht_cl_apellidopaterno) + ' ' + (typeof Propietario.custentity_ht_cl_apellidomaterno == 'undefined' ? '' : Propietario.custentity_ht_cl_apellidomaterno);
                PxAdmin["DireccionPropietario"] = Propietario.provincia;
                PxAdmin["ConvencionalPropietario"] = Propietario.homephone;
                PxAdmin["CelularPropietario"] = Propietario.phone.length ? Propietario.phone.replace('+593', '0') : '';
                PxAdmin["EmailPropietario"] = Propietario.email;
            }
        }

        const setAseguradoraValues = (PxAdmin, Aseguradora, operacionOrden) => {
            if (!Aseguradora.custrecord_ht_cd_nombre) return;
            if (operacionOrden == OPERACION_ORDEN_INSTALACION) {
                PxAdmin["IdentificadorAseguradora"] = Aseguradora.custrecord_ht_cd_ruccanaldistribucion || "";
                PxAdmin["RazonSocialAseguradora"] = Aseguradora.custrecord_ht_cd_nombre || "";
                PxAdmin["DireccionAseguradora"] = Aseguradora.custrecord_ht_cd_direccion || "";
                PxAdmin["ConvencionalAseguradora"] = Aseguradora.custrecord_ht_cd_convencional.replace('+593', '0');
                PxAdmin["CelularAseguradora"] = Aseguradora.custrecord_ht_cd_telefono.replace('+593', '0') || "";
                PxAdmin["EmailAseguradora"] = Aseguradora.custrecord_ht_cd_email || "";
            }
        }

        const setConcesionarioValues = (PxAdmin, Concesionario, operacionOrden) => {
            if (!Concesionario.custrecord_ht_cd_nombre) return;
            if (operacionOrden == OPERACION_ORDEN_INSTALACION) {
                PxAdmin["IdentificadorConcesionario"] = Concesionario.custrecord_ht_cd_ruccanaldistribucion || "";
                PxAdmin["RazonSocialConcesionario"] = Concesionario.custrecord_ht_cd_nombre || "";
                PxAdmin["DireccionConcesionario"] = Concesionario.custrecord_ht_cd_direccion || "";
                PxAdmin["ConvencionalConcesionario"] = Concesionario.custrecord_ht_cd_convencional.replace('+593', '0');
                PxAdmin["CelularConcesionario"] = Concesionario.custrecord_ht_cd_telefono.replace('+593', '0') || "";
                PxAdmin["EmailConcesionario"] = Concesionario.custrecord_ht_cd_email || "";
            }
        }

        const setFinancieraValues = (PxAdmin, Financiera, operacionOrden) => {
            if (!Financiera.custrecord_ht_cd_nombre) return;
            if (operacionOrden == OPERACION_ORDEN_INSTALACION) {
                PxAdmin["IdentificadorFinanciera"] = Financiera.custrecord_ht_cd_ruccanaldistribucion || "";
                PxAdmin["RazonSocialFinanciera"] = Financiera.custrecord_ht_cd_nombre || "";
                PxAdmin["DireccionFinanciera"] = Financiera.custrecord_ht_cd_direccion || "";
                PxAdmin["ConvencionalFinanciera"] = Financiera.custrecord_ht_cd_convencional.replace('+593', '0');
                PxAdmin["CelularFinanciera"] = Financiera.custrecord_ht_cd_telefono.replace('+593', '0') || "";
                PxAdmin["EmailFinanciera"] = Financiera.custrecord_ht_cd_email || "";
            }
        }

        const setConvenioValues = (PxAdmin, Convenio, operacionOrden) => {
            if (!Convenio.custrecord_ht_cn_ruc_convenio) return;
            if (operacionOrden == OPERACION_ORDEN_INSTALACION) {
                PxAdmin["IdentificadorConvenio"] = Convenio.custrecord_ht_cn_ruc_convenio || "";
                PxAdmin["RazonSocialConvenio"] = Convenio.custrecord_ht_cn_razon_social || "";
                PxAdmin["DireccionConvenio"] = Convenio.custrecord_ht_cn_direccion || "";
                PxAdmin["ConvencionalConvenio"] = Convenio.custrecord_ht_cn_convencional.replace('+593', '0');
                PxAdmin["CelularConvenio"] = Convenio.custrecord_ht_cn_celular.replace('+593', '0') || "";
                PxAdmin["EmailConvenio"] = Convenio.custrecord_ht_cn_email || "";
            }
        }

        const setMonitoreoValues = (PxAdmin, PropietarioMonitoreo, operacionOrden) => {
            let persona = PropietarioMonitoreo.isperson;
            let convencional = '';
            if (!PropietarioMonitoreo.vatregnumber) return;
            log.debug('IDMONITOREO', PropietarioMonitoreo);
            let sql3 = 'SELECT custrecord_ht_campo_txt_telefono as convencional FROM customrecord_ht_registro_telefono WHERE custrecord_ht_campo_list_tipo_telefono = 10 AND custrecord_ht_campo_lbl_entidad_telefono = ?'
            let resultSet3 = query.runSuiteQL({ query: sql3, params: [PropietarioMonitoreo.identity] });
            let results3 = resultSet3.asMappedResults();
            convencional = results3.length ? results3[0]['convencional'].replace('+593', '0') : convencional;
            if (operacionOrden == OPERACION_ORDEN_INSTALACION) {
                PxAdmin["IdentificadorMonitorea"] = PropietarioMonitoreo.vatregnumber;
                PxAdmin["NombreMonitorea"] = (typeof PropietarioMonitoreo.custentity_ht_cl_primernombre == 'undefined' ? '' : PropietarioMonitoreo.custentity_ht_cl_primernombre) + ' ' + (typeof PropietarioMonitoreo.custentity_ht_cl_segundonombre == 'undefined' ? '' : PropietarioMonitoreo.custentity_ht_cl_segundonombre);
                PxAdmin["ApellidosMonitorea"] = (typeof PropietarioMonitoreo.custentity_ht_cl_apellidopaterno == 'undefined' ? '' : PropietarioMonitoreo.custentity_ht_cl_apellidopaterno) + ' ' + (typeof PropietarioMonitoreo.custentity_ht_cl_apellidomaterno == 'undefined' ? '' : PropietarioMonitoreo.custentity_ht_cl_apellidomaterno);
                PxAdmin["DireccionMonitorea"] = PropietarioMonitoreo.provincia;
                PxAdmin["ConvencionalMonitorea"] = convencional;
                PxAdmin["CelularMonitorea"] = PropietarioMonitoreo.phone.replace('+593', '0');
                PxAdmin["EmailMonitorea"] = PropietarioMonitoreo.email;
            } else if (operacionOrden == OPERACION_ORDEN_CAMBIO_PROPIETARIO) {
                PxAdmin["IdentificadorMonitorea"] = PropietarioMonitoreo.vatregnumber;
                PxAdmin["NombreMonitorea"] = PropietarioMonitoreo.custentity_ht_cl_primernombre + ' ' + PropietarioMonitoreo.custentity_ht_cl_segundonombre;
                PxAdmin["ApellidosMonitorea"] = PropietarioMonitoreo.custentity_ht_cl_apellidopaterno + ' ' + PropietarioMonitoreo.custentity_ht_cl_apellidomaterno;
                PxAdmin["DireccionMonitorea"] = PropietarioMonitoreo.provincia;
                PxAdmin["ConvencionalMonitorea"] = convencional;
                PxAdmin["CelularMonitorea"] = PropietarioMonitoreo.phone.replace('+593', '0');
                PxAdmin["EmailMonitorea"] = PropietarioMonitoreo.email;
            }
        }

        const setCoberturaValues = (PxAdmin, Cobertura, operacionOrden) => {
            PxAdmin["Servicio"] = [];
        }

        const obtenerTipoDocumentoTelematic = (codigoTipoDocumento) => {
            let telematicDocumenType = "";
            if (codigoTipoDocumento == "08" || codigoTipoDocumento == "06") {
                telematicDocumenType = 1;
            } else if (codigoTipoDocumento == "04") {
                telematicDocumenType = 2;
            } else if (codigoTipoDocumento == "05") {
                telematicDocumenType = 3;
            }
            return telematicDocumenType;
        }

        const getPropietarioTelematic = (Propietario, Subsidiaria, operacion) => {
            let customer = {};
            if (operacion == TELEMATIC_OPERACION_INSTALACION_NUEVA) {
                customer.username = Propietario.htEmail.amiEmail;
                customer.first_name = Propietario.custentity_ht_cl_primernombre;
                customer.last_name = Propietario.custentity_ht_cl_apellidopaterno;
                customer.email = Propietario.htEmail.mainEmail;
                customer.id = Propietario.custentity_ht_customer_id_telematic;
                customer.is_active = true;
                customer.account_type = 1;
                customer.customer = {
                    company_code: Subsidiaria.taxidnum,
                    identity_document_number: Propietario.vatregnumber,
                    identity_document_type: obtenerTipoDocumentoTelematic(Propietario.custentityts_ec_cod_tipo_doc_identidad),
                    business_name: Propietario.companyname || "",
                    phone_number: Propietario.phone,
                    emergency_phone_number: Subsidiaria.custrecord_telematic_emergency_phone_num,
                    assistance_phone_number: Subsidiaria.custrecord_telematic_assistanc_phone_num,
                    technical_support_email: Subsidiaria.custrecord_telematic_technic_support_ema
                }
            } else if (operacion == TELEMATIC_OPERACION_DESINSTALACION_DISPOSITIVO) {
                customer.id = Propietario.custentity_ht_customer_id_telematic;
                customer.username = Propietario.htEmail.amiEmail;
                customer.first_name = Propietario.custentity_ht_cl_primernombre;
                customer.last_name = Propietario.custentity_ht_cl_apellidopaterno;
                customer.customer = {
                    company_code: Subsidiaria.taxidnum,
                    identity_document_number: Propietario.vatregnumber
                }

            } else if (operacion == TELEMATIC_OPERACION_ACTUALIZACION_DATOS_CLIENTES) {
                customer.username = Propietario.htEmail.amiEmail;
                customer.first_name = Propietario.custentity_ht_cl_primernombre;
                customer.last_name = Propietario.custentity_ht_cl_apellidopaterno;
                customer.email = Propietario.htEmail.mainEmail;
                customer.id = Propietario.custentity_ht_customer_id_telematic;
                customer.is_active = true;
                customer.account_type = 1;
                customer.customer = {
                    company_code: Subsidiaria.taxidnum,
                    identity_document_number: Propietario.vatregnumber,
                    identity_document_type: obtenerTipoDocumentoTelematic(Propietario.custentityts_ec_cod_tipo_doc_identidad),
                    business_name: Propietario.companyname || "",
                    phone_number: Propietario.phone,
                    emergency_phone_number: Subsidiaria.custrecord_telematic_emergency_phone_num,
                    assistance_phone_number: Subsidiaria.custrecord_telematic_assistanc_phone_num,
                    technical_support_email: Subsidiaria.custrecord_telematic_technic_support_ema
                }
            } else if (operacion == TELEMATIC_OPERACION_ACTUALIZACION_COBERTURAS) {
                customer.username = Propietario.htEmail.amiEmail;
                customer.first_name = Propietario.custentity_ht_cl_primernombre;
                customer.last_name = Propietario.custentity_ht_cl_apellidopaterno;
                customer.email = Propietario.htEmail.mainEmail;
                customer.id = Propietario.custentity_ht_customer_id_telematic;
                customer.is_active = true;
                customer.account_type = 1;
                customer.customer = {
                    company_code: Subsidiaria.taxidnum,
                    identity_document_number: Propietario.vatregnumber,
                    identity_document_type: obtenerTipoDocumentoTelematic(Propietario.custentityts_ec_cod_tipo_doc_identidad),
                    business_name: Propietario.companyname || "",
                    phone_number: Propietario.phone,
                    emergency_phone_number: Subsidiaria.custrecord_telematic_emergency_phone_num,
                    assistance_phone_number: Subsidiaria.custrecord_telematic_assistanc_phone_num,
                    technical_support_email: Subsidiaria.custrecord_telematic_technic_support_ema
                }
            }
            return customer;
        }

        const getVehiculoTelematic = (Vehiculo, operacion) => {
            let asset = {};
            if (operacion == TELEMATIC_OPERACION_INSTALACION_NUEVA) {
                let tipoVehiculoTelematic = Vehiculo["custrecord_ht_bien_tipoterrestre.custrecord_ht_tt_idtelematic"];
                asset.id = Vehiculo.custrecord_ht_bien_id_telematic;
                asset.product = Vehiculo.producto;
                asset.name = Vehiculo.custrecord_ht_bien_placa ? Vehiculo.custrecord_ht_bien_placa : "S/P";
                asset.description = Vehiculo.name.substring(0, 100);//Vehiculo.altname.substring(0, 100);
                asset.custom_name = asset.name == "S/P" ? "" : asset.name;
                //asset.aceptation_date = obtenerFechaHoraConFormatoConTimezone(fechaInicioCobertura);
                asset.active = true;
                asset.asset_type = tipoVehiculoTelematic;
                asset.product_expire_date = obtenerFechaHoraConFormatoConTimezone(Vehiculo.fechaFinCobertura);
                asset.contract_code = "";
                asset.attributes = obtenerAtributos(tipoVehiculoTelematic, Vehiculo);
                asset.doors_sensors = Vehiculo.custrecord_ht_bien_numeropuertas || 0;
                asset.cod_sys = Number(Vehiculo.name.replace(/\D/g, '')).toString();
            } else if (operacion == TELEMATIC_OPERACION_DESINSTALACION_DISPOSITIVO) {
                asset.id = Vehiculo.custrecord_ht_bien_id_telematic;
                asset.name = Vehiculo.custrecord_ht_bien_placa ? Vehiculo.custrecord_ht_bien_placa : "S/P";
                asset.cod_sys = Vehiculo.name;
            } else if (operacion == TELEMATIC_OPERACION_ACTUALIZACION_COBERTURAS) {
                let tipoVehiculoTelematic = Vehiculo["custrecord_ht_bien_tipoterrestre.custrecord_ht_tt_idtelematic"];
                asset.id = Vehiculo.custrecord_ht_bien_id_telematic;
                asset.product = Vehiculo.producto;
                asset.name = Vehiculo.custrecord_ht_bien_placa ? Vehiculo.custrecord_ht_bien_placa : "S/P";
                asset.description = Vehiculo.name.substring(0, 100);//Vehiculo.altname.substring(0, 100);
                asset.custom_name = asset.name == "S/P" ? "" : asset.name;
                //asset.aceptation_date = obtenerFechaHoraConFormatoConTimezone(fechaInicioCobertura);
                asset.active = true;
                asset.asset_type = tipoVehiculoTelematic;
                asset.product_expire_date = obtenerFechaHoraConFormatoConTimezone(Vehiculo.fechaFinCobertura);
                asset.contract_code = Vehiculo.custrecord_ht_ot_producto;
                asset.attributes = obtenerAtributos(tipoVehiculoTelematic, Vehiculo);
                asset.doors_sensors = Vehiculo.custrecord_ht_bien_numeropuertas || 0;
                asset.cod_sys = Number(Vehiculo.name.replace(/\D/g, '')).toString();
            }
            return asset;
        }

        getDispositivoTelematic = (Dispositivo, Subsidiaria, operacion) => {
            let device = {};
            if (operacion == TELEMATIC_OPERACION_INSTALACION_NUEVA) {
                var servidorRelacionado = Dispositivo["custrecord_ht_mc_modelo.custrecord_ht_md_servidor_relacionado"];
                servidorRelacionado = servidorRelacionado.length ? servidorRelacionado[0].value : "";
                var servidor = Dispositivo["custrecord_ht_mc_servidor"];
                servidor = servidor.length ? servidor[0].value : "";
                device.report_from = Dispositivo["custrecord_ht_mc_servidor.custrecord_ht_mc_servidor_id_telematic"];
                device.active = true;
                if (Dispositivo["custrecord_ht_mc_modelo.custrecord_ht_dd_mod_disp_id_telematic"] && servidorRelacionado == servidor)
                    device.model = Dispositivo["custrecord_ht_mc_modelo.custrecord_ht_dd_mod_disp_id_telematic"];
                device.company_code = Subsidiaria.taxidnum;
                device.id = Dispositivo.name;
            } else if (operacion == TELEMATIC_OPERACION_DESINSTALACION_DISPOSITIVO) {
                device.id = Dispositivo.name;
                device.active = false;
            } else if (operacion == TELEMATIC_OPERACION_ACTUALIZACION_DATOS_TECNICOS) {
                var servidorRelacionado = Dispositivo["custrecord_ht_mc_modelo.custrecord_ht_md_servidor_relacionado"];
                servidorRelacionado = servidorRelacionado.length ? servidorRelacionado[0].value : "";
                var servidor = Dispositivo["custrecord_ht_mc_servidor"];
                servidor = servidor.length ? servidor[0].value : "";
                device.report_from = Dispositivo["custrecord_ht_mc_servidor.custrecord_ht_mc_servidor_id_telematic"];
                device.active = true;
                if (Dispositivo["custrecord_ht_mc_modelo.custrecord_ht_dd_mod_disp_id_telematic"] && servidorRelacionado == servidor)
                    device.model = Dispositivo["custrecord_ht_mc_modelo.custrecord_ht_dd_mod_disp_id_telematic"];
                device.company_code = Subsidiaria.taxidnum;
                device.id = Dispositivo.name;
            } else if (operacion == TELEMATIC_OPERACION_CORTE_SIM) {
                device.id = Dispositivo.name;
                device.active = false;
            }
            return device;
        }

        const idItemType = (itemId) => {
            if (!itemId) return "";
            let item = search.lookupFields({
                type: search.Type.SERVICE_ITEM,
                id: itemId,
                columns: ["unitstype"]
            });
            if (item.unitstype) item.unitstype = item.unitstype.length ? item.unitstype[0].value : "";
            return item;
        }

        const obtenerPeriodoCobertura = (ordenServicio) => {
            let cantidad = 0;
            let itemLines = ordenServicio.getLineCount('item');
            for (let j = 0; j < itemLines; j++) {
                let items = ordenServicio.getSublistValue({ sublistId: 'item', fieldId: 'item', line: j });
                var itemTypeId = idItemType(items);
                if (itemTypeId.unitstype == "6") {
                    let quantity = Number(ordenServicio.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: j }));
                    cantidad = cantidad + quantity;
                }
            }
            return cantidad;
        }

        const obtenerCamposOrdenServicio = (ordenServicioId) => {
            let ordenVenta = record.load({ type: record.Type.SALES_ORDER, id: ordenServicioId });
            let Propietario = obtenerPropietario(ordenVenta.getValue('entity'));
            let vehiculo = obtenerVehiculo(ordenVenta.getValue('custbody_ht_so_bien'));
            let PropietarioMonitoreo = obtenerPropietarioMonitoreo(ordenVenta, null);
            let order = record.load({ type: 'salesorder', id: ordenServicioId });
            let clienteNew = order.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente', line: 0 });
            let NuevoPropietario = obtenerNewPropietario(clienteNew);
            //obtenerNuevoPropietario(ordenVenta, null);

            return { vehiculo, Propietario, PropietarioMonitoreo, NuevoPropietario };
        }

        const obtenerCamposOrdenTrabajo = (ordenTrabajoId) => {
            let Convenio = {};
            let ordenTrabajo = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
            let salesOrderId = ordenTrabajo.getValue('custrecord_ht_ot_orden_servicio');
            let ordenVenta = record.load({ type: record.Type.SALES_ORDER, id: salesOrderId });
            let bien = ordenVenta.getValue('custbody_ht_so_bien');
            let sql4 = 'SELECT custrecord_ht_bien_conveniovehiculo FROM customrecord_ht_record_bienes WHERE id = ?'
            let resultSet4 = query.runSuiteQL({ query: sql4, params: [bien] });
            let results4 = resultSet4.asMappedResults();
            //log.debug('RESULTTTTT', results4);
            let periodoCobertura = obtenerPeriodoCobertura(ordenVenta);
            let Dispositivo = obtenerDispositivo(ordenTrabajo.getValue('custrecord_ht_ot_serieproductoasignacion'));
            Dispositivo.producto = ordenTrabajo.getText('custrecord_ht_ot_producto') || "";
            let vehiculo = obtenerVehiculo(ordenTrabajo.getValue('custrecord_ht_ot_vehiculo'));
            vehiculo.producto = ordenTrabajo.getText('custrecord_ht_ot_producto') || "";
            vehiculo.fechaInicioCobertura = ordenVenta.getValue('trandate');
            vehiculo.fechaFinCobertura = new Date(vehiculo.fechaInicioCobertura.getFullYear(), vehiculo.fechaInicioCobertura.getMonth() + periodoCobertura, vehiculo.fechaInicioCobertura.getDate());
            let Propietario = obtenerPropietario(ordenTrabajo.getValue('custrecord_ht_ot_cliente_id'));
            let PropietarioMonitoreo = obtenerPropietarioMonitoreo(ordenVenta, ordenTrabajo.getValue('custrecord_ht_ot_item'));

            let Cobertura = obtenerCobertura(ordenTrabajo);
            let pxadminfinalizacion = ordenTrabajo.getValue('custrecord_ht_ot_pxadminfinalizacion');
            let confirmaciontelamatic = ordenTrabajo.getValue('custrecord_ht_ot_confirmaciontelamatic');
            let Subsidiaria = obtenerSubsidiaria(ordenVenta.getValue('subsidiary'));
            let Aseguradora = obtenerCanalDistribucion(ordenVenta.getValue('custbody_ht_os_companiaseguros'));
            let Concesionario = obtenerCanalDistribucion(ordenVenta.getValue('custbody_ht_os_concesionario'));
            let Financiera = obtenerCanalDistribucion(ordenVenta.getValue('custbody_ht_os_bancofinanciera'));
            if (results4.length > 0) {
                Convenio = obtenerConvenio(results4[0]['custrecord_ht_bien_conveniovehiculo']);
            } else {
                Convenio = obtenerConvenio(ordenVenta.getValue('custbody_ht_os_convenio'));
            }

            let Commands = obtenerCommands(ordenTrabajo);
            let Servicios = ordenTrabajo.getText("custrecord_ht_ot_servicios_commands");
            //let Producto = ordenTrabajo.getText('custrecord_ht_ot_producto');
            log.debug('CONVENIOOOO', Convenio)
            log.debug('PROPIETARIOMON', PropietarioMonitoreo)
            return { Dispositivo, vehiculo, Propietario, PropietarioMonitoreo, Cobertura, Subsidiaria, Aseguradora, Concesionario, Financiera, Convenio, Commands, Servicios, pxadminfinalizacion, confirmaciontelamatic, salesOrderId };
        }

        const envioPXInstalacionDispositivo = (ordenTrabajoId) => {
            let { Dispositivo, vehiculo, Propietario, PropietarioMonitoreo, Cobertura, pxadminfinalizacion, Aseguradora, Concesionario, Financiera, Convenio, Servicios, salesOrderId } = obtenerCamposOrdenTrabajo(ordenTrabajoId);
            if (!pxadminfinalizacion) {
                let registroImpulsoPlataforma = crearRegistroImpulsoPlataforma(ordenTrabajoId, null, "enviado", "PX");
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setEmptyFields(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_INSTALACION;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_INSTALACION);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_INSTALACION);
                setPropietarioValues(PxAdmin, Propietario, OPERACION_ORDEN_INSTALACION);
                setAseguradoraValues(PxAdmin, Aseguradora, OPERACION_ORDEN_INSTALACION);
                setConcesionarioValues(PxAdmin, Concesionario, OPERACION_ORDEN_INSTALACION);
                setFinancieraValues(PxAdmin, Financiera, OPERACION_ORDEN_INSTALACION);
                setConvenioValues(PxAdmin, Convenio, OPERACION_ORDEN_INSTALACION);
                setMonitoreoValues(PxAdmin, PropietarioMonitoreo, OPERACION_ORDEN_INSTALACION);
                setCoberturaValues(PxAdmin, Cobertura);
                PxAdmin["ServiciosInstalados"] = Servicios.join("/");
                log.error("Body PX Instalacion Dispositivo", PxAdmin);
                let response = sendPXServer(PxAdmin);
                log.error("Response PX Instalacion Dispositivo", response.body);
                if (response.body == 1) {
                    // //TODO: cambiar a false para pruebas, solo para validación
                    let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                    updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    updatePxadmin.save();
                    pxadminfinalizacion = true;
                    actualizarRegistroImpulsoPlataforma(registroImpulsoPlataforma, "exitoso", response.body);
                } else {
                    actualizarRegistroImpulsoPlataforma(registroImpulsoPlataforma, "error", response.body);
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
            let { Dispositivo, vehiculo, pxadminfinalizacion, salesOrderId } = obtenerCamposOrdenTrabajo(ordenTrabajoId);

            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setEmptyFields(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_DESINSTALACION;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_DESINSTALACION);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_DESINSTALACION);

                log.error("Body PX Desinstalacion Dispositivo", PxAdmin);
                let response = sendPXServer(PxAdmin);
                log.error("response", response);
                log.error("Response PX Desinstalacion Dispositivo", response.body);
                if (response.body == 1) {
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
                setEmptyFields(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_REINSTALACION;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_REINSTALACION);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_REINSTALACION);
                setCoberturaValues(PxAdmin, Cobertura);
                log.error("Body PX Reinstalacion Dispositivo", PxAdmin);
                let response = sendPXServer(PxAdmin);
                log.error("Response PX Reinstalacion Dispositivo", response.body);
                if (response.body == 1) {
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
                setEmptyFields(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_RENOVACION;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_RENOVACION);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_RENOVACION);
                log.error("Body PX Renovacion Dispositivo", PxAdmin);
                let response = sendPXServer(PxAdmin);
                log.error("Response PX Renovacion Dispositivo", response.body);
                if (response.body == 1) {
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
                setEmptyFields(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_MODIFICACION;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_MODIFICACION);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_MODIFICACION);
                setCoberturaValues(PxAdmin, Cobertura);

                log.error("Body PX Modificacion Dispositivo", PxAdmin);
                let response = sendPXServer(PxAdmin);
                log.error("Response PX Modificacion Dispositivo", response.body);
                if (response.body == 1) {
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

        const envioPXMantenimientoChequeoDispositivo = (ordenTrabajoId, activofijoId) => {
            let { Dispositivo, vehiculo, Cobertura, salesOrderId } = obtenerCamposOrdenTrabajo(ordenTrabajoId);
            let registroImpulsoPlataforma = crearRegistroImpulsoPlataforma(ordenTrabajoId, activofijoId, "enviado", "PX");
            let PxAdmin = {};
            setAuthenticationValues(PxAdmin);
            setEmptyFields(PxAdmin);
            setSalesOrderValues(PxAdmin, salesOrderId);
            PxAdmin["OperacionOrden"] = OPERACION_ORDEN_MANTENIMIENTO_CHEQUEO;
            setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_MANTENIMIENTO_CHEQUEO);
            setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_MANTENIMIENTO_CHEQUEO);
            setCoberturaValues(PxAdmin, Cobertura);
            log.error("Body PX Mantenimiento Chequeo Dispositivo", PxAdmin);
            let response = sendPXServer(PxAdmin);
            log.error("Response PX Mantenimiento Chequeo Dispositivo", response.body);
            if (response.body == 1) {
                actualizarRegistroImpulsoPlataforma(registroImpulsoPlataforma, "exitoso", response.body);
                return true;
            } else {
                actualizarRegistroImpulsoPlataforma(registroImpulsoPlataforma, "error", response.body);
                return false;
            }
        }

        const envioPXChequeoComponentes = (ordenTrabajoId) => {
            let { Dispositivo, vehiculo, Cobertura, pxadminfinalizacion, salesOrderId } = obtenerCamposOrdenTrabajo(ordenTrabajoId);

            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setEmptyFields(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_CHEQUEO_COMPONENTES;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_CHEQUEO_COMPONENTES);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_CHEQUEO_COMPONENTES);
                setCoberturaValues(PxAdmin, Cobertura);
                log.error("Body PX Chequeo Componentes", PxAdmin);
                let response = sendPXServer(PxAdmin);
                log.error("Response PX Chequeo Componentes", response.body);
                if (response.body == 1) {
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
                setEmptyFields(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_VENTA_SEGUROS;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_VENTA_SEGUROS);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_VENTA_SEGUROS);
                setCoberturaValues(PxAdmin, Cobertura);
                log.error("Body PX Venta Seguros", PxAdmin);
                let response = sendPXServer(PxAdmin);
                log.error("Response PX Venta Seguros", response.body);
                if (response.body == 1) {
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
                setEmptyFields(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_RENOVACION_SEGUROS;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_RENOVACION_SEGUROS);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_RENOVACION_SEGUROS);
                setCoberturaValues(PxAdmin, Cobertura);
                log.error("Body PX Renovacion Seguro", PxAdmin);
                let response = sendPXServer(PxAdmin);
                log.error("Response PX Renovacion Seguro", response.body);
                if (response.body == 1) {
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
            let { vehiculo, Propietario, PropietarioMonitoreo, NuevoPropietario } = obtenerCamposOrdenServicio(ordenServicioId);
            let PxAdmin = {};
            setAuthenticationValues(PxAdmin);
            setEmptyFields(PxAdmin);
            setSalesOrderValues(PxAdmin, ordenServicioId);
            PxAdmin["OperacionOrden"] = OPERACION_ORDEN_CAMBIO_PROPIETARIO;
            setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_CAMBIO_PROPIETARIO);
            setPropietarioValues(PxAdmin, NuevoPropietario, OPERACION_ORDEN_CAMBIO_PROPIETARIO);
            setMonitoreoValues(PxAdmin, PropietarioMonitoreo, OPERACION_ORDEN_CAMBIO_PROPIETARIO);
            PxAdmin["OperacionDispositivo"] = "A";
            log.error("Body PX Cambio Propietario", PxAdmin);
            let response = sendPXServer(PxAdmin);
            log.error("Response PX Cambio Propietario", response.body);
            return true;
        }

        const envioPXInstalacionOtrosProductos = (ordenTrabajoId) => {
            let { Dispositivo, vehiculo, pxadminfinalizacion, salesOrderId } = obtenerCamposOrdenTrabajo(ordenTrabajoId);
            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setEmptyFields(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_INSTALACION_OTROS_PRODUCTOS;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_INSTALACION_OTROS_PRODUCTOS);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_INSTALACION_OTROS_PRODUCTOS);
                log.error("PxAdmin", PxAdmin);
                log.error("Body PX Instalacion Otros Productos", PxAdmin);
                let response = sendPXServer(PxAdmin);
                log.error("Response PX Instalacion Otros Productos", response.body);
                if (response.body == 1) {
                    order.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    order.save();
                    pxadminfinalizacion = true;
                }
            }
            if (!pxadminfinalizacion) {
                let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
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
                setEmptyFields(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_DESINSTALACION_OTROS_PRODUCTOS;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_DESINSTALACION_OTROS_PRODUCTOS);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_DESINSTALACION_OTROS_PRODUCTOS);
                setCoberturaValues(PxAdmin, Cobertura);
                log.error("Body PX Instalacion Otros Productos", PxAdmin);
                let response = sendPXServer(PxAdmin);
                log.error("Response PX Instalacion Otros Productos", response.body);
                if (response.body == 1) {
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
                setEmptyFields(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_CHEQUEO_OTROS_PRODUCTOS;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_CHEQUEO_OTROS_PRODUCTOS);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_CHEQUEO_OTROS_PRODUCTOS);
                setCoberturaValues(PxAdmin, Cobertura);
                log.error("Body PX Chequeo Otros Productos", PxAdmin);
                let response = sendPXServer(PxAdmin);
                log.error("Response PX Chequeo Otros Productos", response.body);
                if (response.body == 1) {
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
                setEmptyFields(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_REINSTALACION_OTROS_PRODUCTOS;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_REINSTALACION_OTROS_PRODUCTOS);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_REINSTALACION_OTROS_PRODUCTOS);
                setCoberturaValues(PxAdmin, Cobertura);
                log.error("Body PX ReInstalacion Otros Productos", PxAdmin);
                let response = sendPXServer(PxAdmin);
                log.error("Response PX ReInstalacion Otros Productos", response.body);
                if (response.body == 1) {
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
                setEmptyFields(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_VENTA_SERVICIOS;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_VENTA_SERVICIOS);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_VENTA_SERVICIOS);
                setCoberturaValues(PxAdmin, Cobertura);
                log.error("Body PX Venta Servicios", PxAdmin);
                let response = sendPXServer(PxAdmin);
                log.error("Response PX Venta Servicios", response.body);
                if (response.body == 1) {
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
                setEmptyFields(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_ACTUALIZACION_DATOS_PROPIETARIOS;
                //setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_ACTUALIZACION_DATOS_PROPIETARIOS);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_ACTUALIZACION_DATOS_PROPIETARIOS);
                setPropietarioValues(PxAdmin, Propietario, OPERACION_ORDEN_ACTUALIZACION_DATOS_PROPIETARIOS);
                log.error("Body PX Actualizacion Datos Propietario", PxAdmin);
                let response = sendPXServer(PxAdmin);
                log.error("Response PX Actualizacion Datos Propietario", response.body);
                if (response.body == 1) {
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

        // estadoSim: ACT, INA, COR
        const envioPXActualizacionEstado = (dispositivoId, vehiculoId, estadoSim) => {
            let Dispositivo = obtenerDispositivo(dispositivoId);
            let vehiculo = obtenerVehiculo(vehiculoId);

            let PxAdmin = {};
            setAuthenticationValues(PxAdmin);
            setEmptyFields(PxAdmin);
            PxAdmin["NumeroOrden"] = '0';
            PxAdmin["OperacionOrden"] = OPERACION_ORDEN_ACTUALIZACION_ESTADOS;
            setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_ACTUALIZACION_ESTADOS);
            setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_ACTUALIZACION_ESTADOS);
            PxAdmin["EstadoSim"] = estadoSim;
            log.error("Body PX Actualizacion Estado", PxAdmin);
            let response = sendPXServer(PxAdmin);
            log.error("Response PX Actualizacion Estado", response.body);
            return true;
        }

        const envioPXRegistrarCanal = (ordenTrabajoId) => {
            let { Dispositivo, vehiculo, pxadminfinalizacion, salesOrderId } = obtenerCamposOrdenTrabajo(ordenTrabajoId);

            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setEmptyFields(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_REGISTRAR_CANAL;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_REGISTRAR_CANAL);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_ACTUALIZACION_ESTADOS);
                log.error("Body PX Registrar Canal", PxAdmin);
                let response = sendPXServer(PxAdmin);
                log.error("Body PX Registrar Canal", PxAdmin);

                if (response.body == 1) {
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
                setEmptyFields(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_INSTALACION_COMPONENTES;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_INSTALACION_COMPONENTES);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_INSTALACION_COMPONENTES);
                setCoberturaValues(PxAdmin, Cobertura);
                log.error("Body PX Instalacion Componentes", PxAdmin);
                let response = sendPXServer(PxAdmin);
                log.error("Response PX Instalacion Componentes", response.body);

                if (response.body == 1) {
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

        const envioTelecInstalacionNueva = (ordenTrabajoId) => {
            let confirm = false;
            let { Dispositivo, vehiculo, Propietario, PropietarioMonitoreo, confirmaciontelamatic, Subsidiaria, Commands, salesOrderId } = obtenerCamposOrdenTrabajo(ordenTrabajoId);
            if (!confirmaciontelamatic) {
                let registroImpulsoPlataforma = crearRegistroImpulsoPlataforma(ordenTrabajoId, null, "enviado", "Telematic");
                let telematic = {};
                telematic.monitoreo = getPropietarioTelematic(PropietarioMonitoreo, Subsidiaria, TELEMATIC_OPERACION_INSTALACION_NUEVA);
                telematic.customer = getPropietarioTelematic(Propietario, Subsidiaria, TELEMATIC_OPERACION_INSTALACION_NUEVA);
                telematic.asset = getVehiculoTelematic(vehiculo, TELEMATIC_OPERACION_INSTALACION_NUEVA);
                telematic.asset.owner = Propietario.custentity_ht_customer_id_telematic /*|| ""*/;
                telematic.device = getDispositivoTelematic(Dispositivo, Subsidiaria, TELEMATIC_OPERACION_INSTALACION_NUEVA);
                telematic.command = Commands;
                log.error("Body Telematic Nueva Instalacion", telematic);
                let myRestletResponse = ejecutarRestlet(JSON.stringify(telematic), 'customscript_ns_rs_new_installation', 'customdeploy_ns_rs_new_installation');
                saveFile(Dispositivo.name, myRestletResponse.body);
                let response = JSON.parse(myRestletResponse.body);
                log.error('Response Telematic Nueva Instalacion', response);
                if (response.results) imprimirResultados(response.results);
                if (response.status == "ok") {
                    aprobarTelematic(ordenTrabajoId);
                    actualizarIdVehiculo(vehiculo.internalid[0].value, response.data.asset.id);//^ aquí se asigna el id telemtics en el registro del bien de ns
                    actualizarIdCliente(Propietario.internalid[0].value, response.data.customer.id);
                    confirmaciontelamatic = true;
                    actualizarRegistroImpulsoPlataforma(registroImpulsoPlataforma, "exitoso", response.message);
                    confirm = true
                } else {
                    log.error("Response Message", response.message);
                    actualizarRegistroImpulsoPlataforma(registroImpulsoPlataforma, "error", response.message);
                }
            }

            if (!confirmaciontelamatic) {
                let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updateTelematic.save();
                return false;
            }
            return confirm;
        }

        const envioTelecDesinstalacionDispositivoActivoFijo = (ordenTrabajoId, activofijoId) => {
            let { Dispositivo, vehiculo, Propietario, Subsidiaria } = obtenerCamposOrdenTrabajo(ordenTrabajoId);

            let registroImpulsoPlataforma = crearRegistroImpulsoPlataforma(ordenTrabajoId, activofijoId, "enviado", "Telematic");
            let telematic = {};
            telematic.customer = getPropietarioTelematic(Propietario, Subsidiaria, TELEMATIC_OPERACION_DESINSTALACION_DISPOSITIVO);
            telematic.asset = getVehiculoTelematic(vehiculo, TELEMATIC_OPERACION_DESINSTALACION_DISPOSITIVO);
            telematic.device = getDispositivoTelematic(Dispositivo, Subsidiaria, TELEMATIC_OPERACION_DESINSTALACION_DISPOSITIVO);

            log.error("Body Telematic Desinstalacion Dispositivo AF", telematic);
            let myRestletResponse = ejecutarRestlet(JSON.stringify(telematic), 'customscript_ns_rs_uninstallation_devise', 'customdeploy_ns_rs_uninstallation_devise');
            //saveFile(Dispositivo.name, myRestletResponse.body);
            let response = JSON.parse(myRestletResponse.body);
            log.error('Response Telematic Desinstalacion Dispositivo AF', response);
            if (response.results) imprimirResultados(response.results);
            if (response.status == "ok") {
                actualizarRegistroImpulsoPlataforma(registroImpulsoPlataforma, "exitoso", response.message);
                return true;
            } else {
                log.error("Response Message", response.message);
                actualizarRegistroImpulsoPlataforma(registroImpulsoPlataforma, "error", response.message);
                return false;
            }
        }

        const envioTelecDesinstalacionDispositivo = (ordenTrabajoId) => {
            let confirm = false;
            let { Dispositivo, vehiculo, Subsidiaria, Propietario, confirmaciontelamatic } = obtenerCamposOrdenTrabajo(ordenTrabajoId);

            if (!confirmaciontelamatic) {
                let registroImpulsoPlataforma = crearRegistroImpulsoPlataforma(ordenTrabajoId, null, "enviado", "Telematic");

                let telematic = {};
                telematic.customer = getPropietarioTelematic(Propietario, Subsidiaria, TELEMATIC_OPERACION_DESINSTALACION_DISPOSITIVO);
                telematic.asset = getVehiculoTelematic(vehiculo, TELEMATIC_OPERACION_DESINSTALACION_DISPOSITIVO);
                telematic.device = getDispositivoTelematic(Dispositivo, Subsidiaria, TELEMATIC_OPERACION_DESINSTALACION_DISPOSITIVO);

                log.error("Body Telematic Desinstalacion Dispositivo", telematic);
                let myRestletResponse = ejecutarRestlet(JSON.stringify(telematic), 'customscript_ns_rs_uninstallation_devise', 'customdeploy_ns_rs_uninstallation_devise');
                saveFile(Dispositivo.name, myRestletResponse.body);
                let response = JSON.parse(myRestletResponse.body);
                log.error('Response Telematic Desinstalacion Dispositivo', response);
                if (response.results) imprimirResultados(response.results);
                if (response.status == "ok") {
                    aprobarTelematic(ordenTrabajoId);
                    actualizarRegistroImpulsoPlataforma(registroImpulsoPlataforma, "exitoso", response.message);
                    confirmaciontelamatic = true;
                    confirm = true;
                } else {
                    log.error("Response Message", response.message);
                    actualizarRegistroImpulsoPlataforma(registroImpulsoPlataforma, "error", response.message);
                }
            }
            if (!confirmaciontelamatic) {
                let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updateTelematic.save();
            }
            return confirm;
        }

        const envioTelecCambioPropietario = (id) => {
            try {
                let order = record.load({ type: 'salesorder', id: id });
                let clienteNew = order.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente', line: 0 });
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

                let telematic = {
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

                log.error("Body Telematic Cambio Propietario", telematic);
                let myRestletResponse = https.requestRestlet({
                    body: JSON.stringify(telematic),
                    deploymentId: 'customdeploy_ns_rs_new_owner',
                    scriptId: 'customscript_ns_rs_new_owner',
                    headers: obtenerHeaders()
                });
                log.error("Response Telematic Cambio Propietario", JSON.parse(myRestletResponse.body));
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
                headers: obtenerHeaders(),
            });
            return myRestletResponse;
        }

        const obtenerPropietario = (id) => {
            if (!id) return;
            let result = {};
            let correoEmail = '';
            let celular = '';
            let convencional = '';
            let city = '';
            let sql = 'SELECT custrecord_ht_email_email as email FROM customrecord_ht_record_correoelectronico WHERE custrecord_ht_email_tipoemail = 1 AND custrecord_ht_ce_enlace = ?';
            let resultSet = query.runSuiteQL({ query: sql, params: [id] });
            let results = resultSet.asMappedResults();
            correoEmail = results.length ? results[0]['email'] : correoEmail;
            let sql2 = 'SELECT custrecord_ht_campo_txt_telefono as celular FROM customrecord_ht_registro_telefono WHERE custrecord_ht_campo_list_tipo_telefono = 1 AND custrecord_ht_campo_lbl_entidad_telefono = ?'
            let resultSet2 = query.runSuiteQL({ query: sql2, params: [id] });
            let results2 = resultSet2.asMappedResults();
            celular = results2.length ? results2[0]['celular'].replace('+593', '0') : celular;
            let sql3 = 'SELECT custrecord_ht_campo_txt_telefono as convencional FROM customrecord_ht_registro_telefono WHERE custrecord_ht_campo_list_tipo_telefono = 10 AND custrecord_ht_campo_lbl_entidad_telefono = ?'
            let resultSet3 = query.runSuiteQL({ query: sql3, params: [id] });
            let results3 = resultSet3.asMappedResults();
            convencional = results3.length ? results3[0]['convencional'].replace('+593', '0') : convencional;
            let sql4 = 'SELECT addressbookaddress FROM customeraddressbook WHERE entity = ?'
            let resultSet4 = query.runSuiteQL({ query: sql4, params: [id] });
            let results4 = resultSet4.asMappedResults();
            if (results4.length > 0) {
                let sql5 = 'SELECT addr1, addr2, city, zip, country FROM customerAddressbookEntityAddress WHERE nkey = ?'
                let resultSet5 = query.runSuiteQL({ query: sql5, params: [results4[0]['addressbookaddress']] });
                let results5 = resultSet5.asMappedResults();
                if (results5.length > 0) {
                    city = (results5[0]['addr1'] == null ? '' : results5[0]['addr1']) + ' ' + (results5[0]['addr2'] == null ? '' : results5[0]['addr2']) + ' ' + (results5[0]['city'] == null ? '' : results5[0]['city']) + ' ' + (results5[0]['zip'] == null ? '' : results5[0]['zip']) + ' ' + (results5[0]['country'] == null ? '' : results5[0]['country'])
                }
            }
            let Propietario = search.lookupFields({
                type: 'customer', id: id,
                columns: ['entityid', 'custentity_ht_cl_primernombre', 'custentity_ht_cl_segundonombre',
                    'custentity_ht_cl_apellidopaterno',
                    'custentity_ht_cl_apellidomaterno',
                    'phone',
                    'homephone',
                    'email',
                    'vatregnumber',
                    'custentity_ht_customer_id_telematic',
                    'internalid',
                    'custentityts_ec_cod_tipo_doc_identidad',
                    'companyname',
                    'isperson'
                ]
            });
            //let provincia = ObtenerProvincia(id);
            result.htEmail = obtenerCorreosPropietario(id);
            result.entityid = Propietario.entityid.length ? Propietario.entityid : '';
            // result.phone = Propietario.phone.length ? Propietario.phone.replace('+593', '') : '';
            //result.email = Propietario.email.length ? Propietario.email : '';
            result.phone = celular;
            result.email = correoEmail;
            result.vatregnumber = Propietario.vatregnumber.length ? Propietario.vatregnumber : '';
            result.custentity_ht_customer_id_telematic = Propietario.custentity_ht_customer_id_telematic.length ? Propietario.custentity_ht_customer_id_telematic : '';
            result.internalid = Propietario.internalid.length ? Propietario.internalid : '';
            result.isperson = Propietario.isperson;
            // result.provincia = provincia.length ? provincia : '';
            result.provincia = city;
            result.companyname = Propietario.companyname || ""
            result.custentityts_ec_cod_tipo_doc_identidad = Propietario.custentityts_ec_cod_tipo_doc_identidad || "";
            // result.homephone = Propietario.homephone;
            result.homephone = convencional;
            if (result.isperson) {
                result.custentity_ht_cl_primernombre = Propietario.custentity_ht_cl_primernombre.length ? Propietario.custentity_ht_cl_primernombre : '';
                result.custentity_ht_cl_segundonombre = Propietario.custentity_ht_cl_segundonombre.length ? Propietario.custentity_ht_cl_segundonombre : '';
                result.custentity_ht_cl_apellidopaterno = Propietario.custentity_ht_cl_apellidopaterno.length ? Propietario.custentity_ht_cl_apellidopaterno : '';
                result.custentity_ht_cl_apellidomaterno = Propietario.custentity_ht_cl_apellidomaterno.length ? Propietario.custentity_ht_cl_apellidomaterno : '';
            } else {
                result.custentity_ht_cl_primernombre = Propietario.companyname;
            }
            log.error('result', result)
            return result;
        }

        const obtenerNewPropietario = (id) => {
            if (!id) return;
            let result = {};
            let correoEmail = '';
            let celular = '';
            let convencional = '';
            let city = '';
            let sql = 'SELECT custrecord_ht_email_email as email FROM customrecord_ht_record_correoelectronico WHERE custrecord_ht_email_tipoemail = 1 AND custrecord_ht_ce_enlace = ?';
            let resultSet = query.runSuiteQL({ query: sql, params: [id] });
            let results = resultSet.asMappedResults();
            correoEmail = results.length ? results[0]['email'] : correoEmail;
            let sql2 = 'SELECT custrecord_ht_campo_txt_telefono as celular FROM customrecord_ht_registro_telefono WHERE custrecord_ht_campo_list_tipo_telefono = 1 AND custrecord_ht_campo_lbl_entidad_telefono = ?'
            let resultSet2 = query.runSuiteQL({ query: sql2, params: [id] });
            let results2 = resultSet2.asMappedResults();
            celular = results2.length ? results2[0]['celular'].replace('+593', '0') : celular;
            let sql3 = 'SELECT custrecord_ht_campo_txt_telefono as convencional FROM customrecord_ht_registro_telefono WHERE custrecord_ht_campo_list_tipo_telefono = 10 AND custrecord_ht_campo_lbl_entidad_telefono = ?'
            let resultSet3 = query.runSuiteQL({ query: sql3, params: [id] });
            let results3 = resultSet3.asMappedResults();
            convencional = results3.length ? results3[0]['convencional'].replace('+593', '0') : convencional;
            let sql4 = 'SELECT addressbookaddress FROM customeraddressbook WHERE entity = ?'
            let resultSet4 = query.runSuiteQL({ query: sql4, params: [id] });
            let results4 = resultSet4.asMappedResults();
            if (results4.length > 0) {
                let sql5 = 'SELECT addr1, addr2, city, zip, country FROM customerAddressbookEntityAddress WHERE nkey = ?'
                let resultSet5 = query.runSuiteQL({ query: sql5, params: [results4[0]['addressbookaddress']] });
                let results5 = resultSet5.asMappedResults();
                if (results5.length > 0) {
                    city = (results5[0]['addr1'] == null ? '' : results5[0]['addr1']) + ' ' + (results5[0]['addr2'] == null ? '' : results5[0]['addr2']) + ' ' + (results5[0]['city'] == null ? '' : results5[0]['city']) + ' ' + (results5[0]['zip'] == null ? '' : results5[0]['zip']) + ' ' + (results5[0]['country'] == null ? '' : results5[0]['country'])
                }
            }
            let Propietario = search.lookupFields({
                type: 'customer', id: id,
                columns: ['entityid', 'custentity_ht_cl_primernombre', 'custentity_ht_cl_segundonombre',
                    'custentity_ht_cl_apellidopaterno',
                    'custentity_ht_cl_apellidomaterno',
                    'phone',
                    'homephone',
                    'email',
                    'vatregnumber',
                    'custentity_ht_customer_id_telematic',
                    'internalid',
                    'custentityts_ec_cod_tipo_doc_identidad',
                    'companyname',
                    'isperson'
                ]
            });
            //let provincia = ObtenerProvincia(id);
            result.htEmail = obtenerCorreosPropietario(id);
            result.entityid = Propietario.entityid.length ? Propietario.entityid : '';
            // result.phone = Propietario.phone.length ? Propietario.phone.replace('+593', '') : '';
            //result.email = Propietario.email.length ? Propietario.email : '';
            result.phone = celular;
            result.email = correoEmail;
            result.vatregnumber = Propietario.vatregnumber.length ? Propietario.vatregnumber : '';
            result.custentity_ht_customer_id_telematic = Propietario.custentity_ht_customer_id_telematic.length ? Propietario.custentity_ht_customer_id_telematic : '';
            result.internalid = Propietario.internalid.length ? Propietario.internalid : '';
            result.isperson = Propietario.isperson;
            // result.provincia = provincia.length ? provincia : '';
            result.provincia = city;
            result.companyname = Propietario.companyname || ""
            result.custentityts_ec_cod_tipo_doc_identidad = Propietario.custentityts_ec_cod_tipo_doc_identidad || "";
            // result.homephone = Propietario.homephone;
            result.homephone = convencional;
            if (result.isperson) {
                result.custentity_ht_cl_primernombre = Propietario.custentity_ht_cl_primernombre.length ? Propietario.custentity_ht_cl_primernombre : '';
                result.custentity_ht_cl_segundonombre = Propietario.custentity_ht_cl_segundonombre.length ? Propietario.custentity_ht_cl_segundonombre : '';
                result.custentity_ht_cl_apellidopaterno = Propietario.custentity_ht_cl_apellidopaterno.length ? Propietario.custentity_ht_cl_apellidopaterno : '';
                result.custentity_ht_cl_apellidomaterno = Propietario.custentity_ht_cl_apellidomaterno.length ? Propietario.custentity_ht_cl_apellidomaterno : '';
            } else {
                result.custentity_ht_cl_primernombre = Propietario.companyname;
            }
            log.error('result', result)
            return result;
        }

        const ObtenerProvincia = (id) => {
            if (!id) return;
            var searchObj = search.create({
                type: "customer",
                filters:
                    [
                        ["internalidnumber", "equalto", id]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "custrecord_ec_provincia",
                            join: "Address",
                            label: "Provincia"
                        })
                    ]
            });
            var searchResultCount = searchObj.runPaged().count;
            let provincia = '';
            if (searchResultCount != 0) {
                const searchResult = searchObj.run().getRange({ start: 0, end: 1 });
                provincia = searchResult[0].getText(searchObj.columns[0]);
            }
            return provincia;
        }

        const obtenerCorreosPropietario = (customerId) => {
            let result = {
                email: "",
                amiEmail: "",
                mainEmail: "",
                convenioEmail: ""
            };
            let resultSearch = search.create({
                type: "customrecord_ht_record_correoelectronico",
                filters: [
                    ["custrecord_ht_ce_enlace", "anyof", customerId]
                ],
                columns: [
                    search.createColumn({ name: "custrecord_ht_email_tipoemail", label: "HT CE Tipo de Email" }),
                    search.createColumn({ name: "custrecord_ht_email_email", label: "HT CE Email" }),
                    search.createColumn({ name: "custrecord_ht_email_emailprincipal", label: "HT Email Principal" })
                ]
            }).run().getRange(0, 1000);

            if (resultSearch.length) {
                for (let i = 0; i < resultSearch.length; i++) {
                    let email = resultSearch[i].getValue("custrecord_ht_email_email");
                    let emailType = resultSearch[i].getValue("custrecord_ht_email_tipoemail");
                    let mainEmail = resultSearch[i].getValue("custrecord_ht_email_emailprincipal");
                    if (mainEmail) result.mainEmail = email;
                    if (emailType == "1") result.email = email;
                    if (emailType == "2") result.amiEmail = email;
                    if (emailType == "3") result.convenioEmail = email;
                }
            }
            return result;
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
                    'custrecord_ht_bien_tipoterrestre.custrecord_ht_tt_idtelematic',
                    'name',
                    'custrecord_ht_bien_ano',
                    //'altname',
                    'custrecord_ht_bien_consesionarios.custrecord_ht_cd_ruccanaldistribucion',
                    'custrecord_ht_bien_consesionarios.custrecord_ht_cd_nombre',
                    'custrecord_ht_bien_consesionarios.custrecord_ht_cd_direccion',
                    'custrecord_ht_bien_consesionarios.custrecord_ht_cd_telefono',
                    'custrecord_ht_bien_consesionarios.custrecord_ht_cd_tipocanal',
                    'custrecord_ht_bien_marca.custrecord_ht_marca_codigo',
                    'custrecord_ht_bien_marca.custrecord_ht_marca_descripcion',
                    'custrecord_ht_bien_modelo.custrecord_ht_mod_codigo',
                    'custrecord_ht_bien_modelo.custrecord_ht_mod_descripcion',
                    'custrecord_ht_bien_cilindraje',
                    'custrecord_ht_bien_cilindraje.custrecord_ht_record_cilindraje_codigo',
                    'custrecord_ht_bien_cilindraje.custrecord_ht_record_cilindraje_descrip',
                    'custrecord_ht_bien_colorcarseg.custrecord_ht_bn_colorcarseg_codigo',
                    'custrecord_ht_bien_colorcarseg.custrecord_ht_bn_colorcarseg_descripcion',
                    'custrecord_ht_bien_id_telematic',
                    'internalid',
                    'custrecord_ht_bien_tipo',
                    'custrecord_ht_bien_tipo.custrecord_ht_tv_codigo',
                    'custrecord_ht_bien_tipo.custrecord_ht_tv_descripcion',
                    'custrecord_ht_bien_numeropuertas',
                    'custrecord_ht_bien_num_ruedas',
                    'custrecord_ht_bien_max_peso',
                    'custrecord_ht_bien_largo'
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
                    'custrecord_ht_mc_operadora.custrecord_ht_cs_operadora_codigo',
                    'custrecord_ht_mc_operadora.custrecord_ht_cs_operadora_descrip',
                    'custrecord_ht_mc_ip', 'custrecord_ht_mc_celularsimcard',
                    //'custrecord_ht_mc_estado',
                    'custrecord_ht_mc_estadolodispositivo',
                    'custrecord_ht_mc_modelo.custrecord_ht_dd_mod_disp_id_telematic',
                    'custrecord_ht_mc_modelo.custrecord_ht_md_servidor_relacionado',
                    'custrecord_ht_mc_modelo.custrecord_ht_dd_modelodispositivo_codig',
                    'custrecord_ht_mc_modelo.custrecord_ht_dd_modelodispositivo_descr',
                    'custrecord_ht_mc_unidad.custrecord_ht_dd_tipodispositivo_codigo',
                    'custrecord_ht_mc_unidad.custrecord_ht_dd_tipodispositivo_descrip',
                    'custrecord_ht_mc_macaddress',
                    'custrecord_ht_mc_sn',
                    'custrecord_ht_mc_numero_camara',
                    'custrecord_ht_mc_icc',
                    'custrecord_ht_mc_servidor.custrecord_ht_mc_servidor_id_telematic',
                    'custrecord_ht_mc_servidor',
                    'custrecord_ht_mc_estadolodispositivo'
                ]
            });
            return Dispositivo;
        }

        const obtenerPropietarioMonitoreo = (salesOrderRecord, itemMonitoreo) => {
            let city = '';
            let correoEmail = '';
            let celular = '';
            try {
                let itemLines = salesOrderRecord.getLineCount({ sublistId: 'item' });
                let PropietarioMonitoreo = 0;
                for (let j = 0; j < itemLines; j++) {
                    let item = salesOrderRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: j });
                    if (itemMonitoreo && item == itemMonitoreo) {
                        PropietarioMonitoreo = salesOrderRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente_monitoreo', line: j });
                        break;
                    } else {
                        PropietarioMonitoreo = salesOrderRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente_monitoreo', line: j });
                        if (PropietarioMonitoreo) break;
                    }
                }
                var lookupFieldsPropietarioMonitoreo = {};
                if (!PropietarioMonitoreo) return lookupFieldsPropietarioMonitoreo;
                let sql = 'SELECT isperson, id, entityid, custentity_ht_cl_primernombre, custentity_ht_cl_segundonombre, custentity_ht_cl_apellidopaterno, custentity_ht_cl_apellidomaterno, ' +
                    'custentity_ht_customer_id_telematic, custentityts_ec_cod_tipo_doc_identidad, companyname FROM customer WHERE id = ?';
                let resultSet = query.runSuiteQL({ query: sql, params: [PropietarioMonitoreo] });
                let results = resultSet.asMappedResults();
                if (results.length > 0) {
                    let sql1 = 'SELECT custrecord_ht_email_email as email FROM customrecord_ht_record_correoelectronico WHERE custrecord_ht_email_tipoemail = 1 AND custrecord_ht_ce_enlace = ?';
                    let resultSet1 = query.runSuiteQL({ query: sql1, params: [PropietarioMonitoreo] });
                    let results1 = resultSet1.asMappedResults();
                    correoEmail = results1.length ? results1[0]['email'] : correoEmail;
                    let sql2 = 'SELECT custrecord_ht_campo_txt_telefono as celular FROM customrecord_ht_registro_telefono WHERE custrecord_ht_campo_list_tipo_telefono = 1 AND custrecord_ht_campo_lbl_entidad_telefono = ?'
                    let resultSet2 = query.runSuiteQL({ query: sql2, params: [PropietarioMonitoreo] });
                    let results2 = resultSet2.asMappedResults();
                    celular = results2.length ? results2[0]['celular'].replace('+593', '0') : celular;
                    //let provincia = ObtenerProvincia(PropietarioMonitoreo);
                    let sql4 = 'SELECT addressbookaddress FROM customeraddressbook WHERE entity = ?'
                    let resultSet4 = query.runSuiteQL({ query: sql4, params: [PropietarioMonitoreo] });
                    let results4 = resultSet4.asMappedResults();
                    if (results4.length > 0) {
                        let sql5 = 'SELECT addr1, addr2, city, zip, country FROM customerAddressbookEntityAddress WHERE nkey = ?'
                        let resultSet5 = query.runSuiteQL({ query: sql5, params: [results4[0]['addressbookaddress']] });
                        let results5 = resultSet5.asMappedResults();
                        if (results5.length > 0) {
                            city = (results5[0]['addr1'] == null ? '' : results5[0]['addr1']) + ' ' + (results5[0]['addr2'] == null ? '' : results5[0]['addr2']) + ' ' + (results5[0]['city'] == null ? '' : results5[0]['city']) + ' ' + (results5[0]['zip'] == null ? '' : results5[0]['zip']) + ' ' + (results5[0]['country'] == null ? '' : results5[0]['country'])
                        }
                    }
                    lookupFieldsPropietarioMonitoreo.htEmail = obtenerCorreosPropietario(PropietarioMonitoreo);
                    lookupFieldsPropietarioMonitoreo = search.lookupFields({ type: 'customer', id: PropietarioMonitoreo, columns: ['vatregnumber'] });
                    log.debug('lookupFieldsPropietarioMonitoreo', lookupFieldsPropietarioMonitoreo);
                    //let provincia = ObtenerProvincia(PropietarioMonitoreo);
                    lookupFieldsPropietarioMonitoreo.htEmail = obtenerCorreosPropietario(PropietarioMonitoreo);
                    lookupFieldsPropietarioMonitoreo.entityid = results[0]['entityid'] == null ? '' : results[0]['entityid'];
                    lookupFieldsPropietarioMonitoreo.phone = celular;
                    lookupFieldsPropietarioMonitoreo.email = correoEmail;
                    lookupFieldsPropietarioMonitoreo.vatregnumber = lookupFieldsPropietarioMonitoreo.vatregnumber.length ? lookupFieldsPropietarioMonitoreo.vatregnumber : '';
                    lookupFieldsPropietarioMonitoreo.custentity_ht_customer_id_telematic = results[0]['custentity_ht_customer_id_telematic'] == null ? '' : results[0]['custentity_ht_customer_id_telematic'];
                    lookupFieldsPropietarioMonitoreo.isperson = results[0]['isperson'];
                    lookupFieldsPropietarioMonitoreo.custentityts_ec_cod_tipo_doc_identidad = results[0]['custentityts_ec_cod_tipo_doc_identidad'];
                    lookupFieldsPropietarioMonitoreo.companyname = results[0]["companyname"];
                    lookupFieldsPropietarioMonitoreo.identity = PropietarioMonitoreo;
                    // lookupFieldsPropietarioMonitoreo.provincia = provincia.length ? provincia : '';
                    lookupFieldsPropietarioMonitoreo.provincia = city;
                    if (results[0]['isperson'] == 'F') {
                        lookupFieldsPropietarioMonitoreo.custentity_ht_cl_primernombre = results[0]['companyname'] == null ? '' : results[0]['companyname']
                    } else {
                        lookupFieldsPropietarioMonitoreo.custentity_ht_cl_primernombre = results[0]['custentity_ht_cl_primernombre'] == null ? '' : results[0]['custentity_ht_cl_primernombre']
                        lookupFieldsPropietarioMonitoreo.custentity_ht_cl_segundonombre = results[0]['custentity_ht_cl_segundonombre'] == null ? '' : results[0]['custentity_ht_cl_segundonombre']
                        lookupFieldsPropietarioMonitoreo.custentity_ht_cl_apellidopaterno = results[0]['custentity_ht_cl_apellidopaterno'] == null ? '' : results[0]['custentity_ht_cl_apellidopaterno']
                        lookupFieldsPropietarioMonitoreo.custentity_ht_cl_apellidomaterno = results[0]['custentity_ht_cl_apellidomaterno'] == null ? '' : results[0]['custentity_ht_cl_apellidomaterno']
                    }
                }
                // lookupFieldsPropietarioMonitoreo = search.lookupFields({
                //     type: 'customer', id: PropietarioMonitoreo,
                //     columns: [
                //         // 'entityid',
                //         // 'custentity_ht_cl_primernombre',
                //         // 'custentity_ht_cl_segundonombre',
                //         // 'custentity_ht_cl_apellidopaterno',
                //         // 'custentity_ht_cl_apellidomaterno',
                //         // 'phone',
                //         // 'homephone',
                //         // 'email',
                //         'vatregnumber',
                //         // 'custentity_ht_customer_id_telematic',
                //         // 'custentityts_ec_cod_tipo_doc_identidad',
                //         // 'companyname',
                //         // 'isperson'
                //     ]
                // });
                // log.debug('lookupFieldsPropietarioMonitoreo', lookupFieldsPropietarioMonitoreo);
                // let provincia = ObtenerProvincia(PropietarioMonitoreo);
                // lookupFieldsPropietarioMonitoreo.htEmail = obtenerCorreosPropietario(PropietarioMonitoreo);
                // lookupFieldsPropietarioMonitoreo.entityid = lookupFieldsPropietarioMonitoreo.entityid.length ? lookupFieldsPropietarioMonitoreo.entityid : '';
                // lookupFieldsPropietarioMonitoreo.phone = lookupFieldsPropietarioMonitoreo.phone.length ? lookupFieldsPropietarioMonitoreo.phone.replace('+593', '0') : '';
                // lookupFieldsPropietarioMonitoreo.email = lookupFieldsPropietarioMonitoreo.email.length ? lookupFieldsPropietarioMonitoreo.email : '';
                // lookupFieldsPropietarioMonitoreo.vatregnumber = lookupFieldsPropietarioMonitoreo.vatregnumber.length ? lookupFieldsPropietarioMonitoreo.vatregnumber : '';
                // lookupFieldsPropietarioMonitoreo.custentity_ht_customer_id_telematic = lookupFieldsPropietarioMonitoreo.custentity_ht_customer_id_telematic.length ? lookupFieldsPropietarioMonitoreo.custentity_ht_customer_id_telematic : '';
                // lookupFieldsPropietarioMonitoreo.isperson = lookupFieldsPropietarioMonitoreo.isperson;
                // lookupFieldsPropietarioMonitoreo.provincia = provincia.length ? provincia : '';
                // if (lookupFieldsPropietarioMonitoreo.isperson) {
                //     lookupFieldsPropietarioMonitoreo.custentity_ht_cl_primernombre = Propietario.custentity_ht_cl_primernombre.length ? Propietario.custentity_ht_cl_primernombre : '';
                //     lookupFieldsPropietarioMonitoreo.custentity_ht_cl_segundonombre = Propietario.custentity_ht_cl_segundonombre.length ? Propietario.custentity_ht_cl_segundonombre : '';
                //     lookupFieldsPropietarioMonitoreo.custentity_ht_cl_apellidopaterno = Propietario.custentity_ht_cl_apellidopaterno.length ? Propietario.custentity_ht_cl_apellidopaterno : '';
                //     lookupFieldsPropietarioMonitoreo.custentity_ht_cl_apellidomaterno = Propietario.custentity_ht_cl_apellidomaterno.length ? Propietario.custentity_ht_cl_apellidomaterno : '';
                // } else {
                //     lookupFieldsPropietarioMonitoreo.custentity_ht_cl_primernombre = Propietario.companyname;
                // }
                return lookupFieldsPropietarioMonitoreo;
            } catch (error) {
                log.error('error-pxxxx', error);
            }
        }

        const obtenerNuevoPropietario = (salesOrderRecord) => {
            let city = '';
            let correoEmail = '';
            let celular = '';
            try {
                let itemLines = salesOrderRecord.getLineCount({ sublistId: 'item' });
                let PropietarioMonitoreo = 0;
                for (let j = 0; j < itemLines; j++) {
                    let item = salesOrderRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: j });
                    if (itemMonitoreo && item == itemMonitoreo) {
                        PropietarioMonitoreo = salesOrderRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente', line: j });
                        break;
                    } else {
                        PropietarioMonitoreo = salesOrderRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente', line: j });
                        if (PropietarioMonitoreo) break;
                    }
                }
                var lookupFieldsPropietarioMonitoreo = {};
                if (!PropietarioMonitoreo) return lookupFieldsPropietarioMonitoreo;
                let sql = 'SELECT isperson, id, entityid, custentity_ht_cl_primernombre, custentity_ht_cl_segundonombre, custentity_ht_cl_apellidopaterno, custentity_ht_cl_apellidomaterno, ' +
                    'custentity_ht_customer_id_telematic, custentityts_ec_cod_tipo_doc_identidad, companyname FROM customer WHERE id = ?';
                let resultSet = query.runSuiteQL({ query: sql, params: [PropietarioMonitoreo] });
                let results = resultSet.asMappedResults();
                if (results.length > 0) {
                    let sql1 = 'SELECT custrecord_ht_email_email as email FROM customrecord_ht_record_correoelectronico WHERE custrecord_ht_email_tipoemail = 1 AND custrecord_ht_ce_enlace = ?';
                    let resultSet1 = query.runSuiteQL({ query: sql1, params: [PropietarioMonitoreo] });
                    let results1 = resultSet1.asMappedResults();
                    correoEmail = results1.length ? results1[0]['email'] : correoEmail;
                    let sql2 = 'SELECT custrecord_ht_campo_txt_telefono as celular FROM customrecord_ht_registro_telefono WHERE custrecord_ht_campo_list_tipo_telefono = 1 AND custrecord_ht_campo_lbl_entidad_telefono = ?'
                    let resultSet2 = query.runSuiteQL({ query: sql2, params: [PropietarioMonitoreo] });
                    let results2 = resultSet2.asMappedResults();
                    celular = results2.length ? results2[0]['celular'].replace('+593', '0') : celular;
                    //let provincia = ObtenerProvincia(PropietarioMonitoreo);
                    let sql4 = 'SELECT addressbookaddress FROM customeraddressbook WHERE entity = ?'
                    let resultSet4 = query.runSuiteQL({ query: sql4, params: [PropietarioMonitoreo] });
                    let results4 = resultSet4.asMappedResults();
                    if (results4.length > 0) {
                        let sql5 = 'SELECT addr1, addr2, city, zip, country FROM customerAddressbookEntityAddress WHERE nkey = ?'
                        let resultSet5 = query.runSuiteQL({ query: sql5, params: [results4[0]['addressbookaddress']] });
                        let results5 = resultSet5.asMappedResults();
                        if (results5.length > 0) {
                            city = (results5[0]['addr1'] == null ? '' : results5[0]['addr1']) + ' ' + (results5[0]['addr2'] == null ? '' : results5[0]['addr2']) + ' ' + (results5[0]['city'] == null ? '' : results5[0]['city']) + ' ' + (results5[0]['zip'] == null ? '' : results5[0]['zip']) + ' ' + (results5[0]['country'] == null ? '' : results5[0]['country'])
                        }
                    }
                    lookupFieldsPropietarioMonitoreo.htEmail = obtenerCorreosPropietario(PropietarioMonitoreo);
                    lookupFieldsPropietarioMonitoreo = search.lookupFields({ type: 'customer', id: PropietarioMonitoreo, columns: ['vatregnumber'] });
                    log.debug('lookupFieldsPropietarioMonitoreo', lookupFieldsPropietarioMonitoreo);
                    //let provincia = ObtenerProvincia(PropietarioMonitoreo);
                    lookupFieldsPropietarioMonitoreo.htEmail = obtenerCorreosPropietario(PropietarioMonitoreo);
                    lookupFieldsPropietarioMonitoreo.entityid = results[0]['entityid'] == null ? '' : results[0]['entityid'];
                    lookupFieldsPropietarioMonitoreo.phone = celular;
                    lookupFieldsPropietarioMonitoreo.email = correoEmail;
                    lookupFieldsPropietarioMonitoreo.vatregnumber = lookupFieldsPropietarioMonitoreo.vatregnumber.length ? lookupFieldsPropietarioMonitoreo.vatregnumber : '';
                    lookupFieldsPropietarioMonitoreo.custentity_ht_customer_id_telematic = results[0]['custentity_ht_customer_id_telematic'] == null ? '' : results[0]['custentity_ht_customer_id_telematic'];
                    lookupFieldsPropietarioMonitoreo.isperson = results[0]['isperson'];
                    lookupFieldsPropietarioMonitoreo.custentityts_ec_cod_tipo_doc_identidad = results[0]['custentityts_ec_cod_tipo_doc_identidad'];
                    lookupFieldsPropietarioMonitoreo.companyname = results[0]["companyname"];
                    lookupFieldsPropietarioMonitoreo.identity = PropietarioMonitoreo;
                    // lookupFieldsPropietarioMonitoreo.provincia = provincia.length ? provincia : '';
                    lookupFieldsPropietarioMonitoreo.provincia = city;
                    if (results[0]['isperson'] == 'F') {
                        lookupFieldsPropietarioMonitoreo.custentity_ht_cl_primernombre = results[0]['companyname'] == null ? '' : results[0]['companyname']
                    } else {
                        lookupFieldsPropietarioMonitoreo.custentity_ht_cl_primernombre = results[0]['custentity_ht_cl_primernombre'] == null ? '' : results[0]['custentity_ht_cl_primernombre']
                        lookupFieldsPropietarioMonitoreo.custentity_ht_cl_segundonombre = results[0]['custentity_ht_cl_segundonombre'] == null ? '' : results[0]['custentity_ht_cl_segundonombre']
                        lookupFieldsPropietarioMonitoreo.custentity_ht_cl_apellidopaterno = results[0]['custentity_ht_cl_apellidopaterno'] == null ? '' : results[0]['custentity_ht_cl_apellidopaterno']
                        lookupFieldsPropietarioMonitoreo.custentity_ht_cl_apellidomaterno = results[0]['custentity_ht_cl_apellidomaterno'] == null ? '' : results[0]['custentity_ht_cl_apellidomaterno']
                    }
                }
                return lookupFieldsPropietarioMonitoreo;
            } catch (error) {
                log.error('error-pxxxx', error);
            }
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
                    search.createColumn({ name: "custrecord_ht_co_coberturainicial" }),
                    search.createColumn({ name: "custrecord_ht_co_coberturafinal" })
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

        const obtenerSubsidiaria = (subsdiaryId) => {
            if (!subsdiaryId) return {};
            let subsidiary = search.lookupFields({
                type: search.Type.SUBSIDIARY,
                id: subsdiaryId,
                columns: ["taxidnum", "custrecord_telematic_emergency_phone_num", "custrecord_telematic_assistanc_phone_num", "custrecord_telematic_technic_support_ema"]
            });
            return subsidiary;
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
                    'custrecord_ht_mc_estadolodispositivo',
                    //'custrecord_ht_mc_estado'
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

        const aprobarTelematic = (idOrdenTrabajo) => {
            if (!idOrdenTrabajo) return;
            record.submitFields({
                type: 'customrecord_ht_record_ordentrabajo',
                id: idOrdenTrabajo,
                values: {
                    'custrecord_ht_ot_confirmaciontelamatic': true
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

        const envioTelecActualizacionDatosTecnicos = (idDispositivo, idSubsidiaria) => {

            /*var Dispositivo, Subsidiaria;
            let telematic = {};
            telematic.device = getDispositivoTelematic(Dispositivo, Subsidiaria, TELEMATIC_OPERACION_ACTUALIZACION_DATOS_TECNICOS);

            log.error("Body Telematic Actualizacion Datos Técnicos", telematic);
            let myRestletResponse = ejecutarRestlet(JSON.stringify(telematic), 'customscript_ns_rs_tlmt_tech_data_update', 'customdeploy_ns_rs_tlmt_tech_data_update');
            log.error('Response Telematic Actualizacion Datos Técnicos', JSON.parse(myRestletResponse.body));
            let response = JSON.parse(myRestletResponse.body);
            log.error("response", response);
            if (response.results) imprimirResultados(response.results);
            if (response.status == "ok") {
                return true;
            } else {
                log.error("Response Message", response.message);
                return false;
            }*/
        }

        const envioTelecActualizacionDatosClientes = () => {
            /*
            var Dispositivo, Subsidiaria;
            let telematic = {};
            telematic.customer = getPropietarioTelematic(Propietario, Subsidiaria, TELEMATIC_OPERACION_ACTUALIZACION_DATOS_CLIENTES);

            log.error("Body Telematic Actualizacion Datos Técnicos", telematic);
            let myRestletResponse = ejecutarRestlet(JSON.stringify(telematic), 'customscript_ns_rs_tlmt_tech_data_update', 'customdeploy_ns_rs_tlmt_tech_data_update');
            log.error('Response Telematic Actualizacion Datos Técnicos', JSON.parse(myRestletResponse.body));
            let response = JSON.parse(myRestletResponse.body);
            log.error("response", response);
            if (response.results) imprimirResultados(response.results);
            if (response.status == "ok") {
                return true;
            } else {
                log.error("Response Message", response.message);
                return false;
            }*/
        }

        const envioTelecActualizacionDatosVehiculo = () => { }

        const envioTelecActualizacionActualizacionServicio = () => { }

        const envioTelecActualizacionCobertura = (ordenTrabajoId, fechaFinCobertura) => {
            log.error("datos", { ordenTrabajoId, fechaFinCobertura });
            let { vehiculo, Propietario, Subsidiaria } = obtenerCamposOrdenTrabajo(ordenTrabajoId);

            vehiculo.fechaFinCobertura = fechaFinCobertura;
            log.error("envioTelecActualizacionCobertura", "envioTelecActualizacionCobertura");
            let telematic = {};
            telematic.customer = getPropietarioTelematic(Propietario, Subsidiaria, TELEMATIC_OPERACION_ACTUALIZACION_COBERTURAS);
            telematic.asset = getVehiculoTelematic(vehiculo, TELEMATIC_OPERACION_ACTUALIZACION_COBERTURAS);

            log.error("Body Telematic envio", telematic);
            let myRestletResponse = https.requestRestlet({
                body: JSON.stringify(telematic),
                deploymentId: 'customdeploy_ns_rs_tlmt_update_cobertura',
                scriptId: 'customscript_ns_rs_tlmt_update_cobertura',
                headers: obtenerHeaders(),
            });
            log.error('Response Telematic Actualizacion Cobertura', JSON.parse(myRestletResponse.body));
            let response = myRestletResponse.body;
            log.error("response", response);

            return true;
        }

        const envioTelecCorteSim = (dispositivoId) => {
            let Dispositivo = obtenerDispositivo(dispositivoId);
            let device = getDispositivoTelematic(Dispositivo, null, TELEMATIC_OPERACION_CORTE_SIM);
            let myRestletResponse = https.requestRestlet({
                body: JSON.stringify(device),
                deploymentId: 'customdeploy_ns_rs_update_device',
                scriptId: 'customscript_ns_rs_update_device',
                headers: obtenerHeaders()
            });
            log.error('Response Telematic Corte SIM', JSON.parse(myRestletResponse.body));
            let response = myRestletResponse.body;
            log.error("response", response);

            return true;
        }

        const envioTelecReconexion = () => { }

        const obtenerFechaHoraConFormatoConTimezone = (fecha) => {
            if (!fecha) return "";
            var dia = fecha.getDate().toString().padStart(2, '0');
            var mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
            var año = fecha.getFullYear();
            var offsetString = `-05:00`;

            return `${año}-${mes}-${dia}T05:00:00${offsetString}`;
        }

        const obtenerAtributos = (tipoVehiculo, Vehiculo) => {
            if (!tipoVehiculo) return [];
            let searchResult = search.create({
                type: "customrecord_ts_tipo_atributo_vehiculo",
                filters: [
                    ["custrecord_id_tipo_vehiculo", "is", tipoVehiculo]
                ],
                columns: [
                    "altname",
                    "custrecord_id_atributo_telematic",
                    "custrecord_id_tipo_vehiculo"
                ]
            }).run().getRange(0, 1000);

            if (!searchResult.length) return [];
            let result = [];
            for (let i = 0; i < searchResult.length; i++) {
                let name = searchResult[i].getValue("altname");
                let id = searchResult[i].getValue("custrecord_id_atributo_telematic");
                let descMarca = Vehiculo["custrecord_ht_bien_marca.custrecord_ht_marca_descripcion"] || "";
                let descModelo = Vehiculo["custrecord_ht_bien_modelo.custrecord_ht_mod_descripcion"];
                let descCilindro = Vehiculo["custrecord_ht_bien_cilindraje.custrecord_ht_record_cilindraje_descrip"];
                let numeroRuedas = Vehiculo["custrecord_ht_bien_num_ruedas"];
                let longitud = Vehiculo["custrecord_ht_bien_largo"]
                let pesoMaximo = Vehiculo["custrecord_ht_bien_max_peso"]

                if (name == "Brand" && descMarca) {
                    result.push({ attribute: id, value: descMarca })
                } else if (name == "Model" && descModelo) {
                    result.push({ attribute: id, value: descModelo });
                } else if (name == "Cilinders" && descCilindro) {
                    result.push({ attribute: id, value: descCilindro });
                } else if (name == "Number Wheels" && numeroRuedas) {
                    result.push({ attribute: id, value: numeroRuedas });
                } else if (name == "Max Weight" && pesoMaximo) {
                    result.push({ attribute: id, value: pesoMaximo });
                } else if (name == "Length" && longitud) {
                    result.push({ attribute: id, value: longitud });
                } else if (name == "Chasis" && Vehiculo.custrecord_ht_bien_chasis) {
                    result.push({ attribute: id, value: Vehiculo.custrecord_ht_bien_chasis });
                } else if (name == "Motor" && Vehiculo.custrecord_ht_bien_motor) {
                    result.push({ attribute: id, value: Vehiculo.custrecord_ht_bien_motor });
                } else if (name == "Plate" && Vehiculo.custrecord_ht_bien_placa) {
                    result.push({ attribute: id, value: Vehiculo.custrecord_ht_bien_placa });
                } else if (name == "COD_SYS" && Vehiculo.name) {
                    result.push({ attribute: id, value: Number(Vehiculo.name.replace(/\D/g, '')).toString() });
                }
            }
            return result;
        }

        const obtenerCanalDistribucion = (idCanalDistribucion) => {
            if (!idCanalDistribucion) return {};
            let canalDistribucion = search.lookupFields({
                type: "customrecord_ht_record_canaldistribucion",
                id: idCanalDistribucion,
                columns: [
                    "custrecord_ht_cd_ruccanaldistribucion",
                    "custrecord_ht_cd_nombre",
                    "custrecord_ht_cd_telefono",
                    "custrecord_ht_cd_direccion",
                    "custrecord_ht_cd_email",
                    "custrecord_ht_cd_convencional"
                ]
            });

            return canalDistribucion;
        }

        const obtenerConvenio = (idConvenio) => {
            if (!idConvenio) return {};
            let convenio = search.lookupFields({
                type: "customrecord_ht_record_convenio",
                id: idConvenio,
                columns: [
                    "custrecord_ht_cn_ruc_convenio",
                    "custrecord_ht_cn_razon_social",
                    "custrecord_ht_cn_direccion",
                    "custrecord_ht_cn_celular",
                    "custrecord_ht_cn_email",
                    "custrecord_ht_cn_convencional"
                ]
            });
            return convenio;
        }

        const obtenerCommands = (ordenTrabajo) => {
            let filters = ordenTrabajo.getValue("custrecord_ht_ot_servicios_commands");
            let commands = obtenerServicios(filters);
            return commands;
            // let paralizador = ordenTrabajo.getValue("custrecord_ht_ot_paralizador");
            // let aperturaPuertas = ordenTrabajo.getValue("custrecord_ht_ot_boton_panico");

            // let filters = [];
            // if (paralizador) {
            //     let paralizadorField = ordenTrabajo.getField("custrecord_ht_ot_paralizador");
            //     filters.push(["name", "is", paralizadorField.label]);
            // }
            // if (aperturaPuertas) {
            //     let aperturaPuertasField = ordenTrabajo.getField("custrecord_ht_ot_boton_panico");
            //     if (filters.length) filters.push("OR");
            //     filters.push(["name", "is", "APERTURA DE PUERTAS"]);
            // }
            // log.error("filters", filters);

        }

        const obtenerServicios = (filters) => {
            if (!filters.length) return filters;
            let jsonComand = new Array();
            let mySearch = search.create({
                type: "customrecord_ht_servicios",
                filters:
                    [
                        ["internalid", "anyof", filters]
                    ],
                columns:
                    [
                        search.createColumn({ name: "custrecord_ht_sv_command", label: "Comando" })
                    ]
            });
            mySearch.run().each(result => {
                if (result.getValue('custrecord_ht_sv_command')) {
                    let comando = result.getText('custrecord_ht_sv_command').split(',');
                    jsonComand = jsonComand.concat(comando);
                }
                return true;
            });
            return jsonComand;
            // let result = [];
            // let newSearch = search.create({
            //     type: "customrecord_ht_servicios",
            //     filters,
            //     columns: ["custrecord_ht_sv_command"]
            // }).run().getRange(0, 1000);

            // for (let i = 0; i < newSearch.length; i++) {
            //     let commands = newSearch[i].getText("custrecord_ht_sv_command").split(',');
            //     result = result.concat(commands);
            // }
            // return result;
        }

        const saveFile = (name, contents) => {
            let id = file.create({
                name: name + '.js',
                folder: 529,
                fileType: file.Type.JSON,
                contents
            }).save();
        }

        const imprimirResultados = (results) => {
            for (let i = 0; i < results.length; i++) {
                log.error(`Code: ${results[i].code} ${results[i].operation}`, results[i].body);
            }
        }

        const ejecutarRestlet = (body, scriptId, deploymentId) => {
            return https.requestRestlet({
                scriptId,
                deploymentId,
                headers: obtenerHeaders(),
                body
            });
        }

        const crearRegistroImpulsoPlataforma = (ordenTrabajoId, activoFijoId, estado, plataforma) => {
            let registroImpulsoPlataforma = record.create({ type: "customrecord_ts_regis_impulso_plataforma" });
            registroImpulsoPlataforma.setValue('custrecord_ts_reg_imp_plt_ordentrabajo', ordenTrabajoId);
            registroImpulsoPlataforma.setValue('custrecord_ts_reg_imp_plt_activo_fijo', activoFijoId || "");
            registroImpulsoPlataforma.setValue('custrecord_ts_reg_imp_plt_estado', estado);
            registroImpulsoPlataforma.setValue('custrecord_ts_reg_imp_plt_plataforma', plataforma);
            return registroImpulsoPlataforma.save();
        }

        const actualizarRegistroImpulsoPlataforma = (registroImpulsoPlataforma, estado, mensaje) => {
            let values = {
                "custrecord_ts_reg_imp_plt_estado": estado
            };
            if (estado) values["custrecord_ts_reg_imp_plt_mensaje"] = mensaje;

            record.submitFields({
                type: "customrecord_ts_regis_impulso_plataforma",
                id: registroImpulsoPlataforma,
                values
            });
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
            envioTelecDesinstalacionDispositivoActivoFijo,
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
    }
);