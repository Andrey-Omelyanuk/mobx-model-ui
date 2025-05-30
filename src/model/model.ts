import { action,  computed,  observable } from 'mobx'
import { 
    Query, QueryProps, QueryPage, QueryRaw, QueryRawPage,
    QueryCacheSync, QueryDistinct, QueryStream
} from '../queries'
import { Repository } from '../repository'
import { ID } from '../types'
import { Destroyable } from '../object'
import models from './models'
import { ModelDescriptor } from './model-descriptor'


export default abstract class Model implements Destroyable {
    /**
     * Static version initializes in the id decorator.
     * Instance version initializes in the constructor that declare in model decorator.
     * It is used for registering the model in the models map.
     * It is used for get the model descriptor from the models map.
     */
    static   modelName: string
    readonly modelName: string

    /**
     * Default repository that used in methods like `load`, `getTotalCount`, etc.
     */
    static defaultRepository: Repository<Model>
    getDefaultRepository<T extends Model>(): Repository<T> {
        return (this.modelDescriptor.cls as any).defaultRepository
    }

    /**
     * @returns {ModelDescriptor} - model description
     */
    static getModelDescriptor<T extends Model>(): ModelDescriptor<T> {
        return models.get(this.modelName) as ModelDescriptor<T>
    }
    /**
     * @param init - initial data of the object 
     */
    constructor (init?: {}) {}
    /**
     * @returns {ModelDescriptor} - model descriptor
     */
    get modelDescriptor(): ModelDescriptor<Model> {
        return models.get(this.modelName)
    }

    /**
     * ID returns id value from the object.
     * Id field can be different from the id field name. 
     */
    @computed({ keepAlive: true })
    get ID(): ID {
        return this.modelDescriptor.getID(this)
    }

    /**
     * Save the initial data of the object that was loaded from the server.
     */
    @observable init_data: any   
    /**
     * disposers for mobx reactions and interceptors, you can add your own disposers
     */
    disposers = new Map()

    /**
     * Destructor of the object.
     * It eject from cache and removes all disposers.
     */
    @action destroy() {
        // trigger in id fields will ejenct the object from cache
        this[this.modelDescriptor.id] = undefined
        while(this.disposers.size) {
            this.disposers.forEach((disposer, key) => {
                disposer()
                this.disposers.delete(key)
            })
        }
    }

    get model() : any {
        return (<any>this.constructor).__proto__
    }

    /**
     * @returns {Object} - data only from fields (no id)
     */
    get rawData() : Object {
        let rawData: any = {}
        for (const fieldName in this.modelDescriptor.fields) {
            if(this[fieldName] !== undefined) {
                rawData[fieldName] = this[fieldName]
            }
        }
        return rawData
    }

    /**
     * @returns {Object} - it is rawData + id field
     */
    get rawObj() : Object {
        const idFieldName   = this.modelDescriptor.id
        const rawObj        = this.rawData
        rawObj[idFieldName] = this[idFieldName] 
        return rawObj
    }

    get only_changed_raw_data() : any {
        let raw_data: any = {}
        for(let field_name in this.modelDescriptor.fields) {
            if(this[field_name] != this.init_data[field_name]) {
                raw_data[field_name] = this[field_name]
            }
        }
        return raw_data
    }

    get is_changed() : boolean {
        for(let field_name in this.modelDescriptor.fields) {
            if (this[field_name] != this.init_data[field_name]) {
                return true
            }
        }
        return false
    }

    @action refreshInitData() {
        if(this.init_data === undefined) this.init_data = {}
        for (let field_name in this.modelDescriptor.fields) {
            this.init_data[field_name] = this[field_name]
        }
    }

    @action cancelLocalChanges() {
        for (let field_name in this.modelDescriptor.fields) {
            if (this[field_name] !== this.init_data[field_name]) {
                this[field_name] = this.init_data[field_name]
            }
        }
    }

