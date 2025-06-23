import { Model } from '../..'
import { ObjectForm } from './ObjectForm'

/**
 * Form to delete an object.
 */
export class DeleteObjectForm<M extends Model> extends ObjectForm<M> {
    async apply() {
        return await (this.repository || this.obj.getDefaultRepository()).delete(this.obj)
    }
}
