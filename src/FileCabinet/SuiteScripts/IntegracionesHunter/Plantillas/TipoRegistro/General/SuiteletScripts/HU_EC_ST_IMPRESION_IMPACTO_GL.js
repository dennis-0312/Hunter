/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
*/
define(['N/record', 'N/render', 'N/file', 'N/search', 'SuiteScripts/IntegracionesHunter/Plantillas/Libreria'],

    function (record, render, file, search, libreria) {

        //ftl
        const TEMPLATE_PDF = "SuiteScripts/IntegracionesHunter/Plantillas/StandardTemplates/HU_EC_FTL_IMPACTO_GL.ftl";

        const onRequest = (context) => {
            try {
                if (context.request.method == 'GET') {
                    var jsonTemplate = {};
                    var { type, id } = context.request.parameters;
                    jsonTemplate = getDataForTemplate(type, id);

                    renderPDF(type, id, jsonTemplate, context);
                }
            } catch (e) {
                log.error("Error", "[ onRequest ] " + e);
            }
        }

        const getDataForTemplate = (type, id) => {
            try {
                let result = {};

                let recordLoad = record.load({ type: type, id: id });

                result.listGL = libreria.ExtraerImpactoGL(type, id)
                result.tranid = recordLoad.getText({fieldId: 'tranid'})
                result.trantype = libreria.ObtNombreTransaccionIngEsp(type)
                let dataCreate = getCreateUser(id)
                result.createdDate = dataCreate[1] ? dataCreate[1]: ""
                if(dataCreate.length){
                    result.userCreatedBy = getEmployeeInfo(dataCreate[0])[0]
                    result.nameCreatedBy = getEmployeeInfo(dataCreate[0])[1]
                    result.department = getEmployeeInfo(dataCreate[0])[2]
                    result.location = getEmployeeInfo(dataCreate[0])[3]
                }else{
                    result.userCreatedBy = ""
                    result.nameCreatedBy = ""
                    result.department = ""
                    result.location = ""
                }
                return result;

            } catch (error) {
                log.error('error-getDataForTemplate', error);
            }
        }

        const getCreateUser = (idTransaction) => {
            let systemnoteSearchObj = search.create({
                type: "systemnote",
                filters:
                [
                    ["type","is","T"],
                   "AND", 
                   ["recordid","equalto",idTransaction]
                ],
                columns:
                [                   
                   "name",
                   "date"
                ]
             });
             userData = []
             systemnoteSearchObj.run().each( result => {
                userData.push(result.getValue({name: "name"}))
                userData.push(result.getValue({name: "date"}))
                return false // Solo una iteración
            })
            return userData
        }

        const getEmployeeInfo = (idEntity) => {
            var searchUserInfo = search.lookupFields({
                type: "employee",
                id: idEntity,
                columns: [
                    'email',
                    'altname',
                    'department',
                    'location'
                ]
            });
            let email = searchUserInfo.email
            let user = email.substring(0,email.indexOf("@"))
            let name = searchUserInfo.altname
            let department = searchUserInfo.department?.length ? searchUserInfo.department[0].text : ""
            let location = searchUserInfo.location?.length ? searchUserInfo.location[0].text : ""
            return [user, name, department, location]
        }
        
        const renderPDF = (type, id, json, context) => {
            var fileContents = file.load({ id: TEMPLATE_PDF }).getContents();

            var renderer = render.create();
            renderer.templateContent = fileContents;

            renderer.addRecord({
                templateName: 'record',
                record: record.load({
                    type: type,
                    id: id
                })
            });

            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'data',
                data: json
            });

            result = renderer.renderAsString();
            context.response.renderPdf(result);
        }

        return {
            onRequest
        };
    });