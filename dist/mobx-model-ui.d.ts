declare const config: {
    DEFAULT_PAGE_SIZE: number;
    AUTO_UPDATE_DELAY: number;
    FORM_NON_FIELD_ERRORS_KEY: string;
    FORM_UNKNOWN_ERROR_MESSAGE: string;
    UPDATE_SEARCH_PARAMS: (search_params: URLSearchParams) => void;
    WATCH_URL_CHANGES: (callback: any) => () => void;
    DEBOUNCE: (func: (...args: any[]) => any, debounce: number) => (this: any, ...args: any[]) => void;
    COOKIE_DOMAIN: string;
};

/**
 * Interface for objects that can be destroyed.
 */
interface Destroyable {
    destroy(): void;
}

interface TypeDescriptorProps {
    required?: boolean;
    null?: boolean;
}
declare abstract class TypeDescriptor<T> {
    required: boolean;
    null: boolean;
    constructor(props?: TypeDescriptorProps);
    /**
     * Convert value to the string
     */
    abstract toString(value: T): string | undefined;
    /**
     * Convert string to the value
     */
    abstract fromString(value: string | null | undefined): T | null | undefined;
    /**
     * Check if the value is valid
     * If not, throw an error
     */
    validate(value: T): void;
    abstract default(): T | undefined;
}

interface StringDescriptorProps extends TypeDescriptorProps {
    minLength?: number;
    maxLength?: number;
}
declare class StringDescriptor extends TypeDescriptor<string> {
    minLength: number;
    maxLength: number | null;
    constructor(props?: StringDescriptorProps);
    toString(value: string): string | undefined;
    fromString(value: string): string | null | undefined;
    validate(value: string): void;
    default(): string;
}
declare function STRING(props?: StringDescriptorProps): StringDescriptor;

interface NumberDescriptorProps extends TypeDescriptorProps {
    min?: number;
    max?: number;
}
/**
 * NumberDescriptor - numeric data type
 * fromString uses parseInt, so fractional numbers are truncated to integers (3.14 => 3)
 */
declare class NumberDescriptor extends TypeDescriptor<number> {
    min: number;
    max: number;
    constructor(props?: NumberDescriptorProps);
    toString(value: number): string | undefined;
    fromString(value: string): number | null | undefined;
    validate(value: number): void;
    default(): number | undefined;
}
declare function NUMBER(props?: NumberDescriptorProps): NumberDescriptor;

interface BooleanDescriptorProps extends TypeDescriptorProps {
}
declare class BooleanDescriptor extends TypeDescriptor<boolean> {
    constructor(props?: BooleanDescriptorProps);
    toString(value: boolean): string | undefined;
    fromString(value: string): boolean | null | undefined;
    default(): boolean;
}
declare function BOOLEAN(props?: BooleanDescriptorProps): BooleanDescriptor;

interface DateDescriptorProps extends TypeDescriptorProps {
    min?: Date;
    max?: Date;
    defaultDate?: Date;
}
declare class DateDescriptor extends TypeDescriptor<Date> {
    min: Date;
    max: Date;
    defaultDate?: Date;
    constructor(props?: DateDescriptorProps);
    toString(value: Date): string | undefined;
    fromString(value: string): Date | null | undefined;
    validate(value: Date): void;
    default(): Date;
}
declare function DATE(props?: DateDescriptorProps): DateDescriptor;

declare class DateTimeDescriptor extends DateDescriptor {
    toString(value: Date): string | undefined;
}
declare function DATETIME(props?: DateDescriptorProps): DateTimeDescriptor;

interface ArrayDescriptorProps extends TypeDescriptorProps {
    minItems?: number;
    maxItems?: number;
}
declare class ArrayDescriptor<T> extends TypeDescriptor<T[]> {
    type: TypeDescriptor<T>;
    minItems: number;
    maxItems: number;
    constructor(type: TypeDescriptor<T>, props?: ArrayDescriptorProps);
    toString(value: T[]): string | undefined;
    fromString(value: string): T[];
    validate(value: T[]): void;
    default(): T[];
}
declare function ARRAY<T>(type: TypeDescriptor<T>, props?: ArrayDescriptorProps): ArrayDescriptor<T>;

