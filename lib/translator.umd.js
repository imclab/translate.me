(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory(require('./property-path-utility.umd.js'));
    } else if (typeof define === 'function' && define.amd) {
        define(['./property-path-utility.umd.js'], factory);
    } else {
        root.translator = factory(root.propertiesPathUtility);
    }
}(this, function (PropertyPathUtility) {
    var Translator = function(translationsHandler, preferredLocale) {
        var index = {
                elements: {},

                get: function(namespace, key, locale) {
                    if(this.elements[namespace] && this.elements[namespace][key]) {
                        return this.elements[namespace][key][locale];
                    }
                },

                build: function(masters) {
                    var self = this;
                    masters.forEach(function(master) {
                        if(master.translations) {
                            master.translations.forEach(function(translation) {
                                if(!self.elements[master.namespace]) {
                                    self.elements[master.namespace] = {};
                                }
                                if(!self.elements[master.namespace][master.key]) {
                                    self.elements[master.namespace][master.key] = {};
                                }
                                self.elements[master.namespace][master.key][translation.locale] = translation.value;
                            });
                        }
                    });
                }
            };

        translationsHandler.get(function(data) {
            index.build(data);
        });

        /**
         * Translates a given key against translations in the translation store.
         *
         * @param {string|object} keyOrOptions to get a translation for
         * @param {string|object} [namespaceOrContext=""] lookup in a special namespace for the key. Is "" if none is passed.
         * @param {string|object} [localeOrContext] a locale to override the preferred locale or a context
         * @param {object} [context] provides values for placeholders in the passed key
         *
         * @param {string} keyOrOptions.key to get a translation for
         * @param {string} [keyOrOptions.namespace]
         * @param {string} [keyOrOptions.locale]
         *
         * @returns {string} a translated value for the passed key.
         */
        this.translate = function (keyOrOptions, namespaceOrContext, localeOrContext, context) {
            var result, translation, args = {};

            args.namespace = "";
            args.locale = preferredLocale;
            if (typeof keyOrOptions === 'string') {
                args.key = keyOrOptions;
            } else if (typeof keyOrOptions === 'object') {
                args = keyOrOptions;
            }
            if (typeof namespaceOrContext === 'string') {
                args.namespace = namespaceOrContext;
            } else if (typeof namespaceOrContext === 'object') {
                args.context = namespaceOrContext;
            }
            if (typeof localeOrContext === 'string') {
                args.locale = localeOrContext;
            } else if (typeof localeOrContext === 'object') {
                args.context = localeOrContext;
            }
            if(context) {
                if(typeof context !== 'object') {
                    throw new TypeError("The passed context: \"" + context + "\" is not an object.");
                }
                args.context = context;
            }

            if (!args.key) { throw "A key is required!"; }
            if (args.namespace === undefined) { throw "A namespace is required!"; }
            if (!args.locale) { throw "A locale is required!"; }

            translation = index.get(args.namespace, args.key, args.locale);
            if(!translation) {
                translation = index.get(args.namespace, args.key, preferredLocale);
            }
            result = translation;

            if(!result) { // Fallback if no translation has been found
                result = args.key;
            }

            if(args.context) {
                result = PropertyPathUtility.replace(result, args.context);
            }

            return result;
        };

        this.getTranslationsByNamespace = function (namespace) {
            "use strict";

            var translations = {}, i;

            if (namespace === undefined || typeof namespace !== 'string') {
                throw new TypeError("The passed namespace is not a string.");
            }

            for (i in index.elements[namespace]) {
                translations[i] = index.elements[namespace][i][preferredLocale];
            }

            return translations;
        };

        /**
         * Checks whether the translator is ready to translate.
         * @returns {boolean} true if it's ready, otherwise false
         */
        this.isReady = function() {
            return Object.keys(index.elements).length > 0;
        };

        /**
         * Sets the preferred locale for this translator.
         *
         * @param {String} locale formatted in this way: (language[_territory])
         * @throws TypeError if the passed argument locale is not a string
         * @throws Error if the passed locale is empty
         */
        this.setPreferredLocale = function(locale) {
            if(typeof locale !== 'string') {
                throw new TypeError("The passed argument locale is not a string.");
            }
            if(locale.length <= 0) {
                throw new Error("The passed locale is empty.");
            }
            preferredLocale = locale;
        };
    }

    return Translator;
}));
