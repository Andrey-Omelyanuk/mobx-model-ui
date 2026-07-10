import { runInAction } from 'mobx'
import { Model, model, field, QueryCacheSync, Repository, LocalAdapter, local, id, Variable, EQ } from '..'
import { BOOLEAN } from '../types/boolean'
import { STRING } from '../types/string'
import { NUMBER } from '../types/number'


describe('QueryCacheSync', () => {
    @local()
    @model class A extends Model {
        @id(NUMBER())     id !: number
        @field(NUMBER())   a !: number
        @field(STRING())   b !: string
        @field(BOOLEAN())   c !: boolean
    }

    const repository = A.defaultRepository as unknown as Repository<A>
    const adapter = repository.adapter as unknown as LocalAdapter<A>

    beforeEach(() => {
        adapter.clear()
        A.getModelDescriptor().cache.clear()
    })

    it('should track filter changes for all objects with custom id field name', async () => {
        @local()
        @model class QCS_CustomID extends Model {
            @id(NUMBER()) key: number
            @field(STRING()) name: string
        }
        const repo = QCS_CustomID.defaultRepository as unknown as Repository<QCS_CustomID>
        new QCS_CustomID({key: 1, name: 'a'})
        new QCS_CustomID({key: 2, name: 'b'})

        // Filter: name equals filterInput.value
        const filterInput = new Variable(STRING(), {value: 'a'})
        const nameFilter = EQ('name', filterInput)

        // QueryCacheSync constructor iterates cache.store and calls __watch_obj for each
        // Bug: __watch_obj uses obj.id (undefined when id field is 'key') instead of obj.ID
        // Both reactions are stored under disposerObjects['undefined']
        // Second call overwrites first — obj1's reaction is LOST
        const query = new QueryCacheSync<QCS_CustomID>({
            repository: repo,
            filter: nameFilter,
            autoupdate: false,
        })

        // obj1('a') matches 'a', obj2('b') doesn't
        expect(query.items.length).toBe(1)
        expect(query.items[0].name).toBe('a')

        // Change filter from 'a' to 'b'
        runInAction(() => filterInput.set('b'))

        // Allow MobX reactions to propagate
        await new Promise(resolve => setTimeout(resolve, 50))

        // obj1('a') should be removed (no longer matches 'b')
        // obj2('b') should be added (now matches 'b')
        // Expected: items = [obj2]
        // Bug: obj1's reaction was disposed, so obj1 is NOT removed → items = [obj1, obj2]
        expect(query.items.length).toBe(1)
        expect(query.items[0].name).toBe('b')

        query.destroy()
        QCS_CustomID.getModelDescriptor().cache.clear()
    })
})
