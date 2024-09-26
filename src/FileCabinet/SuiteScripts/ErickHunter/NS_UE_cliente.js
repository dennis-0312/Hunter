define /**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * Task          Date                Author                                         Remarks
 * DT-0000      01 Enero 2022       name lastname <examle@gmail.com>       
*/
define(['N/log', 'N/record'], function (log, record) {


  function beforeLoad(context) {
  }

  function afterSubmit(context) {

    if (context.type !== context.UserEventType.EDIT) {
      log.debug(1);
      return (context);
    }
    log.debug(context.type);
    return (context);
    let objRecord = context.newRecord;
    let ordenId = objRecord.id;
    let customer = record.load({ type: record.Type.CUSTOMER, id: ordenId });
    let altname = customer.getValue({ fieldId: 'altname' });

    log.debug(altname);
  }

  function beforeSubmit(context) {
  }

  return {
    beforeLoad: beforeLoad,
    afterSubmit: afterSubmit,
    beforeSubmit: beforeSubmit
  }
}
)