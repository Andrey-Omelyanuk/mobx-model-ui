import { model, Model, LocalAdapter, local, local_store, id, field, NUMBER, AND, Variable, STRING, BOOLEAN, EQ, UUID } from '../'
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

    describe('create edge cases', () => {
        it('should not mutate the input raw_data object (bug: mutates raw_data.id)', async () => {
            @local() @model class LocalMutateTest extends Model { @id(NUMBER()) id: number }
            const testAdapter = LocalMutateTest.defaultRepository.adapter as unknown as LocalAdapter<LocalMutateTest>
            const input = {name: 'test', value: 42}
            const inputCopy = {...input}

            await testAdapter.create(input)

            // The original input should not have been modified
            expect(input).toEqual(inputCopy)
        })

        it('should handle string ID models without producing NaN', async () => {
            @local()
            @model class LocalStringID extends Model {
                @id(STRING()) id: string
                @field(STRING()) name: string
            }
            const testAdapter = LocalStringID.defaultRepository.adapter as unknown as LocalAdapter<LocalStringID>
            local_store['LocalStringID']['uuid-1'] = {id: 'uuid-1', name: 'existing-1'}
            local_store['LocalStringID']['uuid-2'] = {id: 'uuid-2', name: 'existing-2'}

            // When store has string IDs, parseInt returns NaN, Math.max becomes NaN
            const result = await testAdapter.create({name: 'new-item'})
            // Bug: result.id is NaN because parseInt('uuid-1') = NaN
            expect(isNaN(result.id)).toBe(false)
            expect(typeof result.id).toBe('number')
            // The new item should be in the store
            expect(local_store['LocalStringID'][result.id]).toEqual(result)

            // cleanup
            delete local_store['LocalStringID']
        })

        it('should handle UUID ID models without throwing', async () => {
            @local()
            @model class LocalUUIDTest extends Model {
                @id(UUID()) id: string
                @field(STRING()) name: string
            }
            const testAdapter = LocalUUIDTest.defaultRepository.adapter as unknown as LocalAdapter<LocalUUIDTest>
            local_store['LocalUUIDTest']['00000000-0000-0000-0000-000000000001'] = {id: '00000000-0000-0000-0000-000000000001', name: 'existing'}

            // Creating a new object with UUID ID type should not crash
            // Bug: parseInt on UUID returns NaN
            const result = await testAdapter.create({name: 'new-item'})
            // The auto-increment logic is flawed for UUID, but at minimum shouldn't produce NaN
            // Regardless of the fix strategy, the ID should not be NaN
            expect(isNaN(result.id)).toBe(false)

            // cleanup
            delete local_store['LocalUUIDTest']
        })
    })
})
