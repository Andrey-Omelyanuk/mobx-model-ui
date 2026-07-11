import { action, computed, makeObservable, observable, runInAction } from 'mobx'
import { Variable } from '../inputs'
import { config } from '../config'
import { Destroyable } from '../object'

/**
 * A map of field names to their validation error messages.
 * Key is an input name (or FORM_NON_FIELD_ERRORS_KEY for form-level errors).
 * Value is an array of error messages for that field.
 */
export type ValidationErrors = Record<string, string[]> | null | undefined

/**
 * A validator function that checks cross-field constraints.
 * Receives the form's inputs map and returns either:
 * - null/undefined: the field(s) are valid
 * - Record<string, string[]>: field-level errors keyed by input name.
 *   Use `FORM_NON_FIELD_ERRORS_KEY` for form-level errors.
 */
export type Validator = (inputs: Record<string, Variable<any>>) => ValidationErrors

/**
 * Base abstract class for all forms.
 * 
 * Form is an object that contains inputs and methods to work with them.
 * Also it controls loading state, cross-field validation, and errors.
 * 
 */
export abstract class Form implements Destroyable {
    @observable isLoading   : boolean = false
    @observable errors      : string[] = []

    readonly inputs    : { [key: string]: Variable<any> }
    readonly onSuccess?: (this: Form, response?: any) => void
    readonly onCancel ?: (this: Form) => void

    /**
     * Array of cross-field validators.
     * Subclasses can push validators in their constructor or override `validate()`.
     */
    validators: Validator[] = []

    constructor(
        inputs   : { [key: string]: Variable<any> },
        onSuccess?: (this: Form, response?: any) => void,
        onCancel ?: (this: Form) => void
    ) {
        makeObservable(this)
        this.inputs = inputs
        this.onSuccess = onSuccess
        this.onCancel = onCancel
    }

    destroy() {
        for (const key in this.inputs) {
            this.inputs[key].destroy()
        }
    }

    get isReady(): boolean {
        return Object.values(this.inputs).every(input => input.isReady)
    }

    get isError(): boolean {
        return this.errors.length > 0
            || Object.values(this.inputs).some(input => input.errors.length > 0)
    }

    @computed
    get isDirty(): boolean {
        return Object.values(this.inputs).some(input => input.isDirty)
    }

    markClean(): void {
        Object.values(this.inputs).forEach(input => input.markClean())
    }

    @action
    reset(): void {
        Object.values(this.inputs).forEach(input => input.reset())
    }

    /**
     * Run all cross-field validators and return aggregated errors.
     * Returns null when valid, or a map of field→messages when invalid.
     * Can be overridden by subclasses for custom validation logic.
     */
    validate(): ValidationErrors {
        const allErrors: Record<string, string[]> = {}
        for (const validator of this.validators) {
            const errors = validator(this.inputs)
            if (errors) {
                for (const [key, msgs] of Object.entries(errors)) {
                    if (!allErrors[key]) allErrors[key] = []
                    allErrors[key].push(...msgs)
                }
            }
        }
        return Object.keys(allErrors).length ? allErrors : null
    }

    /**
     * Clear all errors on the form and all its inputs.
     */
    @action
    clearErrors(): void {
        this.errors = []
        for (const input of Object.values(this.inputs)) {
            input.errors = []
        }
    }

    abstract apply(): Promise<any>

    errorHandler(err: any) {
        runInAction(() => {
            if (!err.response?.data) {
                this.errors = [err.message]
            }
            else {
                for (const key in err.response.data) {
                    if (key === config.FORM_NON_FIELD_ERRORS_KEY) {
                        this.errors = err.response.data[key]
                    } else {
                        if (this.inputs[key])
                            this.inputs[key].errors = err.response.data[key]
                        else {
                            // unknown error should be logged 
                            // and not shown to user
                            this.errors = [config.FORM_UNKNOWN_ERROR_MESSAGE]
                        }
                    }
                }
            }
        })
    }

    async submit() {
        if (!this.isReady) {
            // Reject so the caller can react to a blocked submit instead of it
            // silently resolving. `async` turns this throw into a rejected Promise.
            throw new Error('Form is not ready to be submitted')
        }

        // Clear all previous errors before running cross-field validation
        this.clearErrors()

        // Run cross-field validation
        const validationErrors = this.validate()
        if (validationErrors) {
            runInAction(() => {
                for (const [key, msgs] of Object.entries(validationErrors)) {
                    if (key === config.FORM_NON_FIELD_ERRORS_KEY) {
                        this.errors.push(...msgs)
                    } else if (this.inputs[key]) {
                        this.inputs[key].errors = msgs
                    } else {
                        this.errors.push(...msgs)
                    }
                }
            })
            throw new Error('Form validation failed')
        }

        runInAction(() => {
            this.isLoading = true
        })

        try {
            const response = await this.apply()
            this.markClean()
            if (this.onSuccess) this.onSuccess(response)
        }
        catch (err) {
            this.errorHandler(err)
        }
        finally {
            runInAction(() => this.isLoading = false )
        }
    }

    cancel() {
        if (this.onCancel) this.onCancel()
    }

    /**
     * Convert inputs to simple key-value object.
     */
    getKeyValueInputs() {
        const inputs: any = {}
        for (const fieldName of Object.keys(this.inputs))
            inputs[fieldName] = this.inputs[fieldName].value
        return inputs
    }
}
