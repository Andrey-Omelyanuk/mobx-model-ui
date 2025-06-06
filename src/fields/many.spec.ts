import { runInAction } from 'mobx'
import { Model, model, field, many, id, models } from '..'
import { ID, NUMBER } from '../types'


describe('Field: Many', () => {

    describe('Declaration', () => {
        beforeEach(() => {
            models.clear()
        })

        it('declare', async () => {
            @model class A extends Model {
                @id(NUMBER()) id: number
                              bs: B[]
            }
            @model class B extends Model {
                @id   (NUMBER())   id: number
                @field(NUMBER()) a_id: number
            }
            many(B, 'a_id')(A, 'bs')
            expect(A.getModelDescriptor().relations['bs']).toEqual({
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
                @id(NUMBER()) id: number
                              bs: B[]
            }
            @model class B extends Model {
                @id   (NUMBER())   id: number
                @field(NUMBER()) a_id: number
            }
            many(B)(A, 'bs')
            expect(A.getModelDescriptor().relations['bs']).toEqual({
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
                @id   (NUMBER())   id : number
                @field(NUMBER()) b_id : number
                                 bs   : B[]
            }
            @model class B extends Model {
                @id   (NUMBER())   id : number
                @field(NUMBER()) a_id : number
                                 as   : A[]
            }
            many(B)(A, 'bs')
            many(A)(B, 'as')

            expect(A.getModelDescriptor().relations['bs']).toEqual({
                decorator: expect.any(Function),
                // array with one function inside
                disposers: [expect.any(Function)],
                settings: {
                    remote_model: B,
                    remote_foreign_id: 'a_id'
                }
            })
            expect(B.getModelDescriptor().relations['as']).toEqual({
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
        @model class A extends Model {
            @id(NUMBER()) id : ID
                          bs : B[]
        }
        @model class B extends Model {
            @id   (NUMBER())   id : ID
            @field(NUMBER()) a_id : ID
        }
        many(B)(A, 'bs')

        beforeEach(() => {
            A.getModelDescriptor().cache.clear()
            B.getModelDescriptor().cache.clear()
        })

        it('should be [] by default', async () => {
            let a = new A()
            expect(a.bs).toEqual([])
        })

        it('should contain a remote object if the object is exist in cache', async () => {
            let a = new A({id: 1})
            let b = new B({id: 2, a_id: 1})
            expect(a.bs).toEqual([b])
        })

        it('should contain [] if the object is not in the cache', async () => {
            let a = new A()
            let b = new B({id: 2, a_id: 1})
            expect(a.bs).toEqual([])
        })

        it('should contain [] if the remote object is not in the cache', async () => {
            let a = new A({id: 1})
            let b = new B({a_id: 1})
            expect(a.bs).toEqual([])
        })

        it('remote object create later', async () => {
            let a = new A({id: 1         });  expect(a.bs).toEqual([])
            let b = new B({id: 2, a_id: 1});  expect(a.bs).toEqual([b])
        })

        it('remote object delete later', async () => {
            let a = new A({id: 1})
            let b = new B({id: 2, a_id: 1})             ; expect(a.bs).toEqual([b])
            runInAction(() => { b.id = undefined })     ; expect(a.bs).toEqual([])
        })

        it('add obj to many ', async () => {
            let a = new A({id: 1})
            let b = new B({id: 2})                      ; expect(b.a_id).toBe(undefined)    ; expect(a.bs).toEqual([])
            runInAction(() => { b.a_id = a.id })        ; expect(b.a_id).toBe(a.id)         ; expect(a.bs).toEqual([b])
        })

        it('remove obj from many', async () => {
            let a = new A({id: 1})
            let b = new B({id: 2, a_id: 1})             ; expect(b.a_id).toBe(a.id)         ; expect(a.bs).toEqual([b])
            runInAction(() => { b.a_id = null })        ; expect(b.a_id).toBe(null)         ; expect(a.bs).toEqual([])
        })

        it('move b from a1 to a2', async () => {
            let a1 = new A({id: 1})
            let a2 = new A({id: 2})
            let b = new B({id: 3, a_id: 1})
            expect(b.a_id).toBe(a1.id)
            expect(a1.bs).toEqual([b])
            expect(a2.bs).toEqual([])

            runInAction(() => { b.a_id = a2.id })
            expect(b.a_id).toBe(a2.id)
            expect(a1.bs).toEqual([])
            expect(a2.bs).toEqual([b])
        })
    })

    it('e2e', async () => {
        @model class Program extends Model {
            @id   (NUMBER()) id	  : number
            @field(NUMBER()) name : string
                             sets : ProgramSet []
        }
        @model class ProgramSet extends Model {
            @id   (NUMBER())  id          : number
            @field(NUMBER())  order       : number
            @field(NUMBER())  program_id  : number
        }
        many(ProgramSet)(Program, 'sets')

        let p_1 = new Program({id: 1, name: 'p_1'})
        let p_2 = new Program({id: 2, name: 'p_2'})
        let p_3 = new Program({id: 3, name: 'p_3'})

        expect(p_1).toMatchObject({id: 1, sets: []})
        expect(p_2).toMatchObject({id: 2, sets: []})
        expect(p_3).toMatchObject({id: 3, sets: []})

        let ps_1 = new ProgramSet({id: 1, program_id: p_1.id, order: 1})
        let ps_2 = new ProgramSet({id: 2, program_id: p_1.id, order: 2})
        let ps_3 = new ProgramSet({id: 3, program_id: p_1.id, order: 3})
        let ps_4 = new ProgramSet({id: 4, program_id: p_2.id, order: 4})

        expect(ps_1).toMatchObject({id: 1, program_id: 1, order: 1})
        expect(ps_2).toMatchObject({id: 2, program_id: 1, order: 2})
        expect(ps_3).toMatchObject({id: 3, program_id: 1, order: 3})
        expect(ps_4).toMatchObject({id: 4, program_id: 2, order: 4})

        expect(p_1).toMatchObject({id: 1, sets: [ps_1, ps_2, ps_3]})
        expect(p_2).toMatchObject({id: 2, sets: [ps_4]})
        expect(p_3).toMatchObject({id: 3, sets: []})
    })
})
