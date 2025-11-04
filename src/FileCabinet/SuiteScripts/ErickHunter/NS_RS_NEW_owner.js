/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/https'], function (log, https) {
    let URL = "https://test-telematicsapi.hunterlabs.io" //SB: https://test-telematicsapi.hunterlabs.io / PR: https://telematicsapi.hunterlabs.io
    let TOKEN = 'ZGVubmlzLmZlcm5hbmRlekBteWV2b2wuYml6OkM0cnMzZ3M0QDIwMjI='

    function _post(context) {
        log.error("context", context);
        let newCustomer;
        let headers1 = [];
        headers1['Accept'] = '*/*';
        headers1['Content-Type'] = 'application/json';
        headers1['Authorization'] = 'Basic ' + TOKEN;

        var respCustomer;
        if (!context.customerNew.id) {
            respCustomer = https.post({
                url: URL + "/customer/user/",
                headers: headers1,
                body: JSON.stringify(context.customerNew),
            });
            respCustomer = JSON.parse(respCustomer.body);
            log.error("Post /customer/user/", respCustomer)
            newCustomer = respCustomer.id
        } else {
            var respCustomer = https.get({
                url: URL + "/customer/user/" + context.customerNew.id + "/",
                headers: headers1
            });
            respCustomer = JSON.parse(respCustomer.body);
            log.error("Get /customer/user/" + context.customerNew.id + "/", respCustomer)
            newCustomer = respCustomer.id
        }

        headers1['X-HTTP-Method-Override'] = 'PATCH';

        const respUserRemove = https.put({
            url: URL + "/asset/" + context.asset + "/user-remove/",
            headers: headers1,
            body: JSON.stringify({ "user_id": context.customerOld })
        });
        log.error("Patch /asset/" + context.asset + "/user-remove/", respUserRemove)

        const respAddUser = https.put({
            url: URL + "/asset/" + context.asset + "/user-add/",
            headers: headers1,
            body: JSON.stringify({ "user_id": newCustomer })
        });
        log.error("Patch /asset/" + context.asset + "/user-add/", respAddUser)

        delete headers1['X-HTTP-Method-Override'];
        var respoRemoveUserAssetCommands = new Array();
        var responUserAssetCommand = new Array();
        var commands = [];
        if (context.customerOld && context.asset) {
            var respGetUserAssetCommand = https.get({
                url: URL + "/user-asset-command/?user=" + context.customerOld + "&asset=" + context.asset,
                headers: headers1
            });
            log.error("Get /user-asset-command/?user=" + context.customerOld + "&asset=" + context.asset, respGetUserAssetCommand);

            respGetUserAssetCommand = JSON.parse(respGetUserAssetCommand.body);
            for (let i = 0; i < respGetUserAssetCommand.count; i++) {
                const respRemoveUserAssetCommands = https.put({
                    url: URL + "/user-asset-command/" + context.asset + "/remove-user-asset-commands/",
                    headers: headers1,
                    body: JSON.stringify({
                        "user": respGetUserAssetCommand.results[i].user,
                        "asset": respGetUserAssetCommand.results[i].asset
                    })
                });
                log.error("Put /user-asset-command/" + context.asset + "/remove-user-asset-commands/", respRemoveUserAssetCommands)

                respoRemoveUserAssetCommands[i] = respRemoveUserAssetCommands.body;
                commands.push({
                    command: respGetUserAssetCommand.results[i].command,
                    can_execute: true
                });
            }
            if (commands.length) {
                var respAddUserAssetCommand = https.post({
                    url: URL + "/user-asset-command/" + context.asset + "/add-user-asset-commands/",
                    headers: headers1,
                    body: JSON.stringify({
                        "commands": commands,
                        "user": newCustomer,
                        "asset": context.asset
                    })
                });
                log.error("Post /user-asset-command/" + context.asset + "/add-user-asset-commands/", respAddUserAssetCommand)
                respAddUserAssetCommand = JSON.parse(respAddUserAssetCommand.body);
                log.error('respAddUserAssetCommand', respAddUserAssetCommand)
                //responUserAssetCommand = respAddUserAssetCommand;
            }
        }

        const respSetPassword = https.get({
            url: URL + "/customer/user/" + newCustomer + "/set_password/",
            headers: headers1
        });
        log.error("Get /customer/user/" + newCustomer + "/set_password/", respSetPassword)

        return {
            "newCustomer": newCustomer,
            "AddUser": respAddUser.body,
            "UserRemove": respUserRemove.body,
            "SetPassword": respSetPassword.body,
            "send": true
        };
    }
    return {
        post: _post
    }
});