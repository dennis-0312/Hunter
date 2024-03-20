/**
 * Copyright 2014, 2020, 2021 NetSuite Inc.  User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */

if (!_4601) { var _4601 = {}; }

_4601.accrualCS = {};

(function () {
    var cs = _4601.accrualCS;
    var context = nlapiGetContext();
    var numberformat = context.getSetting('SCRIPT','NUMBERFORMAT');
    var negativeformat = context.getSetting('SCRIPT','NEGATIVE_NUMBER_FORMAT');
    cs.timeoutId = null;
    cs.minimumReloadDelay = 2000;
    cs.isReloading = false;

    cs.pageInit = function pageInit(type) {
        try{
            cs.type = type.toString();
            if (_4601.isUI()) {
                cs.isWiTaxApplicable = !!nlapiGetField('custpage_4601_witaxamount');
                cs.pageInitSetPublicVariables();
                cs.isEntityChanged = false;
                cs.isSubsidiaryChanged = false;
                cs.isAddressChanged = false;
                
                window.addEventListener('beforeunload', function() { cs.isReloading = true; });
                
                if (cs.isWiTaxApplicable) {
                    cs.wiTaxSetup = JSON.parse(nlapiGetFieldValue("custpage_4601_witaxsetupsasjson"));
                    cs.isOnAccrual =
                        (cs.wiTaxSetup[cs.tranType + 'taxpoint'] === 'onaccrual' && ['purchaseorder', 'salesorder'].indexOf(_4601.getRecordType()) < 0 ) ||
                        (cs.wiTaxSetup[cs.tranType + 'taxpoint'] === 'onpayment' && ['cashsale', 'check'].indexOf(_4601.getRecordType()) > -1);
                    cs.wiTaxCodes = cs.pageInit.getWiTaxCodes();
                    cs.wiTaxSublistNames = _4601.getWiTaxSublistNames();
                    cs.pageInit.initializeSublistTotals();
                    cs.enableLookupTrans = nlapiGetFieldValue('custpage_4601_enablelookuptrans') === 'true';
                    
                    var appliesToFieldValue = nlapiGetFieldValue('custpage_4601_appliesto');
                    nlapiSetFieldValue('custbody_4601_appliesto', appliesToFieldValue);
                    cs.appliesToTotal = appliesToFieldValue === 'T';

                    cs.wiTaxSublistNames.forEach(function (sublistName) {
                        cs.pageInit.removeWiTaxLines(sublistName);
                    });
                    
                    if (_4601.hasHeaderDiscount()) { cs.pageInit.clearWiTaxAmounts("item"); }
                    
                    if (cs.appliesToTotal) { cs.pageInit.setSubtabWiTaxCodeFieldValue(); }
                }
            } else {
                return true;
            }
            if (cs.type === 'edit') {
                cs.pageInitSetStorageData();
            }
        }

        catch(ex){
            alert(ex);

            var error_msg = [];
            var triggered_by = ['Error triggered by user:  ', _4601.getCurrentUserName()].join('');         

            if ( ex instanceof nlobjError ){
                error_msg = ['System Error', '<br/>', ex.getCode(), '<br/>', ex.getDetails(), '<br/>', triggered_by].join('');
            } else{
                error_msg = ['Unexpected Error', '<br/>', ex.toString(), '<br/>', triggered_by].join('');
            }

            throw nlapiCreateError('WITHHOLDING TAX BUNDLE ERROR', error_msg);
        }
    };

    cs.pageInitSetStorageData = function pageInitSetStorageData() {
        var manualReload = getUrlParamValue('manual_reload');

        if (manualReload === 'T' && _4601.isOneWorld() && ['purchaseorder', 'vendorbill','check'].indexOf(_4601.getRecordType()) < 0) {
            var idParameter = getUrlParamValue('id');
            var entityParameter = getUrlParamValue('entity');
            var nexusParameter = getUrlParamValue('nexus');

            var storageKey = _4601.getRecordType() + '-' + idParameter.toString();
            var defaultKey = 'DEFAULT-' + _4601.getRecordType() + '-' + idParameter.toString();
            var storageItem = sessionStorage.getItem(storageKey);

            var item = storageItem && JSON.parse(storageItem);
            if (!item) {
                cs.setStorageItem(storageKey, entityParameter, nexusParameter);
                cs.setStorageItem(defaultKey, nlapiGetFieldValue('entity'), nlapiGetFieldValue('nexus'));
                cs.setSelectedEntity(entityParameter);
            }
            else {
                if (item.nexus === nexusParameter.toString()) {
                    cs.setSelectedEntity(entityParameter);
                }
                else if (item.entity !== entityParameter.toString()) {
                    cs.setStorageItem(storageKey, entityParameter, nexusParameter);
                    cs.setSelectedEntity(entityParameter);
                }
            }
            cs.logStorageData();
        }
    };

    cs.logStorageData = function logStorageData() {
        var key = _4601.getRecordType() + '-' + getUrlParamValue('id');
        var defKey = 'DEFAULT-' + _4601.getRecordType() + '-' + getUrlParamValue('id');

        var logItem = sessionStorage.getItem(key);
        var logDefaultItem = sessionStorage.getItem(defKey);
        
        if (logDefaultItem) {
            nlapiLogExecution('DEBUG','Session Storage (Default)', defKey + ' : ' + logDefaultItem);
        }
        if (logItem) {
            nlapiLogExecution('DEBUG','Session Storage', key + ' : ' + logItem);
        }
    }

    cs.setStorageItem = function setStorageItem(key, entityId, nexusId) {
        var item = JSON.stringify({ 
            entity: entityId,
            nexus: nexusId
        });
        sessionStorage.setItem(key, item);
    }

    cs.setSelectedEntity = function setSelectedEntity(entityId) {
        if (entityId != nlapiGetFieldValue('entity')) {
            cs.currentEntity = entityId;
            nlapiSetFieldValue('entity', entityId, false);
        }
    }

    cs.pageInitSetPublicVariables = function pageInitSetPublicVariables(){
        cs.resourceObject = JSON.parse(nlapiGetFieldValue('custpage_4601_resobj'));
        cs.tranType = nlapiGetFieldValue('custpage_4601_witaxtype');
        cs.currentEntity = nlapiGetFieldValue('entity');
        cs.currentEntityType = _4601.getEntityType();
        cs.currentNexus = nlapiGetFieldValue('nexus');
        cs.publicVarsSet = true;
    };    

    cs.pageInit.getWiTaxCodes = function getWiTaxCodes() {
        var elements = JSON.parse(nlapiGetFieldValue('custpage_4601_witaxcodesasjson'));
        return new _4601.OrderedHash('id', elements);
    };

    cs.pageInit.initializeSublistTotals = function initializeSublistTotals() {
        cs.sublistTotals = {};

        cs.wiTaxSublistNames.forEach(function (sublistName) {
            cs.sublistTotals[sublistName] = {
                wiTaxAmount: 0,
                baseAmount: 0
            };
        });
    };

    cs.pageInit.removeWiTaxLines = function removeWiTaxLines(sublistName) {
        var lineItemCount = nlapiGetLineItemCount(sublistName);
        var period = nlapiGetFieldValue('postingperiod');
        var isPeriodClosed = false;
        if (period) {
            isPeriodClosed = _4601.getAccountingPeriodStatus(period);
        }

        for (var i = lineItemCount; i > 0 ; i--) {
            var isWithholdingTaxLine = nlapiGetLineItemValue(sublistName, 'custcol_4601_'+ (_4601.isExpenseSublist(sublistName) ? 'witaxline_exp': 'witaxline'), i) === 'T';

            if (isWithholdingTaxLine && isPeriodClosed === false) {
                nlapiSelectLineItem(sublistName, i);
                nlapiRemoveLineItem(sublistName, i);
            }
        }
    };

    cs.pageInit.clearWiTaxAmounts = function clearWiTaxAmounts (sublist) {
        var lineItemCount = nlapiGetLineItemCount(sublist);

        for (var i = 1; i <= lineItemCount; i++) {
            if (nlapiGetLineItemValue(sublist, "custcol_4601_witaxapplies", i) === "T") {
                // the recomputation of line amounts are done by triggering the fieldChanged event on the line
                nlapiSelectLineItem(sublist, i);
                nlapiSetCurrentLineItemValue(sublist, "custcol_4601_witaxapplies", "T");
                nlapiCommitLineItem(sublist);
            }
        }
    };

    cs.pageInit.setSubtabWiTaxCodeFieldValue = function setSubtabWiTaxCodeFieldValue() {
        var value = _4601.getFirstWiTaxCodeInUse(cs.wiTaxSublistNames) || nlapiGetFieldValue('custbody_4601_entitydefaultwitaxcode');
        if (value && cs.enableLookupTrans) { 
            nlapiSetFieldValue('custpage_4601_witaxcode', value, true); 
        }
    };

    cs.pageInit.clickRecalcButton = function clickRecalcButton() {
        var recalcButton = document.getElementById('recalc');
        recalcButton && recalcButton.click();
    };

    cs.validateField = function validateField(sublistName, fieldName) {
        var isValid = true;
        var strMsgs = JSON.parse(nlapiGetFieldValue('custpage_cs_msgs_wht'));

        if (_4601.isUI() && cs.isWiTaxApplicable) {
            if (!sublistName && fieldName === 'custpage_4601_witaxcode' && cs.validateField.hasOneLineWithWiTax() && !nlapiGetFieldValue(fieldName)){
                alert(cs.resourceObject.TRANS_CS['form_details'].WTAX_CODE.message); //'Please select a Tax Code.'
                isValid = false;
            }

            if (cs.isOnAccrual || (_4601.getRecordType() === "salesorder" && cs.wiTaxSetup[cs.tranType + 'taxpoint'] === "onaccrual")) {
                if (!sublistName && fieldName === "discountitem" && cs.validateField.hasOneLineWithWiTax() && nlapiGetFieldValue(fieldName)) {
                    // "Applying withholding tax on accrual in transactions where a Header Discount is used is currently not supported."
                    alert(strMsgs['ERR_INVALID_DISCOUNT_ON_ACCRUAL']);
                    nlapiSetFieldValue("discountitem", "", false);
                    isValid = false;
                }
            }
        }

        return isValid;
    };

    cs.validateField.hasOneLineWithWiTax = function hasOneLineWithWiTax() {
        var isWithOneLineWithWiTax = false;

        cs.wiTaxSublistNames.forEach(function (sublistName) {
            if (!isWithOneLineWithWiTax){
                var lineItemCount = nlapiGetLineItemCount(sublistName);

                for (var i = 1; i <= lineItemCount ; i++) {
                    if (nlapiGetLineItemValue(sublistName, 'custcol_4601_witaxapplies', i) === 'T') {
                        isWithOneLineWithWiTax = true;
                        break;
                    }
                }
            }
        });

        return isWithOneLineWithWiTax;

    };
    
    cs.postSource = function postSource(sublistName, fieldName) {
        try {
            if (_4601.isUI()) {
                if (fieldName === 'entity' && nlapiGetFieldValue('entity')) {                	
                	if (!cs.currentEntity && cs.publicVarsSet) {                                      
                        cs.fieldChanged.reload(true);
                    }
                    if (_4601.getRecordType() == 'check' && cs.currentEntityType && cs.currentEntityType !== _4601.getEntityType()) {
                        cs.fieldChanged.reload(true);
                    }
                }
                else if (fieldName === 'subsidiary') {
                    cs.fieldChanged.cancelAutoAppliedLineItem();
                }
                else if (fieldName === 'item') {
                    var wiTaxSetup = JSON.parse(nlapiGetFieldValue("custpage_4601_witaxsetupsasjson"));
                    if (wiTaxSetup) {
                        var autoApply = cs.wiTaxSetup['autoapply'];
                        if (autoApply) {
                            var isCalledByExpenseSublist = _4601.isExpenseSublist(sublistName);
                            var fieldNameRoot = isCalledByExpenseSublist ? 'witaxcode_exp':'witaxcode';
                            var value = nlapiGetCurrentLineItemValue(sublistName, 'custcol_4601_' + fieldNameRoot);

                            // If line item has no wiTaxCode, get default from entity or item
                            if (!value) {
                                value = cs.fieldChanged.getDefaultWiTaxCode(sublistName);
                            }
                            cs.fieldChanged.setWiTaxCurrentLineItemValue(sublistName, fieldNameRoot, value, (isCalledByExpenseSublist ? 'witaxcode': null)); 
                        }
                    }
                }
            } else {
                return true;
            }
        } catch(ex){
            nlapiLogExecution('ERROR', 'WITHHOLDING TAX BUNDLE ERROR', ['Error triggered by user:  ', _4601.getCurrentUserName(), '\n', ex.toString()].join(''));
        }
    },
    
    cs.fieldChanged = function fieldChanged(sublistName, fieldName, linenum) {
        try{
            if (_4601.isUI()) {
                if (cs.isWiTaxApplicable) {
                    if (cs.wiTaxAppliesToSublist(sublistName)) {
                        if ([
                            'quantity',
                            'rate',
                            'amount',
                            'grossamt',
                            'tax1amt',
                            'custcol_4601_witaxapplies',
                            'custpage_4601_witaxcode',
                            'custcol_4601_itemdefaultwitaxcode'
                        ].indexOf(fieldName) > -1) {
                            if(cs.fieldChanged.isWiTaxAppliedToLine(sublistName) ){
                                cs.fieldChanged.setWiTaxCode(sublistName, {toDefault: fieldName === 'custcol_4601_itemdefaultwitaxcode'});
                                cs.fieldChanged.setWiTaxRate(sublistName);
                                cs.fieldChanged.setWiTaxBaseAmount(sublistName);
                                cs.fieldChanged.setWiTaxAmount(sublistName);
                            }
                        }
                    } else {
                        if (fieldName === 'custpage_4601_witaxcode') {
                            cs.fieldChanged.setSubTabWiTaxRate();
                            cs.fieldChanged.setAllWiTaxLineItemValues();
                        } else if (fieldName === 'custpage_4601_appliesto') {
                            cs.fieldChanged.reload(false);
                        }
                    }
                }
                
                if (fieldName === "discountrate") {
                    if (_4601.hasHeaderDiscount()) {
                        cs.fieldChanged.setCustPageAmounts("item", true);
                    } else {
                        cs.fieldChanged.setCustPageAmounts("item", false);
                    }
                }
                
                if (fieldName === "subsidiary") {
                    cs.isSubsidiaryChanged = true;
                }
                
                if (fieldName === "shipaddress") {
                    cs.isAddressChanged = true;
                }

                if (cs.type === 'edit' && _4601.isOneWorld() && ['purchaseorder', 'vendorbill','check'].indexOf(_4601.getRecordType()) < 0) {
                    cs.fieldChanged.setEntityAddress(fieldName);
                }
                else {
                    if (fieldName === 'entity') {
                        cs.isEntityChanged = true;
                    }
                    var isSupportedNexusChangeTrigger = cs.isEntityChanged || cs.isSubsidiaryChanged || cs.isAddressChanged;
                    if (fieldName === 'nexus' && (cs.currentNexus !== nlapiGetFieldValue('nexus')) && cs.publicVarsSet && isSupportedNexusChangeTrigger) {
                        cs.fieldChanged.reload(true);
                    }
                }
            } else {
                return true;
            }
        }

        catch(ex){
           throw nlapiCreateError("WITHHOLDING TAX BUNDLE ERROR",                      
                      ["Error triggered by user:  ", _4601.getCurrentUserName(), "\n", ex.toString()].join(""));
        }
    };

    cs.fieldChanged.setEntityAddress = function setEntityAddress(fieldName) {
        if (fieldName === 'entity') {
            cs.isEntityChanged = true;
        }
        if (fieldName === 'nexus' && (cs.currentNexus !== nlapiGetFieldValue('nexus'))) {
            if (cs.publicVarsSet) {
                var recordId = getUrlParamValue('id');
                var entityId = getUrlParamValue('entity');
                var nexusId = getUrlParamValue('nexus');
                var manualReload = getUrlParamValue('manual_reload');

                var storageKey = _4601.getRecordType() + '-' + recordId.toString();
                var defaultKey = 'DEFAULT-' + _4601.getRecordType() + '-' + recordId.toString();
                var storageItem = sessionStorage.getItem(storageKey);
                var defaultItem = sessionStorage.getItem(defaultKey);
                var item = storageItem && JSON.parse(storageItem);
                var original = defaultItem && JSON.parse(defaultItem);

                var isAddressChanged = (manualReload === 'T' && nexusId !== nlapiGetFieldValue('nexus') && entityId === nlapiGetFieldValue('entity'));
                var isEntityOnDefault = item != null && original != null && item.entity === original.entity;
                var isEntityChanged = (manualReload === 'T' && entityId !== nlapiGetFieldValue('entity'));

                if (manualReload == null || (!isAddressChanged && !isEntityOnDefault) || isEntityChanged || (isAddressChanged && isEntityOnDefault)) {
                    cs.fieldChanged.reload(true);
                }
                else if (isAddressChanged && !isEntityOnDefault) {
                    cs.publicVarsSet = false;
                    cs.fieldChanged.cancelAddressChange();
                }
                else if (!isAddressChanged && isEntityOnDefault) {
                    var defaultUrl = window.location.href.replace(window.location.search,'?id='+recordId +'&e=T&whence=');
                    window.location.href = defaultUrl;
                }
            }
            else {
                cs.fieldChanged.cancelAddressChange();
            }
        }
    }

    cs.fieldChanged.cancelAddressChange = function cancelAddressChange() {
        var strMsgs = nlapiGetFieldValue('custpage_cs_msgs_wht');
        if (strMsgs) {
            var msg = JSON.parse(strMsgs);
            alert(msg['INFO_ADDRESS_CHANGE_ERROR_MESSAGE']);
                        
            var addressId = getUrlParamValue('shipaddresslist');
            nlapiSetFieldValue('shipaddresslist', addressId, false);
        }
    };

    cs.fieldChanged.isWiTaxAppliedToLine = function isWiTaxAppliedToLine(sublistName){
        var witaxapplies = nlapiGetCurrentLineItemValue(sublistName, 'custcol_4601_witaxapplies') === 'T';
        var sublistField = sublistName == 'item' ? 'item' : 'account';
        var currLineValue = nlapiGetCurrentLineItemValue(sublistName, sublistField);

        if (!witaxapplies && currLineValue){
            if(_4601.isExpenseSublist(sublistName)){
                cs.fieldChanged.setWiTaxCurrentLineItemValue(sublistName, 'witaxcode_exp', "", 'witaxcode');
                cs.fieldChanged.setWiTaxCurrentLineItemValue(sublistName, 'witaxrate_exp', "", 'witaxrate');
                cs.fieldChanged.setWiTaxCurrentLineItemValue(sublistName, 'witaxamt_exp', "", 'witaxamount');
                cs.fieldChanged.setWiTaxCurrentLineItemValue(sublistName, 'witaxbamt_exp', "", 'witaxbaseamount');
            } else if(_4601.isItemSublist(sublistName)){
                cs.fieldChanged.setWiTaxCurrentLineItemValue(sublistName, 'witaxcode', "");
                cs.fieldChanged.setWiTaxCurrentLineItemValue(sublistName, 'witaxrate', "");
                cs.fieldChanged.setWiTaxCurrentLineItemValue(sublistName, 'witaxamount', "");
                cs.fieldChanged.setWiTaxCurrentLineItemValue(sublistName, 'witaxbaseamount', "");
            }
        }

        return witaxapplies;
    };    

    cs.fieldChanged.setWiTaxCode = function setWiTaxCode(sublistName, options) {
        options = options || {};
        var isCalledByExpenseSublist = _4601.isExpenseSublist(sublistName);
        var witaxapplies = nlapiGetCurrentLineItemValue(sublistName, 'custcol_4601_witaxapplies') === 'T';
        var value = '';

        if (witaxapplies) {
            if (cs.appliesToTotal) {
                value = nlapiGetFieldValue('custpage_4601_witaxcode');
            } else {
                if (options.toDefault) {
                    if(cs.enableLookupTrans){
                        value = cs.fieldChanged.getDefaultWiTaxCode(sublistName);
                    }
                } else {
                    var currentValue = nlapiGetCurrentLineItemValue(sublistName, 'custpage_4601_witaxcode');
                    value = currentValue || (cs.enableLookupTrans && cs.fieldChanged.getDefaultWiTaxCode(sublistName));
                }
            }
        }

        cs.fieldChanged.setWiTaxCurrentLineItemValue(sublistName, (isCalledByExpenseSublist ? 'witaxcode_exp' : 'witaxcode'), value, (isCalledByExpenseSublist ? 'witaxcode':null)); 
    };

    cs.fieldChanged.getDefaultWiTaxCode = function getDefaultWiTaxCode(sublistName) {
        var wiTaxCodeId = nlapiGetFieldValue('custbody_4601_entitydefaultwitaxcode');
        if (sublistName === 'item' && !wiTaxCodeId) { 
            wiTaxCodeId = nlapiGetCurrentLineItemValue(sublistName, 'custcol_4601_itemdefaultwitaxcode'); 
        }
        return cs.wiTaxCodes[wiTaxCodeId] && wiTaxCodeId;
    };

    cs.fieldChanged.setWiTaxCurrentLineItemValue = function setWiTaxCurrentLineItemValue(sublistName, fieldNameRoot, value, pageFieldNameRoot){
        if(value == null) { value = ''; }
        
        if(value === ''){
            nlapiSetCurrentLineItemValue(sublistName, 'custpage_4601_' + (pageFieldNameRoot ? pageFieldNameRoot: fieldNameRoot), "", false, true);
            nlapiSetCurrentLineItemValue(sublistName, 'custcol_4601_' + fieldNameRoot, "", false, true);
        } else{
            if( ['witaxcode', 'witaxrate', 'witaxcode_exp', 'witaxrate_exp'].indexOf(fieldNameRoot) > -1 ){
                nlapiSetCurrentLineItemValue(sublistName, 'custpage_4601_' + (pageFieldNameRoot ? pageFieldNameRoot: fieldNameRoot), value, false, true);
                nlapiSetCurrentLineItemValue(sublistName, 'custcol_4601_' + fieldNameRoot, value, false, true);
            } else if( ['witaxbaseamount', 'witaxbamt_exp'].indexOf(fieldNameRoot) > -1 ){
                // 'witaxbaseamount', 'witaxbamt_exp' - sign is always opposite of the witax amount
                // parameter 'value' here could either be positive or negative...
                var lineObject = _4601.getSublistWiTaxColumnValuesForDisplayAndForSave(cs.tranType, {WiTaxBaseAmount:value});
                nlapiSetCurrentLineItemValue(sublistName, 'custcol_4601_' + fieldNameRoot, lineObject.SavedBaseAmount, false, true);  // saved variable...

                if (_4601.hasHeaderDiscount()) {
                    nlapiSetCurrentLineItemValue(sublistName, 'custpage_4601_' + (pageFieldNameRoot ? pageFieldNameRoot: fieldNameRoot), "", false, true); // shown variable...
                } else {
                    nlapiSetCurrentLineItemValue(sublistName, 'custpage_4601_' + (pageFieldNameRoot ? pageFieldNameRoot: fieldNameRoot), lineObject.ShownBaseAmount, false, true); // shown variable...
                }
            } else {
                // parameter 'value' here could either be positive or negative...
                var lineObject = _4601.getSublistWiTaxColumnValuesForDisplayAndForSave(cs.tranType, {WiTaxAmount:value});
                nlapiSetCurrentLineItemValue(sublistName, 'custcol_4601_' + fieldNameRoot, lineObject.SavedTaxAmount, false, true);

                if (_4601.hasHeaderDiscount()) {
                    nlapiSetCurrentLineItemValue(sublistName, 'custpage_4601_' + (pageFieldNameRoot ? pageFieldNameRoot: fieldNameRoot), "", false, true);
                } else {
                    nlapiSetCurrentLineItemValue(sublistName, 'custpage_4601_' + (pageFieldNameRoot ? pageFieldNameRoot: fieldNameRoot), lineObject.ShownTaxAmount, false, true);
                }
            }
        }
    };

    cs.fieldChanged.setWiTaxRate = function setWiTaxRate(sublistName) {
        var isCalledByExpenseSublist = _4601.isExpenseSublist(sublistName);
        var wiTaxCodeFieldName = 'custcol_4601_' + (isCalledByExpenseSublist ? 'witaxcode_exp':'witaxcode');
        var wiTaxCode = cs.wiTaxCodes[nlapiGetCurrentLineItemValue(sublistName, wiTaxCodeFieldName)];
        var rate = wiTaxCode ? wiTaxCode.rate : '';
        var wiTaxRateFieldName = (isCalledByExpenseSublist ? 'witaxrate_exp':'witaxrate');
        cs.fieldChanged.setWiTaxCurrentLineItemValue(sublistName, wiTaxRateFieldName, rate, (isCalledByExpenseSublist ? 'witaxrate':null));
    };

    cs.fieldChanged.setWiTaxBaseAmount = function setWiTaxBaseAmount(sublistName) {
        var isCalledByExpenseSublist = _4601.isExpenseSublist(sublistName);
        var wiTaxCodeFieldName = 'custcol_4601_' + (isCalledByExpenseSublist ? 'witaxcode_exp':'witaxcode');
        var wiTaxCode = cs.wiTaxCodes[nlapiGetCurrentLineItemValue(sublistName, wiTaxCodeFieldName)];
        var baseAmount = '';

        if (wiTaxCode) {
            var amountValue = parseFloat(nlapiGetCurrentLineItemValue(sublistName, wiTaxCode.witaxbase));

            if (isFinite(amountValue)) {
                var percentageOfBase = parseFloat(wiTaxCode.percentageofbase);
                if (!isFinite(percentageOfBase)) { percentageOfBase = 100; }
                baseAmount = amountValue * percentageOfBase / 100;
            }
        }

        cs.fieldChanged.setWiTaxCurrentLineItemValue(sublistName, 
                (isCalledByExpenseSublist ? 'witaxbamt_exp' : 'witaxbaseamount'),
                cs.fieldChanged.formatCurrencyAmount(baseAmount),
                (isCalledByExpenseSublist ? 'witaxbaseamount' : null)
        );        
    };

    cs.fieldChanged.setWiTaxAmount = function setWiTaxAmount(sublistName) {
        var isCalledByExpenseSublist = _4601.isExpenseSublist(sublistName);
        var amount = parseFloat( nlapiGetCurrentLineItemValue(sublistName, 'custcol_4601_' + (isCalledByExpenseSublist ? 'witaxbamt_exp' : 'witaxbaseamount') ) ) || 0;
        var rate = parseFloat(nlapiGetCurrentLineItemValue(sublistName, 'custcol_4601_' + (isCalledByExpenseSublist ? 'witaxrate_exp' : 'witaxrate'))) / 100;
        var wiTaxAmount = isFinite(amount) && isFinite(rate) ? amount * rate : '';  // compute the absolute value at this point...

        cs.fieldChanged.setWiTaxCurrentLineItemValue(
                sublistName, 
                (isCalledByExpenseSublist ? 'witaxamt_exp' : 'witaxamount'), 
                cs.fieldChanged.formatCurrencyAmount(wiTaxAmount), 
                (isCalledByExpenseSublist ? 'witaxamount':null)
        );
    };

    cs.fieldChanged.setSubTabWiTaxRate = function setSubTabWiTaxRate() {
        var wiTaxCode = cs.wiTaxCodes[nlapiGetFieldValue('custpage_4601_witaxcode')];
        var rate = wiTaxCode ? wiTaxCode.rate : '';
        nlapiSetFieldValue('custpage_4601_witaxrate', rate);
    };

    cs.fieldChanged.setAllWiTaxLineItemValues = function setAllWiTaxLineItemValues() {
        function setSublistWiTaxLineItemValues(sublistName) {
            cs.fieldChanged.setWiTaxCode(sublistName);
            cs.fieldChanged.setWiTaxRate(sublistName);
            cs.fieldChanged.setWiTaxBaseAmount(sublistName);
            cs.fieldChanged.setWiTaxAmount(sublistName);
        }

        cs.wiTaxSublistNames.forEach(function (sublistName) {
            var lineItemCount = nlapiGetLineItemCount(sublistName);

            for (var i = 1; i <= lineItemCount; i++) {
                nlapiSelectLineItem(sublistName, i);
                setSublistWiTaxLineItemValues(sublistName);
                nlapiCommitLineItem(sublistName);
            }
        });
    };

    cs.fieldChanged.formatCurrencyAmount = function formatCurrencyAmount(amount) {
        if (amount != 0) {
            if (cs.appliesToTotal) {
                return amount;
            } else {
                return nlapiFormatCurrency(amount);
            }
        } else {
            return "";
        }
    };

    cs.fieldChanged.reload = function reload(hasDelay) {
        if (hasDelay) {
            if (!cs.timeoutId) {
                var delay = context.getSetting('SCRIPT', 'custscript_wtax_reload_delay');
                delay = delay <= cs.minimumReloadDelay ? cs.minimumReloadDelay : delay;
                
                cs.timeoutId = window.setTimeout(function() {
                    if (!cs.isReloading) {
                        params = cs.fieldChanged.getReloadParams();
                        params.manual_reload = 'T';
                        window.clearTimeout(cs.timeoutId);
                        nlapiChangeCall(params);
                    }
                }, delay);
            }
        } else {
            if (!cs.isReloading) {
                nlapiChangeCall(cs.fieldChanged.getReloadParams());
            }
        }
    };
    
    cs.fieldChanged.getReloadParams = function getReloadParams() {
        var params = {
            cf: nlapiGetFieldValue('customform'),
            entity: nlapiGetFieldValue('entity'),
            nexus: nlapiGetFieldValue('nexus'),
            custpage_4601_appliesto: nlapiGetFieldValue('custpage_4601_appliesto')
        };
        
        if (_4601.isOneWorld()) {
            params.subsidiary = nlapiGetFieldValue('subsidiary');
        }
        
        if (['salesorder', 'invoice', 'cashsale'].indexOf(_4601.getRecordType()) > -1) {
            params.shipaddresslist = nlapiGetFieldValue('shipaddresslist') == -2 ? 'cust' : nlapiGetFieldValue('shipaddresslist');
            
            if (params.shipaddresslist == 'cust') {
                params.shipisresidential = encodeURI(nlapiGetFieldValue('shipisresidential'));
                params.shipattention = encodeURI(nlapiGetFieldValue('shipattention'));
                params.shipaddressee = encodeURI(nlapiGetFieldValue('shipaddressee'));
                params.shipphone = encodeURI(nlapiGetFieldValue('shipphone'));
                params.shipaddr1 = encodeURI(nlapiGetFieldValue('shipaddr1'));
                params.shipaddr2 = encodeURI(nlapiGetFieldValue('shipaddr2'));
                params.shipaddr3 = encodeURI(nlapiGetFieldValue('shipaddr3'));
                params.shipcity = encodeURI(nlapiGetFieldValue('shipcity'));
                params.shipzip = encodeURI(nlapiGetFieldValue('shipzip'));
                params.shipstate = encodeURI(nlapiGetFieldValue('shipstate'));
                params.shipcountry = encodeURI(nlapiGetFieldValue('shipcountry'));
                params.shipaddress = encodeURI(nlapiGetFieldValue('shipaddress'));
            }
            
            if(cs.isEntityChanged) {
            	delete params.shipaddresslist;
            }
        }
        
        return params;
    };

    cs.fieldChanged.setCustPageAmounts = function setCustPageAmounts(sublist, isClear) {
        var lineCount = nlapiGetLineItemCount(sublist);

        for (var i = 1; i <= lineCount; i++) {
            if (nlapiGetLineItemValue(sublist, "custcol_4601_witaxapplies", i) === "T") {
                if (!isClear) {
                    // the recomputation of line amounts are done by triggering the fieldChanged event on the line
                    nlapiSelectLineItem(sublist, i);
                    nlapiSetCurrentLineItemValue(sublist, "custcol_4601_witaxapplies", "T");
                    nlapiCommitLineItem(sublist);
                } else {
                    nlapiSelectLineItem(sublist, i);
                    nlapiSetCurrentLineItemValue(sublist, "custpage_4601_witaxamount", "");
                    nlapiSetCurrentLineItemValue(sublist, "custpage_4601_witaxbaseamount", "");
                    nlapiCommitLineItem(sublist);
                }
            }
        }
    };

    cs.fieldChanged.cancelAutoAppliedLineItem = function cancelAutoAppliedLineItem() {
        if (cs.isWiTaxApplicable) {
            cs.wiTaxSetup = JSON.parse(nlapiGetFieldValue("custpage_4601_witaxsetupsasjson"));
            var autoApply = cs.wiTaxSetup['autoapply'];
            if (autoApply) {
                nlapiCancelLineItem('item');
            }
        }
    };

    cs.lineInit = function lineInit(sublistName) {
        if (_4601.isUI()) { 
            cs.fieldChanged(sublistName, 'custcol_4601_witaxapplies'); 
        } else {
            return true;
        }
    };

    cs.recalc = function recalc() {
        if (_4601.isUI() && cs.isWiTaxApplicable) {
            try {
                cs.wiTaxSublistNames.forEach(function(sublistName){
                    if (cs.wiTaxAppliesToSublist(sublistName)) {
                        var wiTaxCustomColumnsTotalObject = {WiTaxAmountTotal:0, WiTaxBaseAmountTotal:0};
                        _4601.getSublistWiTaxColumnsTotals(sublistName, wiTaxCustomColumnsTotalObject, cs.tranType);
                        cs.sublistTotals[sublistName].wiTaxAmount = wiTaxCustomColumnsTotalObject.WiTaxAmountTotal;
                        cs.sublistTotals[sublistName].baseAmount = wiTaxCustomColumnsTotalObject.WiTaxBaseAmountTotal;
                    }
                });
                
                cs.recalc.updateWiTaxSubtabValues();
            } catch(e) {}
        } else {
            return true;
        }
    };

    cs.recalc.updateWiTaxSubtabValues = function updateWiTaxSubtabValues() {
        var totalBaseAmount = 0;
        var totalWiTaxAmount = 0;

        if (!_4601.hasHeaderDiscount()) {
            Object.keys(cs.sublistTotals).forEach(function (sublistName) {
                var sublistTotal = cs.sublistTotals[sublistName];
                totalBaseAmount += sublistTotal.baseAmount;
                totalWiTaxAmount += sublistTotal.wiTaxAmount;
            });
        } else {
            totalBaseAmount = "";
            totalWiTaxAmount = "";
        }

        var wiTaxCode = cs.wiTaxCodes[nlapiGetFieldValue('custpage_4601_witaxcode') || nlapiGetCurrentLineItemValue('sublistName', 'custcol_4601_witaxcode')];
        var rate = wiTaxCode ? wiTaxCode.rate : 0;

        if (rate > 0) {
            var computedFromBase = totalBaseAmount * (rate / 100);
            var diff = computedFromBase - totalWiTaxAmount;
            if (diff != 0) {
                totalWiTaxAmount = totalWiTaxAmount + diff;
            }
        }
        nlapiSetFieldValue('custpage_4601_witaxbaseamount', totalBaseAmount);
        nlapiSetFieldValue('custpage_4601_witaxamount', totalWiTaxAmount);
        cs.recalc.updateWiTaxSubtabValues.updateSubtabLabel(nlapiGetFieldValue('custpage_4601_witaxamount'));
    };

    cs.recalc.updateWiTaxSubtabValues.updateSubtabLabel = function updateSubtabLabel(total) {
        var _total = total === "" ? "" : _4601.formatCurrencyProxy(total, numberformat, negativeformat);
        if (document) { document.getElementById('custpage_4601_witaxsubtab_total').innerHTML = _total; }
    };

    cs.validateLine = function validateLine(sublistName) {
        var isLineValid = true;
        var strMsgs = JSON.parse(nlapiGetFieldValue('custpage_cs_msgs_wht'));
        
        if (_4601.isUI() && cs.isWiTaxApplicable) {
            if (sublistName === "item" && _4601.isUnsupportedItemType(nlapiGetCurrentLineItemValue("item", "itemtype"))) {
                nlapiSetCurrentLineItemValue(sublistName, "custcol_4601_witaxapplies", "F");
            }

            if (cs.isOnAccrual || (_4601.getRecordType() === "salesorder" && cs.wiTaxSetup[cs.tranType + 'taxpoint'] === "onaccrual")) {
                if (nlapiGetCurrentLineItemValue(sublistName, "custcol_4601_witaxapplies") === "T" && nlapiGetFieldValue("discountitem")) {
                    // "Applying withholding tax on accrual in transactions where a Header Discount is used is currently not supported."
                    alert(strMsgs['ERR_INVALID_DISCOUNT_ON_ACCRUAL']);
                    isLineValid = false;
                }
            }

            if (nlapiGetCurrentLineItemValue(sublistName, 'custcol_4601_witaxapplies') === 'T') {
                cs.fieldChanged(sublistName, 'custpage_4601_witaxcode');

                if (cs.validateLine.wiTaxCodeIsBlank(sublistName)) {
                    alert(cs.resourceObject.TRANS_CS['form_details'].WTAX_CODE.message); //'Please select a Tax Code.'
                    isLineValid = false;
                }
            }
        }

        return isLineValid;
    };

    cs.validateLine.wiTaxCodeIsBlank = function wiTaxCodeIsBlank(sublistName) {
        var isCalledByExpenseSublist = _4601.isExpenseSublist(sublistName);
        var wiTaxCodeFieldName = 'custcol_4601_' + (isCalledByExpenseSublist ? 'witaxcode_exp':'witaxcode');
        var isCalledByExpenseSublist = _4601.isExpenseSublist(sublistName);
        var wiTaxCodeValue = cs.appliesToTotal ? nlapiGetFieldValue('custpage_4601_witaxcode') : 
                    nlapiGetCurrentLineItemValue(sublistName, wiTaxCodeFieldName) != "false" //nlapiGetCurrentLineItemValue returns string
                    && nlapiGetCurrentLineItemValue(sublistName, wiTaxCodeFieldName) != ""; //nlapiGetCurrentLineItemValue returns BLANK in SI
        
        return !wiTaxCodeValue;
    };

    cs.saveRecord = function saveRecord() {
        if (_4601.isUI()) {
            cs.saveRecord.totalWiTaxPerWtaxTypeMap = [];

            var isSaved = cs.saveRecord.validateWiTaxCodes() &&
                   cs.saveRecord.recomputeWtaxAndBuildTotalWiTaxMap() &&
                   cs.saveRecord.validateTotalWiTax();

            if (isSaved && _4601.isOneWorld() && ['purchaseorder', 'vendorbill','check'].indexOf(_4601.getRecordType()) < 0) {
                cs.clearStorageData();
            }
            
            return isSaved;
        } else {
            return true;
        }
    };

    cs.clearStorageData = function clearStorageData() {
        var key = _4601.getRecordType() + '-' + getUrlParamValue('id');
        var storageItem = sessionStorage.getItem(key);

        if (cs.type === 'edit' && storageItem != null) {
            var defKey = 'DEFAULT-' + _4601.getRecordType() + '-' + getUrlParamValue('id');
            sessionStorage.removeItem(key);
            sessionStorage.removeItem(defKey);
            nlapiLogExecution('DEBUG','Clear Storage Data', 'Session storage cleared on Save.');
        }
    }
    
    cs.saveRecord.validateWiTaxCodes = function validateWiTaxCodes() {
        if (cs.isWiTaxApplicable) {
            for (var i = 0; i < cs.wiTaxSublistNames.length; i++) {
                var sublistName = cs.wiTaxSublistNames[i];
                var lineCount = nlapiGetLineItemCount(sublistName);
                
                for (var j = 1; j <= lineCount; j++) {
                    if (nlapiGetLineItemValue(sublistName, 'custcol_4601_witaxapplies', j) === 'T' &&
                        cs.wiTaxCodes[nlapiGetLineItemValue(sublistName, 'custpage_4601_witaxcode', j)] === undefined) {
                        alert('Please provide a WH Tax Code for ' + sublistName + ' line ' + j + '.');
                        return false;
                    }
                }
            }
        }
        
        return true;
    };

    cs.saveRecord.recomputeWtaxAndBuildTotalWiTaxMap = function recomputeWtaxAndBuildTotalWiTaxMap() {
        if (cs.isWiTaxApplicable) {
            var wiTaxGroups = new _4601.OrderedHash("id", JSON.parse(nlapiGetFieldValue("custpage_4601_witaxgroupsasjson")));

            cs.wiTaxSublistNames.forEach(function (sublistName) {
                var lineCount = nlapiGetLineItemCount(sublistName);

                for (var i = 1; i <= lineCount; i++) {
                    if (nlapiGetLineItemValue(sublistName, "custcol_4601_witaxapplies", i) === "T") {
                        var wiTaxCode = cs.wiTaxCodes[nlapiGetLineItemValue(sublistName, "custpage_4601_witaxcode", i)];

                        // setup the custcol columns to use depending on the sublist
                        var baseAmountCol = "custcol_4601_" + (_4601.isExpenseSublist(sublistName) ? "witaxbamt_exp" : "witaxbaseamount");
                        var wiTaxAmountCol = "custcol_4601_" + (_4601.isExpenseSublist(sublistName) ? "witaxamt_exp" : "witaxamount");

                        // get the saved (custcol) amounts then setup the lineObject
                        var coreBaseAmount = parseFloat(nlapiGetLineItemValue(sublistName, wiTaxCode.witaxbase, i));
                        var savedBaseAmount = parseFloat(nlapiGetLineItemValue(sublistName, baseAmountCol, i));
                        var savedWiTaxAmount = parseFloat(nlapiGetLineItemValue(sublistName, wiTaxAmountCol, i));
                        var lineObject = _4601.getSublistWiTaxColumnValuesForDisplayAndForSave(cs.tranType, { SavedBaseAmount: savedBaseAmount, SavedTaxAmount: savedWiTaxAmount });

                        // recompute the wtax amounts if the actual tax base (net, gross, or tax amount) and the computed (custpage) wh tax base do not match
                        if (lineObject.ShownBaseAmount !== coreBaseAmount) {
                            nlapiSelectLineItem(sublistName, i);
                            nlapiCommitLineItem(sublistName);
                        }

                        // add the wtax amount to the totalWiTaxPerWtaxTypeMap
                        if (wiTaxCode.istaxgroup) {
                            var witaxgroup = wiTaxGroups[nlapiGetLineItemValue(sublistName, "custpage_4601_witaxcode", i)];

                            if (witaxgroup) {
                                witaxgroup.witaxcodes.forEach(function (wtc) {
                                    if (typeof cs.saveRecord.totalWiTaxPerWtaxTypeMap[wtc.TaxType] === "undefined") {
                                        cs.saveRecord.totalWiTaxPerWtaxTypeMap[wtc.TaxType] = 0;
                                    };

                                    // this computation was taken from the reports scripts
                                    cs.saveRecord.totalWiTaxPerWtaxTypeMap[wtc.TaxType] += (lineObject.ShownBaseAmount || 0) * wtc.TaxRate * (wtc.TaxBasis / 100);
                                });
                            }
                        } else {
                            if (typeof cs.saveRecord.totalWiTaxPerWtaxTypeMap[wiTaxCode.witaxtype] === "undefined") {
                                cs.saveRecord.totalWiTaxPerWtaxTypeMap[wiTaxCode.witaxtype] = 0;
                            };

                            cs.saveRecord.totalWiTaxPerWtaxTypeMap[wiTaxCode.witaxtype] += (lineObject.ShownTaxAmount || 0);
                        }
                    }
                }
            });
        }
        
        return true;
    };

    cs.saveRecord.validateTotalWiTax = function validateTotalWiTax() {
        if (cs.isWiTaxApplicable) {
            var message = cs.resourceObject.TRANS_CS["form_save"].WTAX_TOTAL_VALIDATION.message;
            cs.saveRecord.totalWiTax = null;

            for (var key in cs.saveRecord.totalWiTaxPerWtaxTypeMap) {
                if (cs.saveRecord.totalWiTaxPerWtaxTypeMap[key] < 0) {
                    alert(message);
                    return false;
                }

                cs.saveRecord.totalWiTax += cs.saveRecord.totalWiTaxPerWtaxTypeMap[key];
            }

            if (cs.saveRecord.totalWiTax && cs.saveRecord.totalWiTax < 0) {
                alert(message);
                return false;
            }
        }

        return true;
    };

    /* replaced by handling during fieldChanged event (do not header discounts on accrual)
    cs.saveRecord.validateHeaderDiscount = function validateHeaderDiscount() {
        if (cs.isWiTaxApplicable && cs.saveRecord.totalWiTax > 0 && cs.saveRecord.isOnAccrual && _4601.hasHeaderDiscount()) {
            if (nlapiGetFieldValue("discountrate").indexOf("%") > -1) {
                alert(["Applying withholding tax on accrual in transactions where a Header Discount with a percentage rate",
                       "is used is currently not supported. Please convert the header discount to an actual amount to",
                       "calculate the correct withholding tax applicable to this transaction."].join(" "));
                return false;
            }
        }

        return true;
    };

    cs.saveRecord.validateLineDiscount = function validateLineDiscount(sublist) {
        if (cs.isWiTaxApplicable && cs.saveRecord.totalWiTax > 0 && cs.saveRecord.isOnAccrual && _4601.hasHeaderDiscount()) {
            var lineCount = nlapiGetLineItemCount(sublist);

            for (var i = 1; i <= lineCount; i++) {
                if (["discount", "markup"].indexOf(nlapiGetLineItemValue(sublist, "itemtype", i).toLowerCase()) > -1) {
                    alert(["Applying withholding tax on accrual in transactions where both a Header Discount and Line-Item Discounts",
                           "are present is currently not supported. Please remove one of either discount types to calculate the",
                           "correct withholding tax applicable to this transaction."].join(" "));
                    return false;
                }
            }
        }

        return true;
    };
    */

    cs.wiTaxAppliesToSublist = function wiTaxAppliesToSublist(sublistName) {
        return cs.wiTaxSublistNames.indexOf(sublistName) > -1;
    };
}());