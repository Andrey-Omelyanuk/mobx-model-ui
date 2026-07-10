import { Model } from '../model'
import { Query } from '../queries/query'
import { QueryStream } from '../queries/query-stream'
import { Filter } from '../filters/Filter'
import { Adapter, RequestConfig } from './adapter'
import { timeout } from '../utils'
import { ASC, ID } from '../types'


/**
 * Local storage. 
 */
export let local_store: Record<string, Record<string, any>> = {}

/**
 * LocalAdapter connects to the local storage.
 * You can use this adapter for mock data or for unit test
 */
export class LocalAdapter<M extends Model> extends Adapter<M> {

    readonly store_name  : string

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
        super()
        this.store_name = store_name
        local_store[this.store_name] = {}
    }

    async create(raw_data: any) : Promise<any> {
        if (this.delay) await timeout(this.delay) 

        // calculate and set new ID
        // skip non-numeric IDs (e.g. UUID/string) so parseInt's NaN can't poison Math.max
        let ids = [0]
        for(let id of Object.keys(local_store[this.store_name])) {
            let parsed = parseInt(id)
            if (!isNaN(parsed)) ids.push(parsed)
        }
        let max = Math.max(...ids)
        // copy before mutating so we don't modify the caller's object
        raw_data = {...raw_data, id: max + 1}
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

    async action (id: ID, name: string, kwargs: Record<string, any>) : Promise<any> {
        console.error('Action method is not implemented for local adapter')
        // ignore error
        // throw(`Not implemented`)
    }

    async get(id: ID, config?: RequestConfig) : Promise<any> {
        if (this.delay) await timeout(this.delay) 
        return local_store[this.store_name][id]
    }

    async modelAction (name: string, kwargs: Record<string, any>, config?: RequestConfig) : Promise<any> {
        console.error('Model action method is not implemented for local adapter')
        // ignore error
        // throw(`Not implemented`)
    }

    async find(query: Query<M>) : Promise<any> {
        if (this.delay) await timeout(this.delay) 
        for(let raw_obj of Object.values(local_store[this.store_name])) {
            if (!query.filter || query.filter.isMatch(raw_obj)) {
                return raw_obj
            }
        }
        return undefined
    }

    async load (query: Query<M>) : Promise<any[]> {
        if (this.delay) await timeout(this.delay) 
        let raw_objs = []

        if (query.filter) {
            for(let raw_obj of Object.values(local_store[this.store_name])) {
                if (query.filter.isMatch(raw_obj)) {
                    raw_objs.push(raw_obj)
                }
            }
        }
        else {
            raw_objs = Object.values(local_store[this.store_name])
        }

        // order_by (sort)
        if (query.orderBy.value) {
            raw_objs = raw_objs.sort((obj_a, obj_b) => {
                for(let sort_by_field of query.orderBy.value) {
                    if (sort_by_field[1] === ASC) {
                        if (obj_a[sort_by_field[0]] < obj_b[sort_by_field[0]]) return -1
                        if (obj_a[sort_by_field[0]] > obj_b[sort_by_field[0]]) return 1
                    }
                    else {
                        if (obj_a[sort_by_field[0]] > obj_b[sort_by_field[0]]) return -1
                        if (obj_a[sort_by_field[0]] < obj_b[sort_by_field[0]]) return 1
                    }
                }
                return 0
            })
        }

        // cursor-based pagination for QueryStream
        if (query instanceof QueryStream) {
            if (query.offset.value !== undefined) {
                const cursor = query.offset.value
                raw_objs = raw_objs.filter(obj => obj.id > cursor)
            }
            raw_objs = raw_objs.slice(0, query.limit.value)
        }
        // offset/limit pagination for other queries
        else if (query.limit.value !== undefined && query.offset.value !== undefined) {
            raw_objs = raw_objs.slice(query.offset.value, query.offset.value+query.limit.value)
        }
        return raw_objs 
    }

    async getTotalCount(filter?: Filter): Promise<number> {
        if (!filter) return Object.values(local_store[this.store_name]).length
        let count = 0
        for (const raw_obj of Object.values(local_store[this.store_name])) {
            if (filter.isMatch(raw_obj)) count++
        }
        return count
    }

    async getDistinct(filter: Filter, field: string): Promise<any[]> {
        const values = new Set<any>()
        for (const raw_obj of Object.values(local_store[this.store_name])) {
            if (!filter || filter.isMatch(raw_obj)) {
                if (raw_obj[field] !== undefined && raw_obj[field] !== null) {
                    values.add(raw_obj[field])
                }
            }
        }
        return Array.from(values)
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
