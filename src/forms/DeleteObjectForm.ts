import { Model } from '../model'
import { Form } from './Form'

/**
 * Form to delete an object.
 */
export class DeleteObjectForm<M extends Model> extends Form {
    constructor(
        public  obj     : M,
                onDone ?: (response?) => void
    ) {
        super(
            {},
            async () => {
                const response = await this.obj.delete()
                onDone && onDone(response)
            },
            onDone
        )
    }
}
