import { model, Model, local, Input, NUMBER, STRING, ObjectForm, id } from '..'

describe('ObjectForm', () => {

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
        const form = new ObjectForm(new A(), inputs)
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
        const form = new ObjectForm<A>(new A(), {a: inputA, b: inputB}, onDone)
        inputA.set('a')
        inputB.set(1)
        form.submit()
    })

    it('cancel', (done)=> {
        const onDone= () => { done() }
        const form = new ObjectForm<A>(new A(), {}, onDone)
        form.cancel()
    })

    it('submit without match fields between form and object', async ()=> {
        const inputA = new Input(STRING())
        const inputB = new Input(NUMBER()) 
        const form = new ObjectForm<A>(new A({}), {a: inputA, X: inputB})
        await expect(form.submit())
            .rejects
            .toThrow('ObjectForm error: object has no field X')
    })
    // it('...', (done)=> {
    //     const inputA = new Input(STRING())
    //     const inputB = new Input(NUMBER()) 
    //     const onSubmitted = (obj: A) => {
    //         expect(obj.a).toBe('a')
    //         expect(obj.b).toBe(1)
    //         done()
    //     }
    //     const form = new ObjectForm<A>(new A(), {a: inputA, b: inputB}, onSubmitted)
    //     inputA.set('a')
    //     inputB.set(1)
    //     form.submit()
    // })
})