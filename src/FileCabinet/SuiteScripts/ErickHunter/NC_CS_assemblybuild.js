/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define([
   'N/ui/dialog',
   '../TS NET Scripts/Main/controller/TS_CM_Controller',
   '../TS NET Scripts/Main/constant/TS_CM_Constant',
], (dialog, _controller, _constant) => {

   const pageInit = (scriptContext) => {
      let currentRecord = scriptContext.currentRecord;
      currentRecord.setValue('quantity', 1);
   }

   const saveRecord = (scriptContext) => {
      let currentRecord = scriptContext.currentRecord;
      if (currentRecord.getValue('custbody_ht_ce_ordentrabajo').length > 0) {
         let pro = _controller.getParameter(currentRecord.getValue('item'), _constant.Parameter.PRO_ITEM_COMERCIAL_DE_PRODUCCION);
         if (pro == _constant.Valor.SI) {
            if (currentRecord.getValue('custbody_ht_as_datos_tecnicos').length == 0) {
               dialog.alert({ title: 'Alerta', message: 'El producto es un item comercial de producción, requiere ingresar los Datos Técnicos' });
               return false;
            }
         }
      }
      return true;
   }

   return {
      pageInit: pageInit,
      saveRecord: saveRecord
   }
});

