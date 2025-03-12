import { model, Model } from './model'
import { EQ, EQV } from './filters'
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

    it('find', async ()=> {
        const repository = new Repository(A.getModelDescriptor(), adapter)
        let a = new A({id: 1, b: 'test'})
        await repository.create(a)
        expect(adapter.find).toHaveBeenCalledTimes(0)
        expect(local_store['test']['1']).toEqual({id: 1, b: 'test'})

        const query = A.getQuery({})
        const response = await repository.find(query)
        expect(response).toBe(a)
        expect(adapter.find).toHaveBeenCalledTimes(1)
    })

    it('load', async ()=> {
        const repository = new Repository(A.getModelDescriptor(), adapter)
        let a = new A({id: 1, b: 'test a'})
        let b = new A({id: 2, b: 'test b'})
        let c = new A({id: 3, b: 'test c'})
        await repository.create(a)
        await repository.create(b)
        await repository.create(c)
        expect(adapter.load).toHaveBeenCalledTimes(0)
        expect(local_store['test']).toEqual({'1': {id: 1, b: 'test a'}, '2': {id: 2, b: 'test b'}, 3: {id: 3, b: 'test c'}})

        const query = A.getQuery({})
        const response = await repository.load(query)
        expect(response).toEqual([a, b, c])
        expect(adapter.load).toHaveBeenCalledTimes(1)
    })

    it('cancel load', async ()=> {
        // const controller = new AbortController() 
        //                                     expect(__load).toHaveBeenCalledTimes(0)
        // try {
        //     setTimeout(() => controller.abort(), 500)
        //     let items = await adapter.load(undefined, controller);   
        // } catch (e) {
        //                                     expect(e).toBe('abort')
        // }
        //                                     expect(__load).toHaveBeenCalledTimes(1)
        //                                     expect(__load).toHaveBeenCalledWith(undefined, controller)
    })
})
