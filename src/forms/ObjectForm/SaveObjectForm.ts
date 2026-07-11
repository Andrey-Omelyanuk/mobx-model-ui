import { runInAction } from 'mobx'
import { Model } from '../..'
import { ObjectForm } from './ObjectForm'

/**
 * Form to save (create/update) an object.
 */
export class SaveObjectForm<M extends Model> extends ObjectForm<M> {
    async apply() {
        const modelDescriptor = this.obj.modelDescriptor
        // A valid input target is a declared field, a relation, or the id field.
        // We must NOT use Object.keys(this.obj): on a MobX model that also exposes
        // internal props (init_data, disposers, modelName, ...), which would let an
        // input silently overwrite the object's internal state.
        const isKnownField = (name: string) =>
            !!modelDescriptor.fields[name]
            || !!modelDescriptor.relations[name]
            || name === modelDescriptor.id
        // check if all fields from inputs are in obj
        for (const fieldName of Object.keys(this.inputs))
            if (!isKnownField(fieldName))
                throw new Error(`ObjectForm error: object has no field ${fieldName}`)
        // move all values from inputs to obj
        // cast to the non-generic Model so the index signature allows writes
        const obj = this.obj as Model
        runInAction(()=> {
            for (const fieldName of Object.keys(this.inputs)) {
                // correct fieldName if it is foreign obj to foreign id
                if (modelDescriptor.relations[fieldName]) {
                    const idFieldName = modelDescriptor.relations[fieldName].settings.foreign_id
                    obj[idFieldName] = this.inputs[fieldName].value
                }
                else
                    obj[fieldName] = this.inputs[fieldName].value
            }
        })

        return await (this.repository || this.obj.getDefaultRepository()).save(this.obj)
    }
}
