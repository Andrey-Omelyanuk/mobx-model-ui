import { id, field } from '../fields'
import { NUMBER, STRING, UUID } from '../types'
import { Model, model, models, clearModels } from '.'
import { runInAction } from 'mobx'


describe('Model Decorator', () => {

    afterEach(async () => {
        jest.clearAllMocks()
        clearModels()
    })

    describe('with NUMBER id', () => {
        it('Register model with class that extends Model', async () => {
            @model class A extends Model {
                @id(NUMBER()) id: number
            }
            const modelDescription = models.get('A')
            expect(modelDescription).toBeDefined()

            let a = new A()
            expect(a).toBeInstanceOf(A)
            expect(a).toBeInstanceOf(Model)
            expect(a.modelName).toBe('A')
            expect(a.modelDescriptor).toBe(modelDescription)
        })

        it('Proxy class is created once, not per instance', async () => {
            @model class A extends Model {
                @id(NUMBER()) id: number
                @field(NUMBER()) a: number
            }
            const a1 = new A({ id: 1, a: 10 })
            const a2 = new A({ id: 2, a: 20 })
            // every instance shares the same proxy class instead of a fresh one each `new`
            expect(a1.constructor).toBe(a2.constructor)
            // `.model` (this.constructor.__proto__) still resolves to the original class
            expect(a1.model).toBe(a2.model)
            // observability is still applied per instance
            expect(a1.a).toBe(10)
            expect(a2.a).toBe(20)
        })
    })

    describe('with STRING id', () => {
        it('registers model and creates instance with string id', () => {
            @model class A extends Model {
                @id(STRING()) id: string
            }
            const modelDescription = models.get('A')
            expect(modelDescription).toBeDefined()

            let a = new A()
            expect(a).toBeInstanceOf(A)
            expect(a).toBeInstanceOf(Model)
            expect(a.modelName).toBe('A')
            expect(a.modelDescriptor).toBe(modelDescription)
        })

        it('creates instance with id value', () => {
            @model class A extends Model {
                @id(STRING()) id: string
            }
            expect(A.getModelDescriptor().cache.store.size).toBe(0)
            let a = new A({ id: 'abc-123' })
            expect(A.getModelDescriptor().cache.store.size).toBe(1)
            expect(A.getModelDescriptor().cache.get(a.ID)).toBe(a)
            expect(a).toMatchObject({ id: 'abc-123' })
        })

        it('id is read-only after being set', () => {
            @model class A extends Model {
                @id(STRING()) id: string
            }
            let a = new A({ id: 'first' })
            expect(() => runInAction(() => a.id = 'second'))
                .toThrow(new Error('You cannot change id field: first to second'))
        })

        it('setting id to undefined ejects from cache', () => {
            @model class A extends Model {
                @id(STRING()) id: string
            }
            let a = new A({ id: 'abc' })
            expect(A.getModelDescriptor().cache.store.size).toBe(1)
            runInAction(() => a.id = undefined as any)
            expect(A.getModelDescriptor().cache.store.size).toBe(0)
        })

        it('supports multiple instances with distinct string ids', () => {
            @model class A extends Model {
                @id(STRING()) id: string
                @field(NUMBER()) value: number
            }
            const a1 = new A({ id: 'alpha', value: 10 })
            const a2 = new A({ id: 'beta', value: 20 })
            expect(A.getModelDescriptor().cache.store.size).toBe(2)
            expect(A.getModelDescriptor().cache.get('alpha')).toBe(a1)
            expect(A.getModelDescriptor().cache.get('beta')).toBe(a2)
        })
    })

    describe('with UUID id', () => {
        it('registers model and creates instance with uuid id', () => {
            @model class A extends Model {
                @id(UUID()) id: string
            }
            const modelDescription = models.get('A')
            expect(modelDescription).toBeDefined()

            let a = new A()
            expect(a).toBeInstanceOf(A)
            expect(a).toBeInstanceOf(Model)
            expect(a.modelName).toBe('A')
            expect(a.modelDescriptor).toBe(modelDescription)
        })

        it('creates instance with uuid value', () => {
            @model class A extends Model {
                @id(UUID()) id: string
            }
            expect(A.getModelDescriptor().cache.store.size).toBe(0)
            let a = new A({ id: '550e8400-e29b-41d4-a716-446655440000' })
            expect(A.getModelDescriptor().cache.store.size).toBe(1)
            expect(A.getModelDescriptor().cache.get(a.ID)).toBe(a)
            expect(a).toMatchObject({ id: '550e8400-e29b-41d4-a716-446655440000' })
        })

        it('id is read-only after being set', () => {
            @model class A extends Model {
                @id(UUID()) id: string
            }
            let a = new A({ id: '550e8400-e29b-41d4-a716-446655440000' })
            expect(() => runInAction(() => a.id = '00000000-0000-0000-0000-000000000001'))
                .toThrow(new Error('You cannot change id field: 550e8400-e29b-41d4-a716-446655440000 to 00000000-0000-0000-0000-000000000001'))
        })

        it('setting id to undefined ejects from cache', () => {
            @model class A extends Model {
                @id(UUID()) id: string
            }
            let a = new A({ id: '550e8400-e29b-41d4-a716-446655440000' })
            expect(A.getModelDescriptor().cache.store.size).toBe(1)
            runInAction(() => a.id = undefined as any)
            expect(A.getModelDescriptor().cache.store.size).toBe(0)
        })

        it('supports multiple instances with distinct uuid ids', () => {
            @model class A extends Model {
                @id(UUID()) id: string
                @field(NUMBER()) value: number
            }
            const uuid1 = '550e8400-e29b-41d4-a716-446655440000'
            const uuid2 = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
            const a1 = new A({ id: uuid1, value: 10 })
            const a2 = new A({ id: uuid2, value: 20 })
            expect(A.getModelDescriptor().cache.store.size).toBe(2)
            expect(A.getModelDescriptor().cache.get(uuid1)).toBe(a1)
            expect(A.getModelDescriptor().cache.get(uuid2)).toBe(a2)
        })
    })

    it('Error: Decorate model without extends Model', async () => {
        expect(() => {
            @model class A {}
        }).toThrow(new Error(`Class "A" should extends Model!`))

        expect(() => {
            @model class B extends Object {}
        }).toThrow(new Error(`Class "B" should extends Model!`))
    })

    it('Error: Decorate model with no id', async () => {
        expect(() => {
            @model class A extends Model {}
        }).toThrow(new Error('Model "A" should be registered in models. Did you forget to declare any id?'))
    })
})