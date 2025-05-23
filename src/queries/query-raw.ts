import { runInAction } from 'mobx'
import { Query } from './query'
import { Model } from '../model'

/**
 * QueryRaw is a class to load raw objects from the server 
 * without converting them to models using the repository.
 */

export class QueryRaw<M extends Model> extends Query<M> {
    async __load() {
        const objs = await this.repository.adapter.load(this, { controller: this.controller })
        runInAction(() => {
            this.__items = objs
        })
    }
}