declare const ASC = true;
declare const DESC = false;
declare class OrderByDescriptor extends TypeDescriptor<[string, boolean]> {
    toString(value: [string, boolean]): string | undefined;
    fromString(value: string): [string, boolean] | null | undefined;
    validate(value: [string, boolean]): void;
    default(): [string, boolean];
}
declare function ORDER_BY(): OrderByDescriptor;

interface UUIDDescriptorProps extends TypeDescriptorProps {
}
declare class UUIDDescriptor extends TypeDescriptor<string> {
    constructor(props?: UUIDDescriptorProps);
    toString(value: string): string | undefined;
    fromString(value: string): string | null | undefined;
    validate(value: string): void;
    default(): string;
}
declare function UUID(props?: UUIDDescriptorProps): UUIDDescriptor;

interface EnumOption<T> {
    label: string;
    value: T;
}
interface EnumDescriptorProps<T> extends TypeDescriptorProps {
    options: T[] | Record<string, T>;
}
declare class EnumDescriptor<T extends string | number> extends TypeDescriptor<T> {
    private _rawOptions;
    private _values;
    private _labels;
    constructor(props: EnumDescriptorProps<T>);
    toString(value: T): string | undefined;
    fromString(value: string): T | null | undefined;
    validate(value: T): void;
    default(): T | undefined;
    getOptions(): EnumOption<T>[];
    get values(): T[];
}
declare function ENUM<T extends string | number>(props: EnumDescriptorProps<T>): EnumDescriptor<T>;

type ID = string | number;

declare abstract class Filter {
    abstract get URLSearchParams(): URLSearchParams;
    abstract isMatch(obj: any): boolean;
    abstract get isReady(): boolean;
}

interface VariableConstructorArgs<T> {
    value?: T;
    disabled?: boolean;
    debounce?: number;
    syncURL?: string;
    syncLocalStorage?: string;
    syncCookie?: string;
}
declare class Variable<T> implements Destroyable {
    type: TypeDescriptor<T>;
    value: T;
    initialValue: T;
    isDisabled: boolean;
    isDebouncing: boolean;
    isNeedToUpdate: boolean;
    errors: string[];
    readonly debounce?: number;
    readonly syncURL?: string;
    readonly syncLocalStorage?: string;
    readonly syncCookie?: string;
    __disposers: (() => void)[];
    constructor(type: TypeDescriptor<T>, args?: VariableConstructorArgs<any>);
    get isDirty(): boolean;
    markClean(): void;
    reset(): void;
    destroy(): void;
    private debouncedValidation;
    set(value: T | undefined): void;
    get isReady(): boolean;
    validate(): void;
    setFromString(value: string | null): void;
    toString(): string;
}

declare class SingleFilter extends Filter {
    readonly field: string;
    input: Variable<any>;
    __disposers: (() => void)[];
    readonly getURIField: (field: string) => string;
    readonly operator: (value_a: any, value_b: any) => boolean;
    constructor(field: string, input: Variable<any>, getURIField: (field: string) => string, operator: (a: any, b: any) => boolean);
    get isReady(): boolean;
    get URLSearchParams(): URLSearchParams;
    isMatch(obj: any): boolean;
}
declare function EQ(field: string, input: Variable<any>): SingleFilter;
declare function EQV(field: string, input: Variable<any>): SingleFilter;
declare function NOT_EQ(field: string, input: Variable<any>): SingleFilter;
declare function GT(field: string, input: Variable<any>): SingleFilter;
declare function GTE(field: string, input: Variable<any>): SingleFilter;
declare function LT(field: string, input: Variable<any>): SingleFilter;
declare function LTE(field: string, input: Variable<any>): SingleFilter;
declare function LIKE(field: string, input: Variable<any>): SingleFilter;
declare function ILIKE(field: string, input: Variable<any>): SingleFilter;
declare function IN(field: string, input: Variable<any>): SingleFilter;

declare abstract class ComboFilter extends Filter {
    readonly filters: Filter[];
    constructor(filters: Filter[]);
    abstract isMatch(obj: any): boolean;
    get isReady(): boolean;
    get URLSearchParams(): URLSearchParams;
}
declare class AND_Filter extends ComboFilter {
    isMatch(obj: any): boolean;
}
declare function AND(...filters: Filter[]): Filter;

type RequestConfig = {
    controller?: AbortController;
    onUploadProgress?: (progressEvent: ProgressEvent) => void;
};
/**
 * Adapter is a class that provides a way to interact with the server or other data source.
 */
