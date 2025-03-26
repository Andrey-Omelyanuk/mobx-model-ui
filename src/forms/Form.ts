import { observable } from 'mobx'
import { Input } from '../inputs/Input'
import { config } from '../config'

/**
 * Form class
 */
export class Form {
    @observable isLoading   : boolean = false
    @observable errors      : string[] = []

    constructor(
        readonly inputs: { [key: string]: Input<any> },
        private __submit: () => Promise<void>,
        private __cancel: () => void
    ) {}

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

    async submit() {
        if (!this.isReady) return  // just ignore

        this.isLoading = true
        this.errors = []

        try {
            await this.__submit()
        }
        catch (err) {
            for (const key in err.message) {
                if (key === config.NON_FIELD_ERRORS_KEY) {
                    this.errors = err.message[key]
                } else {
                    if (this.inputs[key])
                        this.inputs[key].errors = err.message[key]
                    else 
                        throw err
                }
            }
        }
        this.isLoading = false
    }

    cancel() {
        this.__cancel()
    }
}
