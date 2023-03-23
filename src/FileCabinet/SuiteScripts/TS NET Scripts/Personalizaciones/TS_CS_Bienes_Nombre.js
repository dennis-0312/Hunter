/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(["N/search", "N/currentRecord", "N/ui/message", "N/url", "N/runtime"], (
  search,
  currentRecord,
  message,
  url,
  runtime
) => {
  let typeMode = "";

  const pageInit = (context) => {
    typeMode = context.mode; //!Importante, no borrar.
  };
  const saveRecord = (context) => {
    try {
      console.log("entra saverecord");
      const objRecord = context.currentRecord;
      var tipo_terrestre = objRecord.getValue(
        "custrecord_ht_bien_tipoterrestre"
      );
      const bien_placa = objRecord.getText("custrecord_ht_bien_placa");
      const nro_puertas = objRecord.getText("custrecord_ht_bien_numeropuertas");
      const bien_motor = objRecord.getText("custrecord_ht_bien_motor");
      const bien_chasis = objRecord.getText("custrecord_ht_bien_chasis");
      var patron_placa_vehiculo = /^[A-Z]{3}-[0-9]{4}$/;
      var patron_placa_moto = /^[A-Z]{2}[0-9]{3}[A-Z]{1}$/;
      var patron_motor_chasis = /^[0-9A-Z]{0,30}$/;
      var patron_puertas = /^[3-5]{1}$/;
      var Bienes = getBien();
      if (tipo_terrestre == 1) {
        if (bien_placa != "S/P") {
          if (bien_placa.match(patron_placa_vehiculo) == null) {
            alert(
              "Debe de ingresar una placa válida por ejemplo (ABC-1234) o (ABC-0123), o sin placa (S/P) si la desconoce."
            );
            return false;
          } else {
            for (let i = 0; i < Bienes.length; i++) {
              if (bien_placa == Bienes[i][0]) {
                alert(
                  "Las placas no se pueden repetir."
                );
                return false;
              }
            }
          }
          if (nro_puertas.match(patron_puertas) == null) {
            alert(
              "El valor a ingresar para el Num. de Puertas es entre 3 y 5."
            );
            return false;
          }
          if (bien_motor.match(patron_motor_chasis) == null) {
            alert(
              "El valor a ingresar para el Motor debe tener longitud maxima 30 caracteres y no acepta caracteres especiales."
            );
            return false;
          } else {
            for (let i = 0; i < Bienes.length; i++) {
              if (bien_motor == Bienes[i][1]) {
                alert(
                  "El motor no se puede repetir."
                );
                return false;
              }
            }
          }
          if (bien_chasis.match(patron_motor_chasis) == null) {
            alert(
              "El valor a ingresar para el Chasis debe tener longitud maxima 30 caracteres y no acepta caracteres especiales."
            );
            return false;
          } else {
            for (let i = 0; i < Bienes.length; i++) {
              if (bien_chasis == Bienes[i][2]) {
                alert(
                  "El chasis no se puede repetir."
                );
                return false;
              }
            }
          }
        } else {
          if (nro_puertas.match(patron_puertas) == null) {
            alert(
              "El valor a ingresar para el Num. de Puertas es entre 3 y 5."
            );
            return false;
          }
          if (bien_motor.match(patron_motor_chasis) == null) {
            alert(
              "El valor a ingresar para el Motor debe tener longitud maxima 30 caracteres y no acepta caracteres especiales."
            );
            return false;
          } else {
            for (let i = 0; i < Bienes.length; i++) {
              if (bien_motor == Bienes[i][1]) {
                alert(
                  "El motor no se puede repetir."
                );
                return false;
              }
            }
          }
          if (bien_chasis.match(patron_motor_chasis) == null) {
            alert(
              "El valor a ingresar para el Chasis debe tener longitud maxima 30 caracteres y no acepta caracteres especiales."
            );
            return false;
          } else {
            for (let i = 0; i < Bienes.length; i++) {
              if (bien_chasis == Bienes[i][2]) {
                alert(
                  "El chasis no se puede repetir."
                );
                return false;
              }
            }
          }
        }
      } else if (tipo_terrestre == 2) {
        if (bien_placa != "S/P") {
          if (bien_placa.match(patron_placa_moto) == null) {
            alert(
              "Debe de ingresar una placa válida por ejemplo (AB123C) o (AB012C), o sin placa (S/P) si la desconoce."
            );
            return false;
          } else {
            for (let i = 0; i < Bienes.length; i++) {
              if (bien_placa == Bienes[i][0]) {
                alert(
                  "Las placas no se pueden repetir."
                );
                return false;
              }
            }
          }
          if (bien_motor.match(patron_motor_chasis) == null) {
            alert(
              "El valor a ingresar para el Motor debe tener longitud maxima 30 caracteres y no acepta caracteres especiales."
            );
            return false;
          } else {
            for (let i = 0; i < Bienes.length; i++) {
              if (bien_motor == Bienes[i][1]) {
                alert(
                  "El motor no se puede repetir."
                );
                return false;
              }
            }
          }
          if (bien_chasis.match(patron_motor_chasis) == null) {
            alert(
              "El valor a ingresar para el Chasis debe tener longitud maxima 30 caracteres y no acepta caracteres especiales."
            );
            return false;
          } else {
            for (let i = 0; i < Bienes.length; i++) {
              if (bien_chasis == Bienes[i][2]) {
                alert(
                  "El chasis no se puede repetir."
                );
                return false;
              }
            }
          }
        } else {
          if (bien_motor.match(patron_motor_chasis) == null) {
            alert(
              "El valor a ingresar para el Motor debe tener longitud maxima 30 caracteres y no acepta caracteres especiales."
            );
            return false;
          } else {
            for (let i = 0; i < Bienes.length; i++) {
              if (bien_motor == Bienes[i][1]) {
                alert(
                  "El motor no se puede repetir."
                );
                return false;
              }
            }
          }
          if (bien_chasis.match(patron_motor_chasis) == null) {
            alert(
              "El valor a ingresar para el Chasis debe tener longitud maxima 30 caracteres y no acepta caracteres especiales."
            );
            return false;
          } else {
            for (let i = 0; i < Bienes.length; i++) {
              if (bien_chasis == Bienes[i][2]) {
                alert(
                  "El chasis no se puede repetir."
                );
                return false;
              }
            }
          }
        }
      } else {
        if (bien_motor.match(patron_motor_chasis) == null) {
          alert(
            "El valor a ingresar para el Motor debe tener longitud maxima 30 caracteres y no acepta caracteres especiales"
          );
          return false;
        } else {
          for (let i = 0; i < Bienes.length; i++) {
            if (bien_motor == Bienes[i][1]) {
              alert(
                "El motor no se puede repetir."
              );
              return false;
            }
          }
        }
        if (bien_chasis.match(patron_motor_chasis) == null) {
          alert(
            "El valor a ingresar para el Chasis debe tener longitud maxima 30 caracteres y no acepta caracteres especiales"
          );
          return false;
        } else {
          for (let i = 0; i < Bienes.length; i++) {
            if (bien_chasis == Bienes[i][2]) {
              alert(
                "El chasis no se puede repetir."
              );
              return false;
            }
          }
        }
      }
      return true;
    } catch (e) {
      console.log("Error en el saveRecord", e);
    }
  };
  const fieldChanged = (context) => {
    try {
      const objRecord = context.currentRecord;
      console.log("objRecord", objRecord);
      const typeTransaction = objRecord.type;
      const sublistFieldName = context.fieldId;

      if (typeMode == "create" || typeMode == "copy" || typeMode == "edit") {

        if (typeTransaction === "customrecord_ht_record_bienes") {
          var Bienes = getBien();
          console.log('Bienes', Bienes);
          var tipo_terrestre = objRecord.getValue(
            "custrecord_ht_bien_tipoterrestre"
          );
          if (sublistFieldName === "custrecord_ht_bien_placa") {
            const bien_placa = objRecord.getText(sublistFieldName);
            if (bien_placa != "S/P") {
              if (tipo_terrestre == 1) {
                var patron_placa = /^[A-Z]{3}-[0-9]{4}$/;
                if (bien_placa.match(patron_placa) == null) {
                  alert(
                    "Debe de ingresar una placa válida por ejemplo (ABC-1234) o (ABC-0123), o sin placa (S/P) si la desconoce."
                  );

                } else {
                  for (let i = 0; i < Bienes.length; i++) {
                    if (bien_placa == Bienes[i][0]) {
                      console.log('entra bien placa');
                      alert(
                        "Las placas no se pueden repetir."
                      );

                    }
                  }
                }
              } else if (tipo_terrestre == 2) {
                var patron_placa = /^[A-Z]{2}[0-9]{3}[A-Z]{1}$/;
                if (bien_placa.match(patron_placa) == null) {
                  alert(
                    "Debe de ingresar una placa válida por ejemplo (AB123C) o (AB012C), o sin placa (S/P) si la desconoce."
                  );
                } else {
                  for (let i = 0; i < Bienes.length; i++) {
                    if (bien_placa == Bienes[i][0]) {
                      alert(
                        "Las placas no se pueden repetir."
                      );

                    }
                  }
                }
              }
            }
          } else if (sublistFieldName === "custrecord_ht_bien_numeropuertas") {
            const nro_puertas = objRecord.getText(sublistFieldName);
            var patron_puertas = /^[3-5]{1}$/;
            if (tipo_terrestre == 1) {
              if (nro_puertas.match(patron_puertas) == null) {
                alert(
                  "El valor a ingresar para el Num. de Puertas es entre 3 y 5."
                );
              }
            }
          } else if (sublistFieldName === "custrecord_ht_bien_motor") {
            const bien_motor = objRecord.getText(sublistFieldName);
            var patron_motor_chasis = /^[0-9A-Z]{0,30}$/;
            console.log("patron_motor_chasis", patron_motor_chasis);
            if (bien_motor.match(patron_motor_chasis) == null) {
              alert(
                "El valor a ingresar para el Motor debe tener longitud maxima 30 caracteres y no acepta caracteres especiales."
              );
            } else {
              for (let i = 0; i < Bienes.length; i++) {
                if (bien_motor == Bienes[i][1]) {
                  alert(
                    "El motor no se puede repetir."
                  );

                }
              }
            }
          } else if (sublistFieldName === "custrecord_ht_bien_chasis") {
            const bien_chasis = objRecord.getText(sublistFieldName);
            var patron_motor_chasis = /^[0-9A-Z]{0,30}$/;
            if (bien_chasis.match(patron_motor_chasis) == null) {
              alert(
                "El valor a ingresar para el Chasis debe tener longitud maxima 30 caracteres y no acepta caracteres especiales."
              );
            } else {
              for (let i = 0; i < Bienes.length; i++) {
                if (bien_chasis == Bienes[i][2]) {
                  alert(
                    "El chasis no se puede repetir."
                  );

                }
              }
            }
          }
          var placa = objRecord.getText("custrecord_ht_bien_placa");
          var motor = objRecord.getText("custrecord_ht_bien_motor");
          var chasis = objRecord.getText("custrecord_ht_bien_chasis");
          var marca = objRecord.getText("custrecord_ht_bien_marca");
          var tipo = objRecord.getText("custrecord_ht_bien_tipo");
          var modelo = objRecord.getText("custrecord_ht_bien_modelo");
          var color = objRecord.getText("custrecord_ht_bien_colorcarseg");
          if (placa) {
            placa = "PLC.:" + placa;
          } else {
            placa = "";
          }
          if (motor) {
            motor = "MOT.:" + motor;
          } else {
            motor = "";
          }
          if (chasis) {
            chasis = "CHA.:" + chasis;
          } else {
            chasis = "";
          }
          if (marca) {
            marca = "MAR.:" + marca;
          } else {
            marca = "";
          }
          if (tipo) {
            tipo = "TIP.:" + tipo;
          } else {
            tipo = "";
          }
          if (modelo) {
            modelo = "MOD.:" + modelo;
          } else {
            modelo = "";
          }
          if (color) {
            color = "COL.:" + color;
          } else {
            color = "";
          }
          var array = [placa, motor, chasis, marca, tipo, modelo, color];
          var txtfinal = "";
          for (let i = 0; i < array.length; i++) {
            if (array[i]) {
              txtfinal += array[i];
              if (i < array.length - 1 && array[i + 1]) txtfinal += " ";
            }
          }
          console.log("txtfinal", txtfinal);
          objRecord.setText({
            fieldId: "altname",
            text: txtfinal,
            ignoreFieldChange: true,
          });
        }
      }
    } catch (e) {
      log.error("Error en el fieldChange", e);
      return false;
    }
  };
  function getBien() {
    try {
      var arrCustomerId = new Array();
      var busqueda = search.create({
        type: "customrecord_ht_record_bienes",
        filters:
          [
          ],
        columns:
          [
            search.createColumn({ name: "custrecord_ht_bien_placa", label: "HT BN Placa" }),
            search.createColumn({ name: "custrecord_ht_bien_motor", label: "HT BN Motor" }),
            search.createColumn({ name: "custrecord_ht_bien_chasis", label: "HT BN Chasis" })
          ]
      });
      var pageData = busqueda.runPaged({
        pageSize: 1000
      });

      pageData.pageRanges.forEach(function (pageRange) {
        page = pageData.fetch({
          index: pageRange.index
        });
        page.data.forEach(function (result) {
          var columns = result.columns;
          var arrCustomer = new Array();
          //0. Internal id match
          if (result.getValue(columns[0]) != null) {
            arrCustomer[0] = result.getValue(columns[0]);
          } else {
            arrCustomer[0] = '';
          }
          if (result.getValue(columns[1]) != null) {
            arrCustomer[1] = result.getValue(columns[1]);
          } else {
            arrCustomer[1] = '';
          }
          if (result.getValue(columns[2]) != null) {
            arrCustomer[2] = result.getValue(columns[2]);
          } else {
            arrCustomer[2] = '';
          }
          arrCustomerId.push(arrCustomer);
        });

      });
      return arrCustomerId;
    } catch (e) {
      log.error('Error en getCustomer', e);
    }
  }
  return {
    pageInit: pageInit,
    saveRecord: saveRecord,
    fieldChanged: fieldChanged,
    //sublistChanged: sublistChanged
  };
});