declare abstract class Adapter<M extends Model> {
    abstract create(raw_data: any, config?: RequestConfig): Promise<any>;
    abstract update(id: ID, only_changed_raw_data: any, config?: RequestConfig): Promise<any>;
    abstract delete(id: ID, config?: RequestConfig): Promise<void>;
    abstract action(id: ID, name: string, kwargs: Record<string, any>, config?: RequestConfig): Promise<any>;
    abstract get(id: ID, config?: RequestConfig): Promise<any>;
    abstract modelAction(name: string, kwargs: Record<string, any>, config?: RequestConfig): Promise<any>;
    abstract find(query: Query<M>, config?: RequestConfig): Promise<any>;
    abstract load(query: Query<M>, config?: RequestConfig): Promise<any[]>;
    abstract getTotalCount(filter: Filter, config?: RequestConfig): Promise<number>;
    abstract getDistinct(filter: Filter, field: string, config?: RequestConfig): Promise<any[]>;
    abstract getURLSearchParams(query: Query<M>): URLSearchParams;
    delay: number;
}

/**
 * Repository class is responsible for CRUD operations on the model.
 */
declare class Repository<M extends Model> {
    readonly modelDescriptor: ModelDescriptor<M>;
    adapter: Adapter<M>;
    constructor(modelDescriptor: ModelDescriptor<M>, adapter?: Adapter<M>);
    /**
     * Create the object.
     */
    create(obj: M, config?: RequestConfig): Promise<M>;
    /**
     * Update the object.
     */
    update(obj: M, config?: RequestConfig): Promise<M>;
    /**
     * Save the object.
     * If the object has ID, it will be updated, otherwise it will be created.
     */
    save(obj: M, config?: RequestConfig): Promise<M>;
    /**
     * Delete the object.
     */
    delete(obj: M, config?: RequestConfig): Promise<void>;
    /**
     * Run action for the object.
     */
    action(obj: M, name: string, kwargs: Record<string, any>, config?: RequestConfig): Promise<any>;
    /**
     * Run action for the model.
     */
    modelAction(name: string, kwargs: Record<string, any>, config?: RequestConfig): Promise<any>;
    /**
     * Returns ONE object by id.
     */
    get(id: ID, config?: RequestConfig): Promise<M>;
    /**
     * Returns ONE object by query.
     */
    find(query: Query<M>, config?: RequestConfig): Promise<M>;
    /**
     * Returns MANY objects by query.
     */
    load(query: Query<M>, config?: RequestConfig): Promise<M[]>;
    /**
     * Returns total count of objects.
     */
    getTotalCount(filter: Filter, config?: RequestConfig): Promise<number>;
    /**
     * Returns distinct values for the field.
     */
    getDistinct(filter: Filter, field: string, config?: RequestConfig): Promise<any[]>;
    getQuery(props: QueryProps<M>): Query<M>;
    getQueryPage(props: QueryProps<M>): QueryPage<M>;
    getQueryRaw(props: QueryProps<M>): QueryRaw<M>;
    getQueryRawPage(props: QueryProps<M>): QueryRawPage<M>;
    getQueryCacheSync(props: QueryProps<M>): QueryCacheSync<M>;
    getQueryStream(props: QueryProps<M>): QueryStream<M>;
    getQueryDistinct(field: string, props: QueryProps<M>): QueryDistinct;
}

interface ObjectInputConstructorArgs<M extends Model> extends VariableConstructorArgs<ID> {
    options: Query<M>;
    autoReset?: (input: ObjectInput<M>) => void;
}
declare class ObjectInput<M extends Model> extends Variable<ID> {
    readonly options: Query<M>;
    constructor(type: TypeDescriptor<ID>, args?: ObjectInputConstructorArgs<M>);
    get obj(): M | undefined;
    get isReady(): boolean;
    destroy(): void;
}

declare function autoResetId(input: ObjectInput<any>): void;

declare const syncURLHandler: (paramName: string, input: Variable<any>) => void;

declare const syncLocalStorageHandler: (paramName: string, input: Variable<any>) => void;

declare const syncCookieHandler: (paramName: string, input: Variable<any>) => void;

