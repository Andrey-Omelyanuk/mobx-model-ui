import { runInAction } from 'mobx'
import { Model, ModelDescriptor } from './model'
import { ID } from './types'
import { Query, QueryProps, QueryPage, QueryRaw, QueryRawPage, QueryCacheSync, QueryStream, QueryDistinct } from './queries'
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
        let raw_obj = await this.adapter.create(obj.rawObj, config) // Id can be defined in the frontend => id should be passed to the create method if they exist
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
        let raw_obj = await this.adapter.update(obj.ID, obj.only_changed_raw_data, config)
        obj.updateFromRaw(raw_obj)
        obj.refreshInitData()
        return obj
    }

    /**
     * Delete the object.
     */
    async delete(obj: M, config?: RequestConfig) : Promise<void> {
        await this.adapter.delete(obj.ID, config)
        obj.destroy()
    }

    /**
     * Run action for the object.
     */
    async action(obj: M, name: string, kwargs: Object, config?: RequestConfig) : Promise<any> {
        return await this.adapter.action(obj.ID, name, kwargs, config)
    }

    /**
     * Returns ONE object by id.
     */
    async get(id: ID, config?: RequestConfig): Promise<M> {
        let raw_obj = await this.adapter.get(id, config)
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

    getQuery         (props: QueryProps<M>): Query         <M> { return new Query         ({...props, repository: this }) }
    getQueryPage     (props: QueryProps<M>): QueryPage     <M> { return new QueryPage     ({...props, repository: this }) }
    getQueryRaw      (props: QueryProps<M>): QueryRaw      <M> { return new QueryRaw      ({...props, repository: this }) }
    getQueryRawPage  (props: QueryProps<M>): QueryRawPage  <M> { return new QueryRawPage  ({...props, repository: this }) }
    getQueryCacheSync(props: QueryProps<M>): QueryCacheSync<M> { return new QueryCacheSync({...props, repository: this }) }
    getQueryStream   (props: QueryProps<M>): QueryStream   <M> { return new QueryStream   ({...props, repository: this }) }
    getQueryDistinct (field: string, props: QueryProps<M>): QueryDistinct { return new QueryDistinct(field, {...props, repository: this }) }
}
