import { runInAction } from 'mobx'
import { Model, model, models } from '../model'
import { id } from './id'
import { field } from './field'
import { NUMBER, STRING } from '../types'

describe('Id field', () => {
    @model class TestModel extends Model {
        @id(NUMBER())       id      : number
        @field(STRING())    name    : string
    }

    beforeEach(() => {
        TestModel.getModelDescriptor().cache.clear() 
    })

    afterEach(async () => {
        jest.clearAllMocks()
    })

    it('should register model with id field', () => {
        const modelDesc = models.get('TestModel')
        expect(modelDesc).toBeDefined()
        expect(modelDesc.id).toBe('id')
        expect(modelDesc.idFieldDescriptors).toBeDefined()
    })

    // it('should create model instance with id', () => {
    //     const obj = new TestModel()
    //     const cache = TestModel.getModelDescriptor().cache
    //     obj.id = 1
    //     expect(obj.id).toBe(1)
    //     expect(cache.get(1)).toBe(obj)
    // })

    // it('should throw when trying to change id', () => {
    //     const obj = new TestModel({ id: 1 })
        
    //     expect(() => {
    //         runInAction(() => obj.id = 2 )
    //     }).toThrow()
    // })

    // it('should eject model from cache when id is set to undefined', () => {
    //     const obj = new TestModel({ id: 1 })
    //     const modelDesc = models.get('TestModel')
    //     const spy = jest.spyOn(modelDesc.cache, 'eject')
        
    //     runInAction(() => obj.id = undefined)
    //     expect(spy).toHaveBeenCalledWith(obj)
    // })
})