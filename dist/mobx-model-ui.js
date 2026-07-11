
  /**
   * @license
   * author: Andrey Omelyanuk
   * mobx-model-ui.js v0.4.0
   * Released under the MIT license.
   */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('mobx')) :
    typeof define === 'function' && define.amd ? define(['exports', 'mobx'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global["mobx-model-ui"] = {}, global.mobx));
})(this, (function (exports, mobx) { 'use strict';

    // Global config of Mobx-ORM
    const config = {
        DEFAULT_PAGE_SIZE: 50,
        AUTO_UPDATE_DELAY: 100, // ms
        FORM_NON_FIELD_ERRORS_KEY: 'non_field_errors',
        FORM_UNKNOWN_ERROR_MESSAGE: 'Unknown errors. Please contact support.',
        // NOTE: React router manage URL by own way. 
        // change UPDATE_SEARCH_PARAMS and WATCH_URL_CHANGES in this case
        UPDATE_SEARCH_PARAMS: (search_params) => {
            window.history.pushState(null, '', `${window.location.pathname}?${search_params.toString()}`);
        },
        WATCH_URL_CHANGES: (callback) => {
            window.addEventListener('popstate', callback);
            return () => { window.removeEventListener('popstate', callback); };
        },
        DEBOUNCE: (func, debounce) => {
            let timeoutId = null;
            return function (...args) {
                if (timeoutId !== null) {
                    clearTimeout(timeoutId);
                }
                timeoutId = setTimeout(() => {
                    timeoutId = null;
                    func.apply(this, args);
                }, debounce);
            };
        },
        COOKIE_DOMAIN: 'localhost' // Change this to your domain if needed.
    };

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise, SuppressedError, Symbol, Iterator */


    function __decorate(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }

    function __metadata(metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
    }

    typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };

    /**
     * Cache for model objects.
     */
    class Cache {
        store = new Map();
        constructor() {
            mobx.makeObservable(this);
        }
        /**
         * Get object by ID
         */
        get(id) {
            return this.store.get(id);
        }
        /**
         * Inject object to the cache
         */
        inject(obj) {
            if (obj.ID === undefined || obj.ID === null || obj.ID === '')
                throw new Error('Object should have id!');
            const exist_obj = this.store.get(obj.ID);
            if (exist_obj && exist_obj !== obj)
                throw new Error(`Object with ID ${obj.ID} already exist in the cache.`);
            this.store.set(obj.ID, obj);
        }
        /**
         * Eject object from the cache
         */
        eject(obj) {
            if (obj.ID !== undefined && obj.ID !== null && obj.ID !== '')
                this.store.delete(obj.ID);
        }
        /**
         * Clear the cache
         */
        clear() {
            for (const obj of this.store.values())
                obj.destroy();
            this.store.clear();
        }
    }
    __decorate([
        mobx.observable,
        __metadata("design:type", Object)
    ], Cache.prototype, "store", void 0);
    __decorate([
        mobx.action,
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", void 0)
    ], Cache.prototype, "inject", null);
    __decorate([
        mobx.action,
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", void 0)
    ], Cache.prototype, "eject", null);
    __decorate([
        mobx.action,
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], Cache.prototype, "clear", null);

    function waitIsTrue(obj, field) {
        return new Promise((resolve) => {
            mobx.autorun((reaction) => {
                if (obj[field]) {
                    reaction.dispose();
                    resolve(true);
                }
            });
        });
    }
    function waitIsFalse(obj, field) {
        return new Promise((resolve) => {
            mobx.autorun((reaction) => {
                if (!obj[field]) {
                    reaction.dispose();
                    resolve(true);
                }
            });
        });
    }
    function timeout(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    const syncURLHandler = (paramName, input) => {
        const searchParams = new URLSearchParams(window.location.search);
        // init from URL Search Params
        if (searchParams.has(paramName)) {
            input.setFromString(searchParams.get(paramName));
        }
        // watch for URL changes and update Input
        function updateInputFromURL() {
            const searchParams = new URLSearchParams(window.location.search);
            if (searchParams.has(paramName)) {
                const raw_value = searchParams.get(paramName);
                const exist_raw_value = input.toString();
                if (raw_value !== exist_raw_value) {
                    input.setFromString(raw_value);
                }
            }
            else if (input.value !== undefined)
                input.set(undefined);
        }
        input.__disposers.push(config.WATCH_URL_CHANGES(updateInputFromURL.bind(input)));
        // watch for Input changes and update URL
        input.__disposers.push(mobx.reaction(() => input.toString(), // I cannot use this.value because it can be a Map
        (value) => {
            const searchParams = new URLSearchParams(window.location.search);
            if (value === '' || value === undefined)
                searchParams.delete(paramName);
            else if (searchParams.get(paramName) !== value)
                searchParams.set(paramName, value);
            config.UPDATE_SEARCH_PARAMS(searchParams);
        }, { fireImmediately: true }));
    };

    const syncLocalStorageHandler = (paramName, input) => {
        // init value from localStorage
        if (paramName in localStorage) {
            const raw_value = localStorage.getItem(paramName);
            const exist_raw_value = input.toString();
            if (exist_raw_value !== raw_value)
                input.setFromString(raw_value);
        }
        // watch for changes and save to localStorage
        input.__disposers.push(mobx.reaction(() => input.value, (value, _previousValue) => {
            // WARNING: input should return 'null' if value is null
            // because localStorage cannot store null
            if (value !== undefined)
                localStorage.setItem(paramName, input.toString());
            else
                localStorage.removeItem(paramName);
        }));
    };

    const syncCookieHandler = (paramName, input) => {
        const cookie = document.cookie.split(';').find(row => row.trim().startsWith(`${paramName}=`));
        if (cookie) {
            input.setFromString(cookie.split('=')[1]);
        }
        // watch for Input changes and update cookie
        input.__disposers.push(mobx.reaction(() => input.toString(), (value) => {
            if (value === undefined)
                // expire the cookie: `max-age=0` plus a past `expires` so every
                // browser actually removes it instead of keeping an empty value
                document.cookie = `${paramName}=; path=/; domain=${config.COOKIE_DOMAIN}; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            else
                document.cookie = `${paramName}=${value}; path=/; domain=${config.COOKIE_DOMAIN}`;
        }, { fireImmediately: true }));
    };

    class Variable {
        type;
        value;
        initialValue;
        isDisabled;
        isDebouncing; //  
        isNeedToUpdate; //  
        errors = []; // validations or backend errors put here
        debounce;
        syncURL;
        syncLocalStorage;
        syncCookie;
        __disposers = [];
        // TODO: fix any, it should be InputConstructorArgs<T> but it is not working
        // it's look like a bug in the TypeScript
        constructor(type, args) {
            // init all observables before use it in reaction
            this.type = type;
            this.value = args && args.value !== undefined ? args.value : type.default();
            this.isDisabled = !!args?.disabled;
            this.isDebouncing = false;
            this.isNeedToUpdate = false;
            this.debounce = args?.debounce;
            this.syncURL = args?.syncURL;
            this.syncLocalStorage = args?.syncLocalStorage;
            this.syncCookie = args?.syncCookie;
            mobx.makeObservable(this);
            if (this.debounce) {
                this.debouncedValidation = config.DEBOUNCE(() => mobx.runInAction(() => {
                    // the debounced value has settled: clear the pending-update
                    // flag and validate together, once
                    this.isNeedToUpdate = false;
                    this.validate();
                    this.isDebouncing = false;
                }), this.debounce);
            }
            // the order is important, because syncURL has more priority under syncLocalStorage
            // i.e. init from syncURL can overwrite value from syncLocalStorage
            if (this.syncLocalStorage)
                syncLocalStorageHandler(this.syncLocalStorage, this);
            if (this.syncCookie)
                syncCookieHandler(this.syncCookie, this);
            if (this.syncURL)
                syncURLHandler(this.syncURL, this);
            // capture the final initial value after all sync handlers may have modified it
            this.initialValue = this.value;
        }
        get isDirty() {
            return this.value !== this.initialValue;
        }
        markClean() {
            this.initialValue = this.value;
        }
        reset() {
            this.value = this.initialValue;
        }
        destroy() {
            this.__disposers.forEach(disposer => disposer());
        }
        // runs validation once the debounce window settles (not a "stop" — it
        // fires the pending validation after `debounce` ms of no changes)
        debouncedValidation;
        set(value) {
            this.value = value;
            if (this.debounce) {
                this.isDebouncing = true;
                this.debouncedValidation(); // clears isNeedToUpdate and validates after debounce
            }
            else {
                // no debounce: the value is settled immediately
                this.isNeedToUpdate = false;
                this.validate();
            }
        }
        get isReady() {
            if (this.isDisabled)
                return true;
            return !(this.errors.length
                || this.isDebouncing
                || this.isNeedToUpdate
                || this.type.required && (this.value === undefined || this.value === '' || (Array.isArray(this.value) && !this.value.length)));
        }
        validate() {
            this.errors = [];
            try {
                this.type.validate(this.value);
                this.errors = [];
            }
            catch (e) {
                this.errors = [e instanceof Error ? e.message : String(e)];
            }
        }
        setFromString(value) {
            this.set(this.type.fromString(value));
        }
        // Return type stays `string` so the class remains assignable to the
        // built-in Object type (Object.toString(): string); a `string | undefined`
        // return would break mobx's legacy @observable/@action decorator overloads
        // that accept `target: Object`. The value may still be undefined at runtime.
        toString() {
            return this.type.toString(this.value);
        }
    }
    __decorate([
        mobx.observable,
        __metadata("design:type", Object)
    ], Variable.prototype, "value", void 0);
    __decorate([
        mobx.observable,
        __metadata("design:type", Object)
    ], Variable.prototype, "initialValue", void 0);
    __decorate([
        mobx.observable,
        __metadata("design:type", Boolean)
    ], Variable.prototype, "isDisabled", void 0);
    __decorate([
        mobx.observable,
        __metadata("design:type", Boolean)
    ], Variable.prototype, "isDebouncing", void 0);
    __decorate([
        mobx.observable,
        __metadata("design:type", Boolean)
    ], Variable.prototype, "isNeedToUpdate", void 0);
    __decorate([
        mobx.observable,
        __metadata("design:type", Array)
    ], Variable.prototype, "errors", void 0);
    __decorate([
        mobx.computed,
        __metadata("design:type", Boolean),
        __metadata("design:paramtypes", [])
    ], Variable.prototype, "isDirty", null);
    __decorate([
        mobx.action,
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], Variable.prototype, "markClean", null);
    __decorate([
        mobx.action,
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], Variable.prototype, "reset", null);
    __decorate([
        mobx.action,
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", void 0)
    ], Variable.prototype, "set", null);
    __decorate([
        mobx.action,
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], Variable.prototype, "validate", null);

    class ObjectInput extends Variable {
        options;
        constructor(type, args) {
            super(type, args);
            this.options = args.options;
            if (this.options) {
                this.__disposers.push(mobx.reaction(() => this.options.isReady, (isReady, previousValue) => {
                    if (isReady && !previousValue) {
                        mobx.runInAction(() => this.isNeedToUpdate = true);
                        if (args?.autoReset)
                            args.autoReset(this);
                    }
                }));
            }
            else if (args?.autoReset) {
                console.warn('autoReset function should be used only with options');
            }
        }
        get obj() {
            if (!this.options) {
                console.warn('ObjectInput cannot return an object if options are not provided');
                return undefined;
            }
            return this.options.repository.modelDescriptor.cache.get(this.value);
        }
        get isReady() {
            // options should be checked first
            // because without options it doesn't make sense to check value 
            return this.options ? this.options.isReady && super.isReady : super.isReady;
        }
        destroy() {
            super.destroy();
            this.options?.destroy();
        }
    }

    function autoResetId(input) {
        // if value still in options, do nothing
        for (const item of input.options.items) {
            if (item.ID === input.value) {
                // have to set value to trigger reaction
                input.set(input.value);
                return;
            }
        }
        // otherwise set first available id or undefined
        input.set(input.options.items[0]?.ID);
    }

    class TypeDescriptor {
        required; // allow undefined value
        null; // allow null value
        constructor(props) {
            this.null = props?.null ?? false;
            this.required = props?.required ?? false;
        }
        /**
         * Check if the value is valid
         * If not, throw an error
         */
        validate(value) {
            if ((value === undefined && this.required)
                || (value === null && !this.null))
                throw new Error('Field is required');
        }
    }

    class StringDescriptor extends TypeDescriptor {
        minLength;
        maxLength;
        constructor(props) {
            super(props);
            // by default string has no length constraints
            this.minLength = props?.minLength ?? 0;
            this.maxLength = props?.maxLength ?? null;
        }
        toString(value) {
            if (value === undefined)
                return undefined;
            if (value === null)
                return 'null';
            return value;
        }
        fromString(value) {
            if (value === undefined)
                return undefined;
            else if (value === 'null')
                return null;
            else if (value === null)
                return null;
            return value;
        }
        validate(value) {
            super.validate(value);
            if (value === '' && this.required)
                throw new Error('Field is required');
            if (this.minLength && value?.length < this.minLength)
                throw new Error(`String must be at least ${this.minLength} characters long`);
            if (this.maxLength && value?.length > this.maxLength)
                throw new Error(`String must be no more than ${this.maxLength} characters long`);
        }
        default() {
            return '';
        }
    }
    function STRING(props) {
        return new StringDescriptor(props);
    }

    /**
     * NumberDescriptor - numeric data type
     * fromString uses parseInt, so fractional numbers are truncated to integers (3.14 => 3)
     */
    class NumberDescriptor extends TypeDescriptor {
        min;
        max;
        constructor(props) {
            super(props);
            this.min = props?.min ?? -Infinity;
            this.max = props?.max ?? Infinity;
        }
        toString(value) {
            if (value === undefined)
                return undefined;
            if (value === null)
                return 'null';
            return value.toString();
        }
        fromString(value) {
            if (value === undefined)
                return undefined;
            if (value === 'null')
                return null;
            if (value === null)
                return null;
            const result = parseInt(value);
            if (isNaN(result))
                return undefined;
            return result;
        }
        validate(value) {
            super.validate(value);
            if (this.min !== -Infinity && value < this.min)
                throw new Error('Number should be greater than or equal to ' + this.min);
            if (this.max !== Infinity && value > this.max)
                throw new Error('Number should be less than or equal to ' + this.max);
        }
        default() {
            return undefined;
        }
    }
    function NUMBER(props) {
        return new NumberDescriptor(props);
    }

    class BooleanDescriptor extends TypeDescriptor {
        constructor(props) {
            super(props);
        }
        toString(value) {
            if (value === undefined)
                return undefined;
            if (value === null)
                return 'null';
            if (value === false)
                return 'false';
            return 'true';
        }
        fromString(value) {
            if (value === 'false' || value === '0')
                return false;
            if (value === 'null' || value === null)
                return null;
            if (value === undefined)
                return undefined;
            return !!value;
        }
        default() {
            return false;
        }
    }
    function BOOLEAN(props) {
        return new BooleanDescriptor(props);
    }

    class DateDescriptor extends TypeDescriptor {
        min;
        max;
        defaultDate;
        constructor(props) {
            super(props);
            this.min = props?.min ?? new Date(0);
            this.max = props?.max ?? new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000); // + 100 years
            this.defaultDate = props?.defaultDate;
        }
        toString(value) {
            if (value === undefined)
                return undefined;
            if (value === null)
                return 'null';
            return value.toISOString();
        }
        fromString(value) {
            if (value === null || value === 'null')
                return null;
            if (value === undefined)
                return undefined;
            return new Date(value);
        }
        validate(value) {
            super.validate(value);
            if (this.min && value < this.min)
                throw new Error('Date should be later than ' + this.min.toISOString());
            if (this.max && value > this.max)
                throw new Error('Date should be earlier than ' + this.max.toISOString());
        }
        default() {
            // Return a fresh copy so instances can't mutate the shared default.
            // Without `defaultDate` fall back to "now" (current behaviour).
            return this.defaultDate ? new Date(this.defaultDate) : new Date();
        }
    }
    function DATE(props) {
        return new DateDescriptor(props);
    }

    class DateTimeDescriptor extends DateDescriptor {
        toString(value) {
            if (value === undefined)
                return undefined;
            if (value === null)
                return 'null';
            return value.toISOString();
        }
    }
    function DATETIME(props) {
        return new DateTimeDescriptor(props);
    }

    class ArrayDescriptor extends TypeDescriptor {
        type;
        minItems;
        maxItems;
        constructor(type, props) {
            super(props);
            this.type = type;
            this.minItems = props?.minItems ?? 0;
            this.maxItems = props?.maxItems ?? Infinity;
        }
        toString(value) {
            if (!value)
                return undefined;
            if (!value.length)
                return undefined;
            return value.map(item => this.type.toString(item)).join(',');
        }
        fromString(value) {
            if (!value)
                return [];
            // each item can decode to null/undefined; the array itself is always T[]
            return value.split(',').map(item => this.type.fromString(item));
        }
        validate(value) {
            super.validate(value);
            if (this.minItems && value?.length < this.minItems)
                throw new Error('Items count is less than minimum allowed');
            if (this.maxItems && value?.length > this.maxItems)
                throw new Error('Items count is more than maximum allowed');
            value.forEach(item => this.type.validate(item));
        }
        default() {
            return [];
        }
    }
    function ARRAY(type, props) {
        return new ArrayDescriptor(type, props);
    }

    const ASC = true;
    const DESC = false;
    class OrderByDescriptor extends TypeDescriptor {
        toString(value) {
            if (!value || !value[0])
                return undefined;
            return value[1] ? value[0] : '-' + value[0];
        }
        fromString(value) {
            if (!value)
                return undefined;
            return value[0] === '-' ? [value.substring(1), false] : [value, true];
        }
        validate(value) {
            if (!value)
                throw new Error('Field is required');
            if (!value[0])
                throw new Error('Field is required');
            if (value[1] === undefined)
                throw new Error('Field is required');
        }
        default() {
            return ['', ASC];
        }
    }
    function ORDER_BY() {
        return new OrderByDescriptor();
    }

    class UUIDDescriptor extends TypeDescriptor {
        constructor(props) {
            super(props);
        }
        toString(value) {
            if (value === undefined)
                return undefined;
            if (value === null)
                return 'null';
            return value;
        }
        fromString(value) {
            if (value === undefined)
                return undefined;
            else if (value === 'null')
                return null;
            else if (value === null)
                return null;
            return value;
        }
        validate(value) {
            super.validate(value);
            if (value === '' && this.required)
                throw new Error('Field is required');
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (value && !uuidRegex.test(value))
                throw new Error('Invalid UUID format');
        }
        default() {
            return '00000000-0000-0000-0000-000000000000';
        }
    }
    function UUID(props) {
        return new UUIDDescriptor(props);
    }

    function isEnumObject(obj) {
        return typeof obj === 'object'
            && obj !== null
            && !Array.isArray(obj);
    }
    function extractEnumValues(enumObj) {
        return Object.keys(enumObj)
            .filter(key => {
            const val = enumObj[key];
            const reverseKey = enumObj[val];
            return typeof reverseKey !== 'number';
        })
            .map(key => enumObj[key]);
    }
    function extractEnumLabels(enumObj) {
        return Object.keys(enumObj)
            .filter(key => {
            const val = enumObj[key];
            const reverseKey = enumObj[val];
            return typeof reverseKey !== 'number';
        });
    }
    class EnumDescriptor extends TypeDescriptor {
        _rawOptions;
        _values;
        _labels;
        constructor(props) {
            super(props);
            this._rawOptions = props.options;
            if (Array.isArray(props.options)) {
                this._values = props.options;
                this._labels = props.options.map(v => String(v));
            }
            else if (isEnumObject(props.options)) {
                this._values = extractEnumValues(props.options);
                this._labels = extractEnumLabels(props.options);
            }
            else {
                this._values = [];
                this._labels = [];
            }
        }
        toString(value) {
            if (value === undefined)
                return undefined;
            if (value === null)
                return 'null';
            return String(value);
        }
        fromString(value) {
            if (value === undefined)
                return undefined;
            if (value === 'null' || value === null)
                return null;
            const parsed = this._values.find(v => String(v) === value);
            return parsed !== undefined ? parsed : undefined;
        }
        validate(value) {
            super.validate(value);
            if (value !== undefined && value !== null && !this._values.includes(value))
                throw new Error('Value is not a valid enum option');
        }
        default() {
            if (this.required && this._values.length > 0)
                return this._values[0];
            return undefined;
        }
        getOptions() {
            return this._values.map((v, i) => ({
                label: this._labels[i],
                value: v
            }));
        }
        get values() {
            return this._values;
        }
    }
    function ENUM(props) {
        return new EnumDescriptor(props);
    }

    const DISPOSER_AUTOUPDATE = '__autoupdate';
    /* Query live cycle:

        Event           isLoading   needToUpdate    isReady     items
        ------------------------------------------------------------------------
        Create          -           -               -           []


        loading start   +!          -               -           reset error
            |
        loading finish  -!          -               +!          set some items or error


        filter changes  -           +!              -!
            |
        loading start   +!          -!              -           reset error
            |
        loading finish  -!          -               +!          set some items or error

    */
    class Query {
        repository;
        filter;
        orderBy;
        offset;
        limit;
        relations;
        fields;
        omit;
        __items = []; // items from the server
        total; // total count of items on the server, useful for pagination
        isLoading = false; // query is loading the data
        isNeedToUpdate = true; // query was changed and we need to update the data
        timestamp; // monotonic counter of the last update, useful to avoid triggering react hooks twice
        lastUpdatedAt; // wall-clock time (Date.now()) of the last update
        error; // error message
        // NOTE: returns the internal array intentionally so that external code can
        //       observe mutations via mobx (push/splice on the returned array are
        //       tracked by @observable). Do not replace the array — mutate in place.
        get items() { return this.__items; }
        controller;
        // Named disposers for mobx reactions/observers, unified on the same
        // `Map<string, () => void>` shape as `Model.disposers`. Per-object
        // reactions (e.g. in QueryCacheSync) use the `obj:<ID>` key convention.
        disposers = new Map();
        constructor(props) {
            const { repository, filter, orderBy, offset, limit, relations, fields, omit, autoupdate = true } = props;
            this.repository = repository; // required in practice; always set by the Repository factory methods
            this.filter = filter; // optional at runtime; guarded everywhere it is read
            this.orderBy = orderBy ? orderBy : new Variable(ARRAY(ORDER_BY()));
            this.offset = offset ? offset : new Variable(NUMBER());
            this.limit = limit ? limit : new Variable(NUMBER());
            this.relations = relations ? relations : new Variable(ARRAY(STRING()));
            this.fields = fields ? fields : new Variable(ARRAY(STRING()));
            this.omit = omit ? omit : new Variable(ARRAY(STRING()));
            this.autoupdate = autoupdate;
            mobx.makeObservable(this);
            this.disposers.set('isNeedToUpdate', mobx.reaction(
            // watch the dependenciesAreReady and value only
            // because isNeedToUpdate should be set to true
            // if dependenciesAreReady or/and value are triggered and isNeedToUpdate is false
            () => {
                return { dependenciesAreReady: this.dependenciesAreReady, value: this.toString() };
            }, ({ dependenciesAreReady, value: _value }) => {
                if (dependenciesAreReady && !this.isNeedToUpdate)
                    mobx.runInAction(() => this.isNeedToUpdate = true);
            }, { fireImmediately: true }));
        }
        destroy() {
            this.controller?.abort();
            // Snapshot the keys before disposing: a disposer may register a new
            // disposer while running, which would spin a live `while(size)` loop.
            const keys = [...this.disposers.keys()];
            keys.forEach(key => {
                const disposer = this.disposers.get(key);
                if (disposer)
                    disposer();
                this.disposers.delete(key);
            });
        }
        async loading() { return waitIsFalse(this, 'isLoading'); }
        async ready() { return waitIsTrue(this, 'isReady'); }
        get autoupdate() {
            return this.disposers.has(DISPOSER_AUTOUPDATE);
        }
        // Note: autoupdate trigger always the load(),
        // shadowLoad() is not make sense to trigger by autoupdate
        // because autoupdate means => user have changed something on UI inputs
        // and we should to show the UI reaction
        set autoupdate(value) {
            if (value !== this.autoupdate) { // idempotent guarantee
                // on 
                if (value) {
                    this.disposers.set(DISPOSER_AUTOUPDATE, mobx.reaction(() => this.isNeedToUpdate && this.dependenciesAreReady, (updateIt, old) => {
                        if (updateIt && updateIt !== old) {
                            // debounce the reload by AUTO_UPDATE_DELAY so rapid
                            // filter/input changes don't fire a request each
                            setTimeout(() => this.load(), config.AUTO_UPDATE_DELAY);
                        }
                    }, { fireImmediately: true }));
                }
                // off
                else {
                    const disposer = this.disposers.get(DISPOSER_AUTOUPDATE);
                    if (disposer) {
                        disposer();
                        this.disposers.delete(DISPOSER_AUTOUPDATE);
                    }
                }
            }
        }
        // Need to quick compare the querie's state
        toString() {
            return `${this.filter === undefined ? '' : this.filter.URLSearchParams.toString()}`
                + `|${this.orderBy.toString()}`
                + `|${this.offset.toString()}|${this.limit.toString()}`
                + `|${this.relations.toString()}|${this.fields.toString()}|${this.omit.toString()}`;
        }
        get dependenciesAreReady() {
            return (this.filter === undefined || this.filter.isReady)
                && this.orderBy.isReady
                && this.offset.isReady
                && this.limit.isReady
                && this.relations.isReady
                && this.fields.isReady
                && this.omit.isReady;
        }
        // NOTE: if we use only shadowLoad() the isLoading will be always false.
        // In this case isReady is equal to !isNeedToUpdate.
        get isReady() {
            return !this.isNeedToUpdate && !this.isLoading;
        }
        // use it if everybody should know that the query data is updating
        async load() {
            this.isLoading = true;
            try {
                await this.shadowLoad();
            }
            finally {
                mobx.runInAction(() => {
                    // the loading can be canceled by another load
                    // in this case we should not touch isLoading
                    if (!this.controller)
                        this.isLoading = false;
                });
            }
        }
        // use it directly instead of load() if nobody should know that the query data is updating
        // for example you need to update the current data on the page and you don't want to show a spinner
        async shadowLoad() {
            this.isNeedToUpdate = false;
            this.error = undefined;
            if (this.controller)
                this.controller.abort();
            this.controller = new AbortController();
            // monotonic counter: each shadowLoad increments timestamp irrespective of wall clock
            this.timestamp = (this.timestamp ?? 0) + 1;
            this.lastUpdatedAt = Date.now();
            try {
                await this.__load();
            }
            catch (e) {
                const isAbort = (e instanceof DOMException && e.name === 'AbortError')
                    || (e instanceof Error && e.message === 'canceled');
                if (!isAbort) {
                    mobx.runInAction(() => this.error = e instanceof Error ? e.message : String(e));
                }
            }
            finally {
                this.controller = undefined;
            }
        }
        async __load() {
            const objs = await this.repository.load(this, { controller: this.controller });
            mobx.runInAction(() => this.__items = objs);
        }
    }
    __decorate([
        mobx.observable,
        __metadata("design:type", Array)
    ], Query.prototype, "__items", void 0);
    __decorate([
        mobx.observable,
        __metadata("design:type", Object)
    ], Query.prototype, "total", void 0);
    __decorate([
        mobx.observable,
        __metadata("design:type", Boolean)
    ], Query.prototype, "isLoading", void 0);
    __decorate([
        mobx.observable,
        __metadata("design:type", Boolean)
    ], Query.prototype, "isNeedToUpdate", void 0);
    __decorate([
        mobx.observable,
        __metadata("design:type", Object)
    ], Query.prototype, "timestamp", void 0);
    __decorate([
        mobx.observable,
        __metadata("design:type", Object)
    ], Query.prototype, "lastUpdatedAt", void 0);
    __decorate([
        mobx.observable,
        __metadata("design:type", Object)
    ], Query.prototype, "error", void 0);
    __decorate([
        mobx.action('MO: Query Base - load'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", Promise)
    ], Query.prototype, "load", null);
    __decorate([
        mobx.action('MO: Query Base - shadow load'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", Promise)
    ], Query.prototype, "shadowLoad", null);

    class QueryPage extends Query {
        setPage(n) { this.offset.set(this.limit.value * (n > 0 ? n - 1 : 0)); }
        setPageSize(size) { this.limit.set(size); this.offset.set(0); }
        goToFirstPage() { this.setPage(1); }
        goToPrevPage() { this.setPage(this.current_page - 1); }
        goToNextPage() { this.setPage(this.current_page + 1); }
        goToLastPage() { this.setPage(this.total_pages); }
        get is_first_page() { return this.offset.value === 0; }
        // QueryPage uses offset as a numeric page offset (not a cursor), so treat it as a number
        get is_last_page() { return this.total !== undefined && this.offset.value + this.limit.value >= this.total; }
        get current_page() { return this.offset.value / this.limit.value + 1; }
        get total_pages() { return this.total ? Math.ceil(this.total / this.limit.value) : 1; }
        // for compatibility with js code style
        get isFirstPage() { return this.is_first_page; }
        get isLastPage() { return this.is_last_page; }
        get currentPage() { return this.current_page; }
        get totalPages() { return this.total_pages; }
        constructor(props) {
            super(props);
            mobx.runInAction(() => {
                if (this.offset.value === undefined)
                    this.offset.set(0);
                if (this.limit.value === undefined)
                    this.limit.set(config.DEFAULT_PAGE_SIZE);
            });
        }
        async __load() {
            const [objs, total] = await Promise.all([
                this.repository.load(this, { controller: this.controller }),
                this.repository.getTotalCount(this.filter, { controller: this.controller })
            ]);
            mobx.runInAction(() => {
                this.__items = objs;
                this.total = total;
            });
        }
    }
    __decorate([
        mobx.action('MO: set page'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number]),
        __metadata("design:returntype", void 0)
    ], QueryPage.prototype, "setPage", null);
    __decorate([
        mobx.action('MO: set page size'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number]),
        __metadata("design:returntype", void 0)
    ], QueryPage.prototype, "setPageSize", null);

    class QueryCacheSync extends Query {
        constructor(props) {
            super(props);
            // watch the cache for changes, and update items if needed
            this.disposers.set('cacheSync', mobx.observe(this.repository.modelDescriptor.cache.store, mobx.action('MO: Query - update from cache changes', (change) => {
                if (change.type == 'add') {
                    this.__watch_obj(change.newValue);
                }
                if (change.type == 'delete') {
                    const id = change.name;
                    const obj = change.oldValue;
                    const key = `obj:${id}`;
                    this.disposers.get(key)?.();
                    this.disposers.delete(key);
                    const i = this.__items.indexOf(obj);
                    if (i != -1) {
                        this.__items.splice(i, 1);
                        this.total = this.__items.length;
                    }
                }
            })));
            // ch all exist objects of model 
            for (const [, obj] of this.repository.modelDescriptor.cache.store) {
                this.__watch_obj(obj);
            }
        }
        async __load() {
            try {
                await this.repository.load(this, { controller: this.controller });
                // Query don't need to overide the __items,
                // query's items should be get only from the cache
            }
            catch (e) {
                if (!(e instanceof Error) || e.name !== 'AbortError')
                    throw e;
            }
            // we have to wait the next tick
            // mobx should finished recalculation for model-objects
            await Promise.resolve();
        }
        get items() {
            const __items = [...this.__items];
            if (this.orderBy.value && this.orderBy.value.length) {
                const compare = (a, b) => {
                    for (const [key, value] of this.orderBy.value) {
                        if (value === ASC) {
                            if ((a[key] === undefined || a[key] === null) && (b[key] !== undefined && b[key] !== null))
                                return 1;
                            if ((b[key] === undefined || b[key] === null) && (a[key] !== undefined && a[key] !== null))
                                return -1;
                            if (a[key] < b[key])
                                return -1;
                            if (a[key] > b[key])
                                return 1;
                        }
                        else {
                            if ((a[key] === undefined || a[key] === null) && (b[key] !== undefined && b[key] !== null))
                                return -1;
                            if ((b[key] === undefined || b[key] === null) && (a[key] !== undefined && a[key] !== null))
                                return 1;
                            if (a[key] < b[key])
                                return 1;
                            if (a[key] > b[key])
                                return -1;
                        }
                    }
                    return 0;
                };
                __items.sort(compare);
            }
            return __items;
        }
        __watch_obj(obj) {
            const key = `obj:${obj.ID}`;
            this.disposers.get(key)?.();
            this.disposers.set(key, mobx.reaction(() => !this.filter || this.filter.isMatch(obj), mobx.action('MO: Query - obj was changed', (should) => {
                const i = this.__items.indexOf(obj);
                // should be in the items and it is not in the items? add it to the items
                if (should && i == -1)
                    this.__items.push(obj);
                // should not be in the items and it is in the items? remove it from the items
                if (!should && i != -1)
                    this.__items.splice(i, 1);
                if (this.total != this.__items.length)
                    this.total = this.__items.length;
            }), { fireImmediately: true }));
        }
    }
    __decorate([
        mobx.computed,
        __metadata("design:type", Object),
        __metadata("design:paramtypes", [])
    ], QueryCacheSync.prototype, "items", null);

    class QueryStream extends Query {
        restart() {
            this.__items = [];
            this.offset.set(undefined);
            this.total = undefined;
            this.isEndReached = false;
            this.load();
        }
        loadMore() {
            if (this.controller)
                return;
            if (this.total === 1)
                return;
            this.load();
        }
        isEndReached = false;
        constructor(props) {
            super(props);
            mobx.runInAction(() => {
                if (this.offset.value === undefined)
                    this.offset.set(undefined);
                if (this.limit.value === undefined)
                    this.limit.set(config.DEFAULT_PAGE_SIZE);
            });
        }
        async __load() {
            const objs = await this.repository.load(this, { controller: this.controller });
            mobx.runInAction(() => {
                if (objs.length === 0) {
                    this.total = 1;
                    this.isEndReached = true;
                }
                else {
                    this.__items.push(...objs);
                    // cursor = last seen ID (works for numeric and string/UUID IDs)
                    this.offset.set(objs[objs.length - 1].ID);
                    this.total = undefined;
                    this.isEndReached = false;
                }
            });
        }
    }
    __decorate([
        mobx.action('MO: restart'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], QueryStream.prototype, "restart", null);
    __decorate([
        mobx.action('MO: load more'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], QueryStream.prototype, "loadMore", null);
    __decorate([
        mobx.observable,
        __metadata("design:type", Object)
    ], QueryStream.prototype, "isEndReached", void 0);

    /**
     * QueryRaw is a class to load raw objects from the server
     * without converting them to models using the repository.
     */
    class QueryRaw extends Query {
        async __load() {
            const objs = await this.repository.adapter.load(this, { controller: this.controller });
            mobx.runInAction(() => {
                this.__items = objs;
            });
        }
    }

    /**
     * QueryRawPage is a class to load raw objects from the server
     * without converting them to models using the repository.
     */
    class QueryRawPage extends QueryPage {
        async __load() {
            const objs = await this.repository.adapter.load(this, { controller: this.controller });
            const total = await this.repository.getTotalCount(this.filter, { controller: this.controller });
            mobx.runInAction(() => {
                this.__items = objs;
                this.total = total;
            });
        }
    }

    class QueryDistinct extends Query {
        field;
        constructor(field, props) {
            super(props);
            this.field = field;
        }
        async __load() {
            const objs = await this.repository.getDistinct(this.filter, this.field, { controller: this.controller });
            mobx.runInAction(() => {
                this.__items = objs;
            });
        }
    }

    /**
     * Repository class is responsible for CRUD operations on the model.
     */
    class Repository {
        modelDescriptor;
        // adapter is required before any CRUD call, but is usually assigned right
        // after construction (e.g. by the @local/@constant decorators), so it is
        // declared with a definite-assignment assertion rather than as optional.
        adapter;
        constructor(modelDescriptor, adapter) {
            this.modelDescriptor = modelDescriptor;
            if (adapter)
                this.adapter = adapter;
        }
        /**
         * Create the object.
         */
        async create(obj, config) {
            const raw_obj = await this.adapter.create(obj.rawObj, config); // Id can be defined in the frontend => id should be passed to the create method if they exist
            const rawObjID = this.modelDescriptor.getID(raw_obj);
            const cachedObj = this.modelDescriptor.cache.get(rawObjID);
            if (cachedObj)
                obj = cachedObj;
            obj.updateFromRaw(raw_obj);
            obj.refreshInitData();
            return obj;
        }
        /**
         * Update the object.
         */
        async update(obj, config) {
            const raw_obj = await this.adapter.update(obj.ID, obj.only_changed_raw_data, config);
            obj.updateFromRaw(raw_obj);
            obj.refreshInitData();
            return obj;
        }
        /**
         * Save the object.
         * If the object has ID, it will be updated, otherwise it will be created.
         */
        async save(obj, config) {
            return obj.ID ? await this.update(obj, config) : await this.create(obj, config);
        }
        /**
         * Delete the object.
         */
        async delete(obj, config) {
            await this.adapter.delete(obj.ID, config);
            obj.destroy();
        }
        /**
         * Run action for the object.
         */
        async action(obj, name, kwargs, config) {
            return await this.adapter.action(obj.ID, name, kwargs, config);
        }
        /**
         * Run action for the model.
         */
        async modelAction(name, kwargs, config) {
            return await this.adapter.modelAction(name, kwargs, config);
        }
        /**
         * Returns ONE object by id.
         */
        async get(id, config) {
            const raw_obj = await this.adapter.get(id, config);
            return this.modelDescriptor.updateCachedObject(raw_obj);
        }
        /**
         * Returns ONE object by query.
         */
        async find(query, config) {
            const raw_obj = await this.adapter.find(query, config);
            return this.modelDescriptor.updateCachedObject(raw_obj);
        }
        /**
         * Returns MANY objects by query.
         */
        async load(query, config) {
            const raw_objs = await this.adapter.load(query, config);
            const objs = [];
            mobx.runInAction(() => {
                for (const raw_obj of raw_objs) {
                    objs.push(this.modelDescriptor.updateCachedObject(raw_obj));
                }
            });
            return objs;
        }
        /**
         * Returns total count of objects.
         */
        async getTotalCount(filter, config) {
            return await this.adapter.getTotalCount(filter, config);
        }
        /**
         * Returns distinct values for the field.
         */
        async getDistinct(filter, field, config) {
            return await this.adapter.getDistinct(filter, field, config);
        }
        getQuery(props) { return new Query({ ...props, repository: this }); }
        getQueryPage(props) { return new QueryPage({ ...props, repository: this }); }
        getQueryRaw(props) { return new QueryRaw({ ...props, repository: this }); }
        getQueryRawPage(props) { return new QueryRawPage({ ...props, repository: this }); }
        getQueryCacheSync(props) { return new QueryCacheSync({ ...props, repository: this }); }
        getQueryStream(props) { return new QueryStream({ ...props, repository: this }); }
        getQueryDistinct(field, props) { return new QueryDistinct(field, { ...props, repository: this }); }
    }

    /**
     * Is a map of all registered models in the application.
     * It's a singleton.
     */
    const models = new Map();
    function clearModels() {
        for (const [_modelName, modelDescriptor] of models) {
            // Descriptor-level disposers (e.g. the cache-store observers registered
            // by `one`/`many` relations). The id decorator does not register any
            // descriptor-level disposers — its interceptors live on each instance's
            // `obj.disposers` and are released by `obj.destroy()` below.
            for (const fieldName in modelDescriptor.fields) {
                modelDescriptor.fields[fieldName].disposers.forEach(disposer => disposer());
            }
            for (const fieldName in modelDescriptor.relations) {
                modelDescriptor.relations[fieldName].disposers.forEach(disposer => disposer());
            }
            // Clear the cache: destroys every cached object (releasing its own
            // disposers) and drops the references so objects don't leak.
            modelDescriptor.cache.clear();
        }
        models.clear();
    }

    class Model {
        /**
         * Static version initializes in the id decorator.
         * Instance version initializes in the constructor that declare in model decorator.
         * It is used for registering the model in the models map.
         * It is used for get the model descriptor from the models map.
         */
        static modelName;
        modelName;
        /**
         * Default repository that used in methods like `load`, `getTotalCount`, etc.
         */
        static defaultRepository;
        getDefaultRepository() {
            return this.modelDescriptor.cls.defaultRepository;
        }
        /**
         * @returns {ModelDescriptor} - model description
         */
        static getModelDescriptor() {
            return models.get(this.modelName);
        }
        /**
         * @param init - initial data of the object
         */
        constructor(_init) { }
        /**
         * @returns {ModelDescriptor} - model descriptor
         */
        get modelDescriptor() {
            return models.get(this.modelName);
        }
        /**
         * ID returns id value from the object.
         * Id field can be different from the id field name.
         */
        get ID() {
            return this.modelDescriptor.getID(this);
        }
        /**
         * Save the initial data of the object that was loaded from the server.
         */
        init_data;
        /**
         * disposers for mobx reactions and interceptors, you can add your own disposers
         */
        disposers = new Map();
        /**
         * Destructor of the object.
         * It eject from cache and removes all disposers.
         */
        destroy() {
            // trigger in id fields will eject the object from cache
            this[this.modelDescriptor.id] = undefined;
            // Snapshot the keys before disposing: a disposer may register new
            // disposers while running, and iterating a live `while(size)` loop over
            // them could never terminate.
            const keys = [...this.disposers.keys()];
            keys.forEach(key => {
                const disposer = this.disposers.get(key);
                if (disposer)
                    disposer();
                this.disposers.delete(key);
            });
        }
        get model() {
            return Object.getPrototypeOf(this.constructor);
        }
        /**
         * @returns {Object} - data only from fields (no id)
         */
        get rawData() {
            const rawData = {};
            for (const fieldName in this.modelDescriptor.fields) {
                if (this[fieldName] !== undefined) {
                    rawData[fieldName] = this[fieldName];
                }
            }
            return rawData;
        }
        /**
         * @returns {Object} - it is rawData + id field
         */
        get rawObj() {
            const idFieldName = this.modelDescriptor.id;
            const rawObj = this.rawData;
            rawObj[idFieldName] = this[idFieldName];
            return rawObj;
        }
        get only_changed_raw_data() {
            const raw_data = {};
            for (const field_name in this.modelDescriptor.fields) {
                if (this[field_name] !== this.init_data[field_name]) {
                    raw_data[field_name] = this[field_name];
                }
            }
            return raw_data;
        }
        get is_changed() {
            for (const field_name in this.modelDescriptor.fields) {
                if (this[field_name] !== this.init_data[field_name]) {
                    return true;
                }
            }
            return false;
        }
        refreshInitData() {
            if (this.init_data === undefined)
                this.init_data = {};
            for (const field_name in this.modelDescriptor.fields) {
                this.init_data[field_name] = this[field_name];
            }
        }
        cancelLocalChanges() {
            for (const field_name in this.modelDescriptor.fields) {
                if (this[field_name] !== this.init_data[field_name]) {
                    this[field_name] = this.init_data[field_name];
                }
            }
        }
        /**
         * Update the object from the raw data.
         * @description
         * It is used when raw data comes from any source (server, websocket, etc.) and you want to update the object.
         * TODO: ID is not ready! I'll finish it later.
         */
        updateFromRaw(rawObj) {
            // update id if not exist
            const idField = this.modelDescriptor.id;
            if (this[idField] === null || this[idField] === undefined) {
                this[idField] = rawObj[idField];
            }
            // update the fields if the raw data is exist and it is different
            for (const fieldName in this.modelDescriptor.fields) {
                if (rawObj[fieldName] !== undefined && rawObj[fieldName] !== this[fieldName]) {
                    this[fieldName] = rawObj[fieldName];
                }
            }
            // update related objects 
            for (const relation in this.modelDescriptor.relations) {
                const settings = this.modelDescriptor.relations[relation].settings;
                if (settings.foreign_model && rawObj[relation]) {
                    settings.foreign_model.getModelDescriptor().updateCachedObject(rawObj[relation]);
                    this[settings.foreign_id] = rawObj[relation].id;
                }
                else if (settings.remote_model && rawObj[relation]) {
                    // many
                    if (Array.isArray(rawObj[relation])) {
                        for (const i of rawObj[relation]) {
                            settings.remote_model.getModelDescriptor().updateCachedObject(i);
                        }
                    }
                    // one
                    else {
                        settings.remote_model.getModelDescriptor().updateCachedObject(rawObj[relation]);
                    }
                }
            }
        }
        // --------------------------------------------------------------------------------------------
        // helper instance functions
        // --------------------------------------------------------------------------------------------
        async action(name, kwargs) { return await this.getDefaultRepository().action(this, name, kwargs); }
        async create() { return await this.getDefaultRepository().create(this); }
        async update() { return await this.getDefaultRepository().update(this); }
        async save() { return await this.getDefaultRepository().save(this); }
        async delete() { return await this.getDefaultRepository().delete(this); }
        async refresh() { return await this.getDefaultRepository().get(this.ID); }
        // --------------------------------------------------------------------------------------------
        // helper class functions
        // --------------------------------------------------------------------------------------------
        static getQuery(props) { return this.defaultRepository.getQuery(props); }
        static getQueryPage(props) { return this.defaultRepository.getQueryPage(props); }
        static getQueryRaw(props) { return this.defaultRepository.getQueryRaw(props); }
        static getQueryRawPage(props) { return this.defaultRepository.getQueryRawPage(props); }
        static getQueryCacheSync(props) { return this.defaultRepository.getQueryCacheSync(props); }
        static getQueryStream(props) { return this.defaultRepository.getQueryStream(props); }
        static getQueryDistinct(field, props) {
            return this.defaultRepository.getQueryDistinct(field, props);
        }
        static get(id) {
            return this.getModelDescriptor().cache.get(id);
        }
        static async findById(id) {
            return this.defaultRepository.get(id);
        }
        static async find(query) {
            return this.defaultRepository.find(query);
        }
    }
    __decorate([
        mobx.computed({ keepAlive: true }),
        __metadata("design:type", Object),
        __metadata("design:paramtypes", [])
    ], Model.prototype, "ID", null);
    __decorate([
        mobx.observable,
        __metadata("design:type", Object)
    ], Model.prototype, "init_data", void 0);
    __decorate([
        mobx.action,
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], Model.prototype, "destroy", null);
    __decorate([
        mobx.action,
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], Model.prototype, "refreshInitData", null);
    __decorate([
        mobx.action,
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], Model.prototype, "cancelLocalChanges", null);
    __decorate([
        mobx.action,
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", void 0)
    ], Model.prototype, "updateFromRaw", null);

    /**
     * Model decorator.
     * Note: Class decorator has constructor of class as argument.
     */
    function model(constructor) {
        const modelName = constructor.name;
        // check that class extends Model
        if (!(constructor.prototype instanceof Model))
            throw new Error(`Class "${modelName}" should extends Model!`);
        // id fields should register the model into models
        const modelDescriptor = models.get(modelName);
        if (!modelDescriptor)
            throw new Error(`Model "${modelName}" should be registered in models. Did you forget to declare any id?`);
        // set default repository
        constructor.defaultRepository = new Repository(modelDescriptor);
        // the field decorators run first, then the model decorator
        // id decorator creates the model descriptor and registers it in models
        // so, we cannot catch the case when we try to declare a model with the same name
        // Proxy class created once per model (not per instance): its `__proto__`
        // points at the original class so `Model.model` (`this.constructor.__proto__`)
        // resolves to the user's class instead of the base `Model`.
        const proxy = class extends constructor {
            constructor(...args) { super(...args); }
        };
        proxy.__proto__ = constructor;
        // the new constructor
        const f = function (...args) {
            const obj = new proxy();
            obj.modelName = modelName;
            mobx.makeObservable(obj);
            const descriptor = obj.modelDescriptor;
            // apply id decorators
            if (descriptor.id === undefined)
                throw new Error(`Model "${modelName}" should have id field decorator!`);
            descriptor.idFieldDescriptors.decorator(obj, descriptor.id);
            // apply field decorators 
            for (const fieldName in descriptor.fields)
                descriptor.fields[fieldName].decorator(obj, fieldName);
            // apply relations decorators
            for (const fieldName in descriptor.relations)
                descriptor.relations[fieldName].decorator(obj, fieldName);
            if (args[0])
                obj.updateFromRaw(args[0]);
            obj.refreshInitData();
            return obj;
        };
        f.modelName = modelName;
        f.__proto__ = constructor;
        f.prototype = constructor.prototype; // copy prototype so intanceof operator still works
        Object.defineProperty(f, 'name', { value: constructor.name });
        modelDescriptor.cls = f;
        return f; // return new constructor (will override original)
    }

    /**
     * ModelFieldDescriptor is a class that contains all the information about the field.
     */
    class ModelFieldDescriptor {
        decorator;
        disposers = [];
        type;
        settings;
    }
    /**
     * ModelDescriptor is a class that contains all the information about the model.
     */
    class ModelDescriptor {
        /**
         * Model class
         */
        cls;
        /**
         * Id fields
         */
        id;
        idFieldDescriptors;
        /**
         * Fields is a map of all fields in the model that usually use in repository.
         */
        fields = {};
        /**
         * Relations is a map of all relations (foreign, one, many) in the model.
         * It is derivative and does not come from outside.
         */
        relations = {};
        cache = new Cache();
        /**
         * Return id value from object. Object can have id field with different name.
         */
        getID(obj) {
            return obj[this.id];
        }
        updateCachedObject(rawObj) {
            const rawObjID = this.getID(rawObj);
            const cachedObj = this.cache.get(rawObjID);
            if (cachedObj) {
                cachedObj.updateFromRaw(rawObj);
                cachedObj.refreshInitData();
                return cachedObj;
            }
            return new this.cls(rawObj);
        }
    }

    /**
     * Decorator for fields
     */
    function field(typeDescriptor, observable = true) {
        return (cls, fieldName) => {
            const modelName = cls.constructor.name;
            if (!models.has(modelName))
                throw new Error(`Model "${modelName}" should be registered in models. Did you forget to declare any id?`);
            const modelDescription = models.get(modelName);
            modelDescription.fields[fieldName] = {
                decorator: (obj) => {
                    if (observable)
                        mobx.extendObservable(obj, { [fieldName]: obj[fieldName] });
                },
                disposers: [],
                type: typeDescriptor,
                settings: {}
            };
        };
    }

    /**
     * Decorator for foreign fields
     */
    function foreign(foreign_model, foreign_id) {
        return function (cls, field_name) {
            const modelName = cls.modelName ?? cls.constructor.name;
            if (!modelName)
                throw new Error('Model name is not defined. Did you forget to declare any id fields?');
            const modelDescription = models.get(modelName);
            if (!modelDescription)
                throw new Error(`Model ${modelName} is not registered in models. Did you forget to declare any id fields?`);
            // if it is empty then try auto detect it (it works only with single id) 
            // bind to a const so the value stays narrowed to string inside the closures below
            const foreign_id_field = foreign_id ?? `${field_name}_id`;
            modelDescription.relations[field_name] = {
                decorator: (obj) => {
                    // make observable and set default value
                    mobx.extendObservable(obj, { [field_name]: undefined });
                    // watch on foreign id
                    obj.disposers.set(`foreign ${field_name}`, mobx.reaction(
                    // watch on foreign cache for foreign object
                    () => {
                        const foreignID = obj[foreign_id_field];
                        if (foreignID === undefined)
                            return undefined;
                        if (foreignID === '')
                            return undefined;
                        if (foreignID === null)
                            return null; // foreign object can be null
                        if (foreignID === 'null')
                            return null; // foreign object can be null
                        return foreign_model.getModelDescriptor().cache.get(foreignID);
                    }, 
                    // update foreign field
                    mobx.action('MO: Foreign - update', (_new, _old) => obj[field_name] = _new), { fireImmediately: true }));
                },
                disposers: [],
                settings: { foreign_model, foreign_id: foreign_id_field }
            };
        };
    }

    function one(remote_model, remote_foreign_id) {
        return function (cls, field_name) {
            const modelName = cls.modelName ?? cls.constructor.name;
            if (!modelName)
                throw new Error('Model name is not defined. Did you forget to declare any id fields?');
            const modelDescription = models.get(modelName);
            if (!modelDescription)
                throw new Error(`Model ${modelName} is not registered in models. Did you forget to declare any id fields?`);
            // bind to a const so the value stays narrowed to string inside the closures below
            const remote_foreign_id_field = remote_foreign_id ?? `${modelName.toLowerCase()}_id`;
            const remoteModelDescriptor = remote_model.getModelDescriptor();
            const disposer_name = `MO: One - update - ${modelName}.${field_name}`;
            modelDescription.relations[field_name] = {
                decorator: (obj) => {
                    let foreignObj = undefined;
                    for (const [_, cacheObj] of remoteModelDescriptor.cache.store) {
                        const ID = cacheObj[remote_foreign_id_field];
                        if (obj.ID === ID && ID !== undefined) {
                            foreignObj = cacheObj;
                            break;
                        }
                    }
                    mobx.extendObservable(obj, { [field_name]: foreignObj });
                },
                disposers: [],
                settings: { remote_model, remote_foreign_id: remote_foreign_id_field }
            };
            modelDescription.relations[field_name].disposers.push(mobx.observe(remoteModelDescriptor.cache.store, (change) => {
                let remote_obj;
                switch (change.type) {
                    case 'add':
                        remote_obj = change.newValue;
                        remote_obj.disposers.set(disposer_name, mobx.reaction(() => {
                            const foreignID = remote_obj[remote_foreign_id_field];
                            return {
                                id: foreignID,
                                obj: modelDescription.cache.get(foreignID)
                            };
                        }, mobx.action(disposer_name, (_new, _old) => {
                            if (_old?.obj)
                                _old.obj[field_name] = _new.id ? undefined : null;
                            if (_new?.obj)
                                _new.obj[field_name] = remote_obj;
                        }), { fireImmediately: true }));
                        break;
                    case 'delete': {
                        remote_obj = change.oldValue;
                        if (remote_obj.disposers.get(disposer_name)) {
                            remote_obj.disposers.get(disposer_name)();
                            remote_obj.disposers.delete(disposer_name);
                        }
                        const foreignID = remote_obj[remote_foreign_id_field];
                        const obj = modelDescription.cache.get(foreignID);
                        if (obj)
                            mobx.runInAction(() => { obj[field_name] = undefined; });
                        break;
                    }
                }
            }));
        };
    }

    /**
     * Decorator for many fields
     */
    function many(remote_model, remote_foreign_id) {
        return function (cls, field_name) {
            const modelName = cls.modelName ?? cls.constructor.name;
            if (!modelName)
                throw new Error('Model name is not defined. Did you forget to declare any id fields?');
            const modelDescription = models.get(modelName);
            if (!modelDescription)
                throw new Error(`Model ${modelName} is not registered in models. Did you forget to declare any id fields?`);
            // if it is empty then try auto detect it (it works only with single id) 
            // bind to a const so the value stays narrowed to string inside the closures below
            const remote_foreign_id_field = remote_foreign_id ?? `${modelName.toLowerCase()}_id`;
            modelDescription.relations[field_name] = {
                decorator: (obj) => {
                    mobx.extendObservable(obj, { [field_name]: [] });
                },
                disposers: [],
                settings: { remote_model, remote_foreign_id: remote_foreign_id_field }
            };
            const remoteModelDescriptor = remote_model.getModelDescriptor();
            const disposer_name = `MO: Many - update - ${modelName}.${field_name}`;
            // watch for remote object in the cache 
            modelDescription.relations[field_name].disposers.push(mobx.observe(remoteModelDescriptor.cache.store, (remote_change) => {
                let remote_obj;
                switch (remote_change.type) {
                    case 'add':
                        remote_obj = remote_change.newValue;
                        remote_obj.disposers.set(disposer_name, mobx.reaction(() => {
                            return modelDescription.cache.get(remote_obj[remote_foreign_id_field]);
                        }, mobx.action(disposer_name, (_new, _old) => {
                            if (_old) {
                                const i = _old[field_name].indexOf(remote_obj);
                                if (i > -1)
                                    _old[field_name].splice(i, 1);
                            }
                            if (_new) {
                                const i = _new[field_name].indexOf(remote_obj);
                                if (i === -1)
                                    _new[field_name].push(remote_obj);
                            }
                        }), { fireImmediately: true }));
                        break;
                    case 'delete': {
                        remote_obj = remote_change.oldValue;
                        if (remote_obj.disposers.get(disposer_name)) {
                            remote_obj.disposers.get(disposer_name)();
                            remote_obj.disposers.delete(disposer_name);
                        }
                        const obj = modelDescription.cache.get(remote_obj[remote_foreign_id_field]);
                        if (obj) {
                            const i = obj[field_name].indexOf(remote_obj);
                            if (i > -1)
                                mobx.runInAction(() => { obj[field_name].splice(i, 1); });
                        }
                        break;
                    }
                }
            }));
        };
    }

    /**
     * Decorator for id field
     * Only id field can register model in models map,
     * because it invoke before a model decorator.
     */
    function id(typeDescriptor, observable = true) {
        return (cls, fieldName) => {
            const modelName = cls.modelName ?? cls.constructor.name;
            let modelDescription = models.get(modelName);
            // id field is first decorator that invoke before model and other fields decorators
            // so we need to check if model is already registered and if not then register it
            if (!modelDescription) {
                modelDescription = new ModelDescriptor();
                models.set(modelName, modelDescription);
            }
            if (modelDescription.id)
                throw new Error(`Id field already registered in model "${modelName}"`);
            const type = typeDescriptor ? typeDescriptor : new NumberDescriptor();
            modelDescription.id = fieldName;
            modelDescription.idFieldDescriptors = {
                decorator: (obj) => {
                    if (observable)
                        mobx.extendObservable(obj, { [fieldName]: obj[fieldName] });
                    obj.disposers.set('before changes', mobx.intercept(obj, fieldName, (change) => {
                        const oldValue = obj[fieldName];
                        if (change.newValue !== undefined && oldValue !== undefined)
                            throw new Error(`You cannot change id field: ${oldValue} to ${change.newValue}`);
                        if (change.newValue === undefined && oldValue !== undefined)
                            modelDescription.cache.eject(obj);
                        return change;
                    }));
                    obj.disposers.set('after changes', mobx.observe(obj, fieldName, (_change) => {
                        if (obj.ID !== undefined)
                            modelDescription.cache.inject(obj);
                    }));
                },
                disposers: [],
                type,
                settings: {}
            };
        };
    }

    class Filter {
    }

    class SingleFilter extends Filter {
        field;
        input;
        // TODO: is __disposers deprecated? I don't find any usage of it and I don't how it can be used
        __disposers = [];
        getURIField;
        operator;
        constructor(field, input, getURIField, operator) {
            super();
            this.field = field;
            this.input = input;
            this.getURIField = getURIField;
            this.operator = operator;
            mobx.makeObservable(this);
        }
        get isReady() {
            return this.input.isReady;
        }
        get URLSearchParams() {
            const search_params = new URLSearchParams();
            const value = this.input.toString();
            if (!this.input.isDisabled && value !== undefined) {
                search_params.set(this.getURIField(this.field), value);
            }
            return search_params;
        }
        isMatch(obj) {
            // it's always match if value of filter is undefined
            if (this.input === undefined || this.input.isDisabled)
                return true;
            return match(obj, this.field, this.input.value, this.operator);
        }
    }
    __decorate([
        mobx.observable,
        __metadata("design:type", Variable)
    ], SingleFilter.prototype, "input", void 0);
    function match(obj, field_name, filter_value, operator) {
        const field_names = field_name.split('__');
        const current_field_name = field_names[0];
        const current_value = obj[current_field_name];
        if (field_names.length === 1)
            return operator(current_value, filter_value);
        else if (field_names.length > 1) {
            const next_field_name = field_name.substring(field_names[0].length + 2);
            // we have object relation
            if (typeof current_value === 'object' && current_value !== null) {
                if (Array.isArray(current_value)) {
                    let result = false;
                    for (const item of current_value) {
                        result = match(item, next_field_name, filter_value, operator);
                        if (result)
                            return result;
                    }
                }
                else {
                    return match(current_value, next_field_name, filter_value, operator);
                }
            }
        }
        return false;
    }
    function EQ(field, input) {
        return new SingleFilter(field, input, (field) => `${field}`, (a, b) => a === b);
    }
    function EQV(field, input) {
        return new SingleFilter(field, input, (field) => `${field}__eq`, (a, b) => a === b);
    }
    function NOT_EQ(field, input) {
        return new SingleFilter(field, input, (field) => `${field}__not_eq`, (a, b) => a !== b);
    }
    function GT(field, input) {
        return new SingleFilter(field, input, (field) => `${field}__gt`, (a, b) => a > b);
    }
    function GTE(field, input) {
        return new SingleFilter(field, input, (field) => `${field}__gte`, (a, b) => a >= b);
    }
    function LT(field, input) {
        return new SingleFilter(field, input, (field) => `${field}__lt`, (a, b) => a < b);
    }
    function LTE(field, input) {
        return new SingleFilter(field, input, (field) => `${field}__lte`, (a, b) => a <= b);
    }
    function LIKE(field, input) {
        return new SingleFilter(field, input, (field) => `${field}__contains`, (a, b) => {
            if (typeof a !== 'string')
                return false;
            return a.includes(b);
        });
    }
    function ILIKE(field, input) {
        return new SingleFilter(field, input, (field) => `${field}__icontains`, (a, b) => {
            if (typeof a !== 'string')
                return false;
            return a.toLowerCase().includes(b.toLowerCase());
        });
    }
    function IN(field, input) {
        return new SingleFilter(field, input, (field) => `${field}__in`, (a, b) => {
            // it's always match if value of filter is empty []
            if (b.length === 0)
                return true;
            for (const v of b) {
                if (v === a)
                    return true;
            }
            return false;
        });
    }

    class ComboFilter extends Filter {
        filters;
        constructor(filters) {
            super();
            this.filters = filters;
        }
        get isReady() {
            for (const filter of this.filters) {
                if (!filter.isReady)
                    return false;
            }
            return true;
        }
        get URLSearchParams() {
            const search_params = new URLSearchParams();
            for (const filter of this.filters) {
                filter.URLSearchParams.forEach((value, key) => search_params.set(key, value));
            }
            return search_params;
        }
    }
    class AND_Filter extends ComboFilter {
        isMatch(obj) {
            for (const filter of this.filters) {
                if (!filter.isMatch(obj)) {
                    return false;
                }
            }
            return true;
        }
    }
    function AND(...filters) { return new AND_Filter(filters); }

    /**
     * Adapter is a class that provides a way to interact with the server or other data source.
     */
    class Adapter {
        delay; // delays for simulate real usage, use it only for tests
    }

    /**
     * ReadOnlyAdapter not allow to create, update or delete objects.
     */
    class ReadOnlyAdapter extends Adapter {
        async create() { throw ('You cannot create using READ ONLY adapter.'); }
        async update() { throw ('You cannot update using READ ONLY adapter.'); }
        async delete() { throw ('You cannot delete using READ ONLY adapter.'); }
    }

    /**
     * Local storage.
     */
    const local_store = {};
    /**
     * LocalAdapter connects to the local storage.
     * You can use this adapter for mock data or for unit test
     */
    class LocalAdapter extends Adapter {
        store_name;
        clear() {
            local_store[this.store_name] = {};
        }
        init_local_data(data) {
            const objs = {};
            for (const obj of data) {
                objs[obj.id] = obj;
            }
            local_store[this.store_name] = objs;
        }
        constructor(store_name) {
            super();
            this.store_name = store_name;
            local_store[this.store_name] = {};
        }
        async create(raw_data) {
            if (this.delay)
                await timeout(this.delay);
            // calculate and set new ID
            // skip non-numeric IDs (e.g. UUID/string) so parseInt's NaN can't poison Math.max
            const ids = [0];
            for (const id of Object.keys(local_store[this.store_name])) {
                const parsed = parseInt(id);
                if (!isNaN(parsed))
                    ids.push(parsed);
            }
            const max = Math.max(...ids);
            // copy before mutating so we don't modify the caller's object
            raw_data = { ...raw_data, id: max + 1 };
            local_store[this.store_name][raw_data.id] = raw_data;
            return raw_data;
        }
        async update(id, only_changed_raw_data) {
            if (this.delay)
                await timeout(this.delay);
            const raw_obj = local_store[this.store_name][id];
            for (const field of Object.keys(only_changed_raw_data)) {
                raw_obj[field] = only_changed_raw_data[field];
            }
            return raw_obj;
        }
        async delete(id) {
            if (this.delay)
                await timeout(this.delay);
            delete local_store[this.store_name][id];
        }
        async action(_id, _name, _kwargs) {
            throw new Error('Action method is not implemented for local adapter');
        }
        async get(id, _config) {
            if (this.delay)
                await timeout(this.delay);
            return local_store[this.store_name][id];
        }
        async modelAction(_name, _kwargs, _config) {
            throw new Error('Model action method is not implemented for local adapter');
        }
        async find(query) {
            if (this.delay)
                await timeout(this.delay);
            for (const raw_obj of Object.values(local_store[this.store_name])) {
                if (!query.filter || query.filter.isMatch(raw_obj)) {
                    return raw_obj;
                }
            }
            return undefined;
        }
        async load(query) {
            if (this.delay)
                await timeout(this.delay);
            let raw_objs = [];
            if (query.filter) {
                for (const raw_obj of Object.values(local_store[this.store_name])) {
                    if (query.filter.isMatch(raw_obj)) {
                        raw_objs.push(raw_obj);
                    }
                }
            }
            else {
                raw_objs = Object.values(local_store[this.store_name]);
            }
            // order_by (sort)
            if (query.orderBy.value) {
                raw_objs = raw_objs.sort((obj_a, obj_b) => {
                    for (const sort_by_field of query.orderBy.value) {
                        if (sort_by_field[1] === ASC) {
                            if (obj_a[sort_by_field[0]] < obj_b[sort_by_field[0]])
                                return -1;
                            if (obj_a[sort_by_field[0]] > obj_b[sort_by_field[0]])
                                return 1;
                        }
                        else {
                            if (obj_a[sort_by_field[0]] > obj_b[sort_by_field[0]])
                                return -1;
                            if (obj_a[sort_by_field[0]] < obj_b[sort_by_field[0]])
                                return 1;
                        }
                    }
                    return 0;
                });
            }
            // cursor-based pagination for QueryStream
            if (query instanceof QueryStream) {
                if (query.offset.value !== undefined) {
                    const cursor = query.offset.value;
                    raw_objs = raw_objs.filter(obj => obj.id > cursor);
                }
                raw_objs = raw_objs.slice(0, query.limit.value);
            }
            // offset/limit pagination for other queries (offset is a numeric page offset here)
            else if (query.limit.value !== undefined && query.offset.value !== undefined) {
                const offset = query.offset.value;
                raw_objs = raw_objs.slice(offset, offset + query.limit.value);
            }
            return raw_objs;
        }
        async getTotalCount(filter) {
            if (!filter)
                return Object.values(local_store[this.store_name]).length;
            let count = 0;
            for (const raw_obj of Object.values(local_store[this.store_name])) {
                if (filter.isMatch(raw_obj))
                    count++;
            }
            return count;
        }
        async getDistinct(filter, field) {
            const values = new Set();
            for (const raw_obj of Object.values(local_store[this.store_name])) {
                if (!filter || filter.isMatch(raw_obj)) {
                    if (raw_obj[field] !== undefined && raw_obj[field] !== null) {
                        values.add(raw_obj[field]);
                    }
                }
            }
            return Array.from(values);
        }
        getURLSearchParams(_query) {
            return new URLSearchParams();
        }
    }
    // model decorator
    function local(store_name) {
        return (cls) => {
            cls.defaultRepository.adapter = new LocalAdapter(store_name ? store_name : cls.modelName);
        };
    }

    class ConstantAdapter extends Adapter {
        constant;
        constructor(constant) {
            super();
            this.constant = constant;
        }
        async action() {
            throw new Error('ConstantAdapter.action should not be used.');
        }
        async create() {
            throw new Error('ConstantAdapter.create should not be used.');
        }
        async update() {
            throw new Error('ConstantAdapter.update should not be used.');
        }
        async delete() {
            throw new Error('ConstantAdapter.delete should not be used.');
        }
        async get() {
            throw new Error('ConstantAdapter.get should not be used.');
        }
        async modelAction(_name, _kwargs, _config) {
            throw new Error('ConstantAdapter.modelAction should not be used.');
        }
        async find() {
            throw new Error('ConstantAdapter.find should not be used.');
        }
        async load() {
            return this.constant;
        }
        async getTotalCount() {
            return this.constant.length;
        }
        async getDistinct() {
            throw new Error('ConstantAdapter.getDistinct should not be used.');
        }
        getURLSearchParams() {
            return new URLSearchParams();
        }
    }
    // model decorator
    function constant(constant) {
        return (cls) => {
            cls.defaultRepository.adapter = new ConstantAdapter(constant);
        };
    }

    /**
     * Base abstract class for all forms.
     *
     * Form is an object that contains inputs and methods to work with them.
     * Also it controls loading state, cross-field validation, and errors.
     *
     */
    class Form {
        isLoading = false;
        errors = [];
        inputs;
        onSuccess;
        onCancel;
        /**
         * Array of cross-field validators.
         * Subclasses can push validators in their constructor or override `validate()`.
         */
        validators = [];
        constructor(inputs, onSuccess, onCancel) {
            mobx.makeObservable(this);
            this.inputs = inputs;
            this.onSuccess = onSuccess;
            this.onCancel = onCancel;
        }
        destroy() {
            for (const key in this.inputs) {
                this.inputs[key].destroy();
            }
        }
        get isReady() {
            return Object.values(this.inputs).every(input => input.isReady);
        }
        get isError() {
            return this.errors.length > 0
                || Object.values(this.inputs).some(input => input.errors.length > 0);
        }
        get isDirty() {
            return Object.values(this.inputs).some(input => input.isDirty);
        }
        markClean() {
            Object.values(this.inputs).forEach(input => input.markClean());
        }
        reset() {
            Object.values(this.inputs).forEach(input => input.reset());
        }
        /**
         * Run all cross-field validators and return aggregated errors.
         * Returns null when valid, or a map of field→messages when invalid.
         * Can be overridden by subclasses for custom validation logic.
         */
        validate() {
            const allErrors = {};
            for (const validator of this.validators) {
                const errors = validator(this.inputs);
                if (errors) {
                    for (const [key, msgs] of Object.entries(errors)) {
                        if (!allErrors[key])
                            allErrors[key] = [];
                        allErrors[key].push(...msgs);
                    }
                }
            }
            return Object.keys(allErrors).length ? allErrors : null;
        }
        /**
         * Clear all errors on the form and all its inputs.
         */
        clearErrors() {
            this.errors = [];
            for (const input of Object.values(this.inputs)) {
                input.errors = [];
            }
        }
        errorHandler(err) {
            mobx.runInAction(() => {
                if (!err.response?.data) {
                    this.errors = [err.message];
                }
                else {
                    for (const key in err.response.data) {
                        if (key === config.FORM_NON_FIELD_ERRORS_KEY) {
                            this.errors = err.response.data[key];
                        }
                        else {
                            if (this.inputs[key])
                                this.inputs[key].errors = err.response.data[key];
                            else {
                                // unknown error should be logged 
                                // and not shown to user
                                this.errors = [config.FORM_UNKNOWN_ERROR_MESSAGE];
                            }
                        }
                    }
                }
            });
        }
        async submit() {
            if (!this.isReady) {
                // Reject so the caller can react to a blocked submit instead of it
                // silently resolving. `async` turns this throw into a rejected Promise.
                throw new Error('Form is not ready to be submitted');
            }
            // Clear all previous errors before running cross-field validation
            this.clearErrors();
            // Run cross-field validation
            const validationErrors = this.validate();
            if (validationErrors) {
                mobx.runInAction(() => {
                    for (const [key, msgs] of Object.entries(validationErrors)) {
                        if (key === config.FORM_NON_FIELD_ERRORS_KEY) {
                            this.errors.push(...msgs);
                        }
                        else if (this.inputs[key]) {
                            this.inputs[key].errors = msgs;
                        }
                        else {
                            this.errors.push(...msgs);
                        }
                    }
                });
                throw new Error('Form validation failed');
            }
            mobx.runInAction(() => {
                this.isLoading = true;
            });
            try {
                const response = await this.apply();
                this.markClean();
                if (this.onSuccess)
                    this.onSuccess(response);
            }
            catch (err) {
                this.errorHandler(err);
            }
            finally {
                mobx.runInAction(() => this.isLoading = false);
            }
        }
        cancel() {
            if (this.onCancel)
                this.onCancel();
        }
        /**
         * Convert inputs to simple key-value object.
         */
        getKeyValueInputs() {
            const inputs = {};
            for (const fieldName of Object.keys(this.inputs))
                inputs[fieldName] = this.inputs[fieldName].value;
            return inputs;
        }
    }
    __decorate([
        mobx.observable,
        __metadata("design:type", Boolean)
    ], Form.prototype, "isLoading", void 0);
    __decorate([
        mobx.observable,
        __metadata("design:type", Array)
    ], Form.prototype, "errors", void 0);
    __decorate([
        mobx.computed,
        __metadata("design:type", Boolean),
        __metadata("design:paramtypes", [])
    ], Form.prototype, "isDirty", null);
    __decorate([
        mobx.action,
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], Form.prototype, "reset", null);
    __decorate([
        mobx.action,
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], Form.prototype, "clearErrors", null);

    /**
     * Form to run an action in the repository.
     * If repository is defined then model is ignored.
     * Use it for forms with complex data that saved in multiple models.
     */
    class ActionForm extends Form {
        action;
        repository;
        constructor(repository, action, inputs, onSuccess, onCancel) {
            super(inputs, onSuccess, onCancel);
            this.repository = repository;
            this.action = action;
        }
        async apply() {
            return await this.repository.modelAction(this.action, this.getKeyValueInputs());
        }
    }

    /**
     * Abstract class for forms that are used to work with an object.
     */
    class ObjectForm extends Form {
        obj;
        repository;
        constructor(obj, inputs, onSuccess, onCancel, repository) {
            super(inputs, onSuccess, onCancel);
            this.obj = obj;
            this.repository = repository;
        }
    }

    /**
     * Form to save (create/update) an object.
     */
    class SaveObjectForm extends ObjectForm {
        async apply() {
            const modelDescriptor = this.obj.modelDescriptor;
            // A valid input target is a declared field, a relation, or the id field.
            // We must NOT use Object.keys(this.obj): on a MobX model that also exposes
            // internal props (init_data, disposers, modelName, ...), which would let an
            // input silently overwrite the object's internal state.
            const isKnownField = (name) => !!modelDescriptor.fields[name]
                || !!modelDescriptor.relations[name]
                || name === modelDescriptor.id;
            // check if all fields from inputs are in obj
            for (const fieldName of Object.keys(this.inputs))
                if (!isKnownField(fieldName))
                    throw new Error(`ObjectForm error: object has no field ${fieldName}`);
            // move all values from inputs to obj
            // cast to the non-generic Model so the index signature allows writes
            const obj = this.obj;
            mobx.runInAction(() => {
                for (const fieldName of Object.keys(this.inputs)) {
                    // correct fieldName if it is foreign obj to foreign id
                    if (modelDescriptor.relations[fieldName]) {
                        const idFieldName = modelDescriptor.relations[fieldName].settings.foreign_id;
                        obj[idFieldName] = this.inputs[fieldName].value;
                    }
                    else
                        obj[fieldName] = this.inputs[fieldName].value;
                }
            });
            return await (this.repository || this.obj.getDefaultRepository()).save(this.obj);
        }
    }

    /**
     * Form to make an action of object.
     */
    class ActionObjectForm extends ObjectForm {
        action;
        constructor(action, obj, inputs, onSuccess, onCancel, repository) {
            super(obj, inputs, onSuccess, onCancel, repository);
            this.action = action;
        }
        async apply() {
            return await (this.repository || this.obj.getDefaultRepository())
                .action(this.obj, this.action, this.getKeyValueInputs());
        }
    }

    /**
     * Form to delete an object.
     */
    class DeleteObjectForm extends ObjectForm {
        async apply() {
            return await (this.repository || this.obj.getDefaultRepository()).delete(this.obj);
        }
    }

    exports.AND = AND;
    exports.AND_Filter = AND_Filter;
    exports.ARRAY = ARRAY;
    exports.ASC = ASC;
    exports.ActionForm = ActionForm;
    exports.ActionObjectForm = ActionObjectForm;
    exports.Adapter = Adapter;
    exports.ArrayDescriptor = ArrayDescriptor;
    exports.BOOLEAN = BOOLEAN;
    exports.BooleanDescriptor = BooleanDescriptor;
    exports.Cache = Cache;
    exports.ComboFilter = ComboFilter;
    exports.ConstantAdapter = ConstantAdapter;
    exports.DATE = DATE;
    exports.DATETIME = DATETIME;
    exports.DESC = DESC;
    exports.DISPOSER_AUTOUPDATE = DISPOSER_AUTOUPDATE;
    exports.DateDescriptor = DateDescriptor;
    exports.DateTimeDescriptor = DateTimeDescriptor;
    exports.DeleteObjectForm = DeleteObjectForm;
    exports.ENUM = ENUM;
    exports.EQ = EQ;
    exports.EQV = EQV;
    exports.EnumDescriptor = EnumDescriptor;
    exports.Filter = Filter;
    exports.Form = Form;
    exports.GT = GT;
    exports.GTE = GTE;
    exports.ILIKE = ILIKE;
    exports.IN = IN;
    exports.LIKE = LIKE;
    exports.LT = LT;
    exports.LTE = LTE;
    exports.LocalAdapter = LocalAdapter;
    exports.Model = Model;
    exports.ModelDescriptor = ModelDescriptor;
    exports.ModelFieldDescriptor = ModelFieldDescriptor;
    exports.NOT_EQ = NOT_EQ;
    exports.NUMBER = NUMBER;
    exports.NumberDescriptor = NumberDescriptor;
    exports.ORDER_BY = ORDER_BY;
    exports.ObjectForm = ObjectForm;
    exports.ObjectInput = ObjectInput;
    exports.OrderByDescriptor = OrderByDescriptor;
    exports.Query = Query;
    exports.QueryCacheSync = QueryCacheSync;
    exports.QueryDistinct = QueryDistinct;
    exports.QueryPage = QueryPage;
    exports.QueryRaw = QueryRaw;
    exports.QueryRawPage = QueryRawPage;
    exports.QueryStream = QueryStream;
    exports.ReadOnlyAdapter = ReadOnlyAdapter;
    exports.Repository = Repository;
    exports.STRING = STRING;
    exports.SaveObjectForm = SaveObjectForm;
    exports.SingleFilter = SingleFilter;
    exports.StringDescriptor = StringDescriptor;
    exports.TypeDescriptor = TypeDescriptor;
    exports.UUID = UUID;
    exports.UUIDDescriptor = UUIDDescriptor;
    exports.Variable = Variable;
    exports.autoResetId = autoResetId;
    exports.clearModels = clearModels;
    exports.config = config;
    exports.constant = constant;
    exports.field = field;
    exports.foreign = foreign;
    exports.id = id;
    exports.local = local;
    exports.local_store = local_store;
    exports.many = many;
    exports.model = model;
    exports.models = models;
    exports.one = one;
    exports.syncCookieHandler = syncCookieHandler;
    exports.syncLocalStorageHandler = syncLocalStorageHandler;
    exports.syncURLHandler = syncURLHandler;
    exports.timeout = timeout;
    exports.waitIsFalse = waitIsFalse;
    exports.waitIsTrue = waitIsTrue;

}));
//# sourceMappingURL=mobx-model-ui.js.map
