import { action, observable, runInAction } from 'mobx'
import { Model } from '../model'
import { Query, QueryProps } from './query'
import { config } from '../config'
import { ID } from '../types'


export class QueryStream <M extends Model> extends Query<M> {
    @action('MO: restart') restart() {
        this.__items = []
        this.offset.set(undefined)
        this.total = undefined
        this.isEndReached = false
        this.load()
    }

    @action('MO: load more') loadMore() {
        if (this.controller) return
        if (this.total === 1) return
        this.load()
    }

    @observable isEndReached = false

    constructor(props: QueryProps<M>) {
        super(props)
        runInAction(() => {
            if (this.offset.value === undefined) this.offset.set(undefined)
            if (this.limit.value  === undefined) this.limit.set(config.DEFAULT_PAGE_SIZE)
        })
    }

    async __load() {
        const objs = await this.repository.load(this, { controller: this.controller })
        runInAction(() => {
            if (objs.length === 0) {
                this.total = 1
                this.isEndReached = true
            } else {
                this.__items.push(...objs)
                this.offset.set(objs[objs.length - 1].ID as number)
                this.total = undefined
                this.isEndReached = false
            }
        })
    }
}
