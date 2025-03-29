declare const config: {
    DEFAULT_PAGE_SIZE: number;
    AUTO_UPDATE_DELAY: number;
    FORM_NON_FIELD_ERRORS_KEY: string;
    FORM_UNKNOWN_ERROR_MESSAGE: string;
    UPDATE_SEARCH_PARAMS: (search_params: URLSearchParams) => void;
    WATCTH_URL_CHANGES: (callback: any) => () => void;
    DEBOUNCE: (func: Function, debounce: number) => any;
};

interface TypeDescriptorProps {
    null?: boolean;
    required?: boolean;
}
/**
 *  Base class for the type descriptor
 * It is used to define the field of the model
 * It is used to convert the value to the string and back
 */
declare abstract class TypeDescriptor<T> {
    /**
     * Configuration of the descriptor
     */
    config: any;
    /**
     * Convert value to the string
     */
    abstract toString(value: T): string;
    /**
     * Convert string to the value
     */
    abstract fromString(value: string): T;
    /**
     * Check if the value is valid
     * If not, throw an error
     */
    abstract validate(value: T): void;
    abstract default(): T;
}

interface StringDescriptorProps extends TypeDescriptorProps {
    maxLength?: number;
}
declare class StringDescriptor extends TypeDescriptor<string> {
    constructor(props?: StringDescriptorProps);
    toString(value: string): string;
    fromString(value: string): string;
    validate(value: string): void;
    default(): string;
}
declare function STRING(props?: StringDescriptorProps): StringDescriptor;

interface NumberDescriptorProps extends TypeDescriptorProps {
    min?: number;
    max?: number;
}
declare class NumberDescriptor extends TypeDescriptor<number> {
    constructor(props?: NumberDescriptorProps);
    toString(value: number): string;
    fromString(value: string): number;
    validate(value: number): void;
    default(): number;
}
declare function NUMBER(props?: NumberDescriptorProps): NumberDescriptor;

interface BooleanDescriptorProps extends TypeDescriptorProps {
}
declare class BooleanDescriptor extends TypeDescriptor<boolean> {
    constructor(props?: BooleanDescriptorProps);
    toString(value: boolean): string;
    fromString(value: string): boolean;
    validate(value: boolean): void;
    default(): boolean;
}
declare function BOOLEAN(props?: BooleanDescriptorProps): BooleanDescriptor;

interface DateDescriptorProps extends TypeDescriptorProps {
    min?: Date;
    max?: Date;
}
declare class DateDescriptor extends TypeDescriptor<Date> {
    constructor(props?: DateDescriptorProps);
    toString(value: Date): string;
    fromString(value: string): Date;
    validate(value: Date): void;
    default(): Date;
}
declare function DATE(props?: DateDescriptorProps): DateDescriptor;

declare class DateTimeDescriptor extends DateDescriptor {
    toString(value: Date): string;
}
declare function DATETIME(props?: DateDescriptorProps): DateTimeDescriptor;

interface ArrayDescriptorProps extends TypeDescriptorProps {
    minItems?: number;
    maxItems?: number;
}
declare class ArrayDescriptor<T> extends TypeDescriptor<T[]> {
    constructor(type: TypeDescriptor<T>, props?: ArrayDescriptorProps);
    toString(value: T[]): string;
    fromString(value: string): T[];
    validate(value: T[]): void;
    default(): T[];
}
declare function ARRAY<T>(type: TypeDescriptor<T>, props?: ArrayDescriptorProps): ArrayDescriptor<T>;

declare const ASC = true;
declare const DESC = false;
declare class OrderByDescriptor extends TypeDescriptor<[string, boolean]> {
    toString(value: [string, boolean]): string;
    fromString(value: string): [string, boolean];
    validate(value: [string, boolean]): void;
    default(): [string, boolean];
}
declare function ORDER_BY(): OrderByDescriptor;

type ID = string | number;

declare abstract class Filter {
    abstract get URLSearchParams(): URLSearchParams;
    abstract isMatch(obj: any): boolean;
    abstract get isReady(): boolean;
}

