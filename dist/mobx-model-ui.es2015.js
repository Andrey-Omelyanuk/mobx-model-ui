
  /**
   * @license
   * author: Andrey Omelyanuk
   * mobx-model-ui.js v0.0.3
   * Released under the MIT license.
   */

import _ from 'lodash';
import { observable, action, makeObservable, runInAction, autorun, reaction, computed, observe, extendObservable, intercept } from 'mobx';

// TODO: remove dependency of lodash 
// Global config of Mobx-ORM
const config = {
    DEFAULT_PAGE_SIZE: 50,
    AUTO_UPDATE_DELAY: 100, // ms
    NON_FIELD_ERRORS_KEY: 'non_field_errors',
    // NOTE: React router manage URL by own way. 
    // change UPDATE_SEARCH_PARAMS and WATCTH_URL_CHANGES in this case
    UPDATE_SEARCH_PARAMS: (search_params) => {
        window.history.pushState(null, '', `${window.location.pathname}?${search_params.toString()}`);
    },
    WATCTH_URL_CHANGES: (callback) => {
        window.addEventListener('popstate', callback);
        return () => { window.removeEventListener('popstate', callback); };
    },
    DEBOUNCE: (func, debounce) => {
        return _.debounce(func, debounce);
    }
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
 *
 */
class Cache {
    constructor() {
        Object.defineProperty(this, "store", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        makeObservable(this);
    }
    /**
     * Get object by ID
     */
    get(ID) {
        return this.store.get(ID);
    }
    /**
     * Inject object to the cache
     */
    inject(obj) {
        if (obj.ID === undefined || obj.ID === null || obj.ID === '')
            throw new Error(`Object should have id!`);
        const exist_obj = this.store.get(obj.ID);
        if (exist_obj && exist_obj !== obj)
            throw new Error(`Object with ID ${obj.ID} already exist in the cache.`);
        this.store.set(obj.ID, obj);
    }
    /**
     * Eject object from the cache
     */
    eject(obj) {
        if (obj.ID)
            this.store.delete(obj.ID);
    }
    /**
     * Clear the cache
     */
    clear() {
        for (let obj of this.store.values())
            obj.destroy();
        this.store.clear();
    }
}
__decorate([
    observable,
    __metadata("design:type", Object)
], Cache.prototype, "store", void 0);
__decorate([
    action,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], Cache.prototype, "inject", null);
__decorate([
    action,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], Cache.prototype, "eject", null);
__decorate([
    action,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Cache.prototype, "clear", null);

/**
 * Repository class is responsible for CRUD operations on the model.
 */
class Repository {
    constructor(modelDescriptor, adapter) {
        Object.defineProperty(this, "modelDescriptor", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: modelDescriptor
        });
        Object.defineProperty(this, "adapter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: adapter
        });
    }
    /**
     * Create the object.
     */
    async create(obj, config) {
        let raw_obj = await this.adapter.create(obj.rawObj, config); // Id can be defined in the frontend => ids should be passed to the create method if they exist
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
        const ids = this.modelDescriptor.getIds(obj);
        let raw_obj = await this.adapter.update(ids, obj.only_changed_raw_data, config);
        obj.updateFromRaw(raw_obj);
        obj.refreshInitData();
        return obj;
    }
    /**
     * Delete the object.
     */
    async delete(obj, config) {
        const ids = this.modelDescriptor.getIds(obj);
        await this.adapter.delete(ids, config);
        obj.destroy();
    }
    /**
     * Run action for the object.
     */
    async action(obj, name, kwargs, config) {
        const ids = this.modelDescriptor.getIds(obj);
        return await this.adapter.action(ids, name, kwargs, config);
    }
    /**
     * Returns ONE object by ids.
     */
    async get(ids, config) {
        debugger;
        let raw_obj = await this.adapter.get(ids, config);
        return this.modelDescriptor.updateCachedObject(raw_obj);
    }
    /**
     * Returns ONE object by query.
     */
    async find(query, config) {
        let raw_obj = await this.adapter.find(query, config);
        return this.modelDescriptor.updateCachedObject(raw_obj);
    }
    /**
     * Returns MANY objects by query.
     */
    async load(query, config) {
        let raw_objs = await this.adapter.load(query, config);
        let objs = [];
        runInAction(() => {
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
}

function waitIsTrue(obj, field) {
    return new Promise((resolve, reject) => {
        autorun((reaction) => {
            if (obj[field]) {
                reaction.dispose();
                resolve(true);
            }
        });
    });
}
function waitIsFalse(obj, field) {
    return new Promise((resolve, reject) => {
        autorun((reaction) => {
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
    function updataInputFromURL() {
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
    input.__disposers.push(config.WATCTH_URL_CHANGES(updataInputFromURL.bind(input)));
    // watch for Input changes and update URL
    input.__disposers.push(reaction(() => input.toString(), // I cannot use this.value because it can be a Map
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
        let raw_value = localStorage.getItem(paramName);
        const exist_raw_value = input.toString();
        if (exist_raw_value !== raw_value)
            input.setFromString(raw_value);
    }
    // watch for changes and save to localStorage
    input.__disposers.push(reaction(() => input.value, (value, previousValue) => {
        // WARNING: input should return 'null' if value is null
        // because localStorage cannot store null
        if (value !== undefined)
            localStorage.setItem(paramName, input.toString());
        else
            localStorage.removeItem(paramName);
    }));
};

class Input {
    // TODO: fix any, it should be InputConstructorArgs<T> but it is not working
    // it's look like a bug in the TypeScript
    constructor(type, args) {
        Object.defineProperty(this, "type", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "value", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "isRequired", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "isDisabled", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "isDebouncing", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); //  
        Object.defineProperty(this, "isNeedToUpdate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); //  
        Object.defineProperty(this, "errors", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        }); // validations or backend errors put here
        Object.defineProperty(this, "debounce", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "syncURL", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "syncLocalStorage", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "__disposers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "stopDebouncing", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // init all observables before use it in reaction
        this.type = type;
        this.value = args && args.value !== undefined ? args.value : type.default();
        this.isRequired = !!(args === null || args === void 0 ? void 0 : args.required);
        this.isDisabled = !!(args === null || args === void 0 ? void 0 : args.disabled);
        this.isDebouncing = false;
        this.isNeedToUpdate = false;
        this.debounce = args === null || args === void 0 ? void 0 : args.debounce;
        this.syncURL = args === null || args === void 0 ? void 0 : args.syncURL;
        this.syncLocalStorage = args === null || args === void 0 ? void 0 : args.syncLocalStorage;
        makeObservable(this);
        if (this.debounce) {
            this.stopDebouncing = config.DEBOUNCE(() => runInAction(() => this.isDebouncing = false), this.debounce);
        }
        // the order is important, because syncURL has more priority under syncLocalStorage
        // i.e. init from syncURL can overwrite value from syncLocalStorage
        this.syncLocalStorage && syncLocalStorageHandler(this.syncLocalStorage, this);
        this.syncURL && syncURLHandler(this.syncURL, this);
    }
    destroy() {
        this.__disposers.forEach(disposer => disposer());
    }
    set(value) {
        this.value = value;
        this.isNeedToUpdate = false;
        if (this.debounce) {
            this.isDebouncing = true;
            this.stopDebouncing(); // will stop debouncing after debounce
        }
    }
    get isReady() {
        if (this.isDisabled)
            return true;
        return !(this.errors.length
            || this.isDebouncing
            || this.isNeedToUpdate
            || this.isRequired && (this.value === undefined || this.value === '' || (Array.isArray(this.value) && !this.value.length)));
    }
    setFromString(value) {
        this.set(this.type.fromString(value));
    }
    toString() {
        return this.type.toString(this.value);
    }
}
__decorate([
    observable,
    __metadata("design:type", Object)
], Input.prototype, "value", void 0);
__decorate([
    observable,
    __metadata("design:type", Boolean)
], Input.prototype, "isRequired", void 0);
__decorate([
    observable,
    __metadata("design:type", Boolean)
], Input.prototype, "isDisabled", void 0);
__decorate([
    observable,
    __metadata("design:type", Boolean)
], Input.prototype, "isDebouncing", void 0);
__decorate([
    observable,
    __metadata("design:type", Boolean)
], Input.prototype, "isNeedToUpdate", void 0);
__decorate([
    observable,
    __metadata("design:type", Array)
], Input.prototype, "errors", void 0);
__decorate([
    action,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], Input.prototype, "set", null);

/**
 *  Base class for the type descriptor
 * It is used to define the field of the model
 * It is used to convert the value to the string and back
 */
class TypeDescriptor {
    constructor() {
        /**
         * Configuration of the descriptor
         */
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
}

class StringDescriptor extends TypeDescriptor {
    constructor(props) {
        super();
        this.config = props ? props : { maxLength: 255 };
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
        if (value === null && !this.config.null)
            throw new Error('Field is required');
        if (value === '' && this.config.required)
            throw new Error('Field is required');
        if (this.config.maxLength && value.length > this.config.maxLength)
            throw new Error('String is too long');
    }
    default() {
        return '';
    }
}
function STRING(props) {
    return new StringDescriptor(props);
}

class NumberDescriptor extends TypeDescriptor {
    constructor(props) {
        super();
        this.config = props ? props : {};
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
        if (value === null && !this.config.null)
            throw new Error('Field is required');
        if (this.config.min && value < this.config.min)
            throw new Error('Number is too small');
        if (this.config.max && value > this.config.max)
            throw new Error('Number is too big');
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
        super();
        this.config = props;
    }
    toString(value) {
        return value.toString();
    }
    fromString(value) {
        return value === 'true';
    }
    validate(value) {
        var _a;
        if (((_a = this.config) === null || _a === void 0 ? void 0 : _a.required) && value === undefined)
            throw new Error('Field is required');
    }
    default() {
        return false;
    }
}
function BOOLEAN(props) {
    return new BooleanDescriptor(props);
}

class DateDescriptor extends TypeDescriptor {
    constructor(props) {
        super();
        this.config = props;
    }
    toString(value) {
        return value.toISOString();
    }
    fromString(value) {
        return new Date(value);
    }
    validate(value) {
        if (this.config.min && value < this.config.min)
            throw new Error('Date is too early');
        if (this.config.max && value > this.config.max)
            throw new Error('Date is too late');
    }
    default() {
        return new Date();
    }
}
function DATE(props) {
    return new DateDescriptor(props);
}

class DateTimeDescriptor extends DateDescriptor {
    toString(value) {
        return value.toISOString();
    }
}
function DATETIME(props) {
    return new DateTimeDescriptor(props);
}

class ArrayDescriptor extends TypeDescriptor {
    constructor(type, props) {
        super();
        this.config = props ? props : {};
        this.config.type = type;
    }
    toString(value) {
        if (!value)
            return undefined;
        if (!value.length)
            return undefined;
        return value.map(item => this.config.type.toString(item)).join(',');
    }
    fromString(value) {
        if (!value)
            return [];
        return value.split(',').map(item => this.config.type.fromString(item));
    }
    validate(value) {
        if (this.config.minItems && value.length < this.config.minItems)
            throw new Error('Array is too short');
        if (this.config.maxItems && value.length > this.config.maxItems)
            throw new Error('Array is too long');
        value.forEach(item => this.config.type.validate(item));
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
        return [undefined, ASC];
    }
}
function ORDER_BY() {
    return new OrderByDescriptor();
}

class ObjectInput extends Input {
    constructor(args) {
        super(STRING(), args);
        Object.defineProperty(this, "options", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.options = args.options;
        if (this.options) {
            this.__disposers.push(reaction(() => this.options.isReady, (isReady, previousValue) => {
                if (isReady && !previousValue) {
                    runInAction(() => this.isNeedToUpdate = true);
                    (args === null || args === void 0 ? void 0 : args.autoReset) && args.autoReset(this);
                }
            }));
        }
        else if (args === null || args === void 0 ? void 0 : args.autoReset) {
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
        var _a;
        super.destroy();
        (_a = this.options) === null || _a === void 0 ? void 0 : _a.destroy();
    }
}

function autoResetId(input) {
    var _a;
    // if value still in options, do nothing
    for (const item of input.options.items) {
        if (item.ID === input.value) {
            // have to set value to trigger reaction
            input.set(input.value);
            return;
        }
    }
    // otherwise set first available id or undefined
    input.set((_a = input.options.items[0]) === null || _a === void 0 ? void 0 : _a.ID);
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
    get items() { return this.__items; } // the items can be changed after the load (post processing)
    constructor(props) {
        Object.defineProperty(this, "repository", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "filter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "orderBy", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "offset", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "limit", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "relations", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "fields", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "omit", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "__items", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        }); // items from the server
        Object.defineProperty(this, "total", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // total count of items on the server, usefull for pagination
        Object.defineProperty(this, "isLoading", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        }); // query is loading the data
        Object.defineProperty(this, "isNeedToUpdate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        }); // query was changed and we need to update the data
        Object.defineProperty(this, "timestamp", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // timestamp of the last update, usefull to aviod to trigger react hooks twise
        Object.defineProperty(this, "error", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // error message
        Object.defineProperty(this, "controller", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "disposers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "disposerObjects", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        Object.defineProperty(this, "loading", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async () => waitIsFalse(this, 'isLoading')
        });
        Object.defineProperty(this, "ready", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async () => waitIsFalse(this, 'isReady')
        });
        let { repository, filter, orderBy, offset, limit, relations, fields, omit, autoupdate = true } = props;
        this.repository = repository;
        this.filter = filter;
        this.orderBy = orderBy ? orderBy : new Input(ARRAY(ORDER_BY()));
        this.offset = offset ? offset : new Input(NUMBER());
        this.limit = limit ? limit : new Input(NUMBER());
        this.relations = relations ? relations : new Input(ARRAY(STRING()));
        this.fields = fields ? fields : new Input(ARRAY(STRING()));
        this.omit = omit ? omit : new Input(ARRAY(STRING()));
        this.autoupdate = autoupdate;
        makeObservable(this);
        this.disposers.push(reaction(
        // watch the dependenciesAreReady and value only
        // because isNeedToUpdate should be set to true 
        // if dependenciesAreReady or/and value are triggered and isNeedToUpdate is false
        () => {
            return { dependenciesAreReady: this.dependenciesAreReady, value: this.toString };
        }, ({ dependenciesAreReady, value }) => {
            if (dependenciesAreReady && !this.isNeedToUpdate)
                runInAction(() => this.isNeedToUpdate = true);
        }, { fireImmediately: true }));
    }
    destroy() {
        var _a;
        (_a = this.controller) === null || _a === void 0 ? void 0 : _a.abort();
        while (this.disposers.length) {
            this.disposers.pop()();
        }
        for (let __id in this.disposerObjects) {
            this.disposerObjects[__id]();
            delete this.disposerObjects[__id];
        }
    }
    get autoupdate() {
        return !!this.disposerObjects[DISPOSER_AUTOUPDATE];
    }
    // Note: autoupdate trigger always the load(),
    // shadowLoad() is not make sense to trigger by autoupdate
    // because autoupdate means => user have changed something on UI inputs
    // and we should to show the UI reaction
    set autoupdate(value) {
        if (value !== this.autoupdate) { // indepotent guarantee
            // on 
            if (value) {
                this.disposerObjects[DISPOSER_AUTOUPDATE] = reaction(() => this.isNeedToUpdate && this.dependenciesAreReady, (updateIt, old) => {
                    if (updateIt && updateIt !== old) {
                        // run the load() in the next tick
                        setTimeout(() => this.load());
                        // }, config.AUTO_UPDATE_DELAY)
                    }
                }, { fireImmediately: true, delay: config.AUTO_UPDATE_DELAY });
            }
            // off
            else {
                this.disposerObjects[DISPOSER_AUTOUPDATE]();
                delete this.disposerObjects[DISPOSER_AUTOUPDATE];
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
            runInAction(() => {
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
        // NOTE: Date.now() is used to get the current timestamp
        //       and it can be the same in the same tick 
        //       in this case we should increase the timestamp by 1
        const now = Date.now();
        if (this.timestamp === now)
            this.timestamp += 1;
        else
            this.timestamp = now;
        try {
            await this.__load();
        }
        catch (e) {
            // ignore the cancelation of the request
            if (e.name !== 'AbortError' && e.message !== 'canceled') {
                console.error(e);
                runInAction(() => this.error = e.message);
            }
        }
        finally {
            this.controller = undefined;
        }
    }
    async __load() {
        const objs = await this.repository.load(this, { controller: this.controller });
        runInAction(() => this.__items = objs);
    }
}
__decorate([
    observable,
    __metadata("design:type", Array)
], Query.prototype, "__items", void 0);
__decorate([
    observable,
    __metadata("design:type", Number)
], Query.prototype, "total", void 0);
__decorate([
    observable,
    __metadata("design:type", Boolean)
], Query.prototype, "isLoading", void 0);
__decorate([
    observable,
    __metadata("design:type", Boolean)
], Query.prototype, "isNeedToUpdate", void 0);
__decorate([
    observable,
    __metadata("design:type", Number)
], Query.prototype, "timestamp", void 0);
__decorate([
    observable,
    __metadata("design:type", String)
], Query.prototype, "error", void 0);
__decorate([
    action('MO: Query Base - load'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Query.prototype, "load", null);
__decorate([
    action('MO: Query Base - shadow load'),
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
    get is_last_page() { return this.offset.value + this.limit.value >= this.total; }
    get current_page() { return this.offset.value / this.limit.value + 1; }
    get total_pages() { return this.total ? Math.ceil(this.total / this.limit.value) : 1; }
    // for compatibility with js code style
    get isFirstPage() { return this.is_first_page; }
    get isLastPage() { return this.is_last_page; }
    get currentPage() { return this.current_page; }
    get totalPages() { return this.total_pages; }
    constructor(props) {
        super(props);
        runInAction(() => {
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
        runInAction(() => {
            this.__items = objs;
            this.total = total;
        });
    }
}
__decorate([
    action('MO: set page'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], QueryPage.prototype, "setPage", null);
__decorate([
    action('MO: set page size'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], QueryPage.prototype, "setPageSize", null);

class QueryCacheSync extends Query {
    constructor(props) {
        super(props);
        // watch the cache for changes, and update items if needed
        this.disposers.push(observe(props.repository.modelDescriptor.cache.store, action('MO: Query - update from cache changes', (change) => {
            if (change.type == 'add') {
                this.__watch_obj(change.newValue);
            }
            if (change.type == 'delete') {
                let id = change.name;
                let obj = change.oldValue;
                this.disposerObjects[id]();
                delete this.disposerObjects[id];
                let i = this.__items.indexOf(obj);
                if (i != -1) {
                    this.__items.splice(i, 1);
                    this.total = this.__items.length;
                }
            }
        })));
        // ch all exist objects of model 
        for (let [id, obj] of props.repository.modelDescriptor.cache.store) {
            this.__watch_obj(obj);
        }
    }
    async __load() {
        if (this.controller)
            this.controller.abort();
        this.controller = new AbortController();
        try {
            await this.repository.load(this, { controller: this.controller });
            // Query don't need to overide the __items,
            // query's items should be get only from the cache
        }
        catch (e) {
            if (e.name !== 'AbortError')
                throw e;
        }
        // we have to wait the next tick
        // mobx should finished recalculation for model-objects
        await Promise.resolve();
        // await new Promise(resolve => setTimeout(resolve))
    }
    get items() {
        let __items = this.__items.map(x => x); // copy __items (not deep)
        if (this.orderBy.value && this.orderBy.value.length) {
            let compare = (a, b) => {
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
        if (this.disposerObjects[obj.id])
            this.disposerObjects[obj.id]();
        this.disposerObjects[obj.id] = reaction(() => !this.filter || this.filter.isMatch(obj), action('MO: Query - obj was changed', (should) => {
            let i = this.__items.indexOf(obj);
            // should be in the items and it is not in the items? add it to the items
            if (should && i == -1)
                this.__items.push(obj);
            // should not be in the items and it is in the items? remove it from the items
            if (!should && i != -1)
                this.__items.splice(i, 1);
            if (this.total != this.__items.length)
                this.total = this.__items.length;
        }), { fireImmediately: true });
    }
}
__decorate([
    computed,
    __metadata("design:type", Object),
    __metadata("design:paramtypes", [])
], QueryCacheSync.prototype, "items", null);

class QueryStream extends Query {
    // you can reset all and start from beginning
    goToFirstPage() { this.__items = []; this.offset.set(0); }
    // you can scroll only forward
    goToNextPage() { this.offset.set(this.offset.value + this.limit.value); }
    constructor(props) {
        super(props);
        runInAction(() => {
            if (this.offset.value === undefined)
                this.offset.set(0);
            if (this.limit.value === undefined)
                this.limit.set(config.DEFAULT_PAGE_SIZE);
        });
    }
    async __load() {
        const objs = await this.repository.load(this, { controller: this.controller });
        runInAction(() => {
            this.__items.push(...objs);
            // total is not make sense for infinity queries
            // total = 1 show that last page is reached
            if (objs.length < this.limit.value)
                this.total = 1;
        });
    }
}
__decorate([
    action('MO: fisrt page'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], QueryStream.prototype, "goToFirstPage", null);
__decorate([
    action('MO: next page'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], QueryStream.prototype, "goToNextPage", null);

/**
 * QueryRaw is a class to load raw objects from the server
 * without converting them to models using the repository.
 */
class QueryRaw extends Query {
    async __load() {
        const objs = await this.repository.adapter.load(this, { controller: this.controller });
        runInAction(() => {
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
        const objs = await this.repository.adapter.load(this);
        const total = await this.repository.getTotalCount(this.filter);
        runInAction(() => {
            this.__items = objs;
            this.total = total;
        });
    }
}

class QueryDistinct extends Query {
    constructor(field, props) {
        super(props);
        Object.defineProperty(this, "field", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.field = field;
    }
    async __load() {
        const objs = await this.repository.getDistinct(this.filter, this.field, { controller: this.controller });
        runInAction(() => {
            this.__items = objs;
        });
    }
}

/**
 * Is a map of all registered models in the application.
 * It's a singleton.
 */
const models = new Map();
function clearModels() {
    for (let [modelName, modelDescriptor] of models) {
        for (let fieldName in modelDescriptor.ids) {
            modelDescriptor.ids[fieldName].disposers.forEach(disposer => disposer());
        }
        for (let fieldName in modelDescriptor.fields) {
            modelDescriptor.fields[fieldName].disposers.forEach(disposer => disposer());
        }
        for (let fieldName in modelDescriptor.relations) {
            modelDescriptor.relations[fieldName].disposers.forEach(disposer => disposer());
        }
    }
    models.clear();
}

class Model {
    /**
     * @returns {ModelDescriptor} - model description
     */
    static getModelDescriptor() {
        return models.get(this.modelName);
    }
    /**
     * @param init - initial data of the object
     */
    constructor(init) {
        Object.defineProperty(this, "modelName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * Save the initial data of the object that was loaded from the server.
         */
        Object.defineProperty(this, "init_data", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * disposers for mobx reactions and interceptors, you can add your own disposers
         */
        Object.defineProperty(this, "disposers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
    }
    /**
     * @returns {ModelDescriptor} - model descriptor
     */
    get modelDescriptor() {
        return models.get(this.modelName);
    }
    /**
     * ID is string based on join ids.
     * It's base for using in the lib.
     */
    get ID() {
        return this.modelDescriptor.getID(this);
    }
    /**
     * Destructor of the object.
     * It eject from cache and removes all disposers.
     */
    destroy() {
        // trigger in id fields will ejenct the object from cache
        for (const fieldName in this.modelDescriptor.ids) {
            this[fieldName] = undefined;
        }
        while (this.disposers.size) {
            this.disposers.forEach((disposer, key) => {
                disposer();
                this.disposers.delete(key);
            });
        }
    }
    get model() {
        return this.constructor.__proto__;
    }
    /**
     * @returns {Object} - data only from fields (no ids)
     */
    get rawData() {
        let rawData = {};
        for (const fieldName in this.modelDescriptor.fields) {
            if (this[fieldName] !== undefined) {
                rawData[fieldName] = this[fieldName];
            }
        }
        return rawData;
    }
    /**
     * @returns {Object} - it is rawData + ids fields
     */
    get rawObj() {
        let rawObj = this.rawData;
        for (const fieldName in this.modelDescriptor.ids) {
            rawObj[fieldName] = this[fieldName];
        }
        return rawObj;
    }
    get only_changed_raw_data() {
        let raw_data = {};
        for (let field_name in this.modelDescriptor.fields) {
            if (this[field_name] != this.init_data[field_name]) {
                raw_data[field_name] = this[field_name];
            }
        }
        return raw_data;
    }
    get is_changed() {
        for (let field_name in this.modelDescriptor.fields) {
            if (this[field_name] != this.init_data[field_name]) {
                return true;
            }
        }
        return false;
    }
    refreshInitData() {
        if (this.init_data === undefined)
            this.init_data = {};
        for (let field_name in this.modelDescriptor.fields) {
            this.init_data[field_name] = this[field_name];
        }
    }
    cancelLocalChanges() {
        for (let field_name in this.modelDescriptor.fields) {
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
        // update ids if not exist
        for (const fieldName in this.modelDescriptor.ids) {
            if (this[fieldName] === null || this[fieldName] === undefined) {
                this[fieldName] = rawObj[fieldName];
            }
        }
        // update the fields if the raw data is exist and it is different
        for (let fieldName in this.modelDescriptor.fields) {
            if (rawObj[fieldName] !== undefined && rawObj[fieldName] !== this[fieldName]) {
                this[fieldName] = rawObj[fieldName];
            }
        }
        // update related objects 
        for (let relation in this.modelDescriptor.relations) {
            const settings = this.modelDescriptor.relations[relation].settings;
            if (settings.foreign_model && rawObj[relation]) {
                settings.foreign_model.getModelDescriptor().updateCachedObject(rawObj[relation]);
                // TODO: I need to finish composite ids later, with single id it works
                this[settings.foreign_ids[0]] = rawObj[relation].id;
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
    async action(name, kwargs) { return await this.model.repository.action(this, name, kwargs); }
    async create() { return await this.modelDescriptor.defaultRepository.create(this); }
    async update() { return await this.modelDescriptor.defaultRepository.update(this); }
    async save() { return this.ID ? await this.update() : await this.create(); }
    async delete() { return await this.modelDescriptor.defaultRepository.delete(this); }
    async refresh() { return await this.modelDescriptor.defaultRepository.get(this.modelDescriptor.getIds(this)); }
    // --------------------------------------------------------------------------------------------
    // helper class functions
    // --------------------------------------------------------------------------------------------
    static getQuery(props) {
        return new Query(Object.assign(Object.assign({}, props), { repository: this.getModelDescriptor().defaultRepository }));
    }
    static getQueryPage(props) {
        return new QueryPage(Object.assign(Object.assign({}, props), { repository: this.getModelDescriptor().defaultRepository }));
    }
    static getQueryRaw(props) {
        return new QueryRaw(Object.assign(Object.assign({}, props), { repository: this.getModelDescriptor().defaultRepository }));
    }
    static getQueryRawPage(props) {
        return new QueryRawPage(Object.assign(Object.assign({}, props), { repository: this.getModelDescriptor().defaultRepository }));
    }
    static getQueryCacheSync(props) {
        return new QueryCacheSync(Object.assign(Object.assign({}, props), { repository: this.getModelDescriptor().defaultRepository }));
    }
    static getQueryStream(props) {
        return new QueryStream(Object.assign(Object.assign({}, props), { repository: this.getModelDescriptor().defaultRepository }));
    }
    static getQueryDistinct(field, props) {
        return new QueryDistinct(field, Object.assign(Object.assign({}, props), { repository: this.getModelDescriptor().defaultRepository }));
    }
    static get(ID) {
        return this.getModelDescriptor().cache.get(ID);
    }
    static async findById(ids) {
        let repository = this.getModelDescriptor().defaultRepository;
        return repository.get(ids);
    }
    static async find(query) {
        let repository = this.getModelDescriptor().defaultRepository;
        return repository.find(query);
    }
}
__decorate([
    computed({ keepAlive: true }),
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], Model.prototype, "ID", null);
__decorate([
    observable,
    __metadata("design:type", Object)
], Model.prototype, "init_data", void 0);
__decorate([
    action,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Model.prototype, "destroy", null);
__decorate([
    action,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Model.prototype, "refreshInitData", null);
__decorate([
    action,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Model.prototype, "cancelLocalChanges", null);
__decorate([
    action,
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
        throw new Error(`Model "${modelName}" should be registered in models. Did you forget to declare any ids?`);
    // the field decorators run first, then the model decorator
    // id decorator creates the model descriptor and registers it in models 
    // so, we cannot catch the case when we try to declare a model with the same name 
    // the new constructor
    let f = function (...args) {
        let c = class extends constructor {
            constructor(...args) { super(...args); }
        };
        c.__proto__ = constructor;
        let obj = new c();
        obj.modelName = modelName;
        makeObservable(obj);
        const descriptor = obj.modelDescriptor;
        // apply id decorators
        if (Object.keys(descriptor.ids).length === 0)
            throw new Error(`Model "${modelName}" should have id field decorator!`);
        for (const fieldName in descriptor.ids)
            descriptor.ids[fieldName].decorator(obj, fieldName);
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
    constructor() {
        Object.defineProperty(this, "decorator", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "disposers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "type", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "settings", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
}
/**
 * ModelDescriptor is a class that contains all the information about the model.
 */
class ModelDescriptor {
    constructor() {
        /**
         * Model class
         */
        Object.defineProperty(this, "cls", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * Default repository for the model. It used in helper methods like `load`, `getTotalCount`, etc.
         * It can be changed later (e.g. in model decorator)
         */
        Object.defineProperty(this, "defaultRepository", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Repository(this)
        });
        /**
         * Id fields
         */
        Object.defineProperty(this, "ids", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        /**
         * Fields is a map of all fields in the model that usually use in repository.
         */
        Object.defineProperty(this, "fields", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        /**
         * Relations is a map of all relations (foreign, one, many) in the model.
         * It is derivative and does not come from outside.
         */
        Object.defineProperty(this, "relations", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        Object.defineProperty(this, "cache", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Cache()
        });
    }
    /**
     *  Calculate ID from obj based on Model config.
     *  If one of the ids is undefined, it returns undefined.
     * @param obj - any object, usually it's a raw object of model
     * @returns
     * @example:
     *  - id1=1, id2=2 => '1=2'
     */
    getID(obj) {
        let ids = [];
        for (const fieldName in this.ids) {
            const id = this.ids[fieldName].type.toString(obj[fieldName]);
            if (id === undefined)
                return undefined;
            ids.push(id);
        }
        return ids.join('=');
    }
    /**
     * Calculate ID from values based on Model config.
     */
    getIDByValues(values) {
        const ids = [];
        const configs = Object.values(this.ids);
        for (let i = 0; i < values.length; i++) {
            const value = configs[i].type.toString(values[i]);
            if (value === undefined)
                return undefined;
            ids.push(value);
        }
        return ids.join('=');
    }
    /**
     * Get all original values of ids from object.
     * @param obj - any object of model, not only T extends Model, it can be a raw object.
     * @returns
     */
    getIds(obj) {
        const ids = [];
        for (const fieldName in this.ids) {
            const id = obj[fieldName];
            if (id === undefined)
                return undefined;
            ids.push(id);
        }
        return ids;
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
            throw new Error(`Model "${modelName}" should be registered in models. Did you forget to declare any ids?`);
        let modelDescription = models.get(modelName);
        modelDescription.fields[fieldName] = {
            decorator: (obj) => {
                if (observable)
                    extendObservable(obj, { [fieldName]: obj[fieldName] });
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
function foreign(foreign_model, foreign_ids) {
    return function (cls, field_name) {
        var _a;
        const modelName = (_a = cls.modelName) !== null && _a !== void 0 ? _a : cls.constructor.name;
        if (!modelName)
            throw new Error('Model name is not defined. Did you forget to declare any id fields?');
        const modelDescription = models.get(modelName);
        if (!modelDescription)
            throw new Error(`Model ${modelName} is not registered in models. Did you forget to declare any id fields?`);
        // if it is empty then try auto detect it (it works only with single id) 
        foreign_ids = foreign_ids !== null && foreign_ids !== void 0 ? foreign_ids : [`${field_name}_id`];
        modelDescription.relations[field_name] = {
            decorator: (obj) => {
                // make observable and set default value
                extendObservable(obj, { [field_name]: undefined });
                // watch on foreign id
                obj.disposers.set(`foreign ${field_name}`, reaction(
                // watch on foreign cache for foreign object
                () => {
                    const values = foreign_ids.map(id => obj[id]);
                    const foreignModelDescriptor = foreign_model.getModelDescriptor();
                    const foreignID = foreignModelDescriptor.getIDByValues(values);
                    // console.warn('foreign', foreign_ids, values, `fID '${foreignID}'`) 
                    if (foreignID === undefined)
                        return undefined;
                    if (foreignID === '')
                        return undefined;
                    if (foreignID === null)
                        return null; // foreign object can be null
                    if (foreignID === 'null')
                        return null; // foreign object can be null
                    // console.warn('foreign', foreignID, foreign_model.getModelDescriptor().defaultRepository.cache.get(foreignID))
                    // console.warn(foreign_model.getModelDescriptor().defaultRepository.cache.store)
                    return foreign_model.getModelDescriptor().cache.get(foreignID);
                }, 
                // update foreign field
                action('MO: Foreign - update', (_new, _old) => obj[field_name] = _new), { fireImmediately: true }));
            },
            disposers: [],
            settings: { foreign_model, foreign_ids }
        };
    };
}

function one(remote_model, remote_foreign_ids) {
    return function (cls, field_name) {
        var _a;
        const modelName = (_a = cls.modelName) !== null && _a !== void 0 ? _a : cls.constructor.name;
        if (!modelName)
            throw new Error('Model name is not defined. Did you forget to declare any id fields?');
        const modelDescription = models.get(modelName);
        if (!modelDescription)
            throw new Error(`Model ${modelName} is not registered in models. Did you forget to declare any id fields?`);
        remote_foreign_ids = remote_foreign_ids !== null && remote_foreign_ids !== void 0 ? remote_foreign_ids : [`${modelName.toLowerCase()}_id`];
        const remoteModelDescriptor = remote_model.getModelDescriptor();
        const disposer_name = `MO: One - update - ${modelName}.${field_name}`;
        modelDescription.relations[field_name] = {
            decorator: (obj) => {
                let foreignObj = undefined;
                for (let [_, cacheObj] of remoteModelDescriptor.cache.store) {
                    const values = remote_foreign_ids.map(id => cacheObj[id]);
                    const ID = modelDescription.getIDByValues(values);
                    if (obj.ID === ID && ID !== undefined) {
                        foreignObj = cacheObj;
                        break;
                    }
                }
                extendObservable(obj, { [field_name]: foreignObj });
            },
            disposers: [],
            settings: { remote_model, remote_foreign_ids }
        };
        modelDescription.relations[field_name].disposers.push(observe(remoteModelDescriptor.cache.store, (change) => {
            let remote_obj;
            switch (change.type) {
                case 'add':
                    remote_obj = change.newValue;
                    remote_obj.disposers.set(disposer_name, reaction(() => {
                        const values = remote_foreign_ids.map(id => remote_obj[id]);
                        const foreignID = modelDescription.getIDByValues(values);
                        return {
                            id: foreignID,
                            obj: modelDescription.cache.get(foreignID)
                        };
                    }, action(disposer_name, (_new, _old) => {
                        if (_old === null || _old === void 0 ? void 0 : _old.obj)
                            _old.obj[field_name] = _new.id ? undefined : null;
                        if (_new === null || _new === void 0 ? void 0 : _new.obj)
                            _new.obj[field_name] = remote_obj;
                    }), { fireImmediately: true }));
                    break;
                case 'delete':
                    remote_obj = change.oldValue;
                    if (remote_obj.disposers.get(disposer_name)) {
                        remote_obj.disposers.get(disposer_name)();
                        remote_obj.disposers.delete(disposer_name);
                    }
                    const values = remote_foreign_ids.map(id => remote_obj[id]);
                    const foreignID = modelDescription.getIDByValues(values);
                    let obj = modelDescription.cache.get(foreignID);
                    if (obj)
                        runInAction(() => { obj[field_name] = undefined; });
                    break;
            }
        }));
    };
}

/**
 * Decorator for many fields
 */
function many(remote_model, remote_foreign_ids) {
    return function (cls, field_name) {
        var _a;
        const modelName = (_a = cls.modelName) !== null && _a !== void 0 ? _a : cls.constructor.name;
        if (!modelName)
            throw new Error('Model name is not defined. Did you forget to declare any id fields?');
        const modelDescription = models.get(modelName);
        if (!modelDescription)
            throw new Error(`Model ${modelName} is not registered in models. Did you forget to declare any id fields?`);
        // if it is empty then try auto detect it (it works only with single id) 
        remote_foreign_ids = remote_foreign_ids !== null && remote_foreign_ids !== void 0 ? remote_foreign_ids : [`${modelName.toLowerCase()}_id`];
        modelDescription.relations[field_name] = {
            decorator: (obj) => {
                extendObservable(obj, { [field_name]: [] });
            },
            disposers: [],
            settings: { remote_model, remote_foreign_ids }
        };
        const remoteModelDescriptor = remote_model.getModelDescriptor();
        const disposer_name = `MO: Many - update - ${modelName}.${field_name}`;
        // watch for remote object in the cache 
        modelDescription.relations[field_name].disposers.push(observe(remoteModelDescriptor.cache.store, (remote_change) => {
            let remote_obj;
            switch (remote_change.type) {
                case 'add':
                    remote_obj = remote_change.newValue;
                    remote_obj.disposers.set(disposer_name, reaction(() => {
                        const values = remote_foreign_ids.map(id => remote_obj[id]);
                        const foreignID = modelDescription.getIDByValues(values);
                        return modelDescription.cache.get(foreignID);
                    }, action(disposer_name, (_new, _old) => {
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
                case 'delete':
                    remote_obj = remote_change.oldValue;
                    if (remote_obj.disposers.get(disposer_name)) {
                        remote_obj.disposers.get(disposer_name)();
                        remote_obj.disposers.delete(disposer_name);
                    }
                    const values = remote_foreign_ids.map(id => remote_obj[id]);
                    const foreignID = modelDescription.getIDByValues(values);
                    let obj = modelDescription.cache.get(foreignID);
                    if (obj) {
                        const i = obj[field_name].indexOf(remote_obj);
                        if (i > -1)
                            runInAction(() => { obj[field_name].splice(i, 1); });
                    }
                    break;
            }
        }));
    };
}

/**
 * Decorator for id fields
 * Only id field can register model in models map,
 * because it invoke before a model decorator.
 */
function id(typeDescriptor, observable = true) {
    return (cls, fieldName) => {
        var _a;
        const modelName = (_a = cls.modelName) !== null && _a !== void 0 ? _a : cls.constructor.name;
        let modelDescription = models.get(modelName);
        // id field is first decorator that invoke before model and other fields decorators
        // so we need to check if model is already registered and if not then register it
        if (!modelDescription) {
            modelDescription = new ModelDescriptor();
            models.set(modelName, modelDescription);
        }
        if (modelDescription.ids[fieldName])
            throw new Error(`Id field "${fieldName}" already registered in model "${modelDescription.cls.name}"`);
        const type = typeDescriptor ? typeDescriptor : new NumberDescriptor();
        modelDescription.ids[fieldName] = {
            decorator: (obj) => {
                if (observable)
                    extendObservable(obj, { [fieldName]: obj[fieldName] });
                obj.disposers.set('before changes', intercept(obj, fieldName, (change) => {
                    let oldValue = obj[fieldName];
                    if (change.newValue !== undefined && oldValue !== undefined)
                        throw new Error(`You cannot change id field: ${oldValue} to ${change.newValue}`);
                    if (change.newValue === undefined && oldValue !== undefined)
                        modelDescription.cache.eject(obj);
                    return change;
                }));
                obj.disposers.set('after changes', observe(obj, fieldName, (change) => {
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
    constructor(field, input, getURIField, operator) {
        super();
        Object.defineProperty(this, "field", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "input", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // TODO: is __disposers deprecated? I don't find any usage of it and I don't how it can be used
        Object.defineProperty(this, "__disposers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "getURIField", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "operator", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.field = field;
        this.input = input;
        this.getURIField = getURIField;
        this.operator = operator;
        makeObservable(this);
    }
    get isReady() {
        return this.input.isReady;
    }
    get URLSearchParams() {
        let search_params = new URLSearchParams();
        let value = this.input.toString();
        !this.input.isDisabled && value !== undefined && search_params.set(this.getURIField(this.field), value);
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
    observable,
    __metadata("design:type", Input)
], SingleFilter.prototype, "input", void 0);
function match(obj, field_name, filter_value, operator) {
    let field_names = field_name.split('__');
    let current_field_name = field_names[0];
    let current_value = obj[current_field_name];
    if (field_names.length === 1)
        return operator(current_value, filter_value);
    else if (field_names.length > 1) {
        let next_field_name = field_name.substring(field_names[0].length + 2);
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
    return new SingleFilter(field, input, (feild) => `${field}__lt`, (a, b) => a < b);
}
function LTE(field, input) {
    return new SingleFilter(field, input, (field) => `${field}__lte`, (a, b) => a <= b);
}
function LIKE(field, input) {
    return new SingleFilter(field, input, (field) => `${field}__contains`, (a, b) => a.includes(b));
}
function ILIKE(field, input) {
    return new SingleFilter(field, input, (field) => `${field}__icontains`, (a, b) => a.toLowerCase().includes(b.toLowerCase()));
}
function IN(field, input) {
    return new SingleFilter(field, input, (field) => `${field}__in`, (a, b) => {
        // it's always match if value of filter is empty []
        if (b.length === 0)
            return true;
        for (let v of b) {
            if (v === a)
                return true;
        }
        return false;
    });
}

class ComboFilter extends Filter {
    constructor(filters) {
        super();
        Object.defineProperty(this, "filters", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.filters = filters;
    }
    get isReady() {
        for (let filter of this.filters) {
            if (!filter.isReady)
                return false;
        }
        return true;
    }
    get URLSearchParams() {
        let search_params = new URLSearchParams();
        for (let filter of this.filters) {
            filter.URLSearchParams.forEach((value, key) => search_params.set(key, value));
        }
        return search_params;
    }
}
class AND_Filter extends ComboFilter {
    isMatch(obj) {
        for (let filter of this.filters) {
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
}

/**
 * ReadOnlyAdapter not allow to create, update or delete objects.
 */
class ReadOnlyAdapter extends Adapter {
    async create() { throw (`You cannot create using READ ONLY adapter.`); }
    async update() { throw (`You cannot update using READ ONLY adapter.`); }
    async delete() { throw (`You cannot delete using READ ONLY adapter.`); }
}

/**
 * Local storage.
 */
let local_store = {};
/**
 * LocalAdapter connects to the local storage.
 * You can use this adapter for mock data or for unit test
 */
class LocalAdapter {
    getID(ids) {
        return ids.join('-');
    }
    clear() {
        local_store[this.store_name] = {};
    }
    init_local_data(data) {
        let objs = {};
        for (let obj of data) {
            objs[obj.id] = obj;
        }
        local_store[this.store_name] = objs;
    }
    constructor(store_name) {
        Object.defineProperty(this, "store_name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "delay", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // delays for simulate real usage, use it only for tests
        this.store_name = store_name;
        local_store[this.store_name] = {};
    }
    async create(raw_data) {
        if (this.delay)
            await timeout(this.delay);
        // calculate and set new ID
        let ids = [0];
        for (let id of Object.keys(local_store[this.store_name])) {
            ids.push(parseInt(id));
        }
        let max = Math.max.apply(null, ids);
        raw_data.id = max + 1;
        local_store[this.store_name][raw_data.id] = raw_data;
        return raw_data;
    }
    async update(ids, only_changed_raw_data) {
        if (this.delay)
            await timeout(this.delay);
        const obj_id = ids.join('-');
        let raw_obj = local_store[this.store_name][obj_id];
        for (let field of Object.keys(only_changed_raw_data)) {
            raw_obj[field] = only_changed_raw_data[field];
        }
        return raw_obj;
    }
    async delete(ids) {
        if (this.delay)
            await timeout(this.delay);
        const obj_id = ids.join('-');
        delete local_store[this.store_name][obj_id];
    }
    async action(ids, name, kwargs) {
        throw (`Not implemented`);
    }
    async get(ids, config) {
        if (this.delay)
            await timeout(this.delay);
        const ID = this.getID(ids);
        return local_store[this.store_name][ID];
    }
    async find(query) {
        if (this.delay)
            await timeout(this.delay);
        let raw_obj = Object.values(local_store[this.store_name])[0];
        return raw_obj;
    }
    async load(query) {
        if (this.delay)
            await timeout(this.delay);
        let raw_objs = [];
        if (query.filter) {
            for (let raw_obj of Object.values(local_store[this.store_name])) {
            }
        }
        else {
            raw_objs = Object.values(local_store[this.store_name]);
        }
        // order_by (sort)
        if (query.orderBy.value) {
            raw_objs = raw_objs.sort((obj_a, obj_b) => {
                for (let sort_by_field of query.orderBy.value) {
                }
                return 0;
            });
        }
        // page
        if (query.limit.value !== undefined && query.offset.value !== undefined) {
            raw_objs = raw_objs.slice(query.offset.value, query.offset.value + query.limit.value);
        }
        return raw_objs;
    }
    async getTotalCount(filter) {
        return Object.values(local_store[this.store_name]).length;
    }
    async getDistinct(filter, filed) {
        return [];
    }
    getURLSearchParams(query) {
        return new URLSearchParams();
    }
}
// model decorator
function local(store_name) {
    return (cls) => {
        cls.getModelDescriptor().defaultRepository.adapter = new LocalAdapter(store_name ? store_name : cls.modelName);
    };
}

class ConstantAdapter extends Adapter {
    constructor(constant) {
        super();
        Object.defineProperty(this, "constant", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.constant = constant;
    }
    async action() {
        console.warn('ConstantAdapter.action not implemented');
        return {};
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
        cls.getModelDescriptor().defaultRepository.adapter = new ConstantAdapter(constant);
    };
}

/**
 * Form class
 */
class Form {
    constructor(inputs, __submit, __cancel) {
        Object.defineProperty(this, "inputs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: inputs
        });
        Object.defineProperty(this, "__submit", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: __submit
        });
        Object.defineProperty(this, "__cancel", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: __cancel
        });
        Object.defineProperty(this, "isLoading", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "errors", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
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
    async submit() {
        if (!this.isReady)
            return; // just ignore
        this.isLoading = true;
        this.errors = [];
        try {
            await this.__submit();
        }
        catch (err) {
            for (const key in err.message) {
                if (key === config.NON_FIELD_ERRORS_KEY) {
                    this.errors = err.message[key];
                }
                else {
                    if (this.inputs[key])
                        this.inputs[key].errors = err.message[key];
                    else
                        throw err;
                }
            }
        }
        this.isLoading = false;
    }
    cancel() {
        this.__cancel();
    }
}
__decorate([
    observable,
    __metadata("design:type", Boolean)
], Form.prototype, "isLoading", void 0);
__decorate([
    observable,
    __metadata("design:type", Array)
], Form.prototype, "errors", void 0);

/**
 * Form to save (create/update) an object.
 */
class ObjectForm extends Form {
    constructor(obj, inputs, onDone) {
        super(inputs, async () => {
            const fieldsNames = Object.keys(this.obj);
            // check if all fields from inputs are in obj
            for (let fieldName of Object.keys(this.inputs))
                if (!fieldsNames.includes(fieldName))
                    throw new Error(`ObjectForm error: object has no field ${fieldName}`);
            // move all values from inputs to obj
            for (let fieldName of Object.keys(inputs))
                this.obj[fieldName] = inputs[fieldName].value;
            const response = await this.obj.save();
            onDone && onDone(response);
        }, onDone);
        Object.defineProperty(this, "obj", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: obj
        });
    }
}

/**
 * Form to make an action of object.
 */
class ActionObjectForm extends Form {
    constructor(obj, action, inputs, onDone) {
        super(inputs, async () => {
            // move all values from inputs to kwargs of action
            const kwargs = {};
            for (let fieldName of Object.keys(inputs))
                kwargs[fieldName] = inputs[fieldName].value;
            const response = await this.obj.action(action, kwargs);
            onDone && onDone(response);
        }, onDone);
        Object.defineProperty(this, "obj", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: obj
        });
    }
}

/**
 * Form to delete an object.
 */
class DeleteObjectForm extends Form {
    constructor(obj, onDone) {
        super({}, async () => {
            const response = await this.obj.delete();
            onDone && onDone(response);
        }, onDone);
        Object.defineProperty(this, "obj", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: obj
        });
    }
}

export { AND, AND_Filter, ARRAY, ASC, ActionObjectForm, Adapter, ArrayDescriptor, BOOLEAN, BooleanDescriptor, Cache, ComboFilter, ConstantAdapter, DATE, DATETIME, DESC, DISPOSER_AUTOUPDATE, DateDescriptor, DateTimeDescriptor, DeleteObjectForm, EQ, EQV, Filter, Form, GT, GTE, ILIKE, IN, Input, LIKE, LT, LTE, LocalAdapter, Model, ModelDescriptor, ModelFieldDescriptor, NOT_EQ, NUMBER, NumberDescriptor, ORDER_BY, ObjectForm, ObjectInput, OrderByDescriptor, Query, QueryCacheSync, QueryDistinct, QueryPage, QueryRaw, QueryRawPage, QueryStream, ReadOnlyAdapter, Repository, STRING, SingleFilter, StringDescriptor, TypeDescriptor, autoResetId, clearModels, config, constant, field, foreign, id, local, local_store, many, model, models, one, syncLocalStorageHandler, syncURLHandler, timeout, waitIsFalse, waitIsTrue };
//# sourceMappingURL=mobx-model-ui.es2015.js.map
