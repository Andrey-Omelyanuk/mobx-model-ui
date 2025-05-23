import { model, Model, LocalAdapter, local, local_store, id, NUMBER } from '../'
import { data_set  } from '../test.utils' 


describe('LocalAdapter', () => {

    @local() @model class A extends Model { @id(NUMBER()) id: number }
    const adapter = A.defaultRepository.adapter as LocalAdapter<A> 

    afterEach(async () => {
        local_store['A'] = {} // clean the store
    })

    describe('constructor', () => {
        it('create a new instance', async ()=> {
            let adapter = new LocalAdapter('A1')
            expect(adapter.store_name).toBe('A1')
        })

        it('decorate the model', async ()=> {
            @local() @model class A2 extends Model { @id(NUMBER()) id: number }
            expect((A2.defaultRepository.adapter as LocalAdapter<A2>).store_name).toBe('A2')
        })
    })

    it('create', async ()=> {
        expect(await adapter.create({a: 1})).toStrictEqual({id: 1, a: 1})
        expect(await adapter.create({a: 2})).toStrictEqual({id: 2, a: 2})
        expect(await adapter.create({a: 3})).toStrictEqual({id: 3, a: 3})
        expect(await adapter.create({a: 4})).toStrictEqual({id: 4, a: 4})
        expect(local_store['A']).toEqual({
            1: {id: 1, a: 1},
            2: {id: 2, a: 2},
            3: {id: 3, a: 3},
            4: {id: 4, a: 4},
        })
    })

    it('update', async ()=> {
        local_store['A'] = {
            '1': {id: 1, a: 1},
            '2': {id: 2, a: 2},
        }
        const obj = {id: 1, a: 2}
        expect(await adapter.update(1, obj)).toStrictEqual(obj)
        expect(local_store['A'][1]).toStrictEqual(obj)
    })

    it('delete', async ()=> {
        local_store['A'] = {
            '1': {id: 1, a: 1},
            '2': {id: 2, a: 2},
        }
        await adapter.delete(1)
        expect(local_store['A']).toEqual({'2': {id: 2, a: 2}, })
        await adapter.delete(1)  // no error, just ignore
        expect(local_store['A']).toEqual({'2': {id: 2, a: 2}, })
        await adapter.delete(2)
        expect(local_store['A']).toEqual({})
    })

    it('action', (done) => {
        adapter.action(1, 'action', {}).catch((e) => {
            expect(e).toBe('Not implemented')
            done()
        })
    })

    it('get', async ()=> {
        local_store['A'] = {
            '1': {id: 1, a: 1},
            '2': {id: 2, a: 2},
        }
        expect(await adapter.get(1)).toStrictEqual({id: 1, a: 1})
        expect(await adapter.get(2)).toStrictEqual({id: 2, a: 2})
    })

    it('find', async ()=> {
    })

    it('load', async ()=> {
        adapter.init_local_data(data_set)
        let objs = await adapter.load(A.getQuery({}))
        expect(objs).toEqual(data_set)
    })

    it('getTotalCount', async ()=> {
    })

    it('getDistinct', async ()=> {
    })

    describe('init_local_data', () => {

        it('empty', async ()=> {
            adapter.init_local_data([])
            expect(local_store['A']).toEqual({})
        })

        it('with some data', async ()=> {
            let data_set = [
                {id: 1, a: 1, b: 'a', c: true },
                {id: 2, a: 2, b: 'b', c: false},
            ]
            adapter.init_local_data(data_set)
            expect(local_store['A'][data_set[0].id]).toMatchObject(data_set[0])
            expect(local_store['A'][data_set[1].id]).toMatchObject(data_set[1])
        })

        it('override data', async ()=> {
            let data_set_a = [
                {id: 1, a: 1, b: 'a', c: true },
                {id: 2, a: 2, b: 'b', c: false},
            ]
            let data_set_b = [
                {id: 2, a: 2, b: 'b', c: false},
            ]
            adapter.init_local_data(data_set_a)
            adapter.init_local_data(data_set_b)
            expect(local_store['A'][data_set_b[0].id]).toMatchObject(data_set_b[0])
        })
    })
})
