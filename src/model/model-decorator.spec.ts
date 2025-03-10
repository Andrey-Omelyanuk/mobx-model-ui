import { id } from '../fields'
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
        }).toThrow(new Error('Model "A" should be registered in models. Did you forget to declare any ids?'))
    })
})