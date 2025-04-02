import { Model } from '../model'
import { Input } from '../inputs/Input' 
import { Form } from './Form'

/**
 * Form to make an action of object.
 */
export class ActionObjectForm<M extends Model> extends Form {
    constructor(
        public  obj     : M,
                action  : string,
                inputs  : {[key: string]: Input<any> },
                onDone ?: (response?) => void
    ) {
        super(
            inputs,
            async () => {
                // move all values from inputs to kwargs of action
                const kwargs: any = {}
                for (let fieldName of Object.keys(inputs))
                    kwargs[fieldName] = inputs[fieldName].value
                const response = await this.obj.action(action, kwargs)
                onDone && onDone(response)
            },
            onDone
        )
    }
}
