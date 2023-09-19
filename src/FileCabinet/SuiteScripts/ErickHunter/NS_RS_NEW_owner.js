/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
 define(['N/log', 'N/https'], function (log, https) {
    function _post(context) {
        log.error("context", context);
        let newCustomer;
        let headers1 = [];
        headers1['Accept'] = '*/*';
        headers1['Content-Type'] = 'application/json';
        headers1['Authorization'] = 'Basic ZGVubmlzLmZlcm5hbmRlekBteWV2b2wuYml6OkM0cnMzZ3M0QDIwMjI=';

        var respCustomer;
        if (!context.customerNew.id) {
            respCustomer = https.post({
                url: "https://test-telematicsapi.hunterlabs.io/customer/user/",
                headers: headers1,
                body: JSON.stringify(context.customerNew),
            });
            respCustomer = JSON.parse(respCustomer.body);
            log.error("respCustomer", respCustomer);
            newCustomer = respCustomer.id
        } else {
            var respCustomer = https.get({
                url: "https://test-telematicsapi.hunterlabs.io/customer/user/" + context.customerNew.id + "/",
                headers: headers1
            });
            respCustomer = JSON.parse(respCustomer.body);
            log.error("respCustomer", respCustomer);
            newCustomer = respCustomer.id
        }

        headers1['X-HTTP-Method-Override'] = 'PATCH';

        const respUserRemove = https.put({
            url: "https://test-telematicsapi.hunterlabs.io/asset/" + context.asset + "/user-remove/",
            headers: headers1,
            body: JSON.stringify({
                "user_id": context.customerOld
            })
        });
        log.debug("respUserRemove", respUserRemove);

        const respAddUser = https.put({
            url: "https://test-telematicsapi.hunterlabs.io/asset/" + context.asset + "/user-add/",
            headers: headers1,
            body: JSON.stringify({
                "user_id": newCustomer
            })
        });
        log.debug("respAddUser", respAddUser);

        delete headers1['X-HTTP-Method-Override'];
        var respoRemoveUserAssetCommands = new Array();
        var responUserAssetCommand = new Array();
        if (context.customerOld && context.asset) {
            var respGetUserAssetCommand = https.get({
                url: "https://test-telematicsapi.hunterlabs.io/user-asset-command/?user=" + context.customerOld + "&asset=" + context.asset,
                headers: headers1
            });
            log.debug("respGetUserAssetCommand", respGetUserAssetCommand);

            respGetUserAssetCommand = JSON.parse(respGetUserAssetCommand.body);
            log.debug("respGetUserAssetCommand", respGetUserAssetCommand);
            for (let i = 0; i < respGetUserAssetCommand.count; i++) {
                const respRemoveUserAssetCommands = https.put({
                    url: "https://test-telematicsapi.hunterlabs.io/user-asset-command/" + respGetUserAssetCommand.results[i].id + "/remove-user-asset-commands/",
                    headers: headers1,
                    body: JSON.stringify({
                        "user": respGetUserAssetCommand.results[i].user,
                        "asset": respGetUserAssetCommand.results[i].asset
                    })
                });
                log.debug("respRemoveUserAssetCommands", respRemoveUserAssetCommands);

                respoRemoveUserAssetCommands[i] = respRemoveUserAssetCommands.body;
                var respAddUserAssetCommand = https.post({
                    url: "https://test-telematicsapi.hunterlabs.io/user-asset-command/" + respGetUserAssetCommand.results[i].id + "/add-user-asset-commands/",
                    headers: headers1,
                    body: JSON.stringify({
                        "commands": [
                            respGetUserAssetCommand.results[i].command
                        ],
                        "user": newCustomer,
                        "asset": respGetUserAssetCommand.results[i].asset
                    }),
                });
                log.debug("respAddUserAssetCommand", respAddUserAssetCommand);

                respAddUserAssetCommand = JSON.parse(respAddUserAssetCommand.body);
                responUserAssetCommand[i] = respAddUserAssetCommand;
            }
        }

        const respSetPassword = https.get({
            url: "https://test-telematicsapi.hunterlabs.io/customer/user/" + newCustomer + "/set_password/",
            headers: headers1
        });
        log.debug("respSetPassword", respSetPassword);

        return {
            "newCustomer": respCustomer, "AddUser": respAddUser.body,
            "UserRemove": respUserRemove.body,
            "SetPassword": respSetPassword.body
        };
    }
    return {
        post: _post
    }
});