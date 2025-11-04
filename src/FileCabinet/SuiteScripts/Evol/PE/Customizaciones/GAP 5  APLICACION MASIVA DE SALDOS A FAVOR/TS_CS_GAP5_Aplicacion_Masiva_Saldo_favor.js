/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(["N/log", "N/url", "N/search", 'N/currentRecord'], function (log, url, search, currentRecord) {
  var data;
  /**
   * Function to be executed after page is initialized.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
   *
   * @since 2015.2
   */
  function pageInit(scriptContext) {
    data = scriptContext;
    var currentRecord = scriptContext.currentRecord;
    var sublistId = 'sublista';
    var fieldId = 'aplicacion_parcial';
    var lineCount = currentRecord.getLineCount({ sublistId: sublistId });

    for (var i = 0; i < lineCount; i++) {
      var field = currentRecord.getSublistField({
        sublistId: sublistId,
        fieldId: fieldId,
        line: i
      });

      if (field) {
        field.isDisabled = true; // Bloquea el campo en toda la sublista
      }
    }
    setTimeout(() => {
      let fileInput = document.querySelector("input[type='file']");

      if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
      }
    }, 1000); // Espera 1 segundo para asegurar que NetSuite renderice el campo

  }
  function handleFileSelect(event) {
    let file = event.target.files[0];

    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      let reader = new FileReader();

      reader.onload = function (e) {
        let contenido = e.target.result;
        procesarCSV(contenido);
      };

      reader.readAsText(file);
    } else {
      dialog.alert({ title: 'Error', message: 'Por favor, seleccione un archivo CSV válido.' });
    }
  }

  function procesarCSV(contenido) {
    let rec = currentRecord.get();
    let lineas = contenido.split('\n');
    let data = [];

    for (let i = 0; i < lineas.length; i++) {
      let columnas = lineas[i].split(',');
      data.push(columnas);
    }


    let lineCount = rec.getLineCount({ sublistId: 'sublista' });
    for (let i = 0; i < lineCount; i++) {
      let valorSublista = rec.getSublistValue({
        sublistId: 'sublista',
        fieldId: 'id',
        line: i
      });

      valorSublista = valorSublista ? valorSublista.trim() : "";

      // Comparar con la primera columna del array recorriendo todas sus filas
      for (let j = 0; j < data.length; j++) {
        let valorArray = data[j][0].trim(); // Primera columna del array

        if (valorArray === valorSublista) {


          // Marcar checkbox en la sublista
          rec.selectLine({ sublistId: 'sublista', line: i });
          rec.setCurrentSublistValue({
            sublistId: 'sublista',
            fieldId: 'check',
            value: true
          });
          rec.commitLine({ sublistId: 'sublista' });
        }
      }
    }


  }


  /**
   * Function to be executed when field is changed.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.sublistId - Sublist name
   * @param {string} scriptContext.fieldId - Field name
   * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
   * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
   *
   * @since 2015.2
   */
  function fieldChanged(scriptContext) {
    var fieldId = scriptContext.fieldId;
    var currentRecord = scriptContext.currentRecord;
    // try {


    if (fieldId === 'custom_deposito') {
      var newValue = currentRecord.getValue({ fieldId: fieldId });

      var journalentrySearchObj = search.create({
        type: "journalentry",
        settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
        filters:
          [
            ["type", "anyof", "Journal"],
            "AND",
            ["internalid", "anyof", newValue],
            "AND",
            ["creditfxamount", "isnotempty", "0.00"]
          ],
        columns:
          [
            search.createColumn({ name: "currency", label: "Currency" }),
            search.createColumn({ name: "exchangerate", label: "Exchange Rate" }),
            search.createColumn({ name: "subsidiary", label: "Subsidiary" }),
            search.createColumn({ name: "creditfxamount", label: "Amount (Credit) (Foreign Currency)" }),
            search.createColumn({ name: "entity", label: "Name" }),
            search.createColumn({ name: "account", label: "Account" })
          ]
      });
      var searchResultCount = journalentrySearchObj.runPaged().count;
      if (searchResultCount) {
        var searchResult = journalentrySearchObj.run().getRange({ start: 0, end: 1 });

        currentRecord.setValue({ fieldId: "custom_cliente_deposito", value: searchResult[0].getValue({ name: "entity", label: "Name" }), });
        currentRecord.setValue({ fieldId: "custom_subsidiaria", value: searchResult[0].getValue({ name: "subsidiary", label: "Subsidiary" }), });
        currentRecord.setValue({ fieldId: "custom_importe", value: searchResult[0].getValue({ name: "creditfxamount", label: "Amount (Credit) (Foreign Currency)" }), });
        currentRecord.setValue({ fieldId: "currency", value: searchResult[0].getValue({ name: "currency", label: "Currency" }), });
        currentRecord.setValue({ fieldId: "custom_tipo_cambio", value: searchResult[0].getValue({ name: "exchangerate", label: "Exchange Rate" }), });
        currentRecord.setValue({ fieldId: "custom_cuenta", value: searchResult[0].getValue({ name: "account", label: "Account" }), });
      }


    }

    let cliente = scriptContext.currentRecord.getValue({ fieldId: "cliente" });
    let custom_deposito = scriptContext.currentRecord.getValue({ fieldId: "custom_deposito" });
    let fechaInicio = scriptContext.currentRecord.getValue({ fieldId: "fecha_inicio" });
    let fechaFin = scriptContext.currentRecord.getValue({ fieldId: "fecha_fin" });
    let custom_cuenta = scriptContext.currentRecord.getValue({ fieldId: "custom_cuenta" });
    let custom_cliente_deposito = scriptContext.currentRecord.getValue({ fieldId: "custom_cliente_deposito" });
    let custom_subsidiaria = scriptContext.currentRecord.getValue({ fieldId: "custom_subsidiaria" });
    let custom_importe = scriptContext.currentRecord.getValue({ fieldId: "custom_importe" });
    let currency = scriptContext.currentRecord.getValue({ fieldId: "currency" });
    let custom_tipo_cambio = scriptContext.currentRecord.getValue({ fieldId: "custom_tipo_cambio" });
    //& <I>17/07/25 dfernandez
    let custom_fecha = scriptContext.currentRecord.getValue({ fieldId: "custom_fecha" });
    let custom_periodo_contable = scriptContext.currentRecord.getValue({ fieldId: "custom_periodo_contable" });
    let custom_glosa = scriptContext.currentRecord.getValue({ fieldId: "custom_glosa" });
    let custom_tipo_diario = scriptContext.currentRecord.getValue({ fieldId: "custom_tipo_diario" });
    //& <F>17/07/25 dfernandez


    let params = {
      custom_deposito: custom_deposito,
      cliente: cliente,
      fechaInicio: fechaInicio != "" ? new Date(fechaInicio) : "",
      fechaFin: fechaFin != "" ? new Date(fechaFin) : "",
      custom_cliente_deposito: custom_cliente_deposito,
      custom_subsidiaria: custom_subsidiaria,
      custom_importe: custom_importe,
      currency: currency,
      flag: 'anticipo',
      custom_tipo_cambio: custom_tipo_cambio,
      custom_cuenta: custom_cuenta,
      custom_fecha: custom_fecha,
      custom_periodo_contable: custom_periodo_contable,
      custom_glosa: custom_glosa,
      custom_tipo_diario: custom_tipo_diario
    };

    //Validamos que esten llenos los campos obligatorios
    if (params.fechaInicio != "" && params.fechaFin != "" && params.custom_deposito != "") {
      if (scriptContext.sublistId == "sublista" && scriptContext.fieldId == "check" || scriptContext.sublistId == "sublista" && scriptContext.fieldId == "aplicacion_parcial") {
        //Sumamos los montos seleccionados
        let total = 0;
        let impuestolinea = 0;
        let totallinea = 0;
        let sublistLineCount = scriptContext.currentRecord.getLineCount({
          sublistId: "sublista",
        });

        for (let i = 0; i < sublistLineCount; i++) {
          let isSelected = scriptContext.currentRecord.getSublistValue({
            sublistId: "sublista",
            fieldId: "check",
            line: i,
          });

          if (isSelected) {
            let monto = scriptContext.currentRecord.getSublistValue({
              sublistId: "sublista",
              fieldId: "importe_pagar",
              line: i,
            });
            let importe_pagar = scriptContext.currentRecord.getSublistValue({
              sublistId: "sublista",
              fieldId: "aplicacion_parcial",
              line: i,
            });
            let campodesbloquear = scriptContext.currentRecord.getSublistField({
              sublistId: "sublista",
              fieldId: "aplicacion_parcial",
              line: i,
            });

            if (campodesbloquear) {
              campodesbloquear.isDisabled = false;
            }

            if (!importe_pagar || importe_pagar <= 0 || parseFloat(importe_pagar) > parseFloat(monto)) {


              scriptContext.currentRecord.setCurrentSublistValue({
                sublistId: 'sublista',
                fieldId: "aplicacion_parcial",
                value: monto
              });
              importe_pagar = monto;
            }
            totallinea += parseFloat(importe_pagar);
          } else {
            let importe_pagar = scriptContext.currentRecord.getSublistValue({
              sublistId: "sublista",
              fieldId: "aplicacion_parcial",
              line: i,
            });
            let campodesbloquear = scriptContext.currentRecord.getSublistField({
              sublistId: "sublista",
              fieldId: "aplicacion_parcial",
              line: i,
            });

            if (campodesbloquear) {
              campodesbloquear.isDisabled = true;
            }

            if (importe_pagar != 0) {
              scriptContext.currentRecord.setCurrentSublistValue({
                sublistId: 'sublista',
                fieldId: "aplicacion_parcial",
                value: 0
              });
            }

          }
        }

        scriptContext.currentRecord.setValue({ fieldId: "custom_importe_aplicado", value: totallinea, });
        if (custom_importe >= totallinea) {
          scriptContext.currentRecord.setValue({ fieldId: "custom_importe_ganancia", value: parseFloat(custom_importe) - parseFloat(totallinea), });
          scriptContext.currentRecord.setValue({ fieldId: "custom_importe_perdida", value: 0, });
        } else {
          scriptContext.currentRecord.setValue({ fieldId: "custom_importe_perdida", value: parseFloat(totallinea) - parseFloat(custom_importe), });
          scriptContext.currentRecord.setValue({ fieldId: "custom_importe_ganancia", value: 0, });

        }


      } else if (
        scriptContext.fieldId == "custom_cliente_deposito" ||
        scriptContext.fieldId == "custom_subsidiaria" ||
        scriptContext.fieldId == "custom_importe" ||
        scriptContext.fieldId == "currency" ||
        scriptContext.fieldId == "custom_tipo_cambio" ||
        scriptContext.fieldId == "custom_cuenta" ||
        scriptContext.fieldId == "custom_importe_aplicado" ||
        scriptContext.fieldId == "custom_importe_ganancia" ||
        scriptContext.fieldId == "custom_importe_perdida" ||
        scriptContext.fieldId == "aplicacion_parcial" || 
        scriptContext.fieldId == "custom_fecha" ||
        scriptContext.fieldId == "custom_periodo_contable" ||
        scriptContext.fieldId == "custom_glosa" ||
        scriptContext.fieldId == "custom_tipo_diario"
      ) { } else {
        params = JSON.stringify(params);

        //Llamamos al Suitelet
        window.onbeforeunload = null;
        let ruta = url.resolveScript({
          scriptId: "customscript_ts_sl_gap5_aplicacion_masiv",
          deploymentId: "customdeploy_ts_sl_gap5_aplicacion_masiv",
          params: {
            custscript_ts_context: params,
          },
          returnExternalUrl: false,
        });

        setWindowChanged(window, false);
        window.location.href = ruta;
      }
    }
    /*  } catch (e) {
        console.log("Error", e.message);
      }*/
  }

  /**
   * Function para calcular el importe total
   *
   */

  function calcularImporte() {
    try {
      let scriptContext = data;
      let total = 0;
      let impuestolinea = 0;
      let totallinea = 0;
      let sublistLineCount = scriptContext.currentRecord.getLineCount({
        sublistId: "sublista",
      });

      for (let i = 0; i < sublistLineCount; i++) {
        let isSelected = scriptContext.currentRecord.getSublistValue({
          sublistId: "sublista",
          fieldId: "check",
          line: i,
        });

        if (isSelected) {
          let monto = scriptContext.currentRecord.getSublistValue({
            sublistId: "sublista",
            fieldId: "monto",
            line: i,
          });
          let impuestos = scriptContext.currentRecord.getSublistValue({
            sublistId: "sublista",
            fieldId: "impuestos",
            line: i,
          });
          let totalline = scriptContext.currentRecord.getSublistValue({
            sublistId: "sublista",
            fieldId: "totalline",
            line: i,
          });
          total += parseFloat(monto);
          impuestolinea += parseFloat(impuestos);
          totallinea += parseFloat(totalline);
        }
      }

      scriptContext.currentRecord.setValue({
        fieldId: "importe_total",
        value: total,
      });
      scriptContext.currentRecord.setValue({
        fieldId: "igv",
        value: impuestolinea,
      });
      scriptContext.currentRecord.setValue({
        fieldId: "totalbody",
        value: totallinea,
      });
    } catch (error) {
      console.log("Error", error.message);
    }
  }

  /**
   * Validation function to be executed when record is saved.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @returns {boolean} Return true if record is valid
   *
   * @since 2015.2
   */
  function saveRecord(scriptContext) {

    try {
      //Validamos que esten llenos los campos obligatorios
      let currency = scriptContext.currentRecord.getValue({ fieldId: "currency" });

      //validamos que seleccione al menos un registro
      let sublistLineCount = scriptContext.currentRecord.getLineCount({ sublistId: "sublista" });

      let sublistValida = false;
      for (let i = 0; i < sublistLineCount; i++) {
        let isSelected = scriptContext.currentRecord.getSublistValue({
          sublistId: "sublista",
          fieldId: "check",
          line: i,
        });

        if (isSelected) {
          sublistValida = true;
          break;
        }
      }

      if (!sublistValida) {
        alert("Debe seleccionar al menos un registro");
        return false;
      }
      var fieldLookUp = search.lookupFields({
        type: 'customrecord_conf_saldo_favor',
        id: 1,
        columns: ['custrecord_mont_perdido', 'custrecord_mont_ganado', 'custrecord_mont_ganado_dolares', 'custrecord_mont_perdido_dolares']
      });
      let custom_importe_perdida = scriptContext.currentRecord.getValue({ fieldId: "custom_importe_perdida" });
      let custom_importe_ganancia = scriptContext.currentRecord.getValue({ fieldId: "custom_importe_ganancia" });
      let montoganado = currency == '1' ? fieldLookUp.custrecord_mont_ganado_dolares : fieldLookUp.custrecord_mont_ganado;
      let montoperdido = currency == '1' ? fieldLookUp.custrecord_mont_perdido_dolares : fieldLookUp.custrecord_mont_perdido;

      if (custom_importe_perdida != 0 && parseFloat(montoperdido) <= parseFloat(custom_importe_perdida)) {
        alert("Monto Perdido no debe ser mayor a " + montoperdido);
        return false;
      }
      if (custom_importe_ganancia != 0 && parseFloat(montoganado) <= parseFloat(custom_importe_ganancia)) {
        alert("Monto ganado no debe ser mayor a " + montoganado);
        return false;
      }
      /*if (
        cliente != "" &&
        fechaInicio != "" &&
        fechaFin != "" &&
        termino_pago != "" &&
        ubicacion != "" &&
        glosa != ""
      ) {
        return true;
      } else {
        alert("Debe llenar los campos obligatorios");
        return false;
      }*/
      return true;
    } catch (error) {
      log.error("Error", error.message);
      return false;
    }
  }

  return {
    pageInit: pageInit,
    fieldChanged: fieldChanged,
    calcularImporte: calcularImporte,
    /*  postSourcing: postSourcing,
             sublistChanged: sublistChanged,
             lineInit: lineInit,
             validateField: validateField,
             validateLine: validateLine,
             validateInsert: validateInsert,
             validateDelete: validateDelete,*/
    saveRecord: saveRecord,
  };
});
