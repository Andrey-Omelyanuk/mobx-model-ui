import { field, id } from '../fields'
import { NUMBER, STRING } from '../types'
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
            expect(A.getModelDescriptor().cls).toBe(A)
            expect(A.defaultRepository).toBeDefined()

            let descriptor = new ModelDescriptor()
            expect(descriptor.cls).toBeUndefined()
        })
    })

    it('use descroptor.cls to create a new instance of model', () => {
        @model class A extends Model {
            @id(NUMBER()) id: number
        }     
        const constructor = A.getModelDescriptor().cls
        const a = new constructor({id: 1})
        expect(a).toBeInstanceOf(A)
    })

    it('getID', () => {
        @model class A extends Model {
            @id(NUMBER()) id: number
        }     
        const a = new A({id: 1})
        expect(A.getModelDescriptor().getID(a)).toBe(1)
    })

    it('types in model descriptor', () => {
        @model class A extends Model {
            @id(NUMBER()) id: number
            @field(STRING({minLength: 10, maxLength: 20})) name: string
            @field(NUMBER({required: true})) count: number
        }     
        expect(A.getModelDescriptor().fields['name'].type).toEqual(STRING({minLength: 10, maxLength: 20}))
        expect(A.getModelDescriptor().fields['count'].type).toEqual(NUMBER({required: true}))
    })
})