declare const DISPOSER_AUTOUPDATE = "__autoupdate";
interface QueryProps<M extends Model> {
    repository?: Repository<M>;
    filter?: Filter;
    orderBy?: Variable<[string, boolean][]>;
    offset?: Variable<ID>;
    limit?: Variable<number>;
    relations?: Variable<string[]>;
    fields?: Variable<string[]>;
    omit?: Variable<string[]>;
    autoupdate?: boolean;
}
declare class Query<M extends Model> implements Destroyable {
    readonly repository: Repository<M>;
    readonly filter: Filter;
    readonly orderBy: Variable<[string, boolean][]>;
    readonly offset: Variable<ID>;
    readonly limit: Variable<number>;
    readonly relations: Variable<string[]>;
    readonly fields: Variable<string[]>;
    readonly omit: Variable<string[]>;
    protected __items: M[];
    total: number | undefined;
    isLoading: boolean;
    isNeedToUpdate: boolean;
    timestamp: number | undefined;
    lastUpdatedAt: number | undefined;
    error: string | undefined;
    get items(): M[];
    protected controller: AbortController | undefined;
    protected disposers: Map<string, () => void>;
    constructor(props: QueryProps<M>);
    destroy(): void;
    loading(): Promise<boolean>;
    ready(): Promise<boolean>;
    get autoupdate(): boolean;
    set autoupdate(value: boolean);
    toString(): string;
    get dependenciesAreReady(): boolean;
    get isReady(): boolean;
    load(): Promise<void>;
    shadowLoad(): Promise<void>;
    protected __load(): Promise<void>;
}

declare class QueryPage<M extends Model> extends Query<M> {
    setPage(n: number): void;
    setPageSize(size: number): void;
    goToFirstPage(): void;
    goToPrevPage(): void;
    goToNextPage(): void;
    goToLastPage(): void;
    get is_first_page(): boolean;
    get is_last_page(): boolean;
    get current_page(): number;
    get total_pages(): number;
    get isFirstPage(): boolean;
    get isLastPage(): boolean;
    get currentPage(): number;
    get totalPages(): number;
    constructor(props: QueryProps<M>);
    __load(): Promise<void>;
}

declare class QueryCacheSync<M extends Model> extends Query<M> {
    constructor(props: QueryProps<M>);
    __load(): Promise<void>;
    get items(): M[];
    __watch_obj(obj: M): void;
}

declare class QueryStream<M extends Model> extends Query<M> {
    restart(): void;
    loadMore(): void;
    isEndReached: boolean;
    constructor(props: QueryProps<M>);
    __load(): Promise<void>;
}

/**
 * QueryRaw is a class to load raw objects from the server
 * without converting them to models using the repository.
 */
declare class QueryRaw<M extends Model> extends Query<M> {
    __load(): Promise<void>;
}

/**
 * QueryRawPage is a class to load raw objects from the server
 * without converting them to models using the repository.
 */
declare class QueryRawPage<M extends Model> extends QueryPage<M> {
    __load(): Promise<void>;
}

declare class QueryDistinct extends Query<any> {
    readonly field: string;
    constructor(field: string, props: QueryProps<any>);
    __load(): Promise<void>;
}

/**
 * ModelFieldDescriptor is a class that contains all the information about the field.
 */
declare class ModelFieldDescriptor<T, F> {
    decorator: (obj: T) => void;
    disposers: (() => void)[];
    type?: TypeDescriptor<F>;
    settings?: any;
}
/**
 * ModelDescriptor is a class that contains all the information about the model.
 */
declare class ModelDescriptor<T extends Model> {
    /**
     * Model class
     */
    cls: new (args?: any) => T;
    /**
     * Id fields
     */
    id: string;
    idFieldDescriptors: ModelFieldDescriptor<T, ID>;
    /**
     * Fields is a map of all fields in the model that usually use in repository.
     */
    fields: {
        [field_name: string]: ModelFieldDescriptor<T, any>;
    };
    /**
     * Relations is a map of all relations (foreign, one, many) in the model.
     * It is derivative and does not come from outside.
     */
    relations: {
        [field_name: string]: ModelFieldDescriptor<T, any>;
    };
    readonly cache: Cache<T>;
    /**
     * Return id value from object. Object can have id field with different name.
     */
    getID(obj: Record<string, any>): ID;
    updateCachedObject(rawObj: Record<string, any>): T;
}

