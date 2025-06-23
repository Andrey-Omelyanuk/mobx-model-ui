import { model, Model, local, Input, NUMBER, STRING, id, config, SaveObjectForm, ActionForm } from '../..'
import { TestRepository } from '../../test.utils'
import { ActionObjectForm } from './ActionObjectForm'

describe('ActionObjectForm', () => {

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
        const onSuccess= () => {}
        const onCancel = () => {}
        const inputA = new Input(STRING())
        const inputB = new Input(NUMBER()) 
        const inputs = { a: inputA, b: inputB }
        const obj = new A()
        const form = new ActionObjectForm('action', obj, inputs, onSuccess, onCancel)
        expect(form).toMatchObject({
            obj,
            action: 'action',
            inputs: {a: inputA, b: inputB},
            onSuccess,
            onCancel,
            isLoading: false,
            errors: [],
        })
    })

    it('apply', (done)=> {
        const onSuccess = jest.fn(() => { })
        const inputA = new Input(STRING(), {value: 'a'})
        const inputB = new Input(NUMBER(), {value:  1 }) 
        const inputs = { a: inputA, b: inputB }
        const obj = new A()
        const form = new ActionObjectForm('action', obj, inputs, onSuccess)
        expect(form.isLoading).toBe(false)
        form.submit().finally(() => {
            expect(form.isLoading).toBe(false)
            expect(form.errors).toEqual([])
            expect(onSuccess).toHaveBeenCalledTimes(1)
            done()
        })
        expect(form.isLoading).toBe(true)
    })

    it('apply with repository', (done)=> {
        const onSuccess = jest.fn(async () => {})
        const inputA = new Input(STRING(), {value: 'a'})
        const inputB = new Input(NUMBER(), {value:  1 }) 
        const inputs = { a: inputA, b: inputB }
        const obj = new A()
        const repository = new TestRepository(A.getModelDescriptor(), { action: jest.fn(async (...args) => { }) })
        const form = new ActionObjectForm('action', obj, inputs, onSuccess, undefined, repository)
        expect(form.isLoading).toBe(false)
        form.submit().finally(() => {
            expect(form.isLoading).toBe(false)
            expect(form.errors).toEqual([])
            expect(onSuccess).toHaveBeenCalledTimes(1)
            expect(repository.action).toHaveBeenCalledTimes(1)
            expect(repository.action).toHaveBeenCalledWith(obj, 'action', {a: 'a', b: 1})
            done()
        })
        expect(form.isLoading).toBe(true)
    })
})
