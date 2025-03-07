import { Query } from '../queries'
import { Filter } from '../filters'
import { Repository } from '../repository'
import { model, Model } from '../model'
import { ReadOnlyAdapter } from './read-only'
import { ID, NUMBER } from '../types'
import { id } from '../fields/id'


class TestReadOnlyAdapter<M extends Model> extends ReadOnlyAdapter<M> {

    async create() { return super.create() }
    async update() { return super.update() } 
    async delete() { return super.delete() } 
    // next methods just to avoid abstract class
    async get    (obj_id: any): Promise<any> { return 'get' }
    async action (obj_id: any, name: string, kwargs: Object) : Promise<any> { return 'action' }

    async find(query: Query<M>): Promise<any> { return 'find' }
    async load(query: Query<M>): Promise<any[]> { return [] }

    async getTotalCount  (filter: Filter): Promise<number> { return 0 }
    async getDistinct    (filter: Filter, field: string): Promise<any[]> { return [] }
    getURLSearchParams(query: Query<M>): URLSearchParams { return new URLSearchParams() }
}

export function read_only() {
    return (cls: any) => {
        cls.getModelDescriptor().defaultRepository.adapter = new TestReadOnlyAdapter()
    }
}

describe('Read Only Adapter', () => {

    @read_only()
    @model class A extends Model { @id(NUMBER()) id: number }

    it('create', (done) => {
        let a = new A()
        a.create().catch((e) => {
            expect(e).toBe(`You cannot create using READ ONLY adapter.`)
            done()
        })
    })
    it('update', (done) => {
        let a = new A()
        a.update().catch((e) => {
            expect(e).toBe(`You cannot update using READ ONLY adapter.`)
            done()
        })
    })
    it('delete', (done) => {
        let a = new A()
        a.delete().catch((e) => {
            expect(e).toBe(`You cannot delete using READ ONLY adapter.`)
            done()
        })
    })
})
