import { Repository } from '..'
import { Model } from '../model'
import { ObjectForm } from './ObjectForm'

/**
 * Form to delete an object.
 */

export class DeleteObjectForm<M extends Model> extends ObjectForm<M> {
    constructor(
        public  obj     : M,
                onDone ?: (response?) => void,
                repository ?: Repository<M>
    ) {
        super(
            obj,
            {},
            async () => {
                const response = await (repository || this.obj.getDefaultRepository()).delete(this.obj)
                onDone && onDone(response)
            },
            onDone
        )
    }
}
