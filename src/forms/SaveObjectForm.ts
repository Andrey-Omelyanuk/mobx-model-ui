import { runInAction } from 'mobx'
import { Model } from '../model'
import { Input } from '../inputs/Input' 
import { ObjectForm } from './ObjectForm'

/**
 * Form to save (create/update) an object.
 */

export class SaveObjectForm<M extends Model> extends ObjectForm<M> {
    constructor(
        obj     : M,
        inputs  : {[key: string]: Input<any> },
        onDone ?: (response?) => void
    ) {
        super(
            obj,
            inputs,
            async () => {
                const fieldsNames = Object.keys(this.obj)
                // check if all fields from inputs are in obj
                for (let fieldName of Object.keys(this.inputs))
                    if (!fieldsNames.includes(fieldName))
                        throw new Error(`ObjectForm error: object has no field ${fieldName}`)
                // move all values from inputs to obj
                const modelDescriptor = this.obj.modelDescriptor
                runInAction(()=> {
                    for (let fieldName of Object.keys(inputs)) {
                        // correct fieldName if it is foreign obj to foreign id
                        if (modelDescriptor.relations[fieldName]) {
                            const idFieldName = modelDescriptor.fields[fieldName].settings.foreign_id
                            this.obj[idFieldName] = inputs[fieldName].value
                        }
                        else 
                            this.obj[fieldName] = inputs[fieldName].value
                    }
                })

                const response = await this.obj.save()
                onDone && onDone(response)
            },
            onDone
        )
    }
}
