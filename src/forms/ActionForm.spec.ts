import { model, Model, local, Input, NUMBER, STRING, id } from '..'
import { TestRepository } from '../test.utils'
import { ActionForm } from './ActionForm'

describe('ActionForm', () => {

    @local()
    @model class A extends Model { @id(NUMBER()) id: number }

    afterEach(async () => {
        A.getModelDescriptor().cache.clear() 
        TestRepository.mockClear()
        jest.clearAllMocks()
    })

    it('constructor', async ()=> {
        const onSuccess= () => {}
        const onCancel = () => {}
        const inputA = new Input(STRING())
        const inputB = new Input(NUMBER()) 
        const inputs = { a: inputA, b: inputB }
        const form = new ActionForm(A.defaultRepository, 'action', inputs, onSuccess, onCancel)
        expect(form).toMatchObject({
            repository: A.defaultRepository,
            action: 'action',
            inputs: {a: inputA, b: inputB},
            onSuccess,
            onCancel,
            isLoading: false,
            errors: [],
        })
    })

    it('apply', (done)=> {
        const onSuccess = jest.fn(async () => {})
        const inputA = new Input(STRING(), {value: 'a'})
        const inputB = new Input(NUMBER(), {value:  1 }) 
        const inputs = { a: inputA, b: inputB }
        let called: any
        const repository = new TestRepository(A.getModelDescriptor(), { modelAction: async (...args) => { called = args } })
        const form = new ActionForm(repository, 'action', inputs, onSuccess)
        expect(form.isLoading).toBe(false)
        form.submit().then(() => {
            expect(form.isLoading).toBe(false)
            expect(onSuccess).toHaveBeenCalledTimes(1)
            expect(called).toEqual(['action', {a: 'a', b: 1}])
            done()
        })
        expect(form.isLoading).toBe(true)
    })
})