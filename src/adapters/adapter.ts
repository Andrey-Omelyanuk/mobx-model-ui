import { Model } from '../model'
import { ID } from '../types'
import { Query } from '../queries'
import { Filter } from '../filters'

/**
 * Adapter is a class that provides a way to interact with the server or other data source.
 * M is a model class that the adapter is responsible for.
 */

export type RequestConfig = {
    controller?: AbortController
    onUploadProgress?: (progressEvent: ProgressEvent) => void
}

export abstract class Adapter <M extends Model> {
    abstract create (raw_data: any,                            config?: RequestConfig): Promise<any>
    abstract update (obj_id: ID, only_changed_raw_data: any,   config?: RequestConfig): Promise<any>
    abstract delete (obj_id: ID,                               config?: RequestConfig): Promise<void>
    abstract action (obj_id: ID, name: string, kwargs: Object, config?: RequestConfig): Promise<any>
    abstract get    (obj_id: ID,                               config?: RequestConfig): Promise<any>

    // the find returns first object that match the query or undefined
    abstract find(query: Query<M>, config?: RequestConfig): Promise<any>
    abstract load(query: Query<M>, config?: RequestConfig): Promise<any[]>

    abstract getTotalCount  (filter: Filter,                config?: RequestConfig): Promise<number>
    abstract getDistinct    (filter: Filter, field: string, config?: RequestConfig): Promise<any[]>

    abstract getURLSearchParams(query: Query<M>): URLSearchParams
}
