var _ = require('underscore')._,
    mongoose = require('mongoose'),
    schema = new mongoose.Schema({
        key: {
            type: String,
            required: true
        },
        namespace: {
            type: String
        },
        created: {
            type: Date,
            required: true
        },
        sources: [{
            type: String,
            required: true
        }],
        translations: [{
            locale: {
                type: String,
                required: true
            },
            value: {
                type: String,
                required: true
            },
            changed: {
                type: Date,
                required: true
            },
            created: {
                type: Date,
                required: true,
                default: new Date()
            }
        }]
    });

schema.index({key: true, namespace: true}, {unique: true});

/**
 * Adds or updates a translation for a specific locale.
 *
 * @param {!string} locale to translate in
 * @param {?string} [value] which represents the translation
 * @param {!function(object,object)} [done] function which will be called, if the changes have been saved in the database
 * @return {{locale: string, value: string, changed: Date, created: Date}} the created or updated translation
 */
schema.methods.translate = function(locale, value, done) {
    var translation;

    if(typeof locale !== 'string') {
        throw new TypeError("The passed locale is not a string. Instead it's a: \"" + typeof(locale) + "\", " + locale);
    }
    if(value && typeof value !== 'string') {
        throw new TypeError("You have specified a value, but it's not a string. Instead it's a: \"" + typeof(value) + "\", " + value);
    }
    if(done && !_.isFunction(done)) {
        throw new TypeError("You have specified a done argument, but it's not a function. Instead it's a: \"" + typeof(value) + "\", " + done);
    }

    if(value === undefined || value === null) { // Remove translation
        this.translations = _.filter(this.translations, function(translation) {
            return translation.locale === locale;
        });
    } else { // Create update translation
        translation = _.find(this.translations, function(translation) {
            return translation.locale === locale;
        });
        if(!translation) {
            translation = {
                locale: locale,
                value: value
            }
            this.translations.push(translation);
        } else {
            translation.value = value;
        }
        translation.changed = new Date();
    }
    this.save(done);
    return translation;
}

/**
 * Returns the translation in the old format.
 *
 * @param {string|string[]} locales a locale or an array of locales to get translations for.
 * @param {boolean=false} generate translation in case it has not been translated. Default is false.
 * @returns {object|object[]} a translation in the old format, or a list of translations. Depends on the passed locales argument.
 */
schema.methods.toOldModel = function(locales, generate) {
    generate = generate || false;

    if(_.isArray(locales)) {
        var translations = [];
        _.each(locales, function(locale) {
            translations.push(this.toOldModel(locale, generate));
        }, this);
        return translations;
    } else if(_.isString(locales)) {
        var translation = _.findWhere(this.translations, {locale: locales});
        if(!translation && generate) {
            translation = {
                locale: locales
            }
        }
        if(translation) {
            return {
                _id: this._id,
                key: this.key,
                namespace: this.namespace,
                locale: translation.locale,
                value: translation.value
            }
        }
    } else {
        throw new TypeError("The passed argument locales must be a string or an string array.");
    }
}

/**
 * Creates a new translation model or receives one from the database, if it already exists.
 *
 * @param {object} translation properties to start from
 * @param {!string} translation.key
 * @param {!string} translation.namespace
 * @param {!string[]} translation.sources a list of paths to files where the translation originated from
 * @param {function(?object,[object])} done function which receives an error in case anything bad happens and
 * a translation model which can be altered and saved afterwards
 */
schema.statics.getTranslationModel = function(translation, done) {
    if(typeof translation !== 'object') {
        throw new TypeError("Cannot create model. Expected translation to be an object, but got: \"" + translation + "\"");
    }
    if(typeof translation.key !== 'string') {
        throw new TypeError("Cannot create model. Expected key to be a string, but got: \"" + translation.key + "\"");
    }
    if(typeof translation.namespace !== 'string') {
        throw new TypeError("Cannot create model. Expected namespace to be a string, but got: \"" + translation.namespace + "\"");
    }
    var Model = this;

    Model.findOne({
        key: translation.key,
        namespace: translation.namespace
    }, function(err, translationModel) {
        if(!err) {
            if(!translationModel) {
                translationModel = new Model({
                    key: translation.key,
                    namespace: translation.namespace,
                    created: new Date(),
                    sources: translation.sources
                });
            } else {
                translationModel.sources = _.union(translationModel.sources, translation.sources);
            }
            done(null, translationModel);
        } else {
            done(err, undefined);
        }
    })
}

module.exports = schema;