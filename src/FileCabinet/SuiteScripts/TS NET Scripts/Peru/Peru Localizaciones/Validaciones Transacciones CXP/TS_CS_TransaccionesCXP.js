/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @Author dfernandez
 */
define([
    './TS_LogicaNegocio'
],
    (logicaNegocio) => {

        const pageInit = (scriptContext) => {
            eventMode = scriptContext.mode;
        }

        const saveRecord = (scriptContext) => {
            if (scriptContext.currentRecord.type != 'expensereport') {
                return logicaNegocio.validationResponse(scriptContext, eventMode);
            } else {
                return true;
            }
        }

        const validateLine = (scriptContext) => {
            if (scriptContext.currentRecord.type == 'expensereport') {
                let sublistName = scriptContext.sublistId;
                if (sublistName === 'expense') {
                    return logicaNegocio.validationResponse(scriptContext, eventMode);
                }
            } else {
                return true;
            }
        }

        return {
            pageInit: pageInit,
            saveRecord: saveRecord,
            validateLine: validateLine
        };

    });
