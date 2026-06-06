import { runInAction } from 'mobx'
import { Model } from '../model'
import { QueryPage } from './query-page'

/**
 * QueryRawPage is a class to load raw objects from the server 
 * without converting them to models using the repository.
 */

export class QueryRawPage<M extends Model> extends QueryPage<M> {
    async __load() {
        const objs = await this.repository.adapter.load(this, { controller: this.controller })
        const total = await this.repository.getTotalCount(this.filter, { controller: this.controller })
        runInAction(() => {
            this.__items = objs
            this.total = total
        })
    }
}