interface InputConstructorArgs<T> {
    value?: T;
    required?: boolean;
    disabled?: boolean;
    debounce?: number;
    syncURL?: string;
    syncLocalStorage?: string;
}
declare class Input<T> {
    type: TypeDescriptor<T>;
    value: T;
    isRequired: boolean;
    isDisabled: boolean;
    isDebouncing: boolean;
    isNeedToUpdate: boolean;
    errors: string[];
    readonly debounce: number;
    readonly syncURL?: string;
    readonly syncLocalStorage?: string;
    __disposers: any[];
    constructor(type: TypeDescriptor<T>, args?: InputConstructorArgs<any>);
    destroy(): void;
    private stopDebouncing;
    set(value: T): void;
    get isReady(): boolean;
    setFromString(value: string): void;
    toString(): string;
}

declare class SingleFilter extends Filter {
    readonly field: string;
    input: Input<any>;
    __disposers: (() => void)[];
    readonly getURIField: (field: string) => string;
    readonly operator: (value_a: any, value_b: any) => boolean;
    constructor(field: string, input: Input<any>, getURIField: (field: string) => string, operator: (a: any, b: any) => boolean);
    get isReady(): boolean;
    get URLSearchParams(): URLSearchParams;
    isMatch(obj: any): boolean;
}
declare function EQ(field: string, input: Input<any>): SingleFilter;
declare function EQV(field: string, input: Input<any>): SingleFilter;
declare function NOT_EQ(field: string, input: Input<any>): SingleFilter;
declare function GT(field: string, input: Input<any>): SingleFilter;
declare function GTE(field: string, input: Input<any>): SingleFilter;
declare function LT(field: string, input: Input<any>): SingleFilter;
declare function LTE(field: string, input: Input<any>): SingleFilter;
declare function LIKE(field: string, input: Input<any>): SingleFilter;
declare function ILIKE(field: string, input: Input<any>): SingleFilter;
declare function IN(field: string, input: Input<any>): SingleFilter;

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
    abstract action(id: ID, name: string, kwargs: Object, config?: RequestConfig): Promise<any>;
    abstract get(id: ID, config?: RequestConfig): Promise<any>;
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
    adapter?: Adapter<M>;
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
     * Delete the object.
     */
    delete(obj: M, config?: RequestConfig): Promise<void>;
    /**
     * Run action for the object.
     */
    action(obj: M, name: string, kwargs: Object, config?: RequestConfig): Promise<any>;
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
}

interface ObjectInputConstructorArgs<M extends Model> extends InputConstructorArgs<string> {
    options?: Query<M>;
    autoReset?: (input: ObjectInput<M>) => void;
}
declare class ObjectInput<M extends Model> extends Input<string> {
    readonly options?: Query<M>;
    constructor(args?: ObjectInputConstructorArgs<M>);
    get obj(): M | undefined;
    get isReady(): boolean;
    destroy(): void;
}

declare function autoResetId(input: ObjectInput<any>): void;

declare const syncURLHandler: (paramName: string, input: Input<any>) => void;

declare const syncLocalStorageHandler: (paramName: string, input: Input<any>) => void;

declare const DISPOSER_AUTOUPDATE = "__autoupdate";
interface QueryProps<M extends Model> {
    repository?: Repository<M>;
    filter?: Filter;
    orderBy?: Input<[string, boolean][]>;
    offset?: Input<number>;
    limit?: Input<number>;
    relations?: Input<string[]>;
    fields?: Input<string[]>;
    omit?: Input<string[]>;
    autoupdate?: boolean;
}
declare class Query<M extends Model> {
    readonly repository: Repository<M>;
    readonly filter: Filter;
    readonly orderBy: Input<[string, boolean][]>;
    readonly offset: Input<number>;
    readonly limit: Input<number>;
    readonly relations: Input<string[]>;
    readonly fields: Input<string[]>;
    readonly omit: Input<string[]>;
    protected __items: M[];
    total: number;
    isLoading: boolean;
    isNeedToUpdate: boolean;
    timestamp: number;
    error: string;
    get items(): M[];
    protected controller: AbortController;
    protected disposers: (() => void)[];
    protected disposerObjects: {
        [field: string]: () => void;
    };
    constructor(props: QueryProps<M>);
    destroy(): void;
    loading: () => Promise<Boolean>;
    ready: () => Promise<Boolean>;
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
    __watch_obj(obj: any): void;
}

declare class QueryStream<M extends Model> extends Query<M> {
    goToFirstPage(): void;
    goToNextPage(): void;
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
    cls: new (args: any) => T;
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
    getID(obj: Object): ID;
    updateCachedObject(rawObj: Object): T | undefined;
}

