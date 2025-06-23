import { Model, Input, Repository } from '../..'
import { ObjectForm } from './ObjectForm'

/**
 * Form to make an action of object.
 */
export class ActionObjectForm<M extends Model> extends ObjectForm<M> {
    protected action: string

    constructor(
        action      : string,
        obj         : M,
        inputs      : {[key: string]: Input<any> },
        onSuccess  ?: (response?) => void,
        onCancel   ?: () => void,
        repository ?: Repository<M>
    ) {
        super(obj, inputs, onSuccess, onCancel, repository)
        this.action = action
    }

    async apply() {
        return await (this.repository || this.obj.getDefaultRepository())
            .action(this.obj, this.action, this.getKeyValueInputs())
    }
}