declare abstract class Model implements Destroyable {
    /**
     * Fields are declared dynamically by the `@field`/`@id`/relation decorators,
     * so the base class accesses them by string key (`this[fieldName]`).
     * Explicitly declared members and subclass fields keep their real types;
     * this index signature only covers genuinely dynamic access.
     */
    [key: string]: any;
    /**
     * Static version initializes in the id decorator.
     * Instance version initializes in the constructor that declare in model decorator.
     * It is used for registering the model in the models map.
     * It is used for get the model descriptor from the models map.
     */
    static modelName: string;
    readonly modelName: string;
    /**
     * Default repository that used in methods like `load`, `getTotalCount`, etc.
     */
    static defaultRepository: Repository<Model>;
    getDefaultRepository<T extends Model>(): Repository<T>;
    /**
     * @returns {ModelDescriptor} - model description
     */
    static getModelDescriptor<T extends Model>(): ModelDescriptor<T>;
    /**
     * @param init - initial data of the object
     */
    constructor(_init?: Record<string, any>);
    /**
     * @returns {ModelDescriptor} - model descriptor
     */
    get modelDescriptor(): ModelDescriptor<Model>;
    /**
     * ID returns id value from the object.
     * Id field can be different from the id field name.
     */
    get ID(): ID;
    /**
     * Save the initial data of the object that was loaded from the server.
     */
    init_data: Record<string, any>;
    /**
     * disposers for mobx reactions and interceptors, you can add your own disposers
     */
    disposers: Map<any, any>;
    /**
     * Destructor of the object.
     * It eject from cache and removes all disposers.
     */
    destroy(): void;
    get model(): any;
    /**
     * @returns {Object} - data only from fields (no id)
     */
    get rawData(): Record<string, any>;
    /**
     * @returns {Object} - it is rawData + id field
     */
    get rawObj(): Record<string, any>;
    get only_changed_raw_data(): any;
    get is_changed(): boolean;
    refreshInitData(): void;
    cancelLocalChanges(): void;
    /**
     * Update the object from the raw data.
     * @description
     * It is used when raw data comes from any source (server, websocket, etc.) and you want to update the object.
     * TODO: ID is not ready! I'll finish it later.
     */
    updateFromRaw(rawObj: Record<string, any>): void;
    action(name: string, kwargs: Record<string, any>): Promise<any>;
    create<T extends Model>(): Promise<T>;
    update<T extends Model>(): Promise<T>;
    save<T extends Model>(): Promise<T>;
    delete(): Promise<void>;
    refresh(): Promise<Model>;
    static getQuery<T extends Model>(props: QueryProps<T>): Query<T>;
    static getQueryPage<T extends Model>(props: QueryProps<T>): QueryPage<T>;
    static getQueryRaw<T extends Model>(props: QueryProps<T>): QueryRaw<T>;
    static getQueryRawPage<T extends Model>(props: QueryProps<T>): QueryRawPage<T>;
    static getQueryCacheSync<T extends Model>(props: QueryProps<T>): QueryCacheSync<T>;
    static getQueryStream<T extends Model>(props: QueryProps<T>): QueryStream<T>;
    static getQueryDistinct<T extends Model>(field: string, props: QueryProps<T>): QueryDistinct;
    static get<T extends Model>(id: ID): T;
    static findById<T extends Model>(id: ID): Promise<T>;
    static find<T extends Model>(query: Query<T>): Promise<T>;
}

/**
 * Model decorator.
 * Note: Class decorator has constructor of class as argument.
 */
declare function model(constructor: any): any;

/**
 * Is a map of all registered models in the application.
 * It's a singleton.
 */
declare const models: Map<string, ModelDescriptor<any>>;

declare function clearModels(): void;

/**
 * Cache for model objects.
 */
declare class Cache<M extends Model> {
    readonly store: Map<ID, M>;
    constructor();
    /**
     * Get object by ID
     */
    get(id: ID): M | undefined;
    /**
     * Inject object to the cache
     */
    inject(obj: M): void;
    /**
     * Eject object from the cache
     */
    eject(obj: M): void;
    /**
     * Clear the cache
     */
    clear(): void;
}

/**
 * Decorator for fields
 */
declare function field<T>(typeDescriptor?: TypeDescriptor<T>, observable?: boolean): <M extends Model>(cls: M | (new (...args: any[]) => M), fieldName: string) => void;

/**
 * Decorator for foreign fields
 */
declare function foreign<_M extends Model>(foreign_model: any, foreign_id?: string): <M extends Model>(cls: M | ((new (...args: any[]) => M) & {
    modelName?: string;
}), field_name: string) => void;

