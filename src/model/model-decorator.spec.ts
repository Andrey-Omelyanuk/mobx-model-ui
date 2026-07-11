import { id, field } from '../fields'
import { NUMBER } from '../types'
import { Model, model, models, clearModels } from '.'


describe('Model Decorator', () => {

    afterEach(async () => {
        jest.clearAllMocks()
        clearModels()
    })

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