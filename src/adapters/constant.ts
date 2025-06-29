import { Model } from '../model'
import { Adapter, RequestConfig } from './adapter'


export class ConstantAdapter<M extends Model> extends Adapter<M> {
    readonly constant: any[] 

    constructor (constant) {
        super()
        this.constant = constant
    }

    async action (): Promise<any> {
        console.warn('ConstantAdapter.action not implemented')
        return {} 
    }

    async create (): Promise<any> {
        throw new Error('ConstantAdapter.create should not be used.')
    }

    async update (): Promise<any> {
        throw new Error('ConstantAdapter.update should not be used.')
    }

    async delete (): Promise<void> {
        throw new Error('ConstantAdapter.delete should not be used.')
    }

    async get (): Promise<any> {
        throw new Error('ConstantAdapter.get should not be used.')
    }

    async modelAction (name: string, kwargs: Object, config?: RequestConfig) : Promise<any> {
        throw new Error('ConstantAdapter.modelAction should not be used.')
    }

    async find (): Promise<any> {
        throw new Error('ConstantAdapter.find should not be used.')
    }

    async load (): Promise<any[]> {
        return this.constant 
    }

    async getTotalCount (): Promise<number> {
        return this.constant.length
    }

    async getDistinct (): Promise<any[]> {
        throw new Error('ConstantAdapter.getDistinct should not be used.')
    }

    getURLSearchParams(): URLSearchParams {
        return new URLSearchParams()
    }
}

// model decorator
export function constant (constant: any[]) {
    return (cls: any) => {
        cls.defaultRepository.adapter = new ConstantAdapter(constant)
    }
}
