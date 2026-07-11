import { reaction, runInAction } from 'mobx'
import { Query } from '../queries'
import { Model } from '../model'
import { Variable, VariableConstructorArgs } from './Variable'
import { ID, TypeDescriptor } from '../types'


export interface ObjectInputConstructorArgs<M extends Model> extends VariableConstructorArgs<ID> {
    options    : Query<M>
    autoReset ?: (input: ObjectInput<M>) => void
}

export class ObjectInput<M extends Model> extends Variable<ID> {
    readonly options: Query<M>

    constructor (type: TypeDescriptor<ID>, args?: ObjectInputConstructorArgs<M>) {
        super(type, args)
        this.options = args!.options
        if (this.options) {
            this.__disposers.push(reaction(
                () => this.options.isReady,
                (isReady, previousValue) => {
                    if(isReady && !previousValue) {
                        runInAction(() => this.isNeedToUpdate = true)
                        if (args?.autoReset) args.autoReset(this)
                    }
                }
            ))
        }
        else if (args?.autoReset) {
            console.warn('autoReset function should be used only with options')
        }
    }

    get obj(): M | undefined {
        if (!this.options) {
            console.warn('ObjectInput cannot return an object if options are not provided')
            return undefined
        }
        return this.options.repository.modelDescriptor.cache.get(this.value)
    }

    get isReady () {
        // options should be checked first
        // because without options it doesn't make sense to check value 
        return this.options ? this.options.isReady && super.isReady : super.isReady
    }

    destroy () {
        super.destroy()
        this.options?.destroy()
    }
}
