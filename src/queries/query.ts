import { action, makeObservable, observable, reaction, runInAction } from 'mobx'
import { Repository } from '../repository'
import { Model } from '../model'
import { Filter } from '../filters/Filter'
import { waitIsFalse, waitIsTrue } from '../utils'
import { Variable } from '../inputs'
import { config } from '../config'
import { ARRAY, NUMBER, STRING, ORDER_BY, ID } from '../types'
import { Destroyable } from '../object'


export const DISPOSER_AUTOUPDATE = '__autoupdate'

export interface QueryProps<M extends Model> {
    repository                  ?: Repository<M>
    //
    filter                      ?: Filter
    orderBy                     ?: Variable<[string, boolean][]>
    // pagination
    // offset is a numeric page offset for Query/QueryPage, but a cursor (last seen ID)
    // for QueryStream, so it carries the general ID type (string | number)
    offset                      ?: Variable<ID>
    limit                       ?: Variable<number>
    // fields control
    relations                   ?: Variable<string[]>
    fields                      ?: Variable<string[]> 
    omit                        ?: Variable<string[]> 
    //
    autoupdate                  ?: boolean
}

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

export class Query <M extends Model> implements Destroyable {

    readonly repository: Repository<M>
    readonly filter    : Filter
    readonly orderBy   : Variable<[string, boolean][]>
    readonly offset    : Variable<ID>
    readonly limit     : Variable<number>
    readonly relations : Variable<string[]>
    readonly fields    : Variable<string[]>
    readonly omit      : Variable<string[]>

    @observable protected __items: M[] = []         // items from the server
    @observable total           : number | undefined    // total count of items on the server, useful for pagination
    @observable isLoading       : boolean = false       // query is loading the data
    @observable isNeedToUpdate  : boolean = true        // query was changed and we need to update the data
    @observable timestamp       : number | undefined    // timestamp of the last update, useful to avoid triggering react hooks twice
    @observable error           : string | undefined    // error message

    get items       () { return this.__items }      // the items can be changed after the load (post processing)

    protected controller        : AbortController | undefined
    // Named disposers for mobx reactions/observers, unified on the same
    // `Map<string, () => void>` shape as `Model.disposers`. Per-object
    // reactions (e.g. in QueryCacheSync) use the `obj:<ID>` key convention.
    protected disposers         : Map<string, () => void> = new Map()

    constructor(props: QueryProps<M>) {
        const {
            repository, filter, orderBy, offset, limit,
            relations, fields, omit,
            autoupdate = true 
        } = props

        this.repository = repository!  // required in practice; always set by the Repository factory methods
        this.filter    = filter!       // optional at runtime; guarded everywhere it is read
        this.orderBy   = orderBy    ? orderBy   : new Variable(ARRAY(ORDER_BY()))
        this.offset    = offset     ? offset    : new Variable(NUMBER())
        this.limit     = limit      ? limit     : new Variable(NUMBER())
        this.relations = relations  ? relations : new Variable(ARRAY(STRING()))
        this.fields    = fields     ? fields    : new Variable(ARRAY(STRING()))
        this.omit      = omit       ? omit      : new Variable(ARRAY(STRING()))
        this.autoupdate = autoupdate
        makeObservable(this)

        this.disposers.set('isNeedToUpdate', reaction(
            // watch the dependenciesAreReady and value only
            // because isNeedToUpdate should be set to true
            // if dependenciesAreReady or/and value are triggered and isNeedToUpdate is false
            () => {
                return {dependenciesAreReady: this.dependenciesAreReady, value: this.toString()}
            },
            ({dependenciesAreReady, value: _value}) => {
                if(dependenciesAreReady && !this.isNeedToUpdate)
                    runInAction(() => this.isNeedToUpdate = true)
            },
            { fireImmediately: true }
        ))
    }

