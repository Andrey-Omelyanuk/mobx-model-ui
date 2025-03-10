import { model, Model } from './model'
import { EQ } from './filters'
import { obj_a, obj_b, TestAdapter } from './test.utils'
import { Adapter, ConstantAdapter, local, local_store } from './adapters'
import { Repository } from './repository'
import { NUMBER, STRING } from './types'
import { field, id } from './fields'
import { Cache } from './cache'



describe('Repository', () => {

    @local()
    @model class A extends Model {
        @id   (NUMBER()) id : number
        @field(STRING()) b  : string
    }
    const adapter = new TestAdapter('test')

    afterEach(async () => {
        jest.clearAllMocks()
        A.getModelDescriptor().cache.clear()
        adapter.clear()
    })

    it('constructor', async ()=> {
        const adapter = new ConstantAdapter([])
        const cache = new Cache<A>()
        const repositoryA = new Repository(A.getModelDescriptor())
        expect(repositoryA.modelDescriptor).toBe(A.getModelDescriptor())
        expect(repositoryA.adapter).toBeUndefined()

        const repositoryB = new Repository(A.getModelDescriptor(), adapter)
        expect(repositoryB.modelDescriptor).toBe(A.getModelDescriptor())
        expect(repositoryB.adapter).toBe(adapter)

       const repositoryC = new Repository(A.getModelDescriptor(), adapter)
        expect(repositoryC.modelDescriptor).toBe(A.getModelDescriptor())
        expect(repositoryC.adapter).toBe(adapter)
    })


    it('create', async ()=> {
        const repository = new Repository(A.getModelDescriptor(), adapter)
        expect(adapter.create).toHaveBeenCalledTimes(0)

        let a = new A({b: 'test'})
        let response = await repository.create(a)
        expect(response).toBe(a)
        expect(adapter.create).toHaveBeenCalledTimes(1)
        expect(a.id).toBe(1)
        expect(local_store['test']['1']).toEqual({id: 1, b: 'test'})
    })

    it('update', async ()=> {
        const repository = new Repository(A.getModelDescriptor(), adapter)
        let a = new A({id: 1, b: 'test'})
        await repository.create(a)
        a.b = 'xxx'
        expect(adapter.update).toHaveBeenCalledTimes(0)

        const response = await repository.update(a)
        expect(response).toBe(a)
        expect(adapter.update).toHaveBeenCalledTimes(1)
        expect(a.b).toBe('xxx')
        expect(local_store['test']['1']).toEqual({id: 1, b: 'xxx'})
    })

    it('delete', async ()=> {
        const repository = new Repository(A.getModelDescriptor(), adapter)
        let a = new A({id: 1, b: 'test'})
        await repository.create(a)
        expect(adapter.delete).toHaveBeenCalledTimes(0)
        expect(local_store['test']['1']).toEqual({id: 1, b: 'test'})

        const response = await repository.delete(a)
        expect(response).toBeUndefined()
        expect(adapter.delete).toHaveBeenCalledTimes(1)
        expect(local_store['test']).toEqual({})
    })

    it('get', async ()=> {
        const repository = new Repository(A.getModelDescriptor(), adapter)
        let a = new A({id: 1, b: 'test'})
        await repository.create(a)
        expect(adapter.delete).toHaveBeenCalledTimes(0)
        expect(local_store['test']['1']).toEqual({id: 1, b: 'test'})

        const response = await repository.get([1])
        expect(response).toBe(a)
        expect(adapter.get).toHaveBeenCalledTimes(1)
    })

    // it('find', async ()=> {
    //     const selector: Selector = { filter: EQ ('')  }
    //                                             expect(__find).toHaveBeenCalledTimes(0)
    //     let obj = await adapter.find(selector); expect(__find).toHaveBeenCalledTimes(1)
    //                                             expect(__find).toHaveBeenCalledWith(selector)
    //                                             expect(obj).toBe(cache.get(obj_a.id))
    // })

    // it('load', async ()=> {
    //                                         expect(__load).toHaveBeenCalledTimes(0)
    //     let items = await adapter.load();   expect(__load).toHaveBeenCalledTimes(1)
    //                                         expect(__load).toHaveBeenCalledWith(undefined, undefined)
    //                                         expect(items).toEqual([
    //                                             cache.get(obj_a.id),
    //                                             cache.get(obj_b.id),
    //                                         ])
    // })

    // it('cancel load', async ()=> {
    //     const controller = new AbortController() 
    //                                         expect(__load).toHaveBeenCalledTimes(0)
    //     try {
    //         setTimeout(() => controller.abort(), 500)
    //         let items = await adapter.load(undefined, controller);   
    //     } catch (e) {
    //                                         expect(e).toBe('abort')
    //     }
    //                                         expect(__load).toHaveBeenCalledTimes(1)
    //                                         expect(__load).toHaveBeenCalledWith(undefined, controller)
    // })
})
