/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 *
 * Task          Date            Author                                         Remarks
 * TASK01        14 Nov 2023     Jeferson Mejía <jeferson.mejia@myevol.biz>     - I'm back
 */

define(['N/runtime', 'N/url', 'N/search', 'N/email'], function (runtime, url, search, email) {
    const GERENTE_CARTERA = 1632;
    const GERENTE_VENTAS = 1622;
    const onAction = (context) => {
        const FN = 'onAction';
        try {
            log.debug('Init', 'Proccess');
            const currentRecord = context.newRecord;
            const transactionId = currentRecord.id;
            const currentUser = runtime.getCurrentUser();
            //let senderId = currentRecord.getValue('custbody_ht_os_ejecutiva_backoffice');
            let tranID = currentRecord.getValue('tranid');
            let ejecutiva_gestion = currentRecord.getValue('custbody_ht_os_ejecutiva_backoffice');
            let entity = currentRecord.getText('entity');
            let bien = currentRecord.getText('custbody_ht_so_bien');
            let role1 = GERENTE_CARTERA;
            let role2 = GERENTE_VENTAS;
            let EMPLOYID = getUserRoles(role1, role2);
            log.debug('ejecutiva_gestion', ejecutiva_gestion);
            let subject = 'Orden de Servicio ' + tranID + ' pendiente de aprobación por edición';
            let body = '<p>Número de Documento: ' + tranID + '<br>Solicitante: ' + ejecutiva_gestion + '<br>Cliente: ' + entity + '<br>Bien: ' + bien + '<br>Estado: Pendiente de Aprobación</p><p><br>Puedes revisarlo ingresando a: http://www.netsuite.com para aprobarlo.<br> </p>';
            const transactionLink = getTransactionLink(transactionId);
            body += '<a href="' + transactionLink + '"><strong>Ver Registro</strong></a>';
            EMPLOYID.forEach(function (employees) { sendEmail(employees.id, subject, body, '', ejecutiva_gestion) })
        } catch (e) {
            log.error({ title: `${FN} error`, details: { message: `${FN} - ${e.message || `Unexpected error`}` } });
            throw { message: `${FN} - ${e.message || `Unexpected error`}` };
        }
    }

    const getTransactionLink = (transactionId) => {
        return 'https://' + url.resolveDomain({ hostType: url.HostType.APPLICATION }) + '/app/accounting/transactions/salesord.nl?id=' + transactionId + '&whence=';
    }

    const getUserRoles = (role1, role2) => {
        let EMPLOYID = new Array();
        let employeeSearch = search.create({ type: 'employee', columns: ['internalid'], filters: ['role', 'anyof', role1, role2] });
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