    destroy() {
        this.controller?.abort()
        // Snapshot the keys before disposing: a disposer may register a new
        // disposer while running, which would spin a live `while(size)` loop.
        const keys = [...this.disposers.keys()]
        keys.forEach(key => {
            const disposer = this.disposers.get(key)
            if (disposer) disposer()
            this.disposers.delete(key)
        })
    }

    async loading() { return waitIsFalse(this, 'isLoading') }
    async ready()   { return waitIsTrue(this, 'isReady') }

    get autoupdate() : boolean {
        return this.disposers.has(DISPOSER_AUTOUPDATE)
    }

    // Note: autoupdate trigger always the load(),
    // shadowLoad() is not make sense to trigger by autoupdate
    // because autoupdate means => user have changed something on UI inputs
    // and we should to show the UI reaction
    set autoupdate(value: boolean) {
        if (value !== this.autoupdate) {  // idempotent guarantee
            // on 
            if (value) {
                this.disposers.set(DISPOSER_AUTOUPDATE, reaction(
                    () => this.isNeedToUpdate && this.dependenciesAreReady,
                    (updateIt, old) => {
                        if(updateIt && updateIt !== old) {
                            // debounce the reload by AUTO_UPDATE_DELAY so rapid
                            // filter/input changes don't fire a request each
                            setTimeout(() => this.load(), config.AUTO_UPDATE_DELAY)
                        }

                    },
                    { fireImmediately: true }
                ))
            }
            // off
            else {
                const disposer = this.disposers.get(DISPOSER_AUTOUPDATE)
                if (disposer) {
                    disposer()
                    this.disposers.delete(DISPOSER_AUTOUPDATE)
                }
            }
        }
    }

    // Need to quick compare the querie's state
    toString() {
        return `${this.filter === undefined ? '' : this.filter.URLSearchParams.toString()}`
        +`|${this.orderBy.toString()}`
        +`|${this.offset.toString()}|${this.limit.toString()}`
        +`|${this.relations.toString()}|${this.fields.toString()}|${this.omit.toString()}`
    }

    get dependenciesAreReady() {
        return (this.filter === undefined || this.filter.isReady)
            && this.orderBy   .isReady
            && this.offset    .isReady
            && this.limit     .isReady
            && this.relations .isReady
            && this.fields    .isReady
            && this.omit      .isReady
    }

    // NOTE: if we use only shadowLoad() the isLoading will be always false.
    // In this case isReady is equal to !isNeedToUpdate.
    get isReady() {
        return !this.isNeedToUpdate && !this.isLoading
    }

    // use it if everybody should know that the query data is updating
    @action('MO: Query Base - load')
    async load() {
        this.isLoading = true
        try {
            await this.shadowLoad()
        }
        finally {
            runInAction(() => {
                // the loading can be canceled by another load
                // in this case we should not touch isLoading
                if (!this.controller) this.isLoading = false
            })
        }
    }

    // use it directly instead of load() if nobody should know that the query data is updating
    // for example you need to update the current data on the page and you don't want to show a spinner
    @action('MO: Query Base - shadow load')
    async shadowLoad() {

        this.isNeedToUpdate = false 
        this.error = undefined

        if (this.controller)
            this.controller.abort()
        this.controller = new AbortController()

        // NOTE: Date.now() is used to get the current timestamp
        //       and it can be the same in the same tick 
        //       in this case we should increase the timestamp by 1
        const now = Date.now()
        if (this.timestamp === now) this.timestamp += 1
        else                        this.timestamp = now 

        try {
            await this.__load()
        }
        catch (e) {
            const isAbort = (e instanceof DOMException && e.name === 'AbortError')
                         || (e instanceof Error && e.message === 'canceled')

            if (!isAbort) {
                runInAction(() => this.error = e instanceof Error ? e.message : String(e))
            }
        }
        finally {
            this.controller = undefined
        }
    }

    protected async __load() {
        const objs = await this.repository.load(this, { controller: this.controller })
        runInAction(() => this.__items = objs)
    }
}
