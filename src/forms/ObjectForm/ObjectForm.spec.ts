import { model, Model, local, Input, NUMBER, STRING, id, config, SaveObjectForm, ObjectForm } from '../..'

describe('ObjectForm', () => {

    @local()
    @model class A extends Model {
        @id(NUMBER()) id: number
        a: string
        b: number
    }

    class TestObjectForm extends ObjectForm<A> {
        called = false
        async apply() {
            this.called = true
        }
    }

    afterEach(async () => {
        A.getModelDescriptor().cache.clear() 
        jest.clearAllMocks()
    })

    it('constructor', async ()=> {
        const onSuccess= () => {}
        const onCancel = () => {}
        const inputA = new Input(STRING())
        const inputB = new Input(NUMBER()) 
        const inputs = { a: inputA, b: inputB }
        const obj = new A()
        const form = new TestObjectForm(obj, inputs, onSuccess, onCancel)
        expect(form).toMatchObject({
            obj: obj,
            repository: undefined,
            inputs: {a: inputA, b: inputB},
            onSuccess,
            onCancel,
            isLoading: false,
            errors: [],
            called: false,
        })
    })

    it('submit', (done)=> {
        let called = false
        const onSuccess= () => { called = true }
        const onCancel = () => {}
        const inputA = new Input(STRING())
        const inputB = new Input(NUMBER()) 
        const inputs = { a: inputA, b: inputB }
        const obj = new A()
        const form = new TestObjectForm(obj, inputs, onSuccess, onCancel)
        form.submit().finally(() => {
            expect(form.called).toBe(true)
            expect(called).toBe(true)
            done()
        })
    })
})