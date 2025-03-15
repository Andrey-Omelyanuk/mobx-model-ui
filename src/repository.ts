import { runInAction } from 'mobx'
import { Model, ModelDescriptor } from './model'
import { ID } from './types'
import { Cache } from './cache'
import { Query } from './queries/query'
import { Filter } from './filters'
import { Adapter, RequestConfig } from './adapters/adapter'

/**
 * Repository class is responsible for CRUD operations on the model.
 */
export class  Repository<M extends Model> {
    constructor(
        readonly modelDescriptor : ModelDescriptor<M>,
        public   adapter        ?: Adapter<M>
    ) {}

    /**
     * Create the object. 
     */
    async create(obj: M, config?: RequestConfig) : Promise<M> {
        let raw_obj = await this.adapter.create(obj.rawObj, config) // Id can be defined in the frontend => ids should be passed to the create method if they exist
        const rawObjID = this.modelDescriptor.getID(raw_obj)
        const cachedObj = this.modelDescriptor.cache.get(rawObjID)
        if (cachedObj) obj = cachedObj
        obj.updateFromRaw(raw_obj)
        obj.refreshInitData()
        return obj
    }

    /**
     * Update the object.
     */
    async update(obj: M, config?: RequestConfig) : Promise<M> {
        const ids = this.modelDescriptor.getIds(obj)
        let raw_obj = await this.adapter.update(ids, obj.only_changed_raw_data, config)
        obj.updateFromRaw(raw_obj)
        obj.refreshInitData()
        return obj
    }

    /**
     * Delete the object.
     */
    async delete(obj: M, config?: RequestConfig) : Promise<void> {
        const ids = this.modelDescriptor.getIds(obj)
        await this.adapter.delete(ids, config)
        obj.destroy()
    }

    /**
     * Run action for the object.
     */
    async action(obj: M, name: string, kwargs: Object, config?: RequestConfig) : Promise<any> {
        const ids = this.modelDescriptor.getIds(obj)
        return await this.adapter.action(ids, name, kwargs, config)
    }

    /**
     * Returns ONE object by ids.
     */
    async get(ids: ID[], config?: RequestConfig): Promise<M> {
        debugger
        let raw_obj = await this.adapter.get(ids, config)
        return this.modelDescriptor.updateCachedObject(raw_obj)
    }

    /**
     * Returns ONE object by query.
     */
    async find(query: Query<M>, config?: RequestConfig): Promise<M> {
        let raw_obj = await this.adapter.find(query, config)
        return this.modelDescriptor.updateCachedObject(raw_obj)
    }

    /**
     * Returns MANY objects by query. 
     */
    async load(query: Query<M>, config?: RequestConfig):Promise<M[]> {
        let raw_objs = await this.adapter.load(query, config)
        let objs: M[] = []
        runInAction(() => {
            for (const raw_obj of raw_objs) {
                objs.push(this.modelDescriptor.updateCachedObject(raw_obj))
            }
        })
        return objs
    }

    /**
     * Returns total count of objects.
     */
    async getTotalCount(filter: Filter, config?: RequestConfig): Promise<number> {
        return await this.adapter.getTotalCount(filter, config)
    }
    /**
     * Returns distinct values for the field.
     */
    async getDistinct(filter: Filter, field: string, config?: RequestConfig): Promise<any[]> {
        return await this.adapter.getDistinct(filter, field, config)
    }
}
