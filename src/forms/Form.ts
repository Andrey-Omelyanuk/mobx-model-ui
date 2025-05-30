import { makeObservable, observable, runInAction } from 'mobx'
import { Input } from '../inputs/Input'
import { config } from '../config'
import { Destroyable } from '../object'

/**
 * Form class
 */
export class Form implements Destroyable {
    @observable isLoading   : boolean = false
    @observable errors      : string[] = []

    constructor(
        readonly inputs   : { [key: string]: Input<any> },
        private __submit  : () => Promise<void>,
        private __cancel ?: () => void
    ) {
        makeObservable(this)
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

    async submit() {
        if (!this.isReady) return  // just ignore

        runInAction(() => {
            this.isLoading = true
            this.errors = []
        })

        try {
            await this.__submit()
        }
        catch (err) {
            runInAction(() => {
                for (const key in err.message) {
                    if (key === config.FORM_NON_FIELD_ERRORS_KEY) {
                        this.errors = err.message[key]
                    } else {
                        if (this.inputs[key])
                            this.inputs[key].errors = err.message[key]
                        else {
                            // unknown error should be logged 
                            // and not shown to user
                            this.errors = [config.FORM_UNKNOWN_ERROR_MESSAGE]
                            console.error(err)
                        }
                    }
                }
            })
        }
        finally {
            runInAction(() => {
                this.isLoading = false
            })
        }
    }

    cancel() {
        this.__cancel && this.__cancel()
    }
}
