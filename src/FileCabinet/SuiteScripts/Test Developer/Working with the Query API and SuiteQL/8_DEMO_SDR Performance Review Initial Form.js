/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/redirect', 'N/ui/serverWidget' , 'N/query'],

function(redirect , serverWidget , query) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
    	var request = context.request;
    	var response = context.response;

    	if(request.method =='GET'){ //displaying the form

        	var form = serverWidget.createForm({
        	    title : 'Select an Employee'
        	});
        	
        	form.addField({
        	    id : 'custpage_employee',
        	    type : serverWidget.FieldType.SELECT,
        	    label : 'Employee',
        	    source : 'employee'
        	});
        	
        	form.addSubmitButton('Continue');
        	response.writePage(form);
    	}
    	
    	else{ //submitting the form
    		
    		var emp_id = request.parameters.custpage_employee;
    		
    		var resultSet = query.runSuiteQL({
 			    query: `SELECT employee.entityid FROM employee WHERE employee.id = ? ` ,
 			    params: [emp_id]
 			}); 

    		var results = resultSet.results;
    		var emp_display='';
	    	
	    	for (var i = results.length - 1; i >= 0; i--){
	    		emp_display = results[i].values[0];
	    	}
	    	
	    	
    			redirect.toSuitelet({
        		    scriptId: 'customscript_suitelet_query' , 
        		    deploymentId: 'customdeploy_suitelet_query',
        		    parameters: {
        		    	'custparam_employee': emp_id,
        		    	'custparam_employee_disp' : emp_display
        		   } 
        		});
    	}
    }

    return {
        onRequest: onRequest
    };
    
});
