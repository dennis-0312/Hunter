/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 *
 * Task          Date            Author                                         Remarks
 * TASK01        14 Nov 2023     Dennis Fernandez <dennis.fernandez@myevol.biz>     - I'm back
 */

define(['N/runtime', 'N/url', 'N/search', 'N/email', 'N/record'], function (runtime, url, search, email, record) {
    const EC_APROBADOR_OP = 1672;
    const onAction = (context) => {
        const FN = 'onAction';
        try {
            const currentRecord = context.newRecord;
            const transactionId = currentRecord.id;
            // const currentRecord = record.load({
            //     type: 'customtransaction_orden_pago',
            //     id: transactionId,
            //     isDynamic: true,
            // })
            //const currentUser = runtime.getCurrentUser();
            let tranID = currentRecord.getValue('tranid');
            let ejecutiva_gestion = currentRecord.getValue('custbody_ts_solicitante');
            let solicitante = currentRecord.getText('custbody_ts_solicitante');
            let entity = currentRecord.getText('custbody_ts_op');
            let role = EC_APROBADOR_OP;
            let EMPLOYID = getUserRoles(role);
            log.debug('solicitante', ejecutiva_gestion + ' - ' + entity);
            let subject = 'Orden de Pago ' + tranID + ' pendiente de aprobación.';
            let body = '<p>Número de Documento: ' + tranID + '<br>Solicitante: ' + solicitante + '<br>Cliente: ' + entity + '<br>Estado: Pendiente de Aprobación</p><p><br>Puedes revisarlo ingresando a: http://www.netsuite.com para aprobarlo.<br> </p>';
            const transactionLink = getTransactionLink(transactionId);
            body += '<a href="' + transactionLink + '"><strong>Ver Registro</strong></a>';
            EMPLOYID.forEach(function (employees) {
                sendEmail(employees.id, subject, body, '', ejecutiva_gestion);
            })
        } catch (e) {
            log.error({
                title: `${FN} error`,
                details: { message: `${FN} - ${e.message || `Unexpected error`}` },
            });
            throw { message: `${FN} - ${e.message || `Unexpected error`}` };
        }
    }

    const getTransactionLink = (transactionId) => {
        return 'https://' + url.resolveDomain({
            hostType: url.HostType.APPLICATION
        }) + '/app/accounting/transactions/custom.nl?id=' + transactionId + '&whence=';
    }

    const getUserRoles = (role) => {
        let EMPLOYID = new Array();

        let employeeSearch = search.create({
            type: 'employee',
            columns: ['internalid'],
            filters: ['role', 'is', role]
        });

        let resultEmployee = employeeSearch.run().getRange(0, 1000);

        if (resultEmployee.length != 0) {
            for (var i in resultEmployee) {
                let employeeID = resultEmployee[i].getValue({ name: 'internalid' });
                EMPLOYID.push({ 'id': employeeID });
            }
        }
        return EMPLOYID;
    }

    const sendEmail = (paramUser, paramSubject, paramBody, paramArrayUsers, userId) => {
        try {
            log.debug('userId', userId);
            log.debug('paramUser', paramUser);
            if (paramUser) {
                try {
                    var employSearch = search.lookupFields({
                        type: 'employee',
                        id: paramUser,
                        columns: ['email', 'firstname', 'lastname']
                    });
                    log.error("employSearch", employSearch);
                    emailResult = employSearch.email;
                    nameResult = employSearch.firstname + ' ' + employSearch.lastname;
                } catch (msgerror) {
                    return true;
                }


                if (!emailResult) {
                    log.debug('function sendemail ', 'Usuario no tiene correo');
                    return true;
                }
                if (userId) {
                    email.send({
                        author: userId,
                        recipients: emailResult,
                        subject: paramSubject,
                        body: paramBody
                    });
                } else {
                    email.send({
                        author: paramUser,
                        recipients: emailResult,
                        subject: paramSubject,
                        body: paramBody
                    });
                }
            } else {
                paramArrayUsers.forEach(function (employees) {
                    if (employees.id) {
                        try {
                            var employSearch = search.lookupFields({
                                type: 'employee',
                                id: employees.id,
                                columns: ['email', 'firstname', 'lastname']
                            });

                            emailResult = employSearch.email;
                            nameResult = employSearch.firstname + ' ' + employSearch.lastname;
                        } catch (msgerror) {
                            return true;
                        }
                    }

                    if (!emailResult) {
                        log.debug('function sendemail ', 'Usuario no tiene correo');
                        return true;
                    }

                    email.send({
                        author: employees.id,
                        recipients: emailResult,
                        subject: paramSubject,
                        body: paramBody
                    });

                })
            }

        } catch (error) {
            log.error('sendConfirmUserEmail', error);
        }
    }

    return {
        onAction: onAction
    };
});
