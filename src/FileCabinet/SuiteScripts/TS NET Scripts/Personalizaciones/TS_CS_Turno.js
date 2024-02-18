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
            if (typeMode == "create" || typeMode == "copy") {
                const transaccion = objRecord.getValue("transaction");
                var Turno = getTurno();

                for (let i = 0; i < Turno.length; i++) {
                    if (transaccion == Turno[i][0]) {
                        alert("Ya hay un turno para esta transacción.");
                        return false;
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
                if (typeTransaction === "task") {
                    var Turno = getTurno();
                    console.log('sublistFieldName', sublistFieldName);
                    console.log('Turno', Turno);
                    if (sublistFieldName === "transaction") {
                        const turno = objRecord.getText(sublistFieldName);
                        for (let i = 0; i < Turno.length; i++) {
                            if (turno == Turno[i][0]) {
                                alert(
                                    "Ya hay un turno para esta transacción."
                                );

                            }
                        }
                    }
                }
            }
        } catch (e) {
            log.error("Error en el fieldChange", e);
        }
    };
    function getTurno() {
        try {
            var arrTurnoId = new Array();
            var busqueda = search.create({
                type: "task",
                filters:
                    [
                    ],
                columns:
                    [
                        search.createColumn({ name: "transaction", label: "Transacción" })
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
                    var arrTurno = new Array();
                    //0. Internal id match
                    if (result.getValue(columns[0]) != null) {
                        arrTurno[0] = result.getValue(columns[0]);
                    } else {
                        arrTurno[0] = '';
                    }
                    arrTurnoId.push(arrTurno);
                });

            });
            return arrTurnoId;
        } catch (e) {
            log.error('Error en getTurno', e);
        }
    }
    return {
        pageInit: pageInit,
        saveRecord: saveRecord,
        fieldChanged: fieldChanged,
        //sublistChanged: sublistChanged
    };
});
