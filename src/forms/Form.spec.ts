import { reaction, runInAction } from 'mobx'
import { Variable, STRING, config } from '..'
import { Form } from './Form'

class TestForm extends Form {
    apply() {
        return Promise.resolve()
    }
}

describe('Form', () => {

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

describe('cross-field validation', () => {
    it('passes validation when no validators are set', async () => {
        const form = new TestForm({
            a: new Variable(STRING()),
            b: new Variable(STRING()),
        })
        // validate() should return null when there are no validators
        expect(form.validate()).toBeNull()
    })

    it('passes validation when all validators return null', async () => {
        const form = new TestForm({
            start_date: new Variable(STRING()),
            end_date: new Variable(STRING()),
        })
        form.validators.push(
            (inputs) => null,
            (inputs) => undefined,
        )
        expect(form.validate()).toBeNull()
    })

    it('returns form-level errors via FORM_NON_FIELD_ERRORS_KEY', async () => {
        const form = new TestForm({
            a: new Variable(STRING()),
            b: new Variable(STRING()),
        })
        form.validators.push(
            (inputs) => ({
                [config.FORM_NON_FIELD_ERRORS_KEY]: ['Dates are inconsistent'],
            })
        )
        expect(form.validate()).toEqual({
            [config.FORM_NON_FIELD_ERRORS_KEY]: ['Dates are inconsistent'],
        })
    })

    it('returns field-level errors keyed by input name', async () => {
        const form = new TestForm({
            start_date: new Variable(STRING()),
            end_date: new Variable(STRING()),
        })
        form.validators.push(
            (inputs) => ({
                end_date: ['End date must be after start date'],
            })
        )
        expect(form.validate()).toEqual({
            end_date: ['End date must be after start date'],
        })
    })

    it('aggregates errors from multiple validators', async () => {
        const form = new TestForm({
            a: new Variable(STRING()),
            b: new Variable(STRING()),
            c: new Variable(STRING()),
        })
        form.validators.push(
            (inputs) => ({ a: ['error from v1'] }),
            (inputs) => ({ b: ['error from v2'] }),
        )
        expect(form.validate()).toEqual({
            a: ['error from v1'],
            b: ['error from v2'],
        })
    })

    it('aggregates errors for the same field from multiple validators', async () => {
        const form = new TestForm({
            a: new Variable(STRING()),
        })
        form.validators.push(
            (inputs) => ({ a: ['first error'] }),
            (inputs) => ({ a: ['second error'] }),
        )
        expect(form.validate()).toEqual({
            a: ['first error', 'second error'],
        })
    })

    it('submit() calls validate() and blocks on validation failure with field errors', (done) => {
        const onSuccess = jest.fn()
        const form = new TestForm({
            start_date: new Variable(STRING()),
            end_date: new Variable(STRING()),
        }, onSuccess)
        // Set valid values so isReady passes
        runInAction(() => {
            form.inputs.start_date.value = '2024-01-01'
            form.inputs.end_date.value = '2023-01-01' // before start_date
        })
        // Cross-field validator: end_date must be after start_date
        form.validators.push((inputs) => {
            if (inputs.end_date.value <= inputs.start_date.value) {
                return { end_date: ['End date must be after start date'] }
            }
            return null
        })
        form.submit().then(() => {
            done(new Error('submit() should have rejected'))
        }).catch((err) => {
            expect(err.message).toBe('Form validation failed')
            expect(form.isLoading).toBe(false)
            expect(form.inputs.end_date.errors).toEqual(['End date must be after start date'])
            expect(onSuccess).toHaveBeenCalledTimes(0)
            done()
        })
    })

    it('submit() blocks on validation failure with form-level errors', (done) => {
        const onSuccess = jest.fn()
        const form = new TestForm({
            a: new Variable(STRING()),
            b: new Variable(STRING()),
        }, onSuccess)
        runInAction(() => {
            form.inputs.a.value = 'x'
            form.inputs.b.value = 'y'
        })
        form.validators.push((inputs) => ({
            [config.FORM_NON_FIELD_ERRORS_KEY]: ['Cross-field constraint failed'],
        }))
        form.submit().then(() => {
            done(new Error('submit() should have rejected'))
        }).catch((err) => {
            expect(err.message).toBe('Form validation failed')
            expect(form.errors).toEqual(['Cross-field constraint failed'])
            expect(onSuccess).toHaveBeenCalledTimes(0)
            done()
        })
    })

    it('submit() proceeds to apply() when validation passes', (done) => {
        let applied = false
        class ValidForm extends Form {
            async apply() {
                applied = true
            }
        }
        const form = new ValidForm({
            start_date: new Variable(STRING()),
            end_date: new Variable(STRING()),
        })
        runInAction(() => {
            form.inputs.start_date.value = '2024-01-01'
            form.inputs.end_date.value = '2024-06-01'
        })
        form.validators.push((inputs) => {
            if (inputs.end_date.value <= inputs.start_date.value) {
                return { end_date: ['End date must be after start date'] }
            }
            return null
        })
        form.submit().then(() => {
            expect(applied).toBe(true)
            expect(form.isLoading).toBe(false)
            expect(form.errors).toEqual([])
            expect(form.inputs.end_date.errors).toEqual([])
            done()
        })
    })

    it('clears previous validation errors before re-validation', (done) => {
        const form = new TestForm({
            start_date: new Variable(STRING()),
            end_date: new Variable(STRING()),
        })
        form.inputs.start_date.set('2024-01-01')
        form.inputs.end_date.set('2023-01-01')
        form.validators.push((inputs) => {
            if (inputs.end_date.value <= inputs.start_date.value) {
                return { end_date: ['End date must be after start date'] }
            }
            return null
        })
        // First submit — validation fails
        form.submit().then(() => {
            done(new Error('first submit should have rejected'))
        }).catch(() => {
            expect(form.inputs.end_date.errors).toEqual(['End date must be after start date'])
            // Fix the value using set() which triggers validate() → clears errors
            form.inputs.end_date.set('2024-06-01')
            // Second submit — validation passes
            form.submit().then(() => {
                expect(form.inputs.end_date.errors).toEqual([])
                expect(form.errors).toEqual([])
                done()
            }).catch(() => {
                done(new Error('second submit should have passed'))
            })
        })
    })

    it('unknown field in validation errors becomes form-level error', (done) => {
        const form = new TestForm({
            a: new Variable(STRING()),
        })
        runInAction(() => { form.inputs.a.value = 'x' })
        form.validators.push((inputs) => ({
            unknown_field: ['This field does not exist'],
        }))
        form.submit().then(() => {
            done(new Error('submit should have rejected'))
        }).catch(() => {
            expect(form.errors).toEqual(['This field does not exist'])
            done()
        })
    })

    it('can override validate() method for custom logic', () => {
        class CustomForm extends TestForm {
            validate() {
                if (this.inputs.password.value !== this.inputs.confirm.value) {
                    return { confirm: ['Passwords do not match'] }
                }
                return null
            }
        }
        const form = new CustomForm({
            password: new Variable(STRING()),
            confirm: new Variable(STRING()),
        })
        runInAction(() => {
            form.inputs.password.value = 'secret'
            form.inputs.confirm.value = 'different'
        })
        expect(form.validate()).toEqual({
            confirm: ['Passwords do not match'],
        })
        // Override should also work without pushing to validators array
        expect(form.validators.length).toBe(0)
    })
})
