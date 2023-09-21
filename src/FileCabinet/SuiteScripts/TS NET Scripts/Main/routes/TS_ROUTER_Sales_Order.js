/**
 * @NApiVersion 2.1
 */
define(['N/log', 'N/record', 'N/file'],
    /**
 * @param{log} log
 * @param{record} record
 */
    (log, record, file) => {
        const getSchedule = (scriptContext) => {
            try {
                log.debug('Ejecute desde Router', scriptContext.newRecord.type);
                let objRecord = record.load({
                    type: scriptContext.newRecord.type,
                    id: scriptContext.newRecord.id,
                    isDynamic: true
                });
                let numLines = objRecord.getLineCount({ sublistId: 'billingschedule' });
                log.debug('Result', numLines);

                // objRecord.selectLine({ sublistId: 'billingschedule', line: i });
                // let cantidad = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity' });


                // let fileObj = file.create({
                //     name: 'testJson.json',
                //     fileType: file.Type.JSON,
                //     contents: JSON.stringify(schedule),
                //     folder: 2680,
                //     isOnline: true
                // });

                // let fileId = fileObj.save();
                // log.debug('FileJson', fileId);
            } catch (error) {
                log.error('ErrorRouter', error);
            }
        }

        const bar = () => { }

        return {
            getSchedule,
            bar
        }

    });
