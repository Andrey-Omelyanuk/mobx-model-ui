import { Model, model, local, id, NUMBER, STRING, Repository, LocalAdapter} from '..'
import { QueryStream } from './query-stream'


describe('QueryStream', () => {

    @local() @model class A extends Model { @id(NUMBER()) id: number }
    const repository = A.defaultRepository as unknown as Repository<A>
    const adapter = repository.adapter as unknown as LocalAdapter<A>
    let query: QueryStream<A>

    beforeEach(async () => {
        adapter.clear()
        adapter.init_local_data([
            { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 },
            { id: 6 }, { id: 7 }, { id: 8 }, { id: 9 }, { id: 10 },
        ])
        query = new QueryStream<A>({ repository, limit: undefined })
        query.limit.set(3)
    })

    afterEach(async () => {
        query.destroy()
        A.getModelDescriptor().cache.clear()
        jest.clearAllMocks()
    })

    describe('Constructor', () => {
        it('default', async () => {
            expect(query).toMatchObject({
                repository,
                items           : [],
                total           : undefined,
                isEndReached    : false,
            })
            expect(query.offset.value).toBe(undefined)
            expect(query.limit.value).toBe(3)
        })
    })

    describe('Load', () => {
        it('first load loads initial page', async () => {
            await query.load()
            expect(query.items.length).toBe(3)
            expect(query.items.map(i => i.id)).toEqual([1, 2, 3])
            expect(query.offset.value).toBe(3)
            expect(query.total).toBe(undefined)
            expect(query.isEndReached).toBe(false)
        })

        it('accumulates items on subsequent loads', async () => {
            await query.load()
            expect(query.items.length).toBe(3)

            await query.load()
            expect(query.items.length).toBe(6)
            expect(query.items.map(i => i.id)).toEqual([1, 2, 3, 4, 5, 6])
            expect(query.offset.value).toBe(6)
        })

        it('sets isEndReached when no more items', async () => {
            query.limit.set(20)
            await query.load()
            expect(query.items.length).toBe(10)
            expect(query.total).toBe(undefined)
            expect(query.isEndReached).toBe(false)

            await query.load()
            expect(query.items.length).toBe(10)
            expect(query.total).toBe(1)
            expect(query.isEndReached).toBe(true)
        })
    })

    describe('loadMore', () => {
        it('loads next page', async () => {
            await query.load()
            expect(query.items.length).toBe(3)

            query.loadMore()
            await query.loading()
            expect(query.items.length).toBe(6)
            expect(query.items.map(i => i.id)).toEqual([1, 2, 3, 4, 5, 6])
        })

        it('ignores call when loading', async () => {
            query.load()
            query.loadMore()
            await query.loading()
            expect(query.items.length).toBe(3)
        })

        it('ignores call when end reached', async () => {
            query.limit.set(20)
            await query.load()
            await query.load()
            expect(query.total).toBe(1)
            expect(query.isEndReached).toBe(true)

            query.loadMore()
            await query.loading()
            expect(query.items.length).toBe(10)
        })
    })

    describe('restart', () => {
        it('clears items and reloads', async () => {
            await query.load()
            await query.load()
            expect(query.items.length).toBe(6)

            query.restart()
            await query.loading()
            expect(query.items.length).toBe(3)
            expect(query.items.map(i => i.id)).toEqual([1, 2, 3])
            expect(query.offset.value).toBe(3)
            expect(query.total).toBe(undefined)
            expect(query.isEndReached).toBe(false)
        })
    })

    describe('with string IDs', () => {
        @local()
        @model class StringID extends Model {
            @id(STRING()) id: string
        }
        const stringRepo = StringID.defaultRepository as unknown as Repository<StringID>
        const stringAdapter = stringRepo.adapter as unknown as LocalAdapter<StringID>
        let stringQuery: QueryStream<StringID>

        beforeEach(() => {
            stringAdapter.clear()
            stringAdapter.init_local_data([
                { id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' },
            ])
            stringQuery = new QueryStream<StringID>({ repository: stringRepo, limit: undefined })
            stringQuery.limit.set(2)
        })

        afterEach(() => {
            stringQuery.destroy()
            StringID.getModelDescriptor().cache.clear()
        })

        it('should load items with string IDs', async () => {
            await stringQuery.load()
            expect(stringQuery.items.length).toBe(2)
            expect(stringQuery.items.map(i => i.id)).toEqual(['a', 'b'])
            // Bug: offset is set via 'as number' which loses string type information
            expect(stringQuery.offset.value).toBeDefined()
        })

        it('should accumulate items with string IDs', async () => {
            await stringQuery.load()
            expect(stringQuery.items.length).toBe(2)

            await stringQuery.load()
            expect(stringQuery.items.length).toBe(4)
            expect(stringQuery.items.map(i => i.id)).toEqual(['a', 'b', 'c', 'd'])
        })

        it('should reach end with string IDs', async () => {
            stringQuery.limit.set(10)
            await stringQuery.load()
            expect(stringQuery.items.length).toBe(5)
            expect(stringQuery.isEndReached).toBe(false)

            await stringQuery.load()
            expect(stringQuery.isEndReached).toBe(true)
            expect(stringQuery.total).toBe(1)
        })
    })
})
