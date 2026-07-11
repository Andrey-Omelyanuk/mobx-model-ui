import { reaction, runInAction } from 'mobx'
import { Variable, STRING, config } from '..'
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
        const inputA = new Variable(STRING())
        const inputB = new Variable(STRING())
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
            a: new Variable(STRING({required: true})),
            b: new Variable(STRING()),  // by default input is not required
            c: new Variable(STRING({required: true})),
        })                                                ; expect(form.isReady).toBe(false)
        runInAction(() => form.inputs.a.value = 'a'      ); expect(form.isReady).toBe(false)
        runInAction(() => form.inputs.b.value = 'b'      ); expect(form.isReady).toBe(false)
        runInAction(() => form.inputs.c.value = 'c'      ); expect(form.isReady).toBe(true)
        runInAction(() => form.inputs.b.value = undefined); expect(form.isReady).toBe(true)  // not required do not affect isReady
    })

    describe('isError', () => {
        const form = new TestForm({ 
            a: new Variable(STRING()),
            b: new Variable(STRING()), 
            c: new Variable(STRING()),
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

    describe('dirty state', () => {
        it('isDirty is false initially', () => {
            const form = new TestForm({
                a: new Variable(STRING(), { value: 'hello' }),
                b: new Variable(STRING(), { value: 'world' }),
            })
            expect(form.isDirty).toBe(false)
        })

        it('isDirty is true when any input changes', () => {
            const form = new TestForm({
                a: new Variable(STRING(), { value: 'hello' }),
                b: new Variable(STRING(), { value: 'world' }),
            })
            runInAction(() => form.inputs.a.value = 'changed')
            expect(form.isDirty).toBe(true)
        })

        it('isDirty is reactive', () => {
            const form = new TestForm({
                a: new Variable(STRING(), { value: 'hello' }),
            })
            let dirtyValue = form.isDirty
            reaction(
                () => form.isDirty,
                (val) => { dirtyValue = val }
            )
            expect(dirtyValue).toBe(false)
            runInAction(() => form.inputs.a.value = 'changed')
            expect(dirtyValue).toBe(true)
        })

        it('markClean() resets all inputs dirty state', () => {
            const form = new TestForm({
                a: new Variable(STRING(), { value: 'hello' }),
                b: new Variable(STRING(), { value: 'world' }),
            })
            runInAction(() => {
                form.inputs.a.value = 'changed'
                form.inputs.b.value = 'updated'
            })
            expect(form.isDirty).toBe(true)
            form.markClean()
            expect(form.isDirty).toBe(false)
            expect(form.inputs.a.isDirty).toBe(false)
            expect(form.inputs.b.isDirty).toBe(false)
        })

        it('reset() reverts all inputs to their initial values', () => {
            const form = new TestForm({
                a: new Variable(STRING(), { value: 'hello' }),
                b: new Variable(STRING(), { value: 'world' }),
            })
            runInAction(() => {
                form.inputs.a.value = 'changed'
                form.inputs.b.value = 'updated'
            })
            form.reset()
            expect(form.inputs.a.value).toBe('hello')
            expect(form.inputs.b.value).toBe('world')
            expect(form.isDirty).toBe(false)
        })
    })

    describe('submit', () => {
        it('good request', (done)=> {
            const inputs = {
                a: new Variable(STRING()),
                b: new Variable(STRING()),
                c: new Variable(STRING()),
            }
            const onSuccess = jest.fn(async () => {})
            const form = new TestForm(inputs, onSuccess )
            expect(form.isLoading).toBe(false)
            runInAction(() => form.inputs.a.value = 'changed')
            expect(form.isDirty).toBe(true)
            form.submit().then(() => {
                expect(form.isLoading).toBe(false)
                expect(onSuccess).toHaveBeenCalledTimes(1)
                // form is marked clean after successful submit
                expect(form.isDirty).toBe(false)
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
            const inputs = {
                a: new Variable(STRING()),
                b: new Variable(STRING()),
                c: new Variable(STRING()),
            }
            const form = new BadRequestForm(inputs)
            runInAction(() => form.inputs.a.value = 'changed')
            expect(form.isDirty).toBe(true)
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
                // dirty state persists after failed submit
                expect(form.isDirty).toBe(true)
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
            const inputs = {
                a: new Variable(STRING()),
                b: new Variable(STRING()),
                c: new Variable(STRING()),
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
            // submit() must reject instead of silently resolving
            const onSuccess = jest.fn(async () => {})
            const form = new TestForm({a: new Variable(STRING())}, onSuccess )
            runInAction(() => form.inputs.a.isNeedToUpdate = true)
            expect(form).toMatchObject({isReady: false, isLoading: false})
            form.submit().then(() => {
                done(new Error('submit() should have rejected'))
            }).catch((err) => {
                expect(err).toBeInstanceOf(Error)
                expect(err.message).toBe('Form is not ready to be submitted')
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
