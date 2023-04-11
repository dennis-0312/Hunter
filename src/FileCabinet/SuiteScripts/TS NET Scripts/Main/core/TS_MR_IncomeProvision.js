/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define([
    'N/log',
    '../controller/TS_CM_Controller'
],
    /**
 * @param{log} log
 */
    (log, _controller) => {

        const getInputData = () => {
            try {
                const json = _controller.getProvisionDetail();
                if (json == 0)
                    json = new Array();
                return json;
            } catch (error) {
                log.error('Error-getInputData', error);
            }
        }

        const map = (context) => {
            try {
                context.write({ key: context.key, value: context.value });
            } catch (error) {
                log.error('Error-map', error);
            }
        }

        const reduce = (context) => {
            try {
                context.write({ key: context.key, value: context.values });
            } catch (error) {
                log.error('Error-reduce', error);
            }
        }

        const summarize = (context) => {
            let records = '';
            try {
                context.output.iterator().each((key, value) => {
                    records = JSON.parse(JSON.parse(value));
                    let provision = _controller.createProvisionDetail(records[0], records[1], records[2], records[3]);
                    log.debug('Record', 'provision: ' + provision + ' - journal: ' + records[0] + ' - serviceOrder: ' + records[1] + ' - item: ' + records[2] + ' - amountProvided: ' + records[3]);
                    return true;
                });
            } catch (error) {
                log.error('Error-summarize', error);
            }
        }

        return { getInputData, map, reduce, summarize }
    });
