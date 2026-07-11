import { model, Model, local, id, NUMBER, Repository, QueryRaw, LocalAdapter } from '..'
import { TestAdapter } from '../test.utils'

describe('QueryRaw', () => {

    @local()
    @model class A extends Model { @id(NUMBER()) id: number }
    const repositoryA = A.defaultRepository as unknown as Repository<A>

    afterEach(async () => {
        A.getModelDescriptor().cache.clear()
        jest.clearAllMocks()
    })

    describe('Constructor', () => {
        it('default', async () => {
            const query = new QueryRaw<A>({ repository: repositoryA })
            expect(query).toMatchObject({
                repository     : repositoryA,
                filter         : undefined,
                items          : [],
                total          : undefined,
                isLoading      : false,
                isNeedToUpdate : true,
                timestamp      : undefined,
                error          : undefined,
            })
        })
    })

    describe('Load', () => {
        it('should load raw objects without converting to models', async () => {
            const rawData = [
                { id: 1, name: 'first' },
                { id: 2, name: 'second' },
            ]
            class RawAdapter<M extends Model> extends LocalAdapter<M> {
                async load(): Promise<any[]> {
                    return rawData
                }
            }
            const repository = new Repository<A>((() => {}) as any, new RawAdapter<A>('test'))
            const query = new QueryRaw<A>({ repository })

            await query.load()

            expect(query.items).toEqual(rawData)
            expect(query.items[0]).toStrictEqual(rawData[0])
            expect(query.items[1]).toStrictEqual(rawData[1])
        })

        it('should not add raw objects to cache', async () => {
            const rawData = [
                { id: 1, name: 'first' },
                { id: 2, name: 'second' },
            ]
            class RawAdapter<M extends Model> extends LocalAdapter<M> {
                async load(): Promise<any[]> {
                    return rawData
                }
            }
            const repository = new Repository<A>((() => {}) as any, new RawAdapter<A>('test'))
            const query = new QueryRaw<A>({ repository })

            await query.load()

            expect(A.getModelDescriptor().cache.store.size).toBe(0)
        })

        it('isLoading', (done) => {
            const query = new QueryRaw<A>({ repository: repositoryA });     expect(query.isLoading).toBe(false)
            query.load().finally(() => {                                    expect(query.isLoading).toBe(false)
                done()
            });                                                             expect(query.isLoading).toBe(true)
        })

        it('need_to_update should set to false', (done) => {
            const query = new QueryRaw<A>({ repository: repositoryA });     expect(query.isNeedToUpdate).toBe(true)
            query.load().finally(() => {                                    expect(query.isNeedToUpdate).toBe(false)
                done()
            });                                                             expect(query.isNeedToUpdate).toBe(false)
        })

        it('timestamp', async () => {
            let timestamp
            const query = new QueryRaw<A>({ repository: repositoryA });     expect(query.timestamp === undefined).toBe(true)
            await query.load();                                             expect(query.timestamp !== undefined).toBe(true)
            timestamp = query.timestamp
            await query.load();                                             expect(query.timestamp).toBe(timestamp + 1)
        })

        it('error', async () => {
            class ErrorAdapter<M extends Model> extends TestAdapter<M> {
                async load(): Promise<any[]> {
                    throw new Error('load error')
                }
            }
            const repository = new Repository<A>((() => {}) as any, new ErrorAdapter<A>('test'))
            const query = new QueryRaw<A>({ repository })
            await query.load()
            expect(query.error).toBe('load error')
        })

        it('shadow load don`t trigger is_loading flag', (done) => {
            const query = new QueryRaw<A>({ repository: repositoryA });     expect(query.isLoading).toBe(false)
            query.shadowLoad().finally(() => {                              expect(query.isLoading).toBe(false)
                done()
            });                                                             expect(query.isLoading).toBe(false)
        })
    })

    describe('Destructor', () => {
        it('should clean up disposers', async () => {
            const query = new QueryRaw<A>({ repository: repositoryA, autoupdate: false }) as any
            expect(query.disposers.size).toBe(1)
            query.destroy()
            expect(query.disposers.size).toBe(0)
        })
    })
})
