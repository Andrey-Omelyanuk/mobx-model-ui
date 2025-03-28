import { Model } from '../model'
import { Query } from '../queries/query'
import { Filter } from '../filters/Filter'
import { Adapter, RequestConfig } from './adapter'
import { timeout } from '../utils'
import { ID } from '../types'


/**
 * Local storage. 
 */
export let local_store: Record<string, Record<string, any>> = {}

/**
 * LocalAdapter connects to the local storage.
 * You can use this adapter for mock data or for unit test
 */
export class LocalAdapter<M extends Model> implements Adapter<M> {

    readonly    store_name  : string
                delay       : number  // delays for simulate real usage, use it only for tests

    clear() {
        local_store[this.store_name] = {}
    }

    init_local_data(data: any[]) {
        let objs = {} 
        for(let obj of data) {
            objs[obj.id] = obj
        }
        local_store[this.store_name] = objs
    }

    constructor(store_name: string) {
        this.store_name = store_name
        local_store[this.store_name] = {}
    }

    async create(raw_data: any) : Promise<any> {
        if (this.delay) await timeout(this.delay) 

        // calculate and set new ID
        let ids = [0]
        for(let id of Object.keys(local_store[this.store_name])) {
            ids.push(parseInt(id))
        }
        let max = Math.max.apply(null, ids)
        raw_data.id = max + 1
        local_store[this.store_name][raw_data.id] = raw_data
        return raw_data
    }

    async update (id: ID, only_changed_raw_data: any): Promise<any> {
        if (this.delay) await timeout(this.delay) 
        let raw_obj = local_store[this.store_name][id] 
        for(let field of Object.keys(only_changed_raw_data)) {
            raw_obj[field] = only_changed_raw_data[field]
        }
        return raw_obj 
    }

    async delete (id: ID): Promise<void> {
        if (this.delay) await timeout(this.delay) 
        delete local_store[this.store_name][id]
    }

    async action (id: ID, name: string, kwargs: Object) : Promise<any> {
        throw(`Not implemented`)
    }

    async get(id: ID, config?: RequestConfig) : Promise<any> {
        if (this.delay) await timeout(this.delay) 
        return local_store[this.store_name][id]
    }

    async find(query: Query<M>) : Promise<any> {
        if (this.delay) await timeout(this.delay) 
        let raw_obj = Object.values(local_store[this.store_name])[0]
        return raw_obj
    }

    async load (query: Query<M>) : Promise<any[]> {
        if (this.delay) await timeout(this.delay) 
        let raw_objs = []

        if (query.filter) {
            for(let raw_obj of Object.values(local_store[this.store_name])) {
            }
        }
        else {
            raw_objs = Object.values(local_store[this.store_name])
        }

        // order_by (sort)
        if (query.orderBy.value) {
            raw_objs = raw_objs.sort((obj_a, obj_b) => {
                let res
                for(let sort_by_field of query.orderBy.value) {
                }
                return 0
            })
        }

        // page
        if (query.limit.value !== undefined && query.offset.value !== undefined) {
            raw_objs = raw_objs.slice(query.offset.value, query.offset.value+query.limit.value)
        }
        return raw_objs 
    }

    async getTotalCount(filter: Filter): Promise<number> {
        return Object.values(local_store[this.store_name]).length
    }

    async getDistinct(filter, filed): Promise<any[]> {
        return []
    }

    getURLSearchParams(query: Query<M>): URLSearchParams {
        return new URLSearchParams()
    }
}


// model decorator
export function local(store_name?: string) {
    return (cls: any) => {
        cls.defaultRepository.adapter = new LocalAdapter(store_name ? store_name : cls.modelName)
    }
}