declare function one<_M extends Model>(remote_model: any, remote_foreign_id?: string): <M extends Model>(cls: M | ((new (...args: any[]) => M) & {
    modelName?: string;
}), field_name: string) => void;

/**
 * Decorator for many fields
 */
declare function many<_M extends Model>(remote_model: any, remote_foreign_id?: string): <M extends Model>(cls: M | ((new (...args: any[]) => M) & {
    modelName?: string;
}), field_name: string) => void;

/**
 * Decorator for id field
 * Only id field can register model in models map,
 * because it invoke before a model decorator.
 */
declare function id<_M extends Model>(typeDescriptor?: TypeDescriptor<ID>, observable?: boolean): <M extends Model>(cls: M | ((new (...args: any[]) => M) & {
    modelName?: string;
}), fieldName: string) => void;

/**
 * ReadOnlyAdapter not allow to create, update or delete objects.
 */
declare abstract class ReadOnlyAdapter<M extends Model> extends Adapter<M> {
    create(): Promise<void>;
    update(): Promise<void>;
    delete(): Promise<void>;
}

/**
 * Local storage.
 */
declare const local_store: Record<string, Record<string, any>>;
/**
 * Configuration for the @local decorator.
 */
type LocalAdapterConfig = {
    storeName?: string;
    delay?: number;
};
/**
 * LocalAdapter connects to the local storage.
 * You can use this adapter for mock data or for unit test
 */
declare class LocalAdapter<M extends Model> extends Adapter<M> {
    readonly store_name: string;
    clear(): void;
    init_local_data(data: any[]): void;
    constructor(store_name: string);
    create(raw_data: any): Promise<any>;
    update(id: ID, only_changed_raw_data: any): Promise<any>;
    delete(id: ID): Promise<void>;
    action(_id: ID, _name: string, _kwargs: Record<string, any>): Promise<any>;
    get(id: ID, _config?: RequestConfig): Promise<any>;
    modelAction(_name: string, _kwargs: Record<string, any>, _config?: RequestConfig): Promise<any>;
    find(query: Query<M>): Promise<any>;
    load(query: Query<M>): Promise<any[]>;
    getTotalCount(filter?: Filter): Promise<number>;
    getDistinct(filter: Filter, field: string): Promise<any[]>;
    getURLSearchParams(_query: Query<M>): URLSearchParams;
}
declare function local(config?: string | LocalAdapterConfig): (cls: any) => void;

declare class ConstantAdapter<M extends Model> extends Adapter<M> {
    readonly constant: any[];
    constructor(constant: any[]);
    action(): Promise<any>;
    create(): Promise<any>;
    update(): Promise<any>;
    delete(): Promise<void>;
    get(): Promise<any>;
    modelAction(_name: string, _kwargs: Record<string, any>, _config?: RequestConfig): Promise<any>;
    find(): Promise<any>;
    load(): Promise<any[]>;
    getTotalCount(): Promise<number>;
    getDistinct(): Promise<any[]>;
    getURLSearchParams(): URLSearchParams;
}
declare function constant(constant: any[]): (cls: any) => void;

/**
 * A map of field names to their validation error messages.
 * Key is an input name (or FORM_NON_FIELD_ERRORS_KEY for form-level errors).
 * Value is an array of error messages for that field.
 */
type ValidationErrors = Record<string, string[]> | null | undefined;
/**
 * A validator function that checks cross-field constraints.
 * Receives the form's inputs map and returns either:
 * - null/undefined: the field(s) are valid
 * - Record<string, string[]>: field-level errors keyed by input name.
 *   Use `FORM_NON_FIELD_ERRORS_KEY` for form-level errors.
 */
type Validator = (inputs: Record<string, Variable<any>>) => ValidationErrors;
/**
 * Base abstract class for all forms.
 *
 * Form is an object that contains inputs and methods to work with them.
 * Also it controls loading state, cross-field validation, and errors.
 *
 */
