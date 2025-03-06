import { runInAction } from 'mobx'
import { Model } from './model'
import { ID } from './types'
import { Cache } from './cache'
import { Query } from './queries/query'
import { Filter } from './filters'
import { Adapter, RequestConfig } from './adapters/adapter'


export class  Repository<M extends Model> {
    readonly model      : any 
    readonly cache     ?: Cache<M>
    readonly adapter    : Adapter<M> 

    constructor(model: any, adapter: any, cache?: any) {
        this.model      = model 
        this.adapter    = adapter 
        this.cache      = cache ? cache : new Cache<M>(model)
    }

    async action(obj: M, name: string, kwargs: Object, config?: RequestConfig) : Promise<any> {
        return await this.adapter.action(obj.id, name, kwargs, config)
    }

    async create(obj: M, config?: RequestConfig) : Promise<M> {
        let raw_obj = await this.adapter.create(obj.raw_data, config)
        obj.updateFromRaw(raw_obj)  // update id and other fields
        obj.refreshInitData()       // backend can return default values and they should be in __init_data
        return obj
    }

    async update(obj: M, config?: RequestConfig) : Promise<M> {
        let raw_obj = await this.adapter.update(obj.id, obj.only_changed_raw_data, config)
        obj.updateFromRaw(raw_obj)
        obj.refreshInitData()
        return obj
    }

    async delete(obj: M, config?: RequestConfig) : Promise<M> {
        await this.adapter.delete(obj.id, config)
        obj.destroy()
        this.cache.eject(obj)
        return obj
    }

    async get(obj_id: ID, config?: RequestConfig): Promise<M> {
        let raw_obj = await this.adapter.get(obj_id, config)
        if (this.cache) {
            const obj = this.cache.update(raw_obj)
            obj.refreshInitData()
            return obj
        } 
        return new this.model(raw_obj) 
    }

    /* Returns ONE object */
    async find(query: Query<M>, config?: RequestConfig): Promise<M> {
        let raw_obj = await this.adapter.find(query, config)
        if (this.cache) {
            const obj = this.cache.update(raw_obj)
            obj.refreshInitData()
            return obj
        } 
        return new this.model(raw_obj) 
    }

    /* Returns MANY objects */
    async load(query: Query<M>, config?: RequestConfig):Promise<M[]> {
        let raw_objs = await this.adapter.load(query, config)
        let objs: M[] = []
        // it should invoke in one big action
        runInAction(() => {
            if (this.cache) {
                for (let raw_obj of raw_objs) {
                    const obj = this.cache.update(raw_obj)
                    obj.refreshInitData()
                    objs.push(obj)
                }
            } 
            else {
                for (let raw_obj of raw_objs) {
                    objs.push(new this.model(raw_obj))
                }
            }
        })
        return objs
    }

    async getTotalCount  (filter: Filter, config?: RequestConfig): Promise<number> {
        return await this.adapter.getTotalCount(filter, config)
    }
    async getDistinct    (filter: Filter, field: string, config?: RequestConfig): Promise<any[]> {
        return await this.adapter.getDistinct(filter, field, config)
    }
}


// Model.repository is readonly, use decorator to customize repository 
export function repository(adapter: any, cache?: any) {
    return (cls: any) => {
        let repository = new Repository(cls, adapter, cache) 
        cls.__proto__.repository = repository
    }
}