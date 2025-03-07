import { Model } from '../model'
import { ID } from '../types'
import { Query } from '../queries'
import { Filter } from '../filters'


export type RequestConfig = {
    controller?: AbortController
    onUploadProgress?: (progressEvent: ProgressEvent) => void
}

/**
 * Adapter is a class that provides a way to interact with the server or other data source.
 */
export abstract class Adapter <M extends Model> {
    abstract create (raw_data: any,                           config?: RequestConfig): Promise<any>
    abstract update (obs: ID[], only_changed_raw_data: any,   config?: RequestConfig): Promise<any>
    abstract delete (ids: ID[],                               config?: RequestConfig): Promise<void>
    abstract action (ids: ID[], name: string, kwargs: Object, config?: RequestConfig): Promise<any>
    abstract get    (ids: ID[],                               config?: RequestConfig): Promise<any>

    // the find returns first object that match the query or undefined
    abstract find(query: Query<M>, config?: RequestConfig): Promise<any>
    abstract load(query: Query<M>, config?: RequestConfig): Promise<any[]>

    abstract getTotalCount  (filter: Filter,                config?: RequestConfig): Promise<number>
    abstract getDistinct    (filter: Filter, field: string, config?: RequestConfig): Promise<any[]>

    abstract getURLSearchParams(query: Query<M>): URLSearchParams
}
