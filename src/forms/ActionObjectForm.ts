import { Model } from '../model'
import { Input } from '../inputs/Input' 
import { ObjectForm } from './ObjectForm'
import { Repository } from '..'

/**
 * Form to make an action of object.
 */
export class ActionObjectForm<M extends Model> extends ObjectForm<M> {
    constructor(
        action: string,
        obj     : M,
        inputs  : {[key: string]: Input<any> },
        onDone ?: (response?) => void,
        repository ?: Repository<M>
    ) {
        super(
            obj,
            inputs,
            async () => {
                // move all values from inputs to kwargs of action
                const kwargs: any = {}
                for (let fieldName of Object.keys(inputs))
                    kwargs[fieldName] = inputs[fieldName].value
                const response = await (repository || this.obj.getDefaultRepository()).action(this.obj, action, kwargs)
                onDone && onDone(response)
            },
            onDone
        )
    }
}
