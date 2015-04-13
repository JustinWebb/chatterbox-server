var ParseService = (function ($) {
    'use strict';

    // Constants
    var PARSE = {
        DOMAIN: 'https://api.parse.com',
        VERSION: '/1/',
        OBJ_CLASSES: 'classes/',
        DATA_TYPE_HTTP: 'http',
        DATA_TYPE_JSON: 'json',
        CONTENT_TYPE: 'application/json; charset=UTF-8'
    },

    REQ = {
        GET: 'GET',
        POST: 'POST',
        OPS_FETCH: 'fetch',
        OPS_SEND: 'send'
    },

    //
    _isOnline = false,
    _baseUrl = null,
    _className,
    _operation,
    _username = null;


    function _report (response) {
        var msg = '[ParseService] '+ _operation +' response: ';
        if (response.status >= 400) {
            console.log(response.responseText);
            msg = msg.concat(response.statusText);
            throw new Error(msg);
        }
        else {
            console.log(msg, response);
        }
    }

    function _getRequestObj (successHandler, errorHandler) {
        var basicReq = {
            dataType: PARSE.DATA_TYPE_JSON,
            contentType: PARSE.CONTENT_TYPE,
            success: (successHandler) ? successHandler : _report,
            error: (errorHandler) ? errorHandler : _report
        };
        return basicReq;
    }

    function _requestUrl (params) {
        return (params) ? _baseUrl.concat('?'+ $.param(params)) : _baseUrl;
    }

    // http://stackoverflow.com/questions/16273788/get-url-variables-from-url-to-form-with-jquery
    function _getURLParameter (name) {
        return decodeURI((new RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]);
    }

    return {

        init: function (className) {
            _className = className;
            _baseUrl = PARSE.DOMAIN + PARSE.VERSION + PARSE.OBJ_CLASSES + _className;
            _username = _getURLParameter('username').replace(/[+]/g, ' ');
            _isOnline = true;
        },

        isOnline: function () {
            return _isOnline;
        },

        getUsername: function () {
            return _username;
        },

        fetch: function (params, onPsSuccess, onPsError) {
            var request;
            _operation = REQ.OPS_FETCH;

            request = $.extend(_getRequestObj(onPsSuccess, onPsError), {
                type: REQ.GET,
                url: (params) ? _requestUrl(params) : _requestUrl()
            });

            console.log('[ParseService] fetching request...', request);
            $.ajax(request);
        },

        send: function (message, onPsSuccess, onPsError) {
            var request;
            _operation = REQ.OPS_SEND;

            request = $.extend(_getRequestObj(onPsSuccess, onPsError), {
                type: REQ.POST,
                url: _requestUrl(),
                data: JSON.stringify({text: _username +': '+ message})
            });

            console.log('[ParseService] sending request...', request);
            $.ajax(request);
        }
    };

})($);