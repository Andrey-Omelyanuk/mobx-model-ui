import { makeObservable, observable, runInAction } from 'mobx'
import { Input, config, Destroyable } from '..'

/**
 * Base abstract class for all forms.
 * 
 * Form is an object that contains inputs and methods to work with them.
 * Also it controls loading state and errors.
 * 
 */
export abstract class Form implements Destroyable {
    @observable isLoading   : boolean = false
    @observable errors      : string[] = []

    readonly inputs    : { [key: string]: Input<any> }
    readonly onSuccess?: (this: Form, response?: any) => void
    readonly onCancel ?: (this: Form) => void

    constructor(
        inputs   : { [key: string]: Input<any> },
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
            console.error('Form is not ready')
            return  // just ignore
        }

        runInAction(() => {
            this.isLoading = true
            this.errors = []
        })

        try {
            const response = await this.apply()
            this.onSuccess && this.onSuccess(response)
        }
        catch (err) {
            this.errorHandler(err)
        }
        finally {
            runInAction(() => this.isLoading = false )
        }
    }

    cancel() {
        this.onCancel && this.onCancel()
    }

    /**
     * Convert inputs to simple key-value object.
     */
    getKeyValueInputs() {
        const inputs: any = {}
        for (let fieldName of Object.keys(this.inputs))
            inputs[fieldName] = this.inputs[fieldName].value
        return inputs
    }
}