declare abstract class Form implements Destroyable {
    isLoading: boolean;
    errors: string[];
    readonly inputs: {
        [key: string]: Variable<any>;
    };
    readonly onSuccess?: (this: Form, response?: any) => void;
    readonly onCancel?: (this: Form) => void;
    /**
     * Array of cross-field validators.
     * Subclasses can push validators in their constructor or override `validate()`.
     */
    validators: Validator[];
    constructor(inputs: {
        [key: string]: Variable<any>;
    }, onSuccess?: (this: Form, response?: any) => void, onCancel?: (this: Form) => void);
    destroy(): void;
    get isReady(): boolean;
    get isError(): boolean;
    get isDirty(): boolean;
    markClean(): void;
    reset(): void;
    /**
     * Run all cross-field validators and return aggregated errors.
     * Returns null when valid, or a map of field→messages when invalid.
     * Can be overridden by subclasses for custom validation logic.
     */
    validate(): ValidationErrors;
    /**
     * Clear all errors on the form and all its inputs.
     */
    clearErrors(): void;
    abstract apply(): Promise<any>;
    errorHandler(err: any): void;
    submit(): Promise<void>;
    cancel(): void;
    /**
     * Convert inputs to simple key-value object.
     */
    getKeyValueInputs(): any;
}

/**
 * Form to run an action in the repository.
 * If repository is defined then model is ignored.
 * Use it for forms with complex data that saved in multiple models.
 */
declare class ActionForm<M extends Model> extends Form {
    protected action: string;
    protected readonly repository: Repository<M>;
    constructor(repository: Repository<M>, action: string, inputs: {
        [key: string]: Variable<any>;
    }, onSuccess?: (response?: any) => void, onCancel?: () => void);
    apply(): Promise<any>;
}

/**
 * Abstract class for forms that are used to work with an object.
 */
declare abstract class ObjectForm<M extends Model> extends Form {
    obj: M;
    protected repository?: Repository<M>;
    constructor(obj: M, inputs: {
        [key: string]: Variable<any>;
    }, onSuccess?: (response?: any) => void, onCancel?: () => void, repository?: Repository<M>);
}

/**
 * Form to save (create/update) an object.
 */
declare class SaveObjectForm<M extends Model> extends ObjectForm<M> {
    apply(): Promise<M>;
}

/**
 * Form to make an action of object.
 */
declare class ActionObjectForm<M extends Model> extends ObjectForm<M> {
    protected action: string;
    constructor(action: string, obj: M, inputs: {
        [key: string]: Variable<any>;
    }, onSuccess?: (response?: any) => void, onCancel?: () => void, repository?: Repository<M>);
    apply(): Promise<any>;
}

/**
 * Form to delete an object.
 */
declare class DeleteObjectForm<M extends Model> extends ObjectForm<M> {
    apply(): Promise<void>;
}

declare function waitIsTrue(obj: any, field: string): Promise<boolean>;
declare function waitIsFalse(obj: any, field: string): Promise<boolean>;
declare function timeout(ms: number): Promise<unknown>;

export { AND, AND_Filter, ARRAY, ASC, ActionForm, ActionObjectForm, Adapter, ArrayDescriptor, BOOLEAN, BooleanDescriptor, Cache, ComboFilter, ConstantAdapter, DATE, DATETIME, DESC, DISPOSER_AUTOUPDATE, DateDescriptor, DateTimeDescriptor, DeleteObjectForm, ENUM, EQ, EQV, EnumDescriptor, Filter, Form, GT, GTE, ILIKE, IN, LIKE, LT, LTE, LocalAdapter, Model, ModelDescriptor, ModelFieldDescriptor, NOT_EQ, NUMBER, NumberDescriptor, ORDER_BY, ObjectForm, ObjectInput, OrderByDescriptor, Query, QueryCacheSync, QueryDistinct, QueryPage, QueryRaw, QueryRawPage, QueryStream, ReadOnlyAdapter, Repository, STRING, SaveObjectForm, SingleFilter, StringDescriptor, TypeDescriptor, UUID, UUIDDescriptor, Variable, autoResetId, clearModels, config, constant, field, foreign, id, local, local_store, many, model, models, one, syncCookieHandler, syncLocalStorageHandler, syncURLHandler, timeout, waitIsFalse, waitIsTrue };
export type { ArrayDescriptorProps, BooleanDescriptorProps, DateDescriptorProps, Destroyable, EnumDescriptorProps, EnumOption, ID, LocalAdapterConfig, NumberDescriptorProps, ObjectInputConstructorArgs, QueryProps, RequestConfig, StringDescriptorProps, TypeDescriptorProps, UUIDDescriptorProps, ValidationErrors, Validator, VariableConstructorArgs };
