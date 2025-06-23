import { reaction } from 'mobx'
import { model, Model, local, Input, NUMBER, STRING, id, config, SaveObjectForm } from '../..'

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
        const inputA = new Input(STRING())
        const inputB = new Input(NUMBER()) 
        const inputs = { a: inputA, b: inputB }
        const form = new SaveObjectForm(new A(), inputs)
        expect(form.inputs).toBe(inputs)
    })

    it('submit', (done)=> {
        const inputA = new Input(STRING())
        const inputB = new Input(NUMBER()) 
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
        const inputA = new Input(STRING())
        const inputB = new Input(NUMBER()) 
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

    it('...', (done)=> {
        const inputA = new Input(STRING())
        const inputB = new Input(NUMBER()) 
        const onSubmitted = (obj: A) => {
            expect(obj.a).toBe('a')
            expect(obj.b).toBe(1)
            done()
        }
        const form = new SaveObjectForm<A>(new A(), {a: inputA, b: inputB}, onSubmitted)
        inputA.set('a')
        inputB.set(1)
        form.submit()
    })
})
