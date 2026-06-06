import { model, Model, LocalAdapter, local, local_store, id, NUMBER, AND, Variable, STRING, BOOLEAN, EQ } from '../'
import { data_set, obj_a, obj_b, obj_c, obj_d, obj_e  } from '../test.utils' 


describe('LocalAdapter', () => {

    @local() @model class A extends Model { @id(NUMBER()) id: number }
    const adapter = A.defaultRepository.adapter as unknown as LocalAdapter<A> 

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
            expect((A2.defaultRepository.adapter as unknown as LocalAdapter<A2>).store_name).toBe('A2')
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

    it('get', async ()=> {
        local_store['A'] = {
            '1': {id: 1, a: 1},
            '2': {id: 2, a: 2},
        }
        expect(await adapter.get(1)).toStrictEqual({id: 1, a: 1})
        expect(await adapter.get(2)).toStrictEqual({id: 2, a: 2})
    })

    describe('find', () => {
        it('returns first object without filter', async ()=> {
            adapter.init_local_data(data_set)
            const result = await adapter.find(A.getQuery({}))
            expect(result).toEqual(obj_a)
        })

        it('returns first matching object with filter', async ()=> {
            adapter.init_local_data(data_set)
            const inputA = new Variable(NUMBER(), {value: 2})
            const result = await adapter.find(A.getQuery({filter: EQ('a', inputA)}))
            expect(result).toEqual(obj_c)
        })

        it('returns undefined when no match', async ()=> {
            adapter.init_local_data(data_set)
            const inputA = new Variable(NUMBER(), {value: 99})
            const result = await adapter.find(A.getQuery({filter: EQ('a', inputA)}))
            expect(result).toBeUndefined()
        })
    })

    describe('load', () => {

        it('without filter', async ()=> {
            adapter.init_local_data(data_set)
            let objs = await adapter.load(A.getQuery({}))
            expect(objs).toEqual(data_set)
        })

        it('with filter', async ()=> {
            adapter.init_local_data(data_set)
            const inputA = new Variable(NUMBER(), {value: 2})
            const inputB = new Variable(STRING(), {value: 'a'})
            const inputC = new Variable(BOOLEAN(), {value: false})

            let objs = await adapter.load(A.getQuery({filter: EQ('a', inputA)}))
            expect(objs).toEqual([obj_c, obj_d])

            objs = await adapter.load(A.getQuery({filter: EQ('b', inputB)}))
            expect(objs).toEqual([obj_a, obj_e])

            objs = await adapter.load(A.getQuery({filter: EQ('c', inputC)}))
            expect(objs).toEqual([obj_b, obj_c])

            objs = await adapter.load(A.getQuery({filter: AND(EQ('a', inputA), EQ('c', inputC))}))
            expect(objs).toEqual([obj_c])

            objs = await adapter.load(A.getQuery({filter: AND(EQ('a', inputA), EQ('b', inputB), EQ('c', inputC))}))
            expect(objs).toEqual([])
        })

        // it('with orderBy', async ()=> {
        //     adapter.init_local_data(data_set)
        //     let objs = await adapter.load(A.getQuery({orderBy: [{a: ASC}]}))
        //     expect(objs).toEqual(data_set)
        // })
    })

    describe('getTotalCount', () => {
        it('returns total count without filter', async ()=> {
            adapter.init_local_data(data_set)
            const count = await adapter.getTotalCount()
            expect(count).toBe(5)
        })

        it('returns count with filter', async ()=> {
            adapter.init_local_data(data_set)
            const inputA = new Variable(NUMBER(), {value: 2})
            const count = await adapter.getTotalCount(EQ('a', inputA))
            expect(count).toBe(2)
        })

        it('returns zero when no match', async ()=> {
            adapter.init_local_data(data_set)
            const inputA = new Variable(NUMBER(), {value: 99})
            const count = await adapter.getTotalCount(EQ('a', inputA))
            expect(count).toBe(0)
        })
    })

    describe('getDistinct', () => {
        it('returns distinct values for a field', async ()=> {
            adapter.init_local_data(data_set)
            const values = await adapter.getDistinct(null as any, 'b')
            expect(values.sort()).toEqual(['a', 'c', 'f'].sort())
        })

        it('returns distinct values with filter', async ()=> {
            adapter.init_local_data(data_set)
            const inputA = new Variable(NUMBER(), {value: 2})
            const values = await adapter.getDistinct(EQ('a', inputA), 'b')
            expect(values.sort()).toEqual(['f'].sort())
        })

        it('returns empty array when no match', async ()=> {
            adapter.init_local_data(data_set)
            const inputA = new Variable(NUMBER(), {value: 99})
            const values = await adapter.getDistinct(EQ('a', inputA), 'b')
            expect(values).toEqual([])
        })
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
