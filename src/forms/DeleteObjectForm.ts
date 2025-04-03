import { Model } from '../model'
import { ObjectForm } from './ObjectForm'

/**
 * Form to delete an object.
 */

export class DeleteObjectForm<M extends Model> extends ObjectForm<M> {
    constructor(
        public  obj     : M,
                onDone ?: (response?) => void
    ) {
        super(
            obj,
            {},
            async () => {
                const response = await this.obj.delete()
                onDone && onDone(response)
            },
            onDone
        )
    }
}
