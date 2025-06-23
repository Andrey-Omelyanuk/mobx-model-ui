import { Repository, Model, Input } from '../..'
import { Form } from '../Form'

/**
 * Abstract class for forms that are used to work with an object.
 */
export abstract class ObjectForm<M extends Model> extends Form {
    public    obj         : M
    protected repository ?: Repository<M>

    constructor(
        obj         : M,
        inputs      : {[key: string]: Input<any> },
        onSuccess   ?: (response?: any) => void,
        onCancel   ?: () => void,
        repository ?: Repository<M>
    ) {
        super(inputs, onSuccess, onCancel)
        this.obj = obj
        this.repository = repository
    }
}