    /**
     * Update the object from the raw data.
     * @description
     * It is used when raw data comes from any source (server, websocket, etc.) and you want to update the object. 
     * TODO: ID is not ready! I'll finish it later. 
     */
    @action updateFromRaw(rawObj) {
        // update id if not exist
        const idField = this.modelDescriptor.id
        if (this[idField] === null || this[idField] === undefined) {
            this[idField] = rawObj[idField] 
        }

        // update the fields if the raw data is exist and it is different
        for(let fieldName in this.modelDescriptor.fields) {
            if (rawObj[fieldName] !== undefined && rawObj[fieldName] !== this[fieldName]) {
                this[fieldName] = rawObj[fieldName]
            }
        }

        // update related objects 
        for (let relation in this.modelDescriptor.relations) {
            const settings = this.modelDescriptor.relations[relation].settings
            if (settings.foreign_model && rawObj[relation]) {
                settings.foreign_model.getModelDescriptor().updateCachedObject(rawObj[relation])
                this[settings.foreign_id] = rawObj[relation].id
            }
            else if (settings.remote_model && rawObj[relation]) {
                // many
                if (Array.isArray(rawObj[relation])) {
                    for (const i of rawObj[relation]) {
                        settings.remote_model.getModelDescriptor().updateCachedObject(i)
                    }
                }
                // one
                else {
                    settings.remote_model.getModelDescriptor().updateCachedObject(rawObj[relation])
                }
            }
        }
    }

    // --------------------------------------------------------------------------------------------
    // helper instance functions
    // --------------------------------------------------------------------------------------------

    async action(name: string, kwargs: Object) { return await this.getDefaultRepository().action(this, name, kwargs) }
    async create<T extends Model>(): Promise<T> { return await this.getDefaultRepository().create(this) as T }
    async update<T extends Model>(): Promise<T> { return await this.getDefaultRepository().update(this) as T }
    async save<T extends Model>(): Promise<T> { return await this.getDefaultRepository().save(this) as T }
    async delete() { return await this.getDefaultRepository().delete(this) }
    async refresh() { return await this.getDefaultRepository().get(this.ID) }

    // --------------------------------------------------------------------------------------------
    // helper class functions
    // --------------------------------------------------------------------------------------------
    static getQuery         <T extends Model>(props: QueryProps<T>): Query         <T> { return (this.defaultRepository as Repository<T>).getQuery(props) }
    static getQueryPage     <T extends Model>(props: QueryProps<T>): QueryPage     <T> { return (this.defaultRepository as Repository<T>).getQueryPage(props) }
    static getQueryRaw      <T extends Model>(props: QueryProps<T>): QueryRaw      <T> { return (this.defaultRepository as Repository<T>).getQueryRaw(props) }
    static getQueryRawPage  <T extends Model>(props: QueryProps<T>): QueryRawPage  <T> { return (this.defaultRepository as Repository<T>).getQueryRawPage(props) }
    static getQueryCacheSync<T extends Model>(props: QueryProps<T>): QueryCacheSync<T> { return (this.defaultRepository as Repository<T>).getQueryCacheSync(props) }
    static getQueryStream   <T extends Model>(props: QueryProps<T>): QueryStream   <T> { return (this.defaultRepository as Repository<T>).getQueryStream(props) }
    static getQueryDistinct <T extends Model>(field: string, props: QueryProps<T>): QueryDistinct {
        return (this.defaultRepository as Repository<T>).getQueryDistinct(field, props)
    }
    static get<T extends Model>(id: ID): T {
        return this.getModelDescriptor().cache.get(id) as T
    }
    static async findById<T extends Model>(id: ID) : Promise<T> {
        return (this.defaultRepository as Repository<T>).get(id)
    }
    static async find<T extends Model>(query: Query<T>) : Promise<T> {
        return (this.defaultRepository as Repository<T>).find(query)
    }
}
