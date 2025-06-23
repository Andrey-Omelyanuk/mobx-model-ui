import { runInAction } from 'mobx'
import { Model } from '../..'
import { ObjectForm } from './ObjectForm'

/**
 * Form to save (create/update) an object.
 */
export class SaveObjectForm<M extends Model> extends ObjectForm<M> {
    async apply() {
        const fieldsNames = Object.keys(this.obj)
        // check if all fields from inputs are in obj
        for (let fieldName of Object.keys(this.inputs))
            if (!fieldsNames.includes(fieldName))
                throw new Error(`ObjectForm error: object has no field ${fieldName}`)
        // move all values from inputs to obj
        const modelDescriptor = this.obj.modelDescriptor
        runInAction(()=> {
            for (let fieldName of Object.keys(this.inputs)) {
                // correct fieldName if it is foreign obj to foreign id
                if (modelDescriptor.relations[fieldName]) {
                    const idFieldName = modelDescriptor.relations[fieldName].settings.foreign_id
                    this.obj[idFieldName] = this.inputs[fieldName].value
                }
                else 
                    this.obj[fieldName] = this.inputs[fieldName].value
            }
        })

        return await (this.repository || this.obj.getDefaultRepository()).save(this.obj)
    }
}
