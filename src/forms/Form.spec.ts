import { reaction, runInAction } from 'mobx'
import { Input, STRING, config } from '..'
import { Form } from './Form'

describe('Form', () => {

    class TestForm extends Form {
        apply() {
            return Promise.resolve()
        }
    }

    it('constructor', async ()=> {
        const onSuccess= () => {}
        const onCancel = () => {}
        const inputA = new Input(STRING())
        const inputB = new Input(STRING())
        const form = new TestForm({a: inputA, b: inputB}, onSuccess, onCancel)

        expect(form).toMatchObject({
            inputs: {a: inputA, b: inputB},
            onSuccess,
            onCancel,
            isLoading: false,
            errors: [],
        })
    })

    it('isReady', () => {
        const form = new TestForm({ 
            a: new Input(STRING({required: true})),
            b: new Input(STRING()),  // by default input is not required
            c: new Input(STRING({required: true})),
        })                                                ; expect(form.isReady).toBe(false)
        runInAction(() => form.inputs.a.value = 'a'      ); expect(form.isReady).toBe(false)
        runInAction(() => form.inputs.b.value = 'b'      ); expect(form.isReady).toBe(false)
        runInAction(() => form.inputs.c.value = 'c'      ); expect(form.isReady).toBe(true)
        runInAction(() => form.inputs.b.value = undefined); expect(form.isReady).toBe(true)  // not required do not affect isReady
    })

    describe('isError', () => {
        const form = new TestForm({ 
            a: new Input(STRING()),
            b: new Input(STRING()), 
            c: new Input(STRING()),
        }, async () => {}, () => {} )

        afterEach(() => {
            // reset all errors
            runInAction(() => {
                form.errors = []
                form.inputs.a.errors = []
                form.inputs.b.errors = []
                form.inputs.c.errors = []
            })
        })

        it('no errors', async ()=> {
            expect(form.isError).toBe(false)
        })

        it('only error in form', async ()=> {
            runInAction(() => {
                form.errors = ['error']
            })
            expect(form.isError).toBe(true)
        })

        it('only error in one input', async ()=> {
            runInAction(() => {
                form.inputs.b.errors = ['error']
            })
            expect(form.isError).toBe(true)
        })

        it('errors in form and all inputs', async ()=> {
            runInAction(() => {
                form.inputs.a.errors = ['error']
                form.inputs.b.errors = ['error']
                form.inputs.c.errors = ['error']
                form.errors = ['error']
            })
            expect(form.isError).toBe(true)
        })
    })

    describe('submit', () => {
        const inputs = {
            a: new Input(STRING()),
            b: new Input(STRING()), 
            c: new Input(STRING()),
        }
        it('good request', (done)=> {
            const onSuccess = jest.fn(async () => {})
            const form = new TestForm(inputs, onSuccess )
            expect(form.isLoading).toBe(false)
            form.submit().then(() => {
                expect(form.isLoading).toBe(false)
                expect(onSuccess).toHaveBeenCalledTimes(1)
                done()
            })
            expect(form.isLoading).toBe(true)
        })

        it('bad request', (done)=> {
            class BadRequestForm extends Form {
                async apply() {
                    throw new Error('test error')
                }
            }
            const form = new BadRequestForm(inputs)
            expect(form.isLoading).toBe(false)
            form.submit().then(() => {
                expect(form).toMatchObject({
                    isLoading: false,
                    errors: ['test error'],
                    inputs: {
                        a: { errors: [] },
                        b: { errors: [] },
                        c: { errors: [] },
                    }
                })
                done()
            })
            expect(form.isLoading).toBe(true)
        })

        it('bad request with response', (done)=> {
            class BadRequestForm extends Form {
                async apply() {
                    throw {
                        response: {
                            data: {
                                [config.FORM_NON_FIELD_ERRORS_KEY]: ['form error'],
                                a: ['a error'],
                                b: ['b error'],
                                c: ['c error']
                            }
                        }
                    }
                }
            }
            const form = new BadRequestForm(inputs)
            expect(form.isLoading).toBe(false)
            form.submit().then(() => {
                expect(form).toMatchObject({
                    isLoading: false,
                    errors: ['form error'],
                    inputs: {
                        a: { errors: ['a error'] },
                        b: { errors: ['b error'] },
                        c: { errors: ['c error'] },
                    }
                })
                done()
            })
            expect(form.isLoading).toBe(true)
        })

        it('do not submit when the form is not ready yet', (done)=> {
            // nothing should happen
            const onSuccess = jest.fn(async () => {})
            const form = new TestForm({a: new Input(STRING())}, onSuccess )
            runInAction(() => form.inputs.a.isNeedToUpdate = true)
            expect(form).toMatchObject({isReady: false, isLoading: false})
            form.submit().then(() => {
                expect(form).toMatchObject({isReady: false, isLoading: false})
                expect(onSuccess).toHaveBeenCalledTimes(0)
                done()
            })
            expect(form).toMatchObject({isReady: false, isLoading: false})
        })
    })

    it('isLoading is observable', (done)=> {
        const form = new TestForm({})
        reaction(
            () => form.isLoading,
            (newValue) => {
                if (newValue) done()
            }
        )
        form.submit()
    })

    it('cancel', async ()=> {
        const onCancel = jest.fn(() => {})
        const form = new TestForm({}, () => {}, onCancel)
        form.cancel()
        expect(onCancel).toHaveBeenCalledTimes(1)
    })
})
