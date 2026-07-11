import { action, makeObservable, observable, runInAction } from 'mobx'
import { syncCookieHandler, syncLocalStorageHandler, syncURLHandler } from './handlers'
import { config } from '../config'
import { TypeDescriptor } from '../types'
import { Destroyable } from '../object'


export interface VariableConstructorArgs<T> {
    value               ?: T
    disabled            ?: boolean
    debounce            ?: number
    syncURL             ?: string
    syncLocalStorage    ?: string
    syncCookie          ?: string
}

export class Variable<T> implements Destroyable {
    type: TypeDescriptor<T>
    @observable          value               : T
    @observable          isDisabled          : boolean
    @observable          isDebouncing        : boolean          //  
    @observable          isNeedToUpdate      : boolean          //  
    @observable          errors              : string[] = []    // validations or backend errors put here
    readonly debounce           ?: number
    readonly syncURL            ?: string
    readonly syncLocalStorage   ?: string
    readonly syncCookie         ?: string
    __disposers : (() => void)[] = []
    
    // TODO: fix any, it should be InputConstructorArgs<T> but it is not working
    // it's look like a bug in the TypeScript
    constructor (type: TypeDescriptor<T>, args?: VariableConstructorArgs<any>) {
        // init all observables before use it in reaction
        this.type               = type
        this.value              = args && args.value !== undefined ? args.value : type.default()
        this.isDisabled         = !!args?.disabled
        this.isDebouncing       = false 
        this.isNeedToUpdate     = false 
        this.debounce           = args?.debounce
        this.syncURL            = args?.syncURL
        this.syncLocalStorage   = args?.syncLocalStorage
        this.syncCookie         = args?.syncCookie
        makeObservable(this)
        if (this.debounce) {
            this.debouncedValidation = config.DEBOUNCE(
                () => runInAction(() => {
                    // the debounced value has settled: clear the pending-update
                    // flag and validate together, once
                    this.isNeedToUpdate = false
                    this.validate()
                    this.isDebouncing = false
                }),
                this.debounce
            )
        }
        // the order is important, because syncURL has more priority under syncLocalStorage
        // i.e. init from syncURL can overwrite value from syncLocalStorage
        if (this.syncLocalStorage) syncLocalStorageHandler(this.syncLocalStorage, this)
        if (this.syncCookie) syncCookieHandler(this.syncCookie, this)
        if (this.syncURL) syncURLHandler(this.syncURL, this)
    }

    destroy () {
        this.__disposers.forEach(disposer => disposer())
    }

    // runs validation once the debounce window settles (not a "stop" — it
    // fires the pending validation after `debounce` ms of no changes)
    private debouncedValidation!: () => void

    @action
    public set (value: T | undefined) {
        this.value = value as T
        if (this.debounce) {
            this.isDebouncing = true
            this.debouncedValidation()  // clears isNeedToUpdate and validates after debounce
        }
        else {
            // no debounce: the value is settled immediately
            this.isNeedToUpdate = false
            this.validate()
        }
    }

    get isReady () {
        if (this.isDisabled)
            return true
        return !(this.errors.length
            ||  this.isDebouncing
            ||  this.isNeedToUpdate
            ||  this.type.required && (this.value === undefined || this.value === '' || (Array.isArray(this.value) && !this.value.length))
        )
    }

    @action validate () {
        this.errors = []
        try {
            this.type.validate(this.value)
            this.errors = []
        } catch (e) {
            this.errors = [e instanceof Error ? e.message : String(e)]
        }
    }

    setFromString(value: string | null) {
        this.set(this.type.fromString(value) as T)
    }
    // Return type stays `string` so the class remains assignable to the
    // built-in Object type (Object.toString(): string); a `string | undefined`
    // return would break mobx's legacy @observable/@action decorator overloads
    // that accept `target: Object`. The value may still be undefined at runtime.
    toString(): string {
        return this.type.toString(this.value) as string
    }
}
