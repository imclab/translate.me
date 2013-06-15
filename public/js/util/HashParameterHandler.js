define(['underscore', 'jquery', 'purl'], function(_, $) {
    'use strict';

    /**
     * Creates a new HashParameterHandler object. Handles parameters in the hash portion of an URL.
     *
     * @param parameter {object} an set of parameters where the key specifies the parameter name and
     * the value a getter function to retrieve the param from.
     * @constructor
     */
    var HashParameterHandler = function(parameter) {
        if(parameter) {
            if(_.isObject(parameter)) {
                this.parameter = parameter;
            } else {
                throw new Error("The passed argument 'parameter' is not an object.");
            }
        } else {
            this.parameter = {};
        }
    };

    /**
     * Adds a handler for a key to a HashParameterHandler instance.
     *
     * @param {!string} key of the parameter
     * @param {!{get: function(), set: function(string)}} handler object which contains get and set function to handle
     * the parameters
     * @returns {function([string])} function to update the parameter. You may pass a fallback value
     */
    HashParameterHandler.prototype.addParameterHandler = function(key, handler) {
        var self = this;

        this.parameter[key] = handler;

        return function(fallback) {
            self.updateParameter(key, fallback);
        }
    };

    /**
     * Updates all parameters based on the parameters in the URL
     *
     * @param {?string} [key] to only update this parameter
     * @param {?string} [fallback] which will be used, if the parameter does not exist in the url
     * @returns {boolean} true if parameter(s) could be set, otherwise false
     */
    HashParameterHandler.prototype.updateParameter = function(key, fallback) {
        var result = false,
            params = $.url().fparam(key);

        if(_.isString(params)) {
            if(_.has(this.parameter, key)) {
                this._setParameter(key, params);
                result = true;
            }
        } else if(_.isObject(params)) {
            result = true;
            _.each(params, function(value, key) {
                if(_.has(this.parameter, key)) {
                    this._setParameter(key, value);
                } else {
                    result = false;
                }
            }, this);
        } else if(fallback) {
            this._setParameter(key, fallback);
        }

        return result;
    }

    /**
     * Updates the hash portion of the URL according to all passed parameters in the constructor.
     */
    HashParameterHandler.prototype.updateHash = function() {
        var hash = "";

        _.each(this.parameter, function(handler, key) {
            var value = handler.get();

            if(value) {
                if(hash.length > 0) {
                    hash += '&';
                }
                hash = hash + key + "=" + encodeURIComponent(handler.get());
            }
        });

        window.location.hash = hash;
    };

    HashParameterHandler.prototype._setParameter = function(key, value) {
        if(!_.has(this.parameter, key)) {
            throw new Error('Parameter key: "' + key + '" is unknown.');
        }
        this.parameter[key].set(decodeURIComponent(value));
    };

    return HashParameterHandler;
});
