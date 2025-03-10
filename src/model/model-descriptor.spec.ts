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
            expect(A.getModelDescriptor().cls).toBe(A)
            expect(A.getModelDescriptor().defaultRepository).toBeDefined()

            let descriptor = new ModelDescriptor()
            expect(descriptor.cls).toBeUndefined()
            expect(descriptor.defaultRepository).toBeDefined()
            expect(descriptor.defaultRepository.modelDescriptor).toBe(descriptor)
        })
    })

    it('use descroptor.cls to create a new instance of model', () => {
        @model class A extends Model {
            @id(NUMBER()) id_a: number
            @id(NUMBER()) id_b: number
        }     
        const constructor = A.getModelDescriptor().cls
        const a = new constructor({id_a: 1, id_b: 2})
        expect(a).toBeInstanceOf(A)
    })

    it('getID', () => {
        @model class A extends Model {
            @id(NUMBER()) id_a: number
            @id(NUMBER()) id_b: number
        }     
        const a = new A({id_a: 1, id_b: 2})
        expect(A.getModelDescriptor().getID(a)).toBe('1=2')
    })

    it('getIds', () => {
        @model class A extends Model {
            @id(NUMBER()) id_a: number
            @id(NUMBER()) id_b: number
        }     
        const a = new A({id_a: 1, id_b: 2})
        expect(A.getModelDescriptor().getIds(a)).toEqual([1, 2])
    })

    it('getIDByValues', () => {
        @model class A extends Model {
            @id(NUMBER()) id_a: number
            @id(NUMBER()) id_b: number
        }     
        expect(A.getModelDescriptor().getIDByValues([1, 2])).toEqual('1=2')
    })
})