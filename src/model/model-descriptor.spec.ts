import { id } from '../fields'
import { NUMBER } from '../types'
import { Model, ModelDescriptor, model, models } from '.'


describe('Model Descriptor', () => {

    afterEach(async () => {
        models.clear()
        jest.clearAllMocks()
    })

    describe('constructor', () => {
        it('default values', () => {
            @model class A extends Model {
                @id(NUMBER()) id: number
            }     
            let descriptor = new ModelDescriptor(A)
            expect(descriptor.defaultRepository.modelDescriptor.cls).toBe(A)
        })
    })
})