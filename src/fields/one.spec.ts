import { runInAction } from 'mobx'
import { Model, model, field, one, models, id, clearModels } from '..'
import { ID } from '../types'
import { NUMBER } from '../types/number'


describe('Field: One', () => {


    describe('Declaration', () => {
        beforeEach(() => {
            clearModels()
        })

        it('declare', async () => {
            @model class A extends Model {
                @id(NUMBER()) id : number
                              b  : B
            }
            @model class B extends Model {
                @id   (NUMBER())   id : number
                @field(NUMBER()) a_id : number
            }
            one(B, 'a_id')(A, 'b')
            expect(A.getModelDescriptor().relations['b']).toEqual({
                decorator: expect.any(Function),
                // array with one function inside
                disposers: [expect.any(Function)],
                settings: {
                    remote_model: B,
                    remote_foreign_id: 'a_id'
                }
            })
        })

        it('declare (auto detect)', async () => {
            @model class A extends Model {
                @id(NUMBER()) id : number
                              b  : B
            }
            @model class B extends Model {
                @id   (NUMBER())   id : number
                @field(NUMBER()) a_id : number
            }
            one(B, 'a_id')(A, 'b')
            one(B)(A, 'b')
            expect(A.getModelDescriptor().relations['b']).toEqual({
                decorator: expect.any(Function),
                // array with one function inside
                disposers: [expect.any(Function)],
                settings: {
                    remote_model: B,
                    remote_foreign_id: 'a_id'
                }
            })
        })

        it('cross declare', async () => {
            @model class A extends Model {
                @id  (NUMBER())  id    : number
                @field(NUMBER()) b_id  : number
                                 b_one : B
            }
            @model class B extends Model {
                @id (NUMBER())   id     : number
                @field(NUMBER()) a_id   : number
                                 a_one  : A
            }
            one(B)(A, 'b_one')
            one(A)(B, 'a_one')
            expect(A.getModelDescriptor().relations['b_one']).toEqual({
                decorator: expect.any(Function),
                // array with one function inside
                disposers: [expect.any(Function)],
                settings: {
                    remote_model: B,
                    remote_foreign_id: 'a_id'
                }
            })
            expect(B.getModelDescriptor().relations['a_one']).toEqual({
                decorator: expect.any(Function),
                // array with one function inside
                disposers: [expect.any(Function)],
                settings: {
                    remote_model: A,
                    remote_foreign_id: 'b_id'
                }
            })
        })
    })

    describe('Usage', () => {
        let A, B
        beforeEach(() => {
            clearModels()
            @model class Ax extends Model { 
                @id(NUMBER()) id : number
                              b  : Bx
            }
            @model class Bx extends Model {
                @id   (NUMBER())  id   : number
                @field(NUMBER())  a_id : ID
            }
            one(Bx, 'a_id')(Ax, 'b')  // auto detect does not work here, because try to find ax_id instead of a_id
            A = Ax, B = Bx
        })

        it('remote obj create before', async () => {
            let b = new B({id: 2, a_id: 1}) 
            let a = new A({id: 1         })
            expect(a.b).toBe(b)
        })

        it('remote obj create after', async () => {
            let a = new A({id: 1         })     ; expect(a.b).toBe(undefined)
            let b = new B({id: 2, a_id: 1})     ; expect(a.b).toBe(b)
        })

        it('remote obj not in the cache', async () => {
            let a = new A({  id: 1})
            let b = new B({a_id: 1})            ; expect(a.b).toBe(undefined)
        })

        it('remote obj delete after', async () => {
            let a = new A({id: 1})
            let b = new B({id: 2, a_id: 1})
            runInAction(() => b.id = undefined) ; expect(a.b).toBe(undefined)
        })

        it('edit foreign_id', async () => {
            let a  = new A({id: 1}) 
            let b1 = new B({id: 1})
            let b2 = new B({id: 2})             ; expect(a.b).toBe(undefined)

            runInAction(() => b1.a_id = a.id)   ; expect(a.b).toBe(b1)
                                                  expect(b1.a_id).toBe(a.id)
                                                  expect(b2.a_id).toBe(undefined)

            runInAction(() => b2.a_id = a.id)   ; expect(a.b).toBe(b2)
                                                  expect(b1.a_id).toBe(a.id)
                                                  expect(b2.a_id).toBe(a.id)

            runInAction(() => b2.a_id = 3)      ; expect(a.b).toBe(undefined)
                                                  expect(b1.a_id).toBe(a.id)
                                                  expect(b2.a_id).toBe(3)

            runInAction(() => b2.a_id = a.id)   ; expect(a.b).toBe(b2)
                                                  expect(b1.a_id).toBe(a.id)
                                                  expect(b2.a_id).toBe(a.id)
        })

        it('set one: null to obj', async () => {
            let a = new A({id: 1})
            let b = new B({id: 2})
            runInAction(() => { b.a_id = a.id })    ; expect(a.b).toBe(b)
                                                      expect(b.a_id).toBe(a.id)
        })

        it('set one: obj_a to obj_b', async () => {
            let a = new A({id: 1})
            let b1 = new B({id: 1, a_id: 1})
            let b2 = new B({id: 2 })
            runInAction(() => b2.a_id = a.id )  ; expect(a.b).toBe(b2)
                                                  expect(b1.a_id).toBe(a.id)
                                                  expect(b2.a_id).toBe(a.id)
        })

        it('set one: obj to null', async () => {
            let a = new A({id: 1})
            let b = new B({id: 2, a_id: 1})
            runInAction(() => b.a_id = null )   ; expect(a.b   ).toBe(null)
                                                  expect(b.a_id).toBe(null)
        })
    })
})
