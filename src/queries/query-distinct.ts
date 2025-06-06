import { runInAction } from 'mobx'
import { Query, QueryProps } from './query'


export class QueryDistinct extends Query<any> {
    readonly field: string
    
    constructor(field: string, props: QueryProps<any>) {
        super(props)
        this.field = field
    }

    async __load() {
        const objs = await this.repository.getDistinct(this.filter, this.field, { controller: this.controller })
        runInAction(() => {
            this.__items = objs
        })
    }
}
