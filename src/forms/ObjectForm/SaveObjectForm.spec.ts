import { reaction } from 'mobx'
import { model, Model, local, Variable, NUMBER, STRING, id, field, config, SaveObjectForm } from '../..'

describe('SaveObjectForm', () => {

    @local()
    @model class A extends Model {
        @id(NUMBER()) id: number
        a: string
        b: number
    }

    afterEach(async () => {
        A.getModelDescriptor().cache.clear() 
        jest.clearAllMocks()
    })

    it('constructor', async ()=> {
        const inputA = new Variable(STRING())
        const inputB = new Variable(NUMBER()) 
        const inputs = { a: inputA, b: inputB }
        const form = new SaveObjectForm(new A(), inputs)
        expect(form.inputs).toBe(inputs)
    })

    it('submit', (done)=> {
        const inputA = new Variable(STRING())
        const inputB = new Variable(NUMBER()) 
        const onDone= () => {
            expect(form.obj.a).toBe('a')
            expect(form.obj.b).toBe(1)
            done()
        }
        const form = new SaveObjectForm<A>(new A(), {a: inputA, b: inputB}, onDone)
        inputA.set('a')
        inputB.set(1)
        form.submit()
    })

    it('cancel', (done)=> {
        const onCancel = () => { done() }
        const form = new SaveObjectForm<A>(new A(), {}, undefined, onCancel)
        form.cancel()
    })

    it('submit without match fields between form and object', async ()=> {
        const inputA = new Variable(STRING())
        const inputB = new Variable(NUMBER()) 
        const form = new SaveObjectForm<A>(new A({}), {a: inputA, X: inputB})
        await form.submit()
        form.errors = [config.FORM_UNKNOWN_ERROR_MESSAGE]
    })

    it('isLoading is observable', (done)=> {
        const form = new SaveObjectForm<A>(new A({}), {})
        reaction(
            () => form.isLoading,
            (newValue) => {
                if (newValue) done()
            }
        )
        form.submit()
    })

    it('should check field existence against modelDescriptor.fields, not Object.keys', async () => {
        @local()
        @model class SaveFormFieldCheck extends Model {
            @id(NUMBER()) id: number
            @field(STRING()) a: string
        }
        const obj = new SaveFormFieldCheck({id: 1, a: 'hello'})

        // Object.keys on a MobX observable includes non-field properties
        // like init_data, disposers, modelName, etc.
        const keys = Object.keys(obj)
        // This proves the bug: Object.keys contains non-field properties
        expect(keys).not.toEqual(['id', 'a'])
        // For example, 'init_data' is always present
        expect(keys).toContain('init_data')
        // 'disposers' is also present
        expect(keys).toContain('disposers')

        // The form should still work for actual fields
        const inputA = new Variable(STRING(), {value: 'world'})
        const form = new SaveObjectForm<SaveFormFieldCheck>(obj, {a: inputA})
        await form.submit()
        expect(obj.a).toBe('world')
    })
})