declare abstract class Model {
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
    constructor(init?: {});
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
    init_data: any;
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
    get rawData(): Object;
    /**
     * @returns {Object} - it is rawData + id field
     */
    get rawObj(): Object;
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
    updateFromRaw(rawObj: any): void;
    action(name: string, kwargs: Object): Promise<any>;
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
    get(ID: ID): M | undefined;
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
declare function field<T>(typeDescriptor?: TypeDescriptor<T>, observable?: boolean): (cls: any, fieldName: string) => void;

/**
 * Decorator for foreign fields
 */
declare function foreign<M extends Model>(foreign_model: any, foreign_id?: string): (cls: any, field_name: string) => void;

declare function one<M extends Model>(remote_model: any, remote_foreign_id?: string): (cls: any, field_name: string) => void;

/**
 * Decorator for many fields
 */
declare function many<M extends Model>(remote_model: any, remote_foreign_id?: string): (cls: any, field_name: string) => void;

/**
 * Decorator for id field
 * Only id field can register model in models map,
 * because it invoke before a model decorator.
 */
declare function id<M extends Model>(typeDescriptor?: TypeDescriptor<ID>, observable?: boolean): (cls: any, fieldName: string) => void;

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
declare let local_store: Record<string, Record<string, any>>;
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
    action(id: ID, name: string, kwargs: Object): Promise<any>;
    get(id: ID, config?: RequestConfig): Promise<any>;
    find(query: Query<M>): Promise<any>;
    load(query: Query<M>): Promise<any[]>;
    getTotalCount(filter: Filter): Promise<number>;
    getDistinct(filter: any, filed: any): Promise<any[]>;
    getURLSearchParams(query: Query<M>): URLSearchParams;
}
declare function local(store_name?: string): (cls: any) => void;

declare class ConstantAdapter<M extends Model> extends Adapter<M> {
    readonly constant: any[];
    constructor(constant: any);
    action(): Promise<any>;
    create(): Promise<any>;
    update(): Promise<any>;
    delete(): Promise<void>;
    get(): Promise<any>;
    find(): Promise<any>;
    load(): Promise<any[]>;
    getTotalCount(): Promise<number>;
    getDistinct(): Promise<any[]>;
    getURLSearchParams(): URLSearchParams;
}
declare function constant(constant: any[]): (cls: any) => void;

/**
 * Form class
 */
declare class Form {
    readonly inputs: {
        [key: string]: Input<any>;
    };
    private __submit;
    private __cancel?;
    isLoading: boolean;
    errors: string[];
    constructor(inputs: {
        [key: string]: Input<any>;
    }, __submit: () => Promise<void>, __cancel?: () => void);
    destroy(): void;
    get isReady(): boolean;
    get isError(): boolean;
    submit(): Promise<void>;
    cancel(): void;
}

declare class ObjectForm<M extends Model> extends Form {
    obj: M;
    constructor(obj: M, inputs: {
        [key: string]: Input<any>;
    }, onDone?: (obj?: M) => void);
}

declare function waitIsTrue(obj: any, field: string): Promise<Boolean>;
declare function waitIsFalse(obj: any, field: string): Promise<Boolean>;
declare function timeout(ms: number): Promise<unknown>;

export { AND, AND_Filter, ARRAY, ASC, Adapter, ArrayDescriptor, ArrayDescriptorProps, BOOLEAN, BooleanDescriptor, BooleanDescriptorProps, Cache, ComboFilter, ConstantAdapter, DATE, DATETIME, DESC, DISPOSER_AUTOUPDATE, DateDescriptor, DateDescriptorProps, DateTimeDescriptor, EQ, EQV, Filter, Form, GT, GTE, ID, ILIKE, IN, Input, InputConstructorArgs, LIKE, LT, LTE, LocalAdapter, Model, ModelDescriptor, ModelFieldDescriptor, NOT_EQ, NUMBER, NumberDescriptor, NumberDescriptorProps, ORDER_BY, ObjectForm, ObjectInput, ObjectInputConstructorArgs, OrderByDescriptor, Query, QueryCacheSync, QueryDistinct, QueryPage, QueryProps, QueryRaw, QueryRawPage, QueryStream, ReadOnlyAdapter, Repository, RequestConfig, STRING, SingleFilter, StringDescriptor, StringDescriptorProps, TypeDescriptor, TypeDescriptorProps, autoResetId, clearModels, config, constant, field, foreign, id, local, local_store, many, model, models, one, syncLocalStorageHandler, syncURLHandler, timeout, waitIsFalse, waitIsTrue };
