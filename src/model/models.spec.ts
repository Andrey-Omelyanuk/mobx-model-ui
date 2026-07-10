import { Model, model, models, clearModels } from '.'
import { NUMBER } from '../types'
import { id } from '../fields'


describe('models', () => {

    afterEach(() => {
        clearModels()
    })

    describe('clearModels', () => {
        it('should clear all model caches', () => {
            @model class A extends Model { @id(NUMBER()) id: number }
            @model class B extends Model { @id(NUMBER()) id: number }

            const cacheA = A.getModelDescriptor().cache
            const cacheB = B.getModelDescriptor().cache

            new A({id: 1})
            new B({id: 1})

            expect(cacheA.store.size).toBe(1)
            expect(cacheB.store.size).toBe(1)

            clearModels()

            // Bug: clearModels doesn't call cache.clear() on each descriptor
            // The models map is cleared, but caches still hold references to objects
            expect(cacheA.store.size).toBe(0)
            expect(cacheB.store.size).toBe(0)
        })
    })
})
