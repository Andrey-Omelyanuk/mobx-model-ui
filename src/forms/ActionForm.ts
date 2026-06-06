import { Repository, Model, Variable } from '..'
import { Form } from './Form'

/**
 * Form to run an action in the repository.
 * If repository is defined then model is ignored.
 * Use it for forms with complex data that saved in multiple models.
 */
export class ActionForm<M extends Model> extends Form {
    protected action: string
    protected readonly repository: Repository<M>

    constructor(
        repository  : Repository<M>,
        action      : string,
        inputs      : {[key: string]: Variable<any> },
        onSuccess  ?: (response?: any) => void,
        onCancel   ?: () => void,
    ) {
        super(inputs, onSuccess, onCancel)
        this.repository = repository
        this.action = action
    }

    async apply() {
        return await this.repository.modelAction(this.action, this.getKeyValueInputs())
    }
}
