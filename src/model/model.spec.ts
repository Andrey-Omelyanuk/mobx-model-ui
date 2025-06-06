import { Model, model, field, foreign, one, many, local, models, clearModels, id } from '..'
import { STRING } from '../types/string'
import { NUMBER } from '../types/number'
import { runInAction } from 'mobx'


describe('Model', () => {

    afterEach(async () => {
        jest.clearAllMocks()
        clearModels()
    })

    describe('constructor', () => {
        it('empty', () => {
            @local() 
            @model class A extends Model {
                @id   (NUMBER()) id: number
                @field(NUMBER())  a: number
            }     
                                                 expect(A.getModelDescriptor().cache.store.size).toBe(0)
            let a = new A()                     ; expect(A.getModelDescriptor().cache.store.size).toBe(0)
                                                ; expect(a).toMatchObject({init_data: {a: undefined}, id: undefined, a :undefined })
        })
        it('only id', () => {
            @local() 
            @model class A extends Model {
                @id   (NUMBER()) id: number
                @field(NUMBER())  a: number
            }     
                                                 expect(A.getModelDescriptor().cache.store.size).toBe(0)
            let a = new A({id: 1})              ; expect(A.getModelDescriptor().cache.store.size).toBe(1)
                                                  expect(A.getModelDescriptor().cache.get(a.ID)).toBe(a)
                                                ; expect(a).toMatchObject({init_data: {a: undefined}, id: 1, a: undefined})
        })
        it('id + value', () => {
            @local() 
            @model class A extends Model {
                @id   (NUMBER()) id: number
                @field(NUMBER())  a: number
            }     
                                                 expect(A.getModelDescriptor().cache.store.size).toBe(0)
            let a = new A({id: 1, a: 2})        ; expect(A.getModelDescriptor().cache.store.size).toBe(1)
                                                  expect(A.getModelDescriptor().cache.get(a.ID)).toBe(a)
                                                ; expect(a).toMatchObject({init_data: {a: 2}, id: 1, a: 2})
        })
        it('default property', () => {
            @local()
            @model class A extends Model {
                @id   (NUMBER()) id: number
                @field(NUMBER()) a : number = 1 
                @field(NUMBER()) b : number 
            }
            let a = new A()                     ; expect(a).toMatchObject({init_data: {}, id: undefined, a: 1, b: undefined})
        })
    })

    it('model', () => {
        @local()
        @model class A extends Model {
            @id   (NUMBER()) id: number
        }     
        let a = new A()                         ; expect(a.model).toBe((<any>a.constructor).__proto__)
    })

    it('rawData', () => {
        @local()
        @model class A extends Model {
            @id   (NUMBER()) id: number
            @field(NUMBER()) a : number
            @field(NUMBER()) b : number 
        }
        let a = new A({a: 1})                   ; expect(a.rawData).toStrictEqual({a: 1})
    })

    it('rawObj', () => {
        @local()
        @model class A extends Model {
            @id   (NUMBER()) id: number
            @field(NUMBER()) a : number
            @field(NUMBER()) b : number 
                             c : number   // should not to be in raw_obj
        }
        let a = new A({a: 1})                   ; expect(a.rawObj).toStrictEqual({id: undefined, a: 1})
        a.id = 1                                ; expect(a.rawObj).toStrictEqual({id: 1, a: 1})
        a.c  = 1                                ; expect(a.rawObj).toStrictEqual({id: 1, a: 1})
    })

    it('only_changed_raw_data', () => {
        @local()
        @model class A extends Model {
            @id   (NUMBER()) id: number
            @field(NUMBER()) a : number
            @field(NUMBER()) b : number 
                   c : number   // should be ignored because it isn't a field
        }
        let a = new A({id: 1, a: 2, c: 3})  ; expect(a).toMatchObject({init_data: {}, id: 1, a: 2, b: undefined, c: undefined})
                                              expect(a.only_changed_raw_data).toStrictEqual({})
        a.a = 5                             ; expect(a.only_changed_raw_data).toStrictEqual({a: 5})
        a.b = 5                             ; expect(a.only_changed_raw_data).toStrictEqual({a: 5, b: 5})
        a.c = 5                             ; expect(a.only_changed_raw_data).toStrictEqual({a: 5, b: 5})
    })

    it('is_changed', () => {
        @local()
        @model class A extends Model {
            @id   (NUMBER()) id: number
            @field(NUMBER()) a : number
            @field(NUMBER()) b : number 
                   c : number   // should be ignored because it isn't a field
        }
        let a
        a = new A({id: 1, a: 2, c: 3})  ; expect(a.is_changed).toBe(false)
        a.a = 5                         ; expect(a.is_changed).toBe(true)

        a = new A({id: 2, a: 2, c: 3})  ; expect(a.is_changed).toBe(false)
        a.b = 5                         ; expect(a.is_changed).toBe(true)

        a = new A({id: 3, a: 2, c: 3})  ; expect(a.is_changed).toBe(false)
        a.c = 5                         ; expect(a.is_changed).toBe(false)
    })

    it('refresh_init_data', () => {
        @model class A extends Model {
            @id   (NUMBER()) id: number
            @field(NUMBER()) a : number
            @field(NUMBER()) b : number 
        }
        let a = new A({a: 1, b: 1})     ; expect(a.init_data).toStrictEqual({a: 1, b: 1})
        a.a = 2                         ; expect(a.init_data).toStrictEqual({a: 1, b: 1})
        a.b = 2                         ; expect(a.init_data).toStrictEqual({a: 1, b: 1})
        a.refreshInitData()             ; expect(a.init_data).toStrictEqual({a: 2, b: 2})
    })

    describe('updateFromRaw', () => {
        it('empty raw_obj', () => {
            @model class A extends Model {
                @id   (NUMBER()) id: number
                @field(NUMBER()) a : number
                @field(NUMBER()) b : number 
            }
            let a = new A({a: 1, b: 1})   
            let raw_obj = {}
            a.updateFromRaw(raw_obj)
            expect(a).toMatchObject({a: 1, b: 1})
        })

        it('raw_obj with data only (no id)', () => {
            @model class A extends Model {
                @id   (NUMBER()) id: number
                @field(NUMBER()) a : number
                @field(NUMBER()) b : number 
            }
            let a = new A({a: 1, b: 1})   
            let raw_obj = {a: 2, b: 2}
            a.updateFromRaw(raw_obj)
            expect(a).toMatchObject({a: 2, b: 2})
        })
        it('raw_obj with id+data ', () => {
            @model class A extends Model {
                @id   (NUMBER()) id: number
                @field(NUMBER()) a : number
                @field(NUMBER()) b : number 
            }
            let a = new A({id: 1, a: 1, b: 1})   
            let raw_obj = {id: 1, a: 2, b: 2}
            a.updateFromRaw(raw_obj)
            expect(a).toMatchObject({id: 1, a: 2, b: 2})
        })

        it('raw_obj with id+data  (obj has no id)', () => {
            @model class A extends Model {
                @id   (NUMBER()) id: number
                @field(NUMBER()) a : number
                @field(NUMBER()) b : number 
            }
            let a = new A({a: 1, b: 1})   
            let raw_obj = {id: 1, a: 2, b: 2}
            a.updateFromRaw(raw_obj)
            expect(a).toMatchObject({id: 1, a: 2, b: 2})
        })

        it('raw_obj with id+data  (raw_obj has wrong id)', () => {
            @model class A extends Model {
                @id   (NUMBER()) id: number
                @field(NUMBER()) a : number
                @field(NUMBER()) b : number 
            }
            let a = new A({id: 1, a: 1, b: 1})   
            let raw_obj = {id: 2, a: 2, b: 2}
            a.updateFromRaw(raw_obj)
            expect(a).toMatchObject({id: 1, a: 2, b: 2})
        })

        it('raw_obj with foreign relations', () => {
            @model class C extends Model {
                @id   (NUMBER()) id: number
                @field(STRING()) x : string
            }
            @model class B extends Model {
                @id   (NUMBER()) id: number
                @field(STRING()) x : string
            }
            @model class A extends Model {
                @id   (NUMBER()) id: number
                @field(NUMBER()) a    : number
                @field(NUMBER()) b_id : number 
                @field(NUMBER()) c_id : number 
                @foreign(B) b: B
                @foreign(C) c: C
            }
            let a = new A({})   
            a.updateFromRaw({ id: 1, b: {id: 1, x: 'B'}, c: {id: 1, x: 'C'} })

            expect(a).toMatchObject({ id: 1, b_id: 1, c_id: 1, b: {id: 1, x: 'B'}, c: {id: 1, x: 'C'}, })
            expect(B.get(1)).toMatchObject({x: 'B'})
            expect(C.get(1)).toMatchObject({x: 'C'})
        })

        it('raw_obj with many relations', () => {
            @model class A extends Model { 
                @id   (NUMBER()) id: number
                                 bs: B[]
            }
            @model class B extends Model {
                @id   (NUMBER()) id: number
                @field(NUMBER()) a_id: number
                @field(STRING()) x: string
            }
            many(B)(A, 'bs')
            let a = new A({})   
            a.updateFromRaw({ id: 1, bs: [
                {id: 1, a_id: 1, x: 'B1'},
                {id: 2, a_id: 1, x: 'B2'},
                {id: 3, a_id: 1, x: 'B3'},
            ]})
            expect(a).toMatchObject({ id: 1, bs: [
                {id: 1, a_id: 1, x: 'B1'},
                {id: 2, a_id: 1, x: 'B2'},
                {id: 3, a_id: 1, x: 'B3'},
            ]})
            expect(B.get(1)).toMatchObject({a_id: 1, x: 'B1'})
            expect(B.get(2)).toMatchObject({a_id: 1, x: 'B2'})
            expect(B.get(3)).toMatchObject({a_id: 1, x: 'B3'})
        })

        it('raw_obj with one relations', () => {
            @model class A extends Model {
                @id   (NUMBER()) id: number
                                  b: B
            }
            @model class B extends Model {
                @id   (NUMBER()) id: number
                @field(NUMBER()) a_id: number
                @field(STRING()) x: string
            }
            one(B)(A, 'b')
            let a = new A({})   

            a.updateFromRaw({ id: 1, b: {id: 2, a_id: 1, x: 'B'}}); expect(a).toMatchObject({ id: 1, b: {id: 2, a_id: 1, x: 'B'}})
                                                                    expect(B.get(2)).toMatchObject({a_id: 1, x: 'B'})
        })
    })

    describe('id', () => {
        it('set in constructor', () => {
            @model class A extends Model {
                @id   (NUMBER()) id: number
            }     
                                                  expect(A.getModelDescriptor().cache.store.size).toBe(0)
            let a = new A({id: 1})              ; expect(A.getModelDescriptor().cache.store.size).toBe(1)
                                                  expect(A.getModelDescriptor().cache.get(a.id)).toBe(a)
                                                  expect(a.disposers.size).toBe(2) // before and after changes observers
                                                ; expect(a).toMatchObject({id: 1})
        })
        it('set later', () => {
            @model class A extends Model {
                @id   (NUMBER()) id: number
            }     
            let a = new A()                     ; expect(A.getModelDescriptor().cache.store.size).toBe(0)
                                                  expect(a.disposers.size).toBe(2) // before and after changes observers
                                                ; expect(a).toMatchObject({id: undefined})
            a.id = 1                            ; expect(A.getModelDescriptor().cache.store.size).toBe(1)
                                                  expect(A.getModelDescriptor().cache.get(a.id)).toBe(a)
        })
        it('edit', () => {
            @model class A extends Model {
                @id   (NUMBER()) id: number
            }                                    expect(A.getModelDescriptor().cache.store.size).toBe(0)
            let a = new A({id: 1})              ; expect(A.getModelDescriptor().cache.store.size).toBe(1)
                                                  expect(A.getModelDescriptor().cache.get(a.id)).toBe(a)
                                                  expect(a.disposers.size).toBe(2) // before and after changes observers
                                                ; expect(a).toMatchObject({id: 1})
            expect(() => runInAction(() => a.id = 2))
                .toThrow(new Error(`You cannot change id field: 1 to 2`))
        })
        it('edit to undefined', () => {
            @model class A extends Model {
                @id   (NUMBER()) id: number
            }                                    expect(A.getModelDescriptor().cache.store.size).toBe(0)
            let a = new A({id: 1})              ; expect(A.getModelDescriptor().cache.store.size).toBe(1)
                                                  expect(A.getModelDescriptor().cache.get(a.id)).toBe(a)
                                                  expect(a.disposers.size).toBe(2) // before and after changes observers
                                                ; expect(a).toMatchObject({id: 1})
            runInAction(() => a.id = undefined) ; expect(A.getModelDescriptor().cache.store.size).toBe(0)
        })
    }) 
})